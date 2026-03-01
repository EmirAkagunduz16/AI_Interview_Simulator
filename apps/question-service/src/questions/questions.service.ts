import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
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
import { getSeedQuestions } from "./data/seed-questions";

@Injectable()
export class QuestionsService implements OnModuleInit {
  private readonly logger = new Logger(QuestionsService.name);

  constructor(
    private readonly questionRepository: QuestionRepository,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      const result = await this.seed();
      if (result.created > 0) {
        this.logger.log(`Auto-seeded ${result.created} questions on startup`);
      }
    } catch (error) {
      this.logger.warn("Auto-seed failed (non-fatal):", error);
    }
  }

  async create(dto: CreateQuestionDto): Promise<QuestionDocument> {
    const question = await this.questionRepository.create({
      ...dto,
      tags: dto.tags || [],
      mcqOptions: dto.mcqOptions || [],
    });
    this.logger.log(`Question created: ${question._id}`);
    return question;
  }

  async findById(id: string): Promise<QuestionDocument> {
    const question = await this.questionRepository.findById(id);
    if (!question) {
      throw new QuestionNotFoundException(id);
    }
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
    return this.questionRepository.findRandom(
      {
        type: query.type,
        difficulty: query.difficulty,
        category: query.category,
        tags: query.tags
          ? query.tags.split(",").map((t) => t.trim())
          : undefined,
      },
      query.count || 5,
    );
  }

  async update(id: string, dto: UpdateQuestionDto): Promise<QuestionDocument> {
    const updated = await this.questionRepository.update(id, dto);
    if (!updated) {
      throw new QuestionNotFoundException(id);
    }
    this.logger.log(`Question updated: ${id}`);
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
    const aiServiceUrl =
      this.configService.get<string>("AI_SERVICE_URL") ||
      "http://localhost:3006";
    const count = dto.count || 5;

    this.logger.log(
      `Generating ${count} questions for field=${dto.field}, tech=${dto.techStack.join(", ")}, difficulty=${dto.difficulty}`,
    );

    try {
      const { data } = await axios.post(
        `${aiServiceUrl}/api/v1/ai/generate-questions`,
        {
          field: dto.field,
          techStack: dto.techStack,
          difficulty: dto.difficulty,
          count,
        },
      );

      const generatedQuestions = data.questions || [];
      const savedQuestions: QuestionDocument[] = [];

      for (const q of generatedQuestions) {
        const question = await this.questionRepository.create({
          title: q.title || q.question,
          content: q.content || q.question,
          hints: q.hints || "",
          sampleAnswer: q.sampleAnswer || q.expectedAnswer || "",
          type: QuestionType.TECHNICAL,
          difficulty: dto.difficulty as Difficulty,
          category: dto.field,
          tags: dto.techStack,
        });

        savedQuestions.push(question);
      }

      this.logger.log(`Generated and saved ${savedQuestions.length} questions`);
      return savedQuestions;
    } catch (error) {
      this.logger.error("Failed to generate questions from AI service", error);
      throw error;
    }
  }

  async seed(): Promise<{ created: number }> {
    const seedQuestions = getSeedQuestions();
    const categories = [...new Set(seedQuestions.map((q) => q.category))];
    let totalCreated = 0;

    for (const category of categories) {
      const existingCount = await this.questionRepository.countQuestions({
        category,
      });

      if (existingCount >= 5) {
        continue; // This category already has enough questions
      }

      const questionsForCategory = seedQuestions.filter(
        (q) => q.category === category,
      );

      // Only add questions that don't already exist (by title)
      for (const q of questionsForCategory) {
        const existing = await this.questionRepository.findAllQuestions(
          { category: q.category },
          { page: 1, limit: 100 },
        );
        const alreadyExists = existing.questions.some(
          (eq) => eq.title === q.title,
        );
        if (!alreadyExists) {
          await this.questionRepository.create(q as any);
          totalCreated++;
        }
      }
    }

    if (totalCreated > 0) {
      this.logger.log(`Seeded ${totalCreated} new questions`);
    }
    return { created: totalCreated };
  }
}
