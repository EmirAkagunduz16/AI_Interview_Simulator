import {
  Controller,
  Post,
  Body,
  Req,
  Inject,
  OnModuleInit,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";
import { GRPC_AI_SERVICE, IGrpcAiService } from "@ai-coach/grpc";
import { Public } from "../../common/decorators/public.decorator";
import { ProxyService } from "../proxy.service";

interface AuthenticatedRequest {
  user: { userId: string; email: string; role: string };
}

@ApiTags("AI")
@Controller("ai")
export class AiController implements OnModuleInit {
  private aiService!: IGrpcAiService;

  constructor(
    @Inject(GRPC_AI_SERVICE) private readonly grpcClient: ClientGrpc,
    private readonly proxyService: ProxyService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    this.aiService = this.grpcClient.getService<IGrpcAiService>("AiService");
  }

  @Post("generate-questions")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Generate questions using AI" })
  async generateQuestions(@Body() body: any) {
    return firstValueFrom(
      this.aiService.generateQuestions({
        field: body.field,
        tech_stack: body.techStack || body.tech_stack || [],
        difficulty: body.difficulty,
        count: body.count,
      }) as any,
    );
  }

  @Post("vapi/webhook")
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "VAPI webhook" })
  async handleVapiWebhook(@Body() body: any, @Req() req: AuthenticatedRequest) {
    const aiServiceUrl = this.configService.get<string>(
      "microservices.ai",
      "http://localhost:3006",
    );

    return this.proxyService.forward(
      aiServiceUrl,
      "/api/v1/ai/vapi/webhook",
      "POST",
      body,
      {
        headers: req.user?.userId ? { "x-user-id": req.user.userId } : {},
      },
    );
  }
}
