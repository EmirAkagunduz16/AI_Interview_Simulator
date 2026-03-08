import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Inject,
  OnModuleInit,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";
import {
  GRPC_QUESTION_SERVICE,
  IGrpcQuestionService,
  CreateQuestionRequest,
  GenerateQuestionsRequest,
  UpdateQuestionRequest,
} from "@ai-coach/grpc";

@Controller("questions")
export class QuestionsController implements OnModuleInit {
  private questionService!: IGrpcQuestionService;

  constructor(
    @Inject(GRPC_QUESTION_SERVICE) private readonly grpcClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.questionService =
      this.grpcClient.getService<IGrpcQuestionService>("QuestionService");
  }

  @Get()
  async findAll(
    @Query("page") page = 1,
    @Query("limit") limit = 10,
    @Query("type") type?: string,
    @Query("difficulty") difficulty?: string,
    @Query("category") category?: string,
  ) {
    return firstValueFrom(
      this.questionService.getQuestions({
        page,
        limit,
        type,
        difficulty,
        category,
      }),
    );
  }

  @Get("random")
  async getRandom(
    @Query("count") count = 5,
    @Query("type") type?: string,
    @Query("difficulty") difficulty?: string,
    @Query("category") category?: string,
  ) {
    const result = await firstValueFrom(
      this.questionService.getRandomQuestions({
        count,
        type,
        difficulty,
        category,
      }),
    );
    return result.questions;
  }

  @Get("categories")
  async getCategories() {
    const result = await firstValueFrom(
      this.questionService.getCategories({} as Record<string, never>),
    );
    return result.items;
  }

  @Get("tags")
  async getTags() {
    const result = await firstValueFrom(
      this.questionService.getTags({} as Record<string, never>),
    );
    return result.items;
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return firstValueFrom(
      this.questionService.getQuestion({ questionId: id }),
    );
  }

  @Post()
  async create(@Body() body: CreateQuestionRequest) {
    return firstValueFrom(this.questionService.createQuestion(body));
  }

  @Post("generate")
  async generate(@Body() body: GenerateQuestionsRequest) {
    const result = await firstValueFrom(
      this.questionService.generateQuestions({
        field: body.field,
        techStack: body.techStack || [],
        difficulty: body.difficulty,
        count: body.count,
      }),
    );
    return result.questions;
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() body: Omit<UpdateQuestionRequest, "questionId">) {
    return firstValueFrom(
      this.questionService.updateQuestion({ questionId: id, ...body }),
    );
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param("id") id: string) {
    await firstValueFrom(
      this.questionService.deleteQuestion({ questionId: id }),
    );
  }
}
