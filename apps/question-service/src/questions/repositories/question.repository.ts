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
  ): Promise<QuestionDocument[]> {
    const query = this.buildFilterQuery({ ...filter, isActive: true });
    return this.questionModel
      .aggregate([{ $match: query }, { $sample: { size: count } }])
      .exec() as unknown as QuestionDocument[];
  }

  async incrementUsage(id: string): Promise<void> {
    await this.questionModel
      .findByIdAndUpdate(id, { $inc: { usageCount: 1 } })
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
