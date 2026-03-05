import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { GrpcAiController } from "./grpc.controller";
import { GeminiService } from "./ai.service";

@Module({
  imports: [ConfigModule],
  controllers: [GrpcAiController],
  providers: [GeminiService],
  exports: [GeminiService],
})
export class AiModule {}
