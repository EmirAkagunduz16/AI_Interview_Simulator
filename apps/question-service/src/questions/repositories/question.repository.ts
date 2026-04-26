import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, FilterQuery } from "mongoose";
import {
  Question,
  QuestionDocument,
  QuestionType,
  Difficulty,
} from "../entities/question.entity";
import { BaseRepository } from "@ai-coach/database";

export interface QuestionFilter {
  type?: QuestionType;
  difficulty?: Difficulty;
  category?: string;
  tags?: string[];
  isActive?: boolean;
}

@Injectable()
export class QuestionRepository extends BaseRepository<QuestionDocument> {
  private readonly logger = new Logger(QuestionRepository.name);

  constructor(
    @InjectModel(Question.name)
    private readonly questionModel: Model<QuestionDocument>,
  ) {
    super(questionModel);
  }

  async findAllQuestions(
    filter: QuestionFilter = {},
    options: { page?: number; limit?: number } = {},
  ): Promise<{ questions: QuestionDocument[]; total: number }> {
    const query = this.buildFilterQuery(filter);
    const result = await super.findAll(query, options);
    return { questions: result.items, total: result.total };
  }

  /**
   * Number of DB-backed (preferably community) questions to reserve per
   * interview when matching criteria is provided. The user explicitly asked
   * for at least 2 matching community questions to be present in any
   * interview if the bank has them — generated questions should not crowd
   * out hand-curated ones.
   */
  private static readonly GUARANTEED_DB_MATCH_TARGET = 2;

