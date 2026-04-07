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

  async findRandom(
    filter: QuestionFilter = {},
    count = 5,
    excludeIds: string[] = [],
  ): Promise<QuestionDocument[]> {
    const query = this.buildFilterQuery({ ...filter, isActive: true });

    if (excludeIds.length > 0) {
      const { Types } = require("mongoose");
      const objectIds = excludeIds
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id));
      if (objectIds.length > 0) {
        query._id = { $nin: objectIds };
      }
    }

    // Pick 3x candidates sorted by usageCount (least-asked first),
    // then randomly sample from that subset for variety.
    const poolSize = count * 3;
    return this.questionModel
      .aggregate([
        { $match: query },
        { $sort: { usageCount: 1 } },
        { $limit: poolSize },
        { $sample: { size: count } },
      ])
      .exec() as unknown as QuestionDocument[];
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
