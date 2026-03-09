import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { GrpcAiController } from "./grpc.controller";
import { GeminiService } from "./ai.service";
import { InterviewFlowService } from "./interview-flow.service";
import { InterviewEvaluationService } from "./interview-evaluation.service";

@Module({
  imports: [ConfigModule],
  controllers: [GrpcAiController],
  providers: [GeminiService, InterviewFlowService, InterviewEvaluationService],
  exports: [GeminiService],
})
export class AiModule {}
