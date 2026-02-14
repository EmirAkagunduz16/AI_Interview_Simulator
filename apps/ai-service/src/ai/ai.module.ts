import { Module } from "@nestjs/common";
import { AiController } from "./ai.controller";
import { GeminiService } from "./ai.service";
import { SupabaseService } from "./supabase.service";

@Module({
  controllers: [AiController],
  providers: [GeminiService, SupabaseService],
  exports: [GeminiService, SupabaseService],
})
export class AiModule {}
