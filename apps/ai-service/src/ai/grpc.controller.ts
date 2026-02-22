import { Controller, Logger } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { GeminiService } from "./ai.service";

@Controller()
export class GrpcAiController {
  private readonly logger = new Logger(GrpcAiController.name);

  constructor(private readonly geminiService: GeminiService) {}

  @GrpcMethod("AiService", "GenerateQuestions")
  async generateQuestions(data: {
    field: string;
    tech_stack: string[];
    difficulty: string;
    count: number;
  }) {
    this.logger.debug(`gRPC GenerateQuestions: ${data.field}`);
    const questions = await this.geminiService.generateInterviewQuestions({
      field: data.field,
      techStack: data.tech_stack,
      difficulty: data.difficulty,
      count: data.count,
    });
    return { questions };
  }

  @GrpcMethod("AiService", "HandleVapiWebhook")
  async handleVapiWebhook(data: { json_body: string; user_id?: string }) {
    this.logger.debug("gRPC HandleVapiWebhook");
    // Delegate to the HTTP controller's logic via service-level methods
    // For now, return a placeholder — the real VAPI webhook logic is complex
    // and involves HTTP calls that are being migrated to gRPC clients
    return { json_response: JSON.stringify({ received: true }) };
  }
}
