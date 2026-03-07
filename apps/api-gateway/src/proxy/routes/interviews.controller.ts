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
import {
  GRPC_INTERVIEW_SERVICE,
  IGrpcInterviewService,
  CreateInterviewRequest,
  SubmitAnswerRequest,
} from "@ai-coach/grpc";
import { AuthenticatedRequest } from "../../common/guards/auth.guard";

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
      this.interviewService.getUserInterviews({
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
      this.interviewService.getInterviewStats({
        userId: req.user.userId,
      }),
    );
  }

  @Get(":id")
  async findOne(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return firstValueFrom(
      this.interviewService.getInterview({
        interviewId: id,
        userId: req.user.userId,
      }),
    );
  }

  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() body: Omit<CreateInterviewRequest, "userId">,
  ) {
    return firstValueFrom(
      this.interviewService.createInterview({
        userId: req.user.userId,
        field: body.field,
        techStack: body.techStack || [],
        difficulty: body.difficulty,
        title: body.title,
        vapiCallId: body.vapiCallId,
        questionCount: body.questionCount,
      }),
    );
  }

  @Post(":id/start")
  async start(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return firstValueFrom(
      this.interviewService.startInterview({
        interviewId: id,
        userId: req.user.userId,
      }),
    );
  }

  @Post(":id/submit")
  async submit(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() body: Omit<SubmitAnswerRequest, "interviewId" | "userId">,
  ) {
    return firstValueFrom(
      this.interviewService.submitAnswer({
        interviewId: id,
        userId: req.user.userId,
        questionId: body.questionId,
        questionTitle: body.questionTitle,
        answer: body.answer,
      }),
    );
  }

  @Post(":id/complete")
  async complete(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return firstValueFrom(
      this.interviewService.completeInterview({
        interviewId: id,
        userId: req.user.userId,
      }),
    );
  }

  @Post(":id/cancel")
  async cancel(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return firstValueFrom(
      this.interviewService.cancelInterview({
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
      this.interviewService.addInterviewMessage({
        interviewId: id,
        userId: req.user.userId,
        role: body.role,
        content: body.content,
      }),
    );
  }
}
