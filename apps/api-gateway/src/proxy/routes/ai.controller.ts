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
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";
import { GRPC_AI_SERVICE, IGrpcAiService } from "@ai-coach/grpc";
import { Public } from "../../common/decorators/public.decorator";

interface AuthenticatedRequest {
  user: { userId: string; email: string; role: string };
}

@ApiTags("AI")
@Controller("ai")
export class AiController implements OnModuleInit {
  private aiService!: IGrpcAiService;

  constructor(
    @Inject(GRPC_AI_SERVICE) private readonly grpcClient: ClientGrpc,
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
    const result: any = await firstValueFrom(
      this.aiService.handleVapiWebhook({
        json_body: JSON.stringify(body),
        user_id: req.user?.userId,
      }) as any,
    );
    return JSON.parse(result.json_response);
  }
}
