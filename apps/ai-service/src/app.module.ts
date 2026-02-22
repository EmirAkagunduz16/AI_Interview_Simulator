import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { KafkaModule } from "@ai-coach/kafka-client";
import configuration from "./config/configuration";
import { AiModule } from "./ai/ai.module";
import { HealthModule } from "./health/health.module";
import { KafkaHandlersModule } from "./kafka/kafka-handlers.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [".env.local", ".env"],
      cache: true,
    }),

    // Kafka
    KafkaModule.forRootAsync(
      KafkaModule.createAsyncOptionsProvider("ai-service"),
    ),

    AiModule,
    HealthModule,
    KafkaHandlersModule,
  ],
})
export class AppModule {}
