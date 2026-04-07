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
  GRPC_QUESTION_SERVICE,
  IGrpcQuestionService,
} from "@ai-coach/grpc";
import { Public } from "../../common/decorators/public.decorator";
import { AuthenticatedRequest } from "../../common/guards/auth.guard";

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

  @Get("popular")
  @Public()
  async getPopular(
    @Query("limit") limit = 20,
    @Query("category") category?: string,
    @Query("difficulty") difficulty?: string,
  ) {
    return firstValueFrom(
      this.questionService.getPopularQuestions({
        limit: Number(limit),
        category,
        difficulty,
      }),
    );
  }

  @Get("community")
  @Public()
  async getCommunity(
    @Query("page") page = 1,
    @Query("limit") limit = 12,
    @Query("category") category?: string,
    @Query("difficulty") difficulty?: string,
    @Query("companyTag") companyTag?: string,
    @Query("sortBy") sortBy?: string,
  ) {
    return firstValueFrom(
      this.questionService.getCommunityQuestions({
        page: Number(page),
        limit: Number(limit),
        category,
        difficulty,
        companyTag,
        sortBy,
      }),
    );
  }

  @Post("community")
  async submitCommunityQuestion(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      title: string;
      content: string;
      type?: string;
      difficulty: string;
      category: string;
      companyTag?: string;
      tags?: string[];
      hints?: string;
      sampleAnswer?: string;
    },
  ) {
    return firstValueFrom(
      this.questionService.submitCommunityQuestion({
        title: body.title,
        content: body.content,
        type: body.type || "technical",
        difficulty: body.difficulty,
        category: body.category,
        companyTag: body.companyTag || "",
        tags: body.tags || [],
        submittedBy: req.user.userId,
        submitterName: req.user.email?.split("@")[0] || "Anonim",
        hints: body.hints,
        sampleAnswer: body.sampleAnswer,
      }),
    );
  }

  @Post(":id/upvote")
  async upvote(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return firstValueFrom(
      this.questionService.upvoteQuestion({
        questionId: id,
        userId: req.user.userId,
      }),
    );
  }

  @Get("categories")
  @Public()
  async getCategories() {
    return firstValueFrom(this.questionService.getCategories({}));
  }

  @Get("tags")
  @Public()
  async getTags() {
    return firstValueFrom(this.questionService.getTags({}));
  }
}
