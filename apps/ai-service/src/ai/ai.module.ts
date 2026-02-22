import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AiController } from "./ai.controller";
import { GrpcAiController } from "./grpc.controller";
import { GeminiService } from "./ai.service";

@Module({
  imports: [ConfigModule],
  controllers: [AiController, GrpcAiController],
  providers: [GeminiService],
  exports: [GeminiService],
})
export class AiModule {}
