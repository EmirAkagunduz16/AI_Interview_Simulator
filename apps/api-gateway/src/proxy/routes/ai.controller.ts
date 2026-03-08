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
import { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";
import { GRPC_AI_SERVICE, IGrpcAiService } from "@ai-coach/grpc";
import { Public } from "../../common/decorators/public.decorator";
import { AuthenticatedRequest } from "../../common/guards/auth.guard";

@Controller("ai")
export class AiController implements OnModuleInit {
  private aiService!: IGrpcAiService;

  constructor(
    @Inject(GRPC_AI_SERVICE) private readonly grpcClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.aiService = this.grpcClient.getService<IGrpcAiService>("AiService");
  }

  @Post("vapi/webhook")
  @Public()
  @HttpCode(HttpStatus.OK)
  async handleVapiWebhook(
    @Body() body: Record<string, unknown>,
    @Req() req: Partial<AuthenticatedRequest>,
  ) {
    const result = await firstValueFrom(
      this.aiService.handleVapiWebhook({
        jsonBody: JSON.stringify(body),
        userId: req.user?.userId || "",
      }),
    );

    try {
      return JSON.parse(result.jsonResponse || "{}");
    } catch {
      return result;
    }
  }
}
