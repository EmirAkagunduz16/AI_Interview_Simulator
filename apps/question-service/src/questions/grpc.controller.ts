import { Controller, Logger } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { mapInterviewDifficultyToQuestionDifficulty } from "@ai-coach/shared-types";
import { QuestionsService } from "./questions.service";
import type {
  GetQuestionRequest,
  GetQuestionsRequest,
  GetRandomQuestionsRequest,
  CreateQuestionRequest,
  GenerateQuestionsRequest,
  UpdateQuestionRequest,
  DeleteQuestionRequest,
  QuestionResponse,
  QuestionsListResponse,
  StringListResponse,
} from "@ai-coach/grpc";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MongoDocument = { toJSON?: () => Record<string, any> } & Record<
  string,
  any
>;

@Controller()
export class GrpcQuestionsController {
  private readonly logger = new Logger(GrpcQuestionsController.name);

  constructor(private readonly questionsService: QuestionsService) {}

  @GrpcMethod("QuestionService", "GetQuestion")
  async getQuestion(data: GetQuestionRequest): Promise<QuestionResponse> {
    this.logger.debug(`gRPC GetQuestion: ${data.questionId}`);
    const question = await this.questionsService.findById(data.questionId);
    return this.toGrpcResponse(question as MongoDocument);
  }

  @GrpcMethod("QuestionService", "GetQuestions")
  async getQuestions(
    data: GetQuestionsRequest,
  ): Promise<QuestionsListResponse> {
    this.logger.debug(`gRPC GetQuestions page=${data.page}`);
    const difficulty = data.difficulty
      ? mapInterviewDifficultyToQuestionDifficulty(data.difficulty)
      : undefined;
    const result = await this.questionsService.findAll({
      type: data.type as string,
      difficulty,
      category: data.category,
      page: data.page || 1,
      limit: data.limit || 10,
    } as Parameters<typeof this.questionsService.findAll>[0]);
    return {
      questions: result.questions.map((q) =>
        this.toGrpcResponse(q as MongoDocument),
      ),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  }

  @GrpcMethod("QuestionService", "GetRandomQuestions")
  async getRandomQuestions(
    data: GetRandomQuestionsRequest,
  ): Promise<{ questions: QuestionResponse[] }> {
    this.logger.debug(`gRPC GetRandomQuestions count=${data.count}`);
    const difficulty = mapInterviewDifficultyToQuestionDifficulty(
      data.difficulty || "",
    );
    const questions = await this.questionsService.findRandom({
      count: data.count,
      type: data.type as string,
      difficulty,
      category: data.category,
      tags: data.tags,
      excludeIds: data.excludeIds,
    } as Parameters<typeof this.questionsService.findRandom>[0]);
    return {
      questions: questions.map((q) => {
        const doc = { ...(q as MongoDocument) };
        doc.id = doc._id?.toString() || doc.id;
        return this.toGrpcResponse(doc);
      }),
    };
  }

  @GrpcMethod("QuestionService", "GetCategories")
  async getCategories(): Promise<StringListResponse> {
    this.logger.debug("gRPC GetCategories");
    const categories = await this.questionsService.getCategories();
    return { items: categories };
  }

  @GrpcMethod("QuestionService", "GetTags")
  async getTags(): Promise<StringListResponse> {
    this.logger.debug("gRPC GetTags");
    const tags = await this.questionsService.getTags();
    return { items: tags };
  }

  @GrpcMethod("QuestionService", "CreateQuestion")
  async createQuestion(data: CreateQuestionRequest): Promise<QuestionResponse> {
    this.logger.debug("gRPC CreateQuestion");
    const difficulty = mapInterviewDifficultyToQuestionDifficulty(
      data.difficulty || "",
    );
    const question = await this.questionsService.create({
      ...data,
      difficulty,
    } as Parameters<typeof this.questionsService.create>[0]);
    return this.toGrpcResponse(question as MongoDocument);
  }

  @GrpcMethod("QuestionService", "GenerateQuestions")
  async generateQuestions(
    data: GenerateQuestionsRequest,
  ): Promise<{ questions: QuestionResponse[] }> {
    this.logger.debug(`gRPC GenerateQuestions field=${data.field}`);
    const difficulty = mapInterviewDifficultyToQuestionDifficulty(
      data.difficulty || "",
    );
    const questions = await this.questionsService.generateAndSave({
      field: data.field,
      techStack: data.techStack,
      difficulty,
      count: data.count,
    } as Parameters<typeof this.questionsService.generateAndSave>[0]);
    return {
      questions: questions.map((q) => this.toGrpcResponse(q as MongoDocument)),
    };
  }

  @GrpcMethod("QuestionService", "UpdateQuestion")
  async updateQuestion(data: UpdateQuestionRequest): Promise<QuestionResponse> {
    this.logger.debug(`gRPC UpdateQuestion: ${data.questionId}`);
    const { questionId, ...updateData } = data;
    const question = await this.questionsService.update(
      questionId,
      updateData as Parameters<typeof this.questionsService.update>[1],
    );
    return this.toGrpcResponse(question as MongoDocument);
  }

  @GrpcMethod("QuestionService", "DeleteQuestion")
  async deleteQuestion(
    data: DeleteQuestionRequest,
  ): Promise<Record<string, never>> {
    this.logger.debug(`gRPC DeleteQuestion: ${data.questionId}`);
    await this.questionsService.delete(data.questionId);
    return {};
  }

  private toGrpcResponse(item: MongoDocument): QuestionResponse {
    const json = item.toJSON ? item.toJSON() : item;

    return {
      id: json._id?.toString() || json.id || "",
      title: json.title || "",
      content: json.content || "",
      hints: json.hints || "",
      sampleAnswer: json.sampleAnswer || "",
      type: json.type || "",
      difficulty: json.difficulty || "",
      category: json.category || "",
      tags: json.tags || [],
      mcqOptions: (json.mcqOptions || []).map((o: MongoDocument) => ({
        text: o.text || "",
        isCorrect: o.isCorrect || false,
      })),
    };
  }
}
