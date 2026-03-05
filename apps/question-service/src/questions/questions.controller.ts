import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { QuestionsService } from "./questions.service";
import {
  CreateQuestionDto,
  UpdateQuestionDto,
  QueryQuestionsDto,
  RandomQuestionsDto,
  QuestionResponseDto,
  PaginatedQuestionsResponseDto,
  GenerateQuestionsDto,
} from "./dto";

@Controller("questions")
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  async findAll(
    @Query() query: QueryQuestionsDto,
  ): Promise<PaginatedQuestionsResponseDto> {
    const result = await this.questionsService.findAll(query);
    return {
      questions: result.questions.map(
        (q) => q.toJSON() as unknown as QuestionResponseDto,
      ),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  }

  @Get("random")
  async findRandom(
    @Query() query: RandomQuestionsDto,
  ): Promise<QuestionResponseDto[]> {
    const questions = await this.questionsService.findRandom(query);
    return questions.map((q) => {
      const json = { ...q } as unknown as Record<string, unknown>;
      json.id = q._id?.toString() || (q as unknown as { id: string }).id;
      delete json._id;
      delete json.__v;
      return json as unknown as QuestionResponseDto;
    });
  }

  @Get("categories")
  async getCategories(): Promise<string[]> {
    return this.questionsService.getCategories();
  }

  @Get("tags")
  async getTags(): Promise<string[]> {
    return this.questionsService.getTags();
  }

  @Get(":id")
  async findOne(@Param("id") id: string): Promise<QuestionResponseDto> {
    const question = await this.questionsService.findById(id);
    return question.toJSON() as unknown as QuestionResponseDto;
  }

  @Post()
  async create(@Body() dto: CreateQuestionDto): Promise<QuestionResponseDto> {
    const question = await this.questionsService.create(dto);
    return question.toJSON() as unknown as QuestionResponseDto;
  }

  @Post("generate")
  async generate(
    @Body() dto: GenerateQuestionsDto,
  ): Promise<QuestionResponseDto[]> {
    const questions = await this.questionsService.generateAndSave(dto);
    return questions.map((q) => q.toJSON() as unknown as QuestionResponseDto);
  }

  @Post("seed")
  @HttpCode(HttpStatus.OK)
  async seed(): Promise<{ created: number }> {
    return this.questionsService.seed();
  }

  @Post(":id/increment-usage")
  @HttpCode(HttpStatus.NO_CONTENT)
  async incrementUsage(@Param("id") id: string): Promise<void> {
    await this.questionsService.incrementUsage(id);
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateQuestionDto,
  ): Promise<QuestionResponseDto> {
    const question = await this.questionsService.update(id, dto);
    return question.toJSON() as unknown as QuestionResponseDto;
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param("id") id: string): Promise<void> {
    await this.questionsService.delete(id);
  }
}
