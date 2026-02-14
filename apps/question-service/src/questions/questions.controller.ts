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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { QuestionsService } from './questions.service';
import {
  CreateQuestionDto,
  UpdateQuestionDto,
  QueryQuestionsDto,
  RandomQuestionsDto,
  QuestionResponseDto,
  PaginatedQuestionsResponseDto,
} from './dto';

@ApiTags('Questions')
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated questions with filters' })
  @ApiResponse({ status: 200, type: PaginatedQuestionsResponseDto })
  async findAll(@Query() query: QueryQuestionsDto): Promise<PaginatedQuestionsResponseDto> {
    const result = await this.questionsService.findAll(query);
    return {
      questions: result.questions.map((q) => q.toJSON() as unknown as QuestionResponseDto),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  }

  @Get('random')
  @ApiOperation({ summary: 'Get random questions for interview' })
  @ApiResponse({ status: 200, type: [QuestionResponseDto] })
  async findRandom(@Query() query: RandomQuestionsDto): Promise<QuestionResponseDto[]> {
    const questions = await this.questionsService.findRandom(query);
    return questions.map((q) => {
      const json = { ...q } as unknown as Record<string, unknown>;
      json.id = q._id?.toString() || (q as unknown as { id: string }).id;
      delete json._id;
      delete json.__v;
      return json as unknown as QuestionResponseDto;
    });
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all unique categories' })
  @ApiResponse({ status: 200, type: [String] })
  async getCategories(): Promise<string[]> {
    return this.questionsService.getCategories();
  }

  @Get('tags')
  @ApiOperation({ summary: 'Get all unique tags' })
  @ApiResponse({ status: 200, type: [String] })
  async getTags(): Promise<string[]> {
    return this.questionsService.getTags();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get question by ID' })
  @ApiParam({ name: 'id', description: 'Question ID' })
  @ApiResponse({ status: 200, type: QuestionResponseDto })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async findOne(@Param('id') id: string): Promise<QuestionResponseDto> {
    const question = await this.questionsService.findById(id);
    return question.toJSON() as unknown as QuestionResponseDto;
  }

  @Post()
  @ApiOperation({ summary: 'Create new question' })
  @ApiResponse({ status: 201, type: QuestionResponseDto })
  async create(@Body() dto: CreateQuestionDto): Promise<QuestionResponseDto> {
    const question = await this.questionsService.create(dto);
    return question.toJSON() as unknown as QuestionResponseDto;
  }

  @Post('seed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Seed initial questions' })
  @ApiResponse({ status: 200 })
  async seed(): Promise<{ created: number }> {
    return this.questionsService.seed();
  }

  @Post(':id/increment-usage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[Internal] Increment question usage count' })
  @ApiParam({ name: 'id', description: 'Question ID' })
  @ApiResponse({ status: 204 })
  async incrementUsage(@Param('id') id: string): Promise<void> {
    await this.questionsService.incrementUsage(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update question' })
  @ApiParam({ name: 'id', description: 'Question ID' })
  @ApiResponse({ status: 200, type: QuestionResponseDto })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateQuestionDto,
  ): Promise<QuestionResponseDto> {
    const question = await this.questionsService.update(id, dto);
    return question.toJSON() as unknown as QuestionResponseDto;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete question' })
  @ApiParam({ name: 'id', description: 'Question ID' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.questionsService.delete(id);
  }
}
