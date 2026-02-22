import { Module, Global } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import {
  GrpcModule,
  GRPC_AUTH_SERVICE,
  GRPC_USER_SERVICE,
  GRPC_INTERVIEW_SERVICE,
  GRPC_QUESTION_SERVICE,
  GRPC_AI_SERVICE,
  PROTO_PACKAGES,
} from "@ai-coach/grpc";

const authClient = GrpcModule.forClientAsync({
  serviceName: GRPC_AUTH_SERVICE,
  packageName: PROTO_PACKAGES.AUTH,
  protoPath: GrpcModule.getProtoPath("auth.proto"),
  useFactory: (config: ConfigService) => ({
    url: config.get<string>("microservices.authGrpc") || "localhost:50051",
  }),
  inject: [ConfigService],
});

const userClient = GrpcModule.forClientAsync({
  serviceName: GRPC_USER_SERVICE,
  packageName: PROTO_PACKAGES.USER,
  protoPath: GrpcModule.getProtoPath("user.proto"),
  useFactory: (config: ConfigService) => ({
    url: config.get<string>("microservices.userGrpc") || "localhost:50052",
  }),
  inject: [ConfigService],
});

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

const aiClient = GrpcModule.forClientAsync({
  serviceName: GRPC_AI_SERVICE,
  packageName: PROTO_PACKAGES.AI,
  protoPath: GrpcModule.getProtoPath("ai.proto"),
  useFactory: (config: ConfigService) => ({
    url: config.get<string>("microservices.aiGrpc") || "localhost:50055",
  }),
  inject: [ConfigService],
});

@Global()
@Module({
  imports: [authClient, userClient, interviewClient, questionClient, aiClient],
  exports: [authClient, userClient, interviewClient, questionClient, aiClient],
})
export class GrpcClientsModule {}
