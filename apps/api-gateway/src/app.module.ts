import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import {
  GrpcModule,
  GRPC_AUTH_SERVICE,
  GRPC_USER_SERVICE,
  GRPC_INTERVIEW_SERVICE,
  GRPC_QUESTION_SERVICE,
  GRPC_AI_SERVICE,
  PROTO_PACKAGES,
} from "@ai-coach/grpc";
import configuration from "./config/configuration";
import { ProxyModule } from "./proxy/proxy.module";
import { RoutesModule } from "./proxy/routes/routes.module";
import { HealthModule } from "./health/health.module";
import { JwtAuthGuard } from "./common/guards/auth.guard";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [".env.local", ".env"],
      cache: true,
    }),

    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // ── gRPC Clients ─────────────────────────────────────────
    GrpcModule.forClientAsync({
      serviceName: GRPC_AUTH_SERVICE,
      packageName: PROTO_PACKAGES.AUTH,
      protoPath: GrpcModule.getProtoPath("auth.proto"),
      useFactory: (config: ConfigService) => ({
        url: config.get<string>("microservices.authGrpc") || "localhost:50051",
      }),
      inject: [ConfigService],
    }),
    GrpcModule.forClientAsync({
      serviceName: GRPC_USER_SERVICE,
      packageName: PROTO_PACKAGES.USER,
      protoPath: GrpcModule.getProtoPath("user.proto"),
      useFactory: (config: ConfigService) => ({
        url: config.get<string>("microservices.userGrpc") || "localhost:50052",
      }),
      inject: [ConfigService],
    }),
    GrpcModule.forClientAsync({
      serviceName: GRPC_INTERVIEW_SERVICE,
      packageName: PROTO_PACKAGES.INTERVIEW,
      protoPath: GrpcModule.getProtoPath("interview.proto"),
      useFactory: (config: ConfigService) => ({
        url:
          config.get<string>("microservices.interviewGrpc") ||
          "localhost:50053",
      }),
      inject: [ConfigService],
    }),
    GrpcModule.forClientAsync({
      serviceName: GRPC_QUESTION_SERVICE,
      packageName: PROTO_PACKAGES.QUESTION,
      protoPath: GrpcModule.getProtoPath("question.proto"),
      useFactory: (config: ConfigService) => ({
        url:
          config.get<string>("microservices.questionGrpc") || "localhost:50054",
      }),
      inject: [ConfigService],
    }),
    GrpcModule.forClientAsync({
      serviceName: GRPC_AI_SERVICE,
      packageName: PROTO_PACKAGES.AI,
      protoPath: GrpcModule.getProtoPath("ai.proto"),
      useFactory: (config: ConfigService) => ({
        url: config.get<string>("microservices.aiGrpc") || "localhost:50055",
      }),
      inject: [ConfigService],
    }),

    // Core modules
    ProxyModule,
    RoutesModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
