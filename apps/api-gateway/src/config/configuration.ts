import { registerAs } from "@nestjs/config";

export const serviceConfig = registerAs("service", () => ({
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
}));

export const microservicesConfig = registerAs("microservices", () => ({
  authGrpc: process.env.AUTH_GRPC_URL || "localhost:50051",
  userGrpc: process.env.USER_GRPC_URL || "localhost:50052",
  questionGrpc: process.env.QUESTION_GRPC_URL || "localhost:50054",
  interviewGrpc: process.env.INTERVIEW_GRPC_URL || "localhost:50053",
  aiGrpc: process.env.AI_GRPC_URL || "localhost:50055",
}));

export const throttleConfig = registerAs("throttle", () => ({
  ttl: parseInt(process.env.THROTTLE_TTL || "60000", 10),
  limit: parseInt(process.env.THROTTLE_LIMIT || "100", 10),
}));

export default () => ({
  service: serviceConfig(),
  microservices: microservicesConfig(),
  throttle: throttleConfig(),
});
