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
  GetPopularQuestionsRequest,
  GetCommunityQuestionsRequest,
  SubmitCommunityQuestionRequest,
  UpvoteQuestionRequest,
  UpvoteQuestionResponse,
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

  @GrpcMethod("QuestionService", "GetPopularQuestions")
  async getPopularQuestions(
    data: GetPopularQuestionsRequest,
  ): Promise<{ questions: QuestionResponse[] }> {
    this.logger.debug(`gRPC GetPopularQuestions limit=${data.limit}`);
    const difficulty = data.difficulty
      ? mapInterviewDifficultyToQuestionDifficulty(data.difficulty)
      : undefined;
    const questions = await this.questionsService.findPopular(
      data.limit || 20,
      { category: data.category, difficulty },
    );
    return {
      questions: questions.map((q) => this.toGrpcResponse(q as MongoDocument)),
    };
  }

  @GrpcMethod("QuestionService", "GetCommunityQuestions")
  async getCommunityQuestions(
    data: GetCommunityQuestionsRequest,
  ): Promise<QuestionsListResponse> {
    this.logger.debug(`gRPC GetCommunityQuestions page=${data.page}`);
    const difficulty = data.difficulty
      ? mapInterviewDifficultyToQuestionDifficulty(data.difficulty)
      : undefined;
    const result = await this.questionsService.findCommunityQuestions({
      page: data.page || 1,
      limit: data.limit || 12,
      category: data.category,
      difficulty,
      companyTag: data.companyTag,
      sortBy: data.sortBy,
    });
    return {
      questions: result.questions.map((q) =>
        this.toGrpcResponse(q as MongoDocument),
      ),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  }

  @GrpcMethod("QuestionService", "SubmitCommunityQuestion")
  async submitCommunityQuestion(
    data: SubmitCommunityQuestionRequest,
  ): Promise<QuestionResponse> {
    this.logger.debug("gRPC SubmitCommunityQuestion");
    // difficulty/category/title are optional now — when missing, the
    // service will auto-classify the question via Gemini.
    const rawDifficulty = (data.difficulty || "").trim();
    const difficulty = rawDifficulty
      ? mapInterviewDifficultyToQuestionDifficulty(rawDifficulty) || rawDifficulty
      : "";

    const question = await this.questionsService.submitCommunityQuestion({
      title: data.title,
      content: data.content,
      type: data.type || "technical",
      difficulty,
      category: data.category,
      companyTag: data.companyTag || "",
      tags: data.tags || [],
      submittedBy: data.submittedBy,
      submitterName: data.submitterName,
      hints: data.hints,
      sampleAnswer: data.sampleAnswer,
    });
    return this.toGrpcResponse(question as MongoDocument);
  }

  @GrpcMethod("QuestionService", "UpvoteQuestion")
  async upvoteQuestion(
    data: UpvoteQuestionRequest,
  ): Promise<UpvoteQuestionResponse> {
    this.logger.debug(`gRPC UpvoteQuestion: ${data.questionId}`);
    const result = await this.questionsService.toggleUpvote(
      data.questionId,
      data.userId,
    );
    return {
      questionId: data.questionId,
      upvoteCount: result.upvoteCount,
      upvoted: result.upvoted,
    };
  }

  private toGrpcResponse(item: MongoDocument): QuestionResponse {
    const json = item.toJSON ? item.toJSON() : item;

    const parsedContent = QuestionsService.parseQuestionText(json.content || "");

    return {
      id: json._id?.toString() || json.id || "",
      title: json.title || "",
      content: parsedContent,
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
      usageCount: json.usageCount || 0,
      companyTag: json.companyTag || "",
      upvoteCount: json.upvoteCount || 0,
      createdBy: json.createdBy || "seed",
      submitterName: json.submitterName || "",
      createdAt: json.createdAt
        ? new Date(json.createdAt).toISOString()
        : "",
    };
  }
}
