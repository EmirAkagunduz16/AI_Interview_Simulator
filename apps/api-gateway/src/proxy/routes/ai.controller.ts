import { Controller, Post, Body, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { ProxyService } from "../proxy.service";

@ApiTags("AI")
@Controller("ai")
export class AiController {
  private readonly aiUrl: string;

  constructor(
    private readonly proxy: ProxyService,
    private readonly config: ConfigService,
  ) {
    this.aiUrl = this.config.get<string>("microservices.ai")!;
  }

  @Post("generate-questions")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Generate interview questions" })
  async generateQuestions(@Body() body: unknown) {
    return this.proxy.forward(
      this.aiUrl,
      "/api/v1/ai/generate-questions",
      "POST",
      body,
    );
  }

  @Post("vapi/webhook")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "VAPI webhook endpoint" })
  async vapiWebhook(@Body() body: unknown) {
    return this.proxy.forward(
      this.aiUrl,
      "/api/v1/ai/vapi/webhook",
      "POST",
      body,
    );
  }
}
