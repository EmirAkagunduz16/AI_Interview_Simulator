import { Injectable, Logger } from "@nestjs/common";
import {
  QuestionRepository,
  QuestionFilter,
} from "./repositories/question.repository";
import {
  CreateQuestionDto,
  UpdateQuestionDto,
  QueryQuestionsDto,
  RandomQuestionsDto,
  GenerateQuestionsDto,
} from "./dto";
import {
  QuestionDocument,
  QuestionType,
  Difficulty,
} from "./entities/question.entity";
import { QuestionNotFoundException } from "../common/exceptions";
import { GeminiService } from "./gemini.service";
import { RedisService } from "../common/redis/redis.service";

@Injectable()
export class QuestionsService {
  private readonly logger = new Logger(QuestionsService.name);

  constructor(
    private readonly questionRepository: QuestionRepository,
    private readonly geminiService: GeminiService,
    private readonly redisService: RedisService,
  ) {}

  async create(dto: CreateQuestionDto): Promise<QuestionDocument> {
    const question = await this.questionRepository.create({
      ...dto,
      tags: dto.tags || [],
      mcqOptions: dto.mcqOptions || [],
    });
    this.logger.log(`Question created: ${question._id}`);

    // Cache the new question & invalidate category caches
    const id = question._id?.toString();
    if (id) {
      this.redisService
        .cacheQuestion(id, question.toObject())
        .catch((e) => this.logger.warn("Redis cacheQuestion failed", e));
    }
    if (dto.category) {
      this.redisService
        .invalidateCategoryCache(dto.category)
        .catch((e) => this.logger.warn("Redis invalidateCategory failed", e));
    }

    return question;
  }

  async findById(id: string): Promise<QuestionDocument> {
    // Check Redis cache first
    const cached = await this.redisService.getCachedQuestion(id);
    if (cached) {
      this.logger.debug(`Cache hit for question ${id}`);
      return cached as unknown as QuestionDocument;
    }

    const question = await this.questionRepository.findById(id);
    if (!question) {
      throw new QuestionNotFoundException(id);
    }

    // Store in cache for future lookups
    this.redisService
      .cacheQuestion(id, question.toObject())
      .catch((e) => this.logger.warn("Redis cacheQuestion failed", e));

    return question;
  }

  async findAll(query: QueryQuestionsDto): Promise<{
    questions: QuestionDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const filter: QuestionFilter = {
      type: query.type,
      difficulty: query.difficulty,
      category: query.category,
      tags: query.tags ? query.tags.split(",").map((t) => t.trim()) : undefined,
    };

    const { page = 1, limit = 10 } = query;
    const { questions, total } = await this.questionRepository.findAllQuestions(
      filter,
      {
        page,
        limit,
      },
    );
    const totalPages = Math.ceil(total / limit);

    return { questions, total, page, totalPages };
  }

  async findRandom(query: RandomQuestionsDto): Promise<QuestionDocument[]> {
    const questions = await this.questionRepository.findRandom(
      {
        type: query.type,
        difficulty: query.difficulty,
        category: query.category,
        tags: query.tags
          ? query.tags.split(",").map((t) => t.trim())
          : undefined,
      },
      query.count || 5,
      query.excludeIds || [],
    );

    // Auto-increment usage for returned questions
    const ids = questions
      .map((q) => q._id?.toString())
      .filter(Boolean) as string[];
    if (ids.length > 0) {
      this.questionRepository
        .incrementUsageBatch(ids)
        .catch((e) =>
          this.logger.warn("Failed to increment usage counts", e),
        );
    }

    return questions;
  }

  async update(id: string, dto: UpdateQuestionDto): Promise<QuestionDocument> {
    const updated = await this.questionRepository.update(id, dto);
    if (!updated) {
      throw new QuestionNotFoundException(id);
    }
    this.logger.log(`Question updated: ${id}`);

    // Invalidate caches
    this.redisService
      .invalidateQuestion(id)
      .catch((e) => this.logger.warn("Redis invalidateQuestion failed", e));
    if (dto.category) {
      this.redisService
        .invalidateCategoryCache(dto.category)
        .catch((e) => this.logger.warn("Redis invalidateCategory failed", e));
    }

    return updated;
  }

  async incrementUsage(id: string): Promise<void> {
    await this.questionRepository.incrementUsage(id);
  }

  async delete(id: string): Promise<void> {
    const question = await this.questionRepository.findById(id);
    if (!question) {
      throw new QuestionNotFoundException(id);
    }
    await this.questionRepository.delete(id);
    this.logger.log(`Question deleted: ${id}`);

    // Invalidate caches
    this.redisService
      .invalidateQuestion(id)
      .catch((e) => this.logger.warn("Redis invalidateQuestion failed", e));
    const category = (question as any).category;
    if (category) {
      this.redisService
        .invalidateCategoryCache(category)
        .catch((e) => this.logger.warn("Redis invalidateCategory failed", e));
    }
  }

  async getCategories(): Promise<string[]> {
    return this.questionRepository.getDistinctCategories();
  }

  async getTags(): Promise<string[]> {
    return this.questionRepository.getDistinctTags();
  }

  async generateAndSave(
    dto: GenerateQuestionsDto,
  ): Promise<QuestionDocument[]> {
    const count = dto.count || 5;

    this.logger.log(
      `Generating ${count} questions via Gemini for field=${dto.field}, tech=${dto.techStack.join(", ")}, difficulty=${dto.difficulty}`,
    );

    const generatedQuestions = await this.geminiService.generateQuestions({
      field: dto.field,
      techStack: dto.techStack,
      difficulty: dto.difficulty,
      count,
    });

    const savedQuestions: QuestionDocument[] = [];

    for (const q of generatedQuestions) {
      try {
        const question = await this.questionRepository.create({
          title: q.title || q.content,
          content: q.content || q.title,
          hints: "",
          sampleAnswer: q.sampleAnswer || "",
          type: QuestionType.TECHNICAL,
          difficulty: dto.difficulty as Difficulty,
          category: dto.field,
          tags: dto.techStack,
          createdBy: "ai-generated",
        } as any);
        savedQuestions.push(question);
      } catch (e) {
        this.logger.warn(`Skipping duplicate question: ${q.title}`, e);
      }
    }

    this.logger.log(`Generated and saved ${savedQuestions.length} questions`);

    // Invalidate category cache after bulk generation
    this.redisService
      .invalidateCategoryCache(dto.field)
      .catch((e) => this.logger.warn("Redis invalidateCategory failed", e));

    return savedQuestions;
  }
}
