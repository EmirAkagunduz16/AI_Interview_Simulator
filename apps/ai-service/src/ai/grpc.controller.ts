import { Controller, Logger } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import {
  HandleVapiWebhookRequest,
  HandleVapiWebhookResponse,
} from "@ai-coach/grpc";
import { InterviewFlowService } from "./interview-flow.service";
import { InterviewEvaluationService } from "./interview-evaluation.service";
import { VapiFunctionCallParams } from "./types";

@Controller()
export class GrpcAiController {
  private readonly logger = new Logger(GrpcAiController.name);

  constructor(
    private readonly flowService: InterviewFlowService,
    private readonly evaluationService: InterviewEvaluationService,
  ) {}

  @GrpcMethod("AiService", "HandleVapiWebhook")
  async handleVapiWebhook(
    data: HandleVapiWebhookRequest,
  ): Promise<HandleVapiWebhookResponse> {
    this.logger.debug("gRPC HandleVapiWebhook called");

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(data.jsonBody || "{}");
    } catch {
      return { jsonResponse: JSON.stringify({ received: true }) };
    }

    const userId = data.userId;
    const message = body.message as Record<string, unknown> | undefined;
    if (!message) {
      return { jsonResponse: JSON.stringify({ received: true }) };
    }

    this.logger.log(`VAPI webhook: ${message.type}`);

    let result: Record<string, unknown>;

    switch (message.type) {
      case "function-call":
        result = await this.routeFunctionCall(message, userId);
        break;

      case "end-of-call-report":
        await this.evaluationService.handleEndOfCall(message);
        result = { received: true };
        break;

      case "status-update":
        this.logger.log(`Call status: ${message.status}`);
        result = { received: true };
        break;

      case "transcript":
        await this.handleTranscript(message);
        result = { received: true };
        break;

      default:
        result = { received: true };
    }

    return { jsonResponse: JSON.stringify(result) };
  }

  private async routeFunctionCall(
    message: Record<string, unknown>,
    headerUserId?: string,
  ): Promise<Record<string, unknown>> {
    const functionCall = message.functionCall as {
      name: string;
      parameters: VapiFunctionCallParams;
    };

    this.logger.log(`Function call: ${functionCall.name}`);

    switch (functionCall.name) {
      case "save_preferences": {
        const callId = (message.call as Record<string, unknown> | undefined)
          ?.id as string | undefined;
        return this.flowService.handleSavePreferences(
          functionCall.parameters,
          callId,
          headerUserId,
        );
      }

      case "save_answer":
        return this.flowService.handleSaveAnswer(
          functionCall.parameters,
          headerUserId,
        );

      case "get_next_question":
        return this.flowService.handleGetNextQuestion(
          functionCall.parameters,
        );

      case "end_interview":
        return this.evaluationService.handleEndInterview(
          functionCall.parameters,
          headerUserId,
        );

      default:
        this.logger.warn(`Unknown function call: ${functionCall.name}`);
        return { result: { error: "Unknown function" } };
    }
  }

  private async handleTranscript(
    message: Record<string, unknown>,
  ): Promise<void> {
    const transcript = message.transcript as string | undefined;
    const callId = (message.call as Record<string, unknown> | undefined)
      ?.id as string | undefined;

    if (transcript && callId) {
      this.logger.debug(`Transcript [${message.role}]: ${transcript}`);
      await this.flowService.dispatchTranscript(
        callId,
        message.role as string,
        transcript,
      );
    }
  }
}
