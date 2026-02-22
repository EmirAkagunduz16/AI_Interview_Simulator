import { Module, Global } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { KafkaModule } from "@ai-coach/kafka-client";
import {
  GrpcModule,
  GRPC_INTERVIEW_SERVICE,
  GRPC_QUESTION_SERVICE,
  PROTO_PACKAGES,
} from "@ai-coach/grpc";
import configuration from "./config/configuration";
import { AiModule } from "./ai/ai.module";
import { HealthModule } from "./health/health.module";
import { KafkaHandlersModule } from "./kafka/kafka-handlers.module";

const interviewClient = GrpcModule.forClientAsync({
  serviceName: GRPC_INTERVIEW_SERVICE,
  packageName: PROTO_PACKAGES.INTERVIEW,
  protoPath: GrpcModule.getProtoPath("interview.proto"),
  useFactory: (config: ConfigService) => ({
    url: config.get<string>("microservices.interviewGrpc") || "localhost:50053",
  }),
  inject: [ConfigService],
});

const questionClient = GrpcModule.forClientAsync({
  serviceName: GRPC_QUESTION_SERVICE,
  packageName: PROTO_PACKAGES.QUESTION,
  protoPath: GrpcModule.getProtoPath("question.proto"),
  useFactory: (config: ConfigService) => ({
    url: config.get<string>("microservices.questionGrpc") || "localhost:50054",
  }),
  inject: [ConfigService],
});

@Global()
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

    // gRPC Clients — internal service-to-service calls
    interviewClient,
    questionClient,

    AiModule,
    HealthModule,
    KafkaHandlersModule,
  ],
  exports: [interviewClient, questionClient],
})
export class AppModule {}