  async findRandom(
    filter: QuestionFilter = {},
    count = 5,
    excludeIds: string[] = [],
  ): Promise<QuestionDocument[]> {
    const baseQueryActive = this.buildFilterQuery({
      ...filter,
      isActive: true,
    });

    const { Types } = require("mongoose");
    const excludeObjectIds = excludeIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id: string) => new Types.ObjectId(id));

    const excludingQuery: Record<string, unknown> = { ...baseQueryActive };
    if (excludeObjectIds.length > 0) {
      excludingQuery._id = { $nin: excludeObjectIds };
    }

    // We only consider a question "community-matched" if it matches field,
    // difficulty AND has tag overlap — i.e. it would actually be relevant.
    const hasMatchCriteria =
      !!filter.category && !!filter.difficulty && (filter.tags?.length ?? 0) > 0;

    // Guarantee N DB-backed (preferably community) questions per interview
    // when relevant matches exist, even if every match is in the user's
    // exclusion list. Otherwise fresh-generated questions completely crowd
    // out the saved bank — a regression the user reported repeatedly.
    const guaranteedTarget = Math.min(
      QuestionRepository.GUARANTEED_DB_MATCH_TARGET,
      count,
    );
    let guaranteedDbQuestions: QuestionDocument[] = [];
    if (hasMatchCriteria && guaranteedTarget > 0) {
      guaranteedDbQuestions = await this.findGuaranteedMatches(
        baseQueryActive,
        guaranteedTarget,
      );
    }

    const reservedIds: Array<{ toString(): string }> = guaranteedDbQuestions
      .map((q) => (q as { _id?: { toString(): string } })._id)
      .filter(Boolean) as Array<{ toString(): string }>;

    // Total community-flavoured slot budget. The reserved (guaranteed)
    // matches already count toward this — we top up only if there's room
    // left after the guaranteed picks.
    const communityTotalTarget = hasMatchCriteria
      ? Math.max(guaranteedTarget, Math.round(count * 0.4))
      : 0;
    const communityTopUpTarget = Math.max(
      0,
      communityTotalTarget - guaranteedDbQuestions.length,
    );

    let communityResults: QuestionDocument[] = [];
    if (communityTopUpTarget > 0) {
      const communityQuery: Record<string, unknown> = {
        ...excludingQuery,
        createdBy: "community",
      };

      // Don't return the guaranteed picks a second time
      if (reservedIds.length > 0) {
        const existingNin = (communityQuery._id as { $nin?: unknown[] })?.$nin;
        communityQuery._id = {
          $nin: [...((existingNin as unknown[]) || []), ...reservedIds],
        };
      }

      const communityPoolSize = communityTopUpTarget * 3;
      communityResults = (await this.questionModel
        .aggregate([
          { $match: communityQuery },
          { $sort: { upvoteCount: -1, usageCount: 1 } },
          { $limit: communityPoolSize },
          { $sample: { size: communityTopUpTarget } },
        ])
        .exec()) as unknown as QuestionDocument[];

      this.logger.debug(
        `Community top-up returned ${communityResults.length}/${communityTopUpTarget} matching ` +
          `category=${filter.category}, difficulty=${filter.difficulty}, tags=[${filter.tags?.join(",")}]` +
          ` (+${guaranteedDbQuestions.length} guaranteed reserved)`,
      );
    }

    const reservedCount = guaranteedDbQuestions.length;
    const remaining = count - reservedCount - communityResults.length;
    let generalResults: QuestionDocument[] = [];

    if (remaining > 0) {
      const generalQuery: Record<string, unknown> = { ...excludingQuery };

      const alreadyPickedIds: Array<{ toString(): string }> = [
        ...reservedIds,
        ...(communityResults
          .map((q) => (q as { _id?: { toString(): string } })._id)
          .filter(Boolean) as Array<{ toString(): string }>),
      ];

      if (alreadyPickedIds.length > 0) {
        const existingNin = (generalQuery._id as { $nin?: unknown[] })?.$nin;
        generalQuery._id = {
          $nin: [...((existingNin as unknown[]) || []), ...alreadyPickedIds],
        };
      }

      const poolSize = remaining * 3;
      generalResults = (await this.questionModel
        .aggregate([
          { $match: generalQuery },
          { $sort: { usageCount: 1 } },
          { $limit: poolSize },
          { $sample: { size: remaining } },
        ])
        .exec()) as unknown as QuestionDocument[];
    }

    // Always lead with the guaranteed picks so the candidate is asked at
    // least N matching DB questions before generated / exclude-pool ones;
    // then interleave the rest for variety.
    const interleaved = this.interleave(communityResults, generalResults);
    const ordered = [...guaranteedDbQuestions, ...interleaved];
    return ordered.slice(0, count);
  }

  /**
   * Returns up to `targetCount` DB-backed questions matching the interview
   * criteria. Community questions are preferred (they're hand-curated).
   *
   * Selection strategy is a **mixed-priority** sample, NOT a strict tiered
   * cascade — that's deliberate. The previous strict cascade always fully
   * filled the target from tier 1 if it had enough matches, which means a
   * candidate doing repeated backend+medium+NestJS interviews would always
   * get the same 2 questions (e.g. "Circular Dependency" + "Pipe vs Guard")
   * because they're the only strict-tag matches. To break that monotony we
   * instead build a pool that mixes strict matches with tag-relaxed ones,
   * then `$sample` from the union.
   *
   * Priority pools (only the union is sampled):
   *   1. Community + category + difficulty + tag overlap (preferred)
   *   2. Community + category + difficulty (tags relaxed) — most curated
   *      submissions land with empty tags, so this is where the variety
   *      lives in practice
   *   3. Community + category only (catches difficulty-mismatch submissions
   *      that are still topically relevant)
   *   4. Any active + original full criteria (non-community fallback)
   *
   * Excluded IDs are NOT applied here on purpose: the user explicitly asked
   * to be re-asked matching questions even after seeing them, otherwise the
   * bank gets exhausted in a few sessions.
   */
  private async findGuaranteedMatches(
    baseQuery: FilterQuery<Question>,
    targetCount: number,
  ): Promise<QuestionDocument[]> {
    if (targetCount <= 0) return [];

    const tier1Query: Record<string, unknown> = {
      ...baseQuery,
      createdBy: "community",
    };

    const tier2Query: Record<string, unknown> = {
      ...baseQuery,
      createdBy: "community",
    };
    delete tier2Query.tags;

    const tier3Query: Record<string, unknown> = {
      ...baseQuery,
      createdBy: "community",
    };
    delete tier3Query.tags;
    delete tier3Query.difficulty;

    // Step A — collect community candidates from tiers 1+2 as a mixed pool.
    // Tier 1 docs are doubled in the pool so they're roughly twice as likely
    // to be sampled when both pools have entries (gentle preference, not a
    // hard rule).
    const [tier1Docs, tier2Docs] = await Promise.all([
      this.questionModel
        .aggregate<QuestionDocument>([
          { $match: tier1Query },
          { $sample: { size: Math.max(targetCount * 2, 5) } },
        ])
        .exec(),
      this.questionModel
        .aggregate<QuestionDocument>([
          { $match: tier2Query },
          { $sample: { size: Math.max(targetCount * 4, 10) } },
        ])
        .exec(),
    ]);

    const idOf = (q: QuestionDocument): string =>
      (q as { _id?: { toString(): string } })._id?.toString() || "";

    const tier1Ids = new Set(tier1Docs.map(idOf).filter(Boolean));
    const dedupedTier2 = tier2Docs.filter((d) => !tier1Ids.has(idOf(d)));

    // Pool with gentle bias: tier-1 entries appear twice, tier-2 once.
    const weightedPool: QuestionDocument[] = [
      ...tier1Docs,
      ...tier1Docs,
      ...dedupedTier2,
    ];

    const sampleUnique = (
      pool: QuestionDocument[],
      size: number,
      excludeIds: Set<string> = new Set(),
    ): QuestionDocument[] => {
      const out: QuestionDocument[] = [];
      const seen = new Set(excludeIds);
      // Fisher–Yates partial shuffle
      const shuffled = [...pool];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      for (const doc of shuffled) {
        const id = idOf(doc);
        if (!id || seen.has(id)) continue;
        seen.add(id);
        out.push(doc);
        if (out.length >= size) break;
      }
      return out;
    };

    const picked = sampleUnique(weightedPool, targetCount);
    const pickedIds = new Set(picked.map(idOf));

    // Step B — if community pools combined still didn't satisfy targetCount,
    // fall back to tier 3 (community + category only) and tier 4 (any active
    // matching the original strict criteria).
    if (picked.length < targetCount) {
      const remaining = targetCount - picked.length;
      const reservedObjectIds = (() => {
        const { Types } = require("mongoose");
        return Array.from(pickedIds)
          .filter((id) => Types.ObjectId.isValid(id))
          .map((id) => new Types.ObjectId(id));
      })();

      const tier3WithExclusion: Record<string, unknown> = { ...tier3Query };
      if (reservedObjectIds.length > 0) {
        tier3WithExclusion._id = { $nin: reservedObjectIds };
      }
      const tier3Docs = await this.questionModel
        .aggregate<QuestionDocument>([
          { $match: tier3WithExclusion },
          { $sample: { size: remaining } },
        ])
        .exec();
      for (const doc of tier3Docs) {
        const id = idOf(doc);
        if (!id || pickedIds.has(id)) continue;
        pickedIds.add(id);
        picked.push(doc);
        if (picked.length >= targetCount) break;
      }
    }

    if (picked.length < targetCount) {
      const remaining = targetCount - picked.length;
      const reservedObjectIds = (() => {
        const { Types } = require("mongoose");
        return Array.from(pickedIds)
          .filter((id) => Types.ObjectId.isValid(id))
          .map((id) => new Types.ObjectId(id));
      })();

      const tier4WithExclusion: Record<string, unknown> = { ...baseQuery };
      if (reservedObjectIds.length > 0) {
        tier4WithExclusion._id = { $nin: reservedObjectIds };
      }
      const tier4Docs = await this.questionModel
        .aggregate<QuestionDocument>([
          { $match: tier4WithExclusion },
          { $sample: { size: remaining } },
        ])
        .exec();
      for (const doc of tier4Docs) {
        const id = idOf(doc);
        if (!id || pickedIds.has(id)) continue;
        pickedIds.add(id);
        picked.push(doc);
        if (picked.length >= targetCount) break;
      }
    }

    this.logger.debug(
      `findGuaranteedMatches: target=${targetCount} picked=${picked.length} ` +
        `(tier1=${tier1Docs.length}, tier2_extra=${dedupedTier2.length})`,
    );

    return picked.slice(0, targetCount);
  }

  private interleave<T>(a: T[], b: T[]): T[] {
    const out: T[] = [];
    const max = Math.max(a.length, b.length);
    for (let i = 0; i < max; i++) {
      if (i < a.length) out.push(a[i]);
      if (i < b.length) out.push(b[i]);
    }
    return out;
  }

  async incrementUsage(id: string): Promise<void> {
    await this.questionModel
      .findByIdAndUpdate(id, {
        $inc: { usageCount: 1 },
        $set: { lastAskedAt: new Date() },
      })
      .exec();
  }

  async incrementUsageBatch(ids: string[]): Promise<void> {
    if (!ids.length) return;
    const { Types } = require("mongoose");
    const objectIds = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (!objectIds.length) return;

    await this.questionModel
      .updateMany(
        { _id: { $in: objectIds } },
        {
          $inc: { usageCount: 1 },
          $set: { lastAskedAt: new Date() },
        },
      )
      .exec();
  }

  async getDistinctCategories(): Promise<string[]> {
    return this.questionModel.distinct("category", { isActive: true }).exec();
  }

  async getDistinctTags(): Promise<string[]> {
    return this.questionModel.distinct("tags", { isActive: true }).exec();
  }

  async countQuestions(filter: QuestionFilter = {}): Promise<number> {
    const query = this.buildFilterQuery(filter);
    return super.count(query);
  }

  /**
   * Returns questions with highest usageCount (frequently asked).
   * Uses adaptive threshold: picks top N questions sorted by usageCount desc.
   */
  async findPopular(
    limit = 20,
    filter: { category?: string; difficulty?: string } = {},
  ): Promise<QuestionDocument[]> {
    const query: FilterQuery<Question> = { isActive: true };
    if (filter.category) query.category = filter.category;
    if (filter.difficulty) query.difficulty = filter.difficulty;

    return this.questionModel
      .find(query)
      .sort({ usageCount: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Returns community-submitted questions with pagination.
   */
  async findCommunityQuestions(
    options: {
      page?: number;
      limit?: number;
      category?: string;
      difficulty?: string;
      companyTag?: string;
      sortBy?: string;
    } = {},
  ): Promise<{ questions: QuestionDocument[]; total: number }> {
    const { page = 1, limit = 12, sortBy = "newest" } = options;
    const query: FilterQuery<Question> = {
      createdBy: "community",
      isActive: true,
    };
    if (options.category) query.category = options.category;
    if (options.difficulty) query.difficulty = options.difficulty;
    if (options.companyTag) query.companyTag = options.companyTag;

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest: { createdAt: -1 },
      popular: { upvoteCount: -1 },
      oldest: { createdAt: 1 },
    };
    const sort = sortMap[sortBy] || sortMap.newest;

    const [questions, total] = await Promise.all([
      this.questionModel
        .find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.questionModel.countDocuments(query).exec(),
    ]);

    return { questions, total };
  }

  /**
   * Toggle upvote for a question. Returns updated count and whether user upvoted.
   */
  async toggleUpvote(
    questionId: string,
    userId: string,
  ): Promise<{ upvoteCount: number; upvoted: boolean }> {
    const question = await this.questionModel.findById(questionId).exec();
    if (!question) throw new Error("Question not found");

    const alreadyUpvoted = question.upvotedBy?.includes(userId);

    if (alreadyUpvoted) {
      await this.questionModel
        .findByIdAndUpdate(questionId, {
          $pull: { upvotedBy: userId },
          $inc: { upvoteCount: -1 },
        })
        .exec();
      return {
        upvoteCount: Math.max(0, (question.upvoteCount || 0) - 1),
        upvoted: false,
      };
    } else {
      await this.questionModel
        .findByIdAndUpdate(questionId, {
          $addToSet: { upvotedBy: userId },
          $inc: { upvoteCount: 1 },
        })
        .exec();
      return {
        upvoteCount: (question.upvoteCount || 0) + 1,
        upvoted: true,
      };
    }
  }

  /**
   * Find an existing question with similar content (first 100 chars match).
   */
  async findSimilar(
    content: string,
    category: string,
  ): Promise<QuestionDocument | null> {
    if (!content || content.length < 20) return null;
    // Normalize: take first 100 chars, escape regex specials
    const prefix = content
      .slice(0, 100)
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return this.questionModel
      .findOne({
        isActive: true,
        category,
        content: { $regex: `^${prefix}`, $options: "i" },
      })
      .exec();
  }

  async getDistinctCompanyTags(): Promise<string[]> {
    return this.questionModel
      .distinct("companyTag", { isActive: true, companyTag: { $ne: "" } })
      .exec();
  }

  private buildFilterQuery(filter: QuestionFilter): FilterQuery<Question> {
    const query: FilterQuery<Question> = {};

    if (filter.type) query.type = filter.type;
    if (filter.difficulty) query.difficulty = filter.difficulty;
    if (filter.category) query.category = filter.category;
    if (filter.tags?.length) query.tags = { $in: filter.tags };
    if (filter.isActive !== undefined) query.isActive = filter.isActive;

    return query;
  }
}
