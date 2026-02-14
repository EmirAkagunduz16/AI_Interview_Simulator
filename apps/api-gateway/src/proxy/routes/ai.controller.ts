import {
  Controller,
  Post,
  Body,
  Res,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiProduces } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { Response } from "express";
import axios from "axios";
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

  @Post("chat")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Chat with AI" })
  async chat(@Body() body: unknown) {
    return this.proxy.forward(this.aiUrl, "/api/v1/ai/chat", "POST", body);
  }

  @Post("evaluate")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Evaluate interview answer" })
  async evaluate(@Body() body: unknown) {
    return this.proxy.forward(this.aiUrl, "/api/v1/ai/evaluate", "POST", body);
  }

  @Post("generate-question")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Generate interview question" })
  async generateQuestion(@Body() body: unknown) {
    return this.proxy.forward(
      this.aiUrl,
      "/api/v1/ai/generate-question",
      "POST",
      body,
    );
  }

  @Post("text-to-speech")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Convert text to speech" })
  @ApiProduces("audio/mpeg")
  async textToSpeech(@Body() body: unknown, @Res() res: Response) {
    const response = await axios.post(
      `${this.aiUrl}/api/v1/ai/text-to-speech`,
      body,
      {
        responseType: "arraybuffer",
        timeout: 30000,
      },
    );

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": response.data.length,
    });

    res.send(Buffer.from(response.data));
  }
}
