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
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";
import { GRPC_QUESTION_SERVICE, IGrpcQuestionService } from "@ai-coach/grpc";

@ApiTags("Questions")
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
  @ApiOperation({ summary: "Get paginated questions" })
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
      }) as any,
    );
  }

  @Get("random")
  @ApiOperation({ summary: "Get random questions" })
  async getRandom(
    @Query("count") count = 5,
    @Query("type") type?: string,
    @Query("difficulty") difficulty?: string,
    @Query("category") category?: string,
  ) {
    const result: any = await firstValueFrom(
      this.questionService.getRandomQuestions({
        count,
        type,
        difficulty,
        category,
      }) as any,
    );
    return result.questions;
  }

  @Get("categories")
  @ApiOperation({ summary: "Get all categories" })
  async getCategories() {
    const result: any = await firstValueFrom(
      this.questionService.getCategories({} as any) as any,
    );
    return result.items;
  }

  @Get("tags")
  @ApiOperation({ summary: "Get all tags" })
  async getTags() {
    const result: any = await firstValueFrom(
      this.questionService.getTags({} as any) as any,
    );
    return result.items;
  }

  @Get(":id")
  @ApiOperation({ summary: "Get question by ID" })
  async findOne(@Param("id") id: string) {
    return firstValueFrom(
      this.questionService.getQuestion({ question_id: id }) as any,
    );
  }

  @Post()
  @ApiOperation({ summary: "Create question" })
  async create(@Body() body: any) {
    return firstValueFrom(this.questionService.createQuestion(body) as any);
  }

  @Post("generate")
  @ApiOperation({ summary: "Generate questions with AI" })
  async generate(@Body() body: any) {
    const result: any = await firstValueFrom(
      this.questionService.generateQuestions({
        field: body.field,
        techStack: body.techStack || body.tech_stack || [],
        difficulty: body.difficulty,
        count: body.count,
      }) as any,
    );
    return result.questions;
  }

  @Post("seed")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Seed initial questions" })
  async seed() {
    return firstValueFrom(this.questionService.seedQuestions({} as any) as any);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update question" })
  async update(@Param("id") id: string, @Body() body: any) {
    return firstValueFrom(
      this.questionService.updateQuestion({
        question_id: id,
        ...body,
      }) as any,
    );
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete question" })
  async delete(@Param("id") id: string) {
    await firstValueFrom(
      this.questionService.deleteQuestion({ question_id: id }) as any,
    );
  }
}
