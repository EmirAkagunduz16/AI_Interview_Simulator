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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiQuery,
  ApiParam,
} from "@nestjs/swagger";
import { InterviewsService } from "./interviews.service";
import {
  CreateInterviewDto,
  SubmitAnswerDto,
  InterviewResponseDto,
  PaginatedInterviewsResponseDto,
  InterviewStatsDto,
} from "./dto";
import { InterviewStatus, InterviewReport } from "./entities/interview.entity";

@ApiTags("Interviews")
@Controller("interviews")
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Get()
  @ApiOperation({ summary: "Get user interviews" })
  @ApiHeader({ name: "x-user-id", description: "User auth ID" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "status", required: false, enum: InterviewStatus })
  @ApiResponse({ status: 200, type: PaginatedInterviewsResponseDto })
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
  @ApiOperation({ summary: "Get user interview statistics" })
  @ApiHeader({ name: "x-user-id", description: "User auth ID" })
  @ApiResponse({ status: 200, type: InterviewStatsDto })
  async getStats(
    @Headers("x-user-id") userId: string,
  ): Promise<InterviewStatsDto> {
    return this.interviewsService.getStats(userId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get interview by ID" })
  @ApiHeader({ name: "x-user-id", description: "User auth ID" })
  @ApiParam({ name: "id", description: "Interview ID" })
  @ApiResponse({ status: 200, type: InterviewResponseDto })
  @ApiResponse({ status: 404, description: "Interview not found" })
  async findOne(
    @Headers("x-user-id") userId: string,
    @Param("id") id: string,
  ): Promise<InterviewResponseDto> {
    const interview = await this.interviewsService.findById(userId, id);
    return interview.toJSON() as unknown as InterviewResponseDto;
  }

  @Post()
  @ApiOperation({ summary: "Create new interview" })
  @ApiHeader({ name: "x-user-id", description: "User auth ID" })
  @ApiResponse({ status: 201, type: InterviewResponseDto })
  async create(
    @Headers("x-user-id") userId: string,
    @Body() dto: CreateInterviewDto,
  ): Promise<InterviewResponseDto> {
    const interview = await this.interviewsService.create(userId, dto);
    return interview.toJSON() as unknown as InterviewResponseDto;
  }

  @Post(":id/start")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Start interview" })
  @ApiHeader({ name: "x-user-id", description: "User auth ID" })
  @ApiParam({ name: "id", description: "Interview ID" })
  @ApiResponse({ status: 200, type: InterviewResponseDto })
  async start(
    @Headers("x-user-id") userId: string,
    @Param("id") id: string,
  ): Promise<InterviewResponseDto> {
    const interview = await this.interviewsService.start(userId, id);
    return interview.toJSON() as unknown as InterviewResponseDto;
  }

  @Post(":id/submit")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Submit answer for question" })
  @ApiHeader({ name: "x-user-id", description: "User auth ID" })
  @ApiParam({ name: "id", description: "Interview ID" })
  @ApiResponse({ status: 200, type: InterviewResponseDto })
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
  @ApiOperation({ summary: "Complete interview" })
  @ApiHeader({ name: "x-user-id", description: "User auth ID" })
  @ApiParam({ name: "id", description: "Interview ID" })
  @ApiResponse({ status: 200, type: InterviewResponseDto })
  async complete(
    @Headers("x-user-id") userId: string,
    @Param("id") id: string,
  ): Promise<InterviewResponseDto> {
    const interview = await this.interviewsService.complete(userId, id);
    return interview.toJSON() as unknown as InterviewResponseDto;
  }

  @Post(":id/complete-with-report")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Complete interview with AI evaluation report" })
  @ApiParam({ name: "id", description: "Interview ID" })
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
  @ApiOperation({ summary: "Cancel interview" })
  @ApiHeader({ name: "x-user-id", description: "User auth ID" })
  @ApiParam({ name: "id", description: "Interview ID" })
  @ApiResponse({ status: 200, type: InterviewResponseDto })
  async cancel(
    @Headers("x-user-id") userId: string,
    @Param("id") id: string,
  ): Promise<InterviewResponseDto> {
    const interview = await this.interviewsService.cancel(userId, id);
    return interview.toJSON() as unknown as InterviewResponseDto;
  }
}
