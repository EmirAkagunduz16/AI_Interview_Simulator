import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { Question, QuestionDocument, QuestionType, Difficulty } from '../entities/question.entity';

export interface QuestionFilter {
  type?: QuestionType;
  difficulty?: Difficulty;
  category?: string;
  tags?: string[];
  isActive?: boolean;
}

@Injectable()
export class QuestionRepository {
  private readonly logger = new Logger(QuestionRepository.name);

  constructor(
    @InjectModel(Question.name)
    private readonly questionModel: Model<QuestionDocument>,
  ) {}

  async create(data: Partial<Question>): Promise<QuestionDocument> {
    const question = new this.questionModel(data);
    return question.save();
  }

  async createMany(data: Partial<Question>[]): Promise<QuestionDocument[]> {
    return this.questionModel.insertMany(data) as unknown as QuestionDocument[];
  }

  async findById(id: string): Promise<QuestionDocument | null> {
    return this.questionModel.findById(id).exec();
  }

  async findAll(
    filter: QuestionFilter = {},
    options: { page?: number; limit?: number } = {},
  ): Promise<{ questions: QuestionDocument[]; total: number }> {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const query = this.buildFilterQuery(filter);

    const [questions, total] = await Promise.all([
      this.questionModel.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
      this.questionModel.countDocuments(query).exec(),
    ]);

    return { questions, total };
  }

  async findRandom(filter: QuestionFilter = {}, count = 5): Promise<QuestionDocument[]> {
    const query = this.buildFilterQuery({ ...filter, isActive: true });
    return this.questionModel.aggregate([
      { $match: query },
      { $sample: { size: count } },
    ]).exec() as unknown as QuestionDocument[];
  }

  async update(id: string, data: Partial<Question>): Promise<QuestionDocument | null> {
    return this.questionModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .exec();
  }

  async incrementUsage(id: string): Promise<void> {
    await this.questionModel
      .findByIdAndUpdate(id, { $inc: { usageCount: 1 } })
      .exec();
  }

  async delete(id: string): Promise<void> {
    await this.questionModel.findByIdAndDelete(id).exec();
  }

  async getDistinctCategories(): Promise<string[]> {
    return this.questionModel.distinct('category', { isActive: true }).exec();
  }

  async getDistinctTags(): Promise<string[]> {
    return this.questionModel.distinct('tags', { isActive: true }).exec();
  }

  async count(filter: QuestionFilter = {}): Promise<number> {
    const query = this.buildFilterQuery(filter);
    return this.questionModel.countDocuments(query).exec();
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
