import { Injectable, Logger } from "@nestjs/common";
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

@Injectable()
export class QuestionsService {
  private readonly logger = new Logger(QuestionsService.name);

  constructor(
    private readonly questionRepository: QuestionRepository,
    private readonly configService: ConfigService,
  ) {}

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
        `${aiServiceUrl}/ai/generate-questions`,
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
    const count = await this.questionRepository.countQuestions();
    if (count > 0) {
      this.logger.log("Questions already seeded, skipping...");
      return { created: 0 };
    }

    const seedQuestions = this.getSeedQuestions();
    await this.questionRepository.createMany(seedQuestions);
    this.logger.log(`Seeded ${seedQuestions.length} questions`);
    return { created: seedQuestions.length };
  }

  private getSeedQuestions(): Partial<QuestionDocument>[] {
    return [
      {
        title: "Tell me about yourself",
        content:
          "Give a brief introduction about your background, experience, and what you are looking for.",
        hints:
          "Keep it professional, focus on relevant experience, and show enthusiasm.",
        sampleAnswer: "I am a software engineer with 3 years of experience...",
        type: QuestionType.BEHAVIORAL,
        difficulty: Difficulty.EASY,
        category: "Introduction",
        tags: ["common", "introduction", "general"],
      },
      {
        title: "Describe a challenging project",
        content:
          "Tell me about a project where you faced significant challenges and how you overcame them.",
        hints: "Use the STAR method: Situation, Task, Action, Result.",
        type: QuestionType.BEHAVIORAL,
        difficulty: Difficulty.MEDIUM,
        category: "Problem Solving",
        tags: ["problem-solving", "experience", "challenges"],
      },
      {
        title: "What is the difference between REST and GraphQL?",
        content:
          "Explain the key differences between REST APIs and GraphQL, including their pros and cons.",
        sampleAnswer:
          "REST uses multiple endpoints with fixed data structures, while GraphQL uses a single endpoint with flexible queries...",
        type: QuestionType.TECHNICAL,
        difficulty: Difficulty.MEDIUM,
        category: "Backend Development",
        tags: ["api", "rest", "graphql", "backend"],
      },
      {
        title: "Explain Big O Notation",
        content:
          "What is Big O notation and why is it important in algorithm analysis?",
        hints: "Discuss time and space complexity with examples.",
        type: QuestionType.TECHNICAL,
        difficulty: Difficulty.EASY,
        category: "Algorithms",
        tags: ["algorithms", "complexity", "fundamentals"],
      },
      {
        title: "Reverse a Linked List",
        content:
          "Write a function to reverse a singly linked list. Explain your approach and analyze the complexity.",
        hints: "Consider both iterative and recursive approaches.",
        type: QuestionType.CODING,
        difficulty: Difficulty.MEDIUM,
        category: "Data Structures",
        tags: ["linked-list", "coding", "data-structures"],
      },
      {
        title: "Design a URL Shortener",
        content:
          "Design a system like bit.ly that shortens URLs. Consider scalability, storage, and collision handling.",
        hints: "Think about encoding schemes, database design, and caching.",
        type: QuestionType.SYSTEM_DESIGN,
        difficulty: Difficulty.HARD,
        category: "System Design",
        tags: ["system-design", "scalability", "database"],
      },
      {
        title: "How do you handle conflict with a coworker?",
        content:
          "Describe a situation where you had a disagreement with a colleague and how you resolved it.",
        hints:
          "Focus on communication, understanding different perspectives, and finding common ground.",
        type: QuestionType.SITUATIONAL,
        difficulty: Difficulty.MEDIUM,
        category: "Teamwork",
        tags: ["teamwork", "conflict-resolution", "communication"],
      },
      {
        title: "Which HTTP method is idempotent?",
        content:
          "Which of the following HTTP methods are considered idempotent?",
        type: QuestionType.MCQ,
        difficulty: Difficulty.EASY,
        category: "Web Development",
        tags: ["http", "web", "api"],
        mcqOptions: [
          { text: "GET", isCorrect: true },
          { text: "POST", isCorrect: false },
          { text: "PUT", isCorrect: true },
          { text: "DELETE", isCorrect: true },
        ],
      },
    ];
  }
}
