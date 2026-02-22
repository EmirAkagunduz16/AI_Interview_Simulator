import {
  Controller,
  Get,
  Post,
  Req,
  Body,
  Param,
  Query,
  Inject,
  OnModuleInit,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";
import { GRPC_INTERVIEW_SERVICE, IGrpcInterviewService } from "@ai-coach/grpc";

interface AuthenticatedRequest {
  user: { userId: string; email: string; role: string };
}

@ApiTags("Interviews")
@Controller("interviews")
export class InterviewsController implements OnModuleInit {
  private interviewService!: IGrpcInterviewService;

  constructor(
    @Inject(GRPC_INTERVIEW_SERVICE) private readonly grpcClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.interviewService =
      this.grpcClient.getService<IGrpcInterviewService>("InterviewService");
  }

  @Get()
  @ApiOperation({ summary: "Get user interviews" })
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query("page") page = 1,
    @Query("limit") limit = 10,
    @Query("status") status?: string,
  ) {
    return firstValueFrom(
      this.interviewService.getUserInterviews({
        user_id: req.user.userId,
        page,
        limit,
        status,
      }) as any,
    );
  }

  @Get("stats")
  @ApiOperation({ summary: "Get interview stats" })
  async getStats(@Req() req: AuthenticatedRequest) {
    return firstValueFrom(
      this.interviewService.getInterviewStats({
        user_id: req.user.userId,
      }) as any,
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Get interview by ID" })
  async findOne(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return firstValueFrom(
      this.interviewService.getInterview({
        interview_id: id,
        user_id: req.user.userId,
      }) as any,
    );
  }

  @Post()
  @ApiOperation({ summary: "Create interview" })
  async create(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return firstValueFrom(
      this.interviewService.createInterview({
        user_id: req.user.userId,
        field: body.field,
        tech_stack: body.techStack || body.tech_stack || [],
        difficulty: body.difficulty,
        title: body.title,
        vapi_call_id: body.vapiCallId,
        question_count: body.questionCount,
      }) as any,
    );
  }

  @Post(":id/start")
  @ApiOperation({ summary: "Start interview" })
  async start(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return firstValueFrom(
      this.interviewService.startInterview({
        interview_id: id,
        user_id: req.user.userId,
      }) as any,
    );
  }

  @Post(":id/submit")
  @ApiOperation({ summary: "Submit answer" })
  async submit(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return firstValueFrom(
      this.interviewService.submitAnswer({
        interview_id: id,
        user_id: req.user.userId,
        question_id: body.questionId || body.question_id,
        question_title: body.questionTitle || body.question_title,
        answer: body.answer,
      }) as any,
    );
  }

  @Post(":id/complete")
  @ApiOperation({ summary: "Complete interview" })
  async complete(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return firstValueFrom(
      this.interviewService.completeInterview({
        interview_id: id,
        user_id: req.user.userId,
      }) as any,
    );
  }

  @Post(":id/cancel")
  @ApiOperation({ summary: "Cancel interview" })
  async cancel(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return firstValueFrom(
      this.interviewService.cancelInterview({
        interview_id: id,
        user_id: req.user.userId,
      }) as any,
    );
  }
}
