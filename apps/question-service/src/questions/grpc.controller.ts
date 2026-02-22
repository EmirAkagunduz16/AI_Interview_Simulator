import { Controller, Logger } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { QuestionsService } from "./questions.service";

@Controller()
export class GrpcQuestionsController {
  private readonly logger = new Logger(GrpcQuestionsController.name);

  constructor(private readonly questionsService: QuestionsService) {}

  @GrpcMethod("QuestionService", "GetQuestion")
  async getQuestion(data: { question_id: string }) {
    this.logger.debug(`gRPC GetQuestion: ${data.question_id}`);
    const question = await this.questionsService.findById(data.question_id);
    return this.toGrpcResponse(question);
  }

  @GrpcMethod("QuestionService", "GetQuestions")
  async getQuestions(data: {
    type?: string;
    difficulty?: string;
    category?: string;
    page: number;
    limit: number;
  }) {
    this.logger.debug(`gRPC GetQuestions page=${data.page}`);
    const result = await this.questionsService.findAll({
      type: data.type,
      difficulty: data.difficulty,
      category: data.category,
      page: data.page || 1,
      limit: data.limit || 10,
    } as any);
    return {
      questions: result.questions.map((q) => this.toGrpcResponse(q)),
      total: result.total,
      page: result.page,
      total_pages: result.totalPages,
    };
  }

  @GrpcMethod("QuestionService", "GetRandomQuestions")
  async getRandomQuestions(data: {
    count: number;
    type?: string;
    difficulty?: string;
    category?: string;
  }) {
    this.logger.debug(`gRPC GetRandomQuestions count=${data.count}`);
    const questions = await this.questionsService.findRandom(data as any);
    return {
      questions: questions.map((q) => {
        const json = { ...q } as any;
        json.id = q._id?.toString() || (q as any).id;
        return this.toGrpcResponse(json);
      }),
    };
  }

  @GrpcMethod("QuestionService", "GetCategories")
  async getCategories() {
    this.logger.debug("gRPC GetCategories");
    const categories = await this.questionsService.getCategories();
    return { items: categories };
  }

  @GrpcMethod("QuestionService", "GetTags")
  async getTags() {
    this.logger.debug("gRPC GetTags");
    const tags = await this.questionsService.getTags();
    return { items: tags };
  }

  @GrpcMethod("QuestionService", "CreateQuestion")
  async createQuestion(data: any) {
    this.logger.debug("gRPC CreateQuestion");
    const question = await this.questionsService.create(data);
    return this.toGrpcResponse(question);
  }

  @GrpcMethod("QuestionService", "GenerateQuestions")
  async generateQuestions(data: {
    field: string;
    tech_stack: string[];
    difficulty: string;
    count: number;
  }) {
    this.logger.debug(`gRPC GenerateQuestions field=${data.field}`);
    const questions = await this.questionsService.generateAndSave({
      field: data.field,
      techStack: data.tech_stack,
      difficulty: data.difficulty,
      count: data.count,
    } as any);
    return {
      questions: questions.map((q) => this.toGrpcResponse(q)),
    };
  }

  @GrpcMethod("QuestionService", "SeedQuestions")
  async seedQuestions() {
    this.logger.debug("gRPC SeedQuestions");
    return this.questionsService.seed();
  }

  @GrpcMethod("QuestionService", "UpdateQuestion")
  async updateQuestion(data: { question_id: string; [key: string]: any }) {
    this.logger.debug(`gRPC UpdateQuestion: ${data.question_id}`);
    const { question_id, ...updateData } = data;
    const question = await this.questionsService.update(
      question_id,
      updateData,
    );
    return this.toGrpcResponse(question);
  }

  @GrpcMethod("QuestionService", "DeleteQuestion")
  async deleteQuestion(data: { question_id: string }) {
    this.logger.debug(`gRPC DeleteQuestion: ${data.question_id}`);
    await this.questionsService.delete(data.question_id);
    return {};
  }

  private toGrpcResponse(item: any) {
    const json = item.toJSON ? item.toJSON() : item;
    return {
      id: json._id?.toString() || json.id || "",
      title: json.title || "",
      content: json.content || "",
      hints: json.hints || "",
      sample_answer: json.sampleAnswer || json.sample_answer || "",
      type: json.type || "",
      difficulty: json.difficulty || "",
      category: json.category || "",
      tags: json.tags || [],
      mcq_options: (json.mcqOptions || json.mcq_options || []).map(
        (o: any) => ({
          text: o.text || "",
          is_correct: o.isCorrect || o.is_correct || false,
        }),
      ),
    };
  }
}
