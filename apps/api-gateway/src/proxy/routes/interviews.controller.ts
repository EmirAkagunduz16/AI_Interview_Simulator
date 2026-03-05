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
import { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";
import { GRPC_INTERVIEW_SERVICE, IGrpcInterviewService } from "@ai-coach/grpc";

interface AuthenticatedRequest {
  user: { userId: string; email: string; role: string };
}

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
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query("page") page = 1,
    @Query("limit") limit = 10,
    @Query("status") status?: string,
  ) {
    return firstValueFrom(
      (this.interviewService as any).getUserInterviews({
        userId: req.user.userId,
        page,
        limit,
        status,
      }),
    );
  }

  @Get("stats")
  async getStats(@Req() req: AuthenticatedRequest) {
    return firstValueFrom(
      (this.interviewService as any).getInterviewStats({
        userId: req.user.userId,
      }),
    );
  }

  @Get(":id")
  async findOne(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return firstValueFrom(
      (this.interviewService as any).getInterview({
        interviewId: id,
        userId: req.user.userId,
      }),
    );
  }

  @Post()
  async create(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return firstValueFrom(
      (this.interviewService as any).createInterview({
        userId: req.user.userId,
        field: body.field,
        techStack: body.techStack || body.tech_stack || [],
        difficulty: body.difficulty,
        title: body.title,
        vapiCallId: body.vapiCallId || body.vapi_call_id,
        questionCount: body.questionCount || body.question_count,
      }),
    );
  }

  @Post(":id/start")
  async start(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return firstValueFrom(
      (this.interviewService as any).startInterview({
        interviewId: id,
        userId: req.user.userId,
      }),
    );
  }

  @Post(":id/submit")
  async submit(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return firstValueFrom(
      (this.interviewService as any).submitAnswer({
        interviewId: id,
        userId: req.user.userId,
        questionId: body.questionId || body.question_id,
        questionTitle: body.questionTitle || body.question_title,
        answer: body.answer,
      }),
    );
  }

  @Post(":id/complete")
  async complete(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return firstValueFrom(
      (this.interviewService as any).completeInterview({
        interviewId: id,
        userId: req.user.userId,
      }),
    );
  }

  @Post(":id/cancel")
  async cancel(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return firstValueFrom(
      (this.interviewService as any).cancelInterview({
        interviewId: id,
        userId: req.user.userId,
      }),
    );
  }

  @Post(":id/messages")
  async addMessage(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() body: { role: string; content: string },
  ) {
    return firstValueFrom(
      (this.interviewService as any).addInterviewMessage({
        interviewId: id,
        userId: req.user.userId,
        role: body.role,
        content: body.content,
      }),
    );
  }
}
