import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Query,
  Inject,
  OnModuleInit,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";
import { GRPC_AI_SERVICE, IGrpcAiService } from "@ai-coach/grpc";
import { Public } from "../../common/decorators/public.decorator";
import { AuthenticatedRequest } from "../../common/guards/auth.guard";

const ELEVENLABS_SIGNED_URL =
  "https://api.elevenlabs.io/v1/convai/conversation/get-signed-url";

@Controller("ai")
export class AiController implements OnModuleInit {
  private aiService!: IGrpcAiService;

  constructor(
    @Inject(GRPC_AI_SERVICE) private readonly grpcClient: ClientGrpc,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    this.aiService = this.grpcClient.getService<IGrpcAiService>("AiService");
  }

  /**
   * Fetches a signed WebSocket URL from ElevenLabs for the conversational agent.
   * Required for private agents - without API key, ElevenLabs falls back to default agent.
   */
  @Get("elevenlabs/signed-url")
  async getElevenLabsSignedUrl(
    @Req() req: AuthenticatedRequest,
    @Query("agentId") agentId?: string,
  ) {
    const apiKey = this.config.get<string>("ELEVENLABS_API_KEY");
    const defaultAgentId = this.config.get<string>("ELEVENLABS_AGENT_ID");

    const resolvedAgentId = agentId || defaultAgentId;

    if (!apiKey) {
      throw new BadRequestException(
        "ElevenLabs API key not configured. Add ELEVENLABS_API_KEY to your server environment.",
      );
    }

    if (!resolvedAgentId) {
      throw new BadRequestException(
        "Agent ID required. Set ELEVENLABS_AGENT_ID in env or pass agentId query param.",
      );
    }

    const url = `${ELEVENLABS_SIGNED_URL}?agent_id=${encodeURIComponent(resolvedAgentId)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new BadRequestException(
        `ElevenLabs signed URL failed (${response.status}): ${responseText.slice(0, 200)}`,
      );
    }

    let data: { signed_url?: string; signedUrl?: string };
    try {
      data = JSON.parse(responseText) as { signed_url?: string; signedUrl?: string };
    } catch {
      throw new BadRequestException(
        "ElevenLabs returned invalid JSON. Response: " + responseText.slice(0, 100),
      );
    }

    const signedUrl = data.signed_url ?? data.signedUrl;

    if (!signedUrl || typeof signedUrl !== "string") {
      throw new BadRequestException(
        "ElevenLabs did not return a signed URL. Response keys: " +
          Object.keys(data).join(", "),
      );
    }

    return { signedUrl };
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
