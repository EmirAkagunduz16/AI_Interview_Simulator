import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { InterviewsService } from "./interviews.service";
import {
  CreateInterviewDto,
  SubmitAnswerDto,
  InterviewResponseDto,
  PaginatedInterviewsResponseDto,
  InterviewStatsDto,
} from "./dto";
import { InterviewStatus, InterviewReport } from "./entities/interview.entity";

@Controller("interviews")
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Get()
  async findAll(
    @Headers("x-user-id") userId: string,
    @Query("page") page = 1,
    @Query("limit") limit = 10,
    @Query("status") status?: InterviewStatus,
  ): Promise<PaginatedInterviewsResponseDto> {
    const result = await this.interviewsService.findByUserId(userId, {
      page,
      limit,
      status,
    });
    return {
      interviews: result.interviews.map(
        (i) => i.toJSON() as unknown as InterviewResponseDto,
      ),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  }

  @Get("stats")
  async getStats(
    @Headers("x-user-id") userId: string,
  ): Promise<InterviewStatsDto> {
    return this.interviewsService.getStats(userId);
  }

  @Get(":id")
  async findOne(
    @Headers("x-user-id") userId: string,
    @Param("id") id: string,
  ): Promise<InterviewResponseDto> {
    const interview = await this.interviewsService.findById(userId, id);
    return interview.toJSON() as unknown as InterviewResponseDto;
  }

  @Post()
  async create(
    @Headers("x-user-id") userId: string,
    @Body() dto: CreateInterviewDto,
  ): Promise<InterviewResponseDto> {
    const interview = await this.interviewsService.create(userId, dto);
    return interview.toJSON() as unknown as InterviewResponseDto;
  }

  @Post(":id/start")
  @HttpCode(HttpStatus.OK)
  async start(
    @Headers("x-user-id") userId: string,
    @Param("id") id: string,
  ): Promise<InterviewResponseDto> {
    const interview = await this.interviewsService.start(userId, id);
    return interview.toJSON() as unknown as InterviewResponseDto;
  }

  @Post(":id/submit")
  @HttpCode(HttpStatus.OK)
  async submitAnswer(
    @Headers("x-user-id") userId: string,
    @Param("id") id: string,
    @Body() dto: SubmitAnswerDto,
  ): Promise<InterviewResponseDto> {
    const interview = await this.interviewsService.submitAnswer(
      userId,
      id,
      dto,
    );
    return interview.toJSON() as unknown as InterviewResponseDto;
  }

  @Post(":id/complete")
  @HttpCode(HttpStatus.OK)
  async complete(
    @Headers("x-user-id") userId: string,
    @Param("id") id: string,
  ): Promise<InterviewResponseDto> {
    const interview = await this.interviewsService.complete(userId, id);
    return interview.toJSON() as unknown as InterviewResponseDto;
  }

  @Post(":id/complete-with-report")
  @HttpCode(HttpStatus.OK)
  async completeWithReport(
    @Param("id") id: string,
    @Body() body: { report: InterviewReport; overallFeedback: string },
  ): Promise<InterviewResponseDto> {
    const interview = await this.interviewsService.completeWithReport(
      id,
      body.report,
      body.overallFeedback,
    );
    return interview.toJSON() as unknown as InterviewResponseDto;
  }

  @Post(":id/cancel")
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Headers("x-user-id") userId: string,
    @Param("id") id: string,
  ): Promise<InterviewResponseDto> {
    const interview = await this.interviewsService.cancel(userId, id);
    return interview.toJSON() as unknown as InterviewResponseDto;
  }
}
