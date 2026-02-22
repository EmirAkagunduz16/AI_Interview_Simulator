import { registerAs } from "@nestjs/config";

export const serviceConfig = registerAs("service", () => ({
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
}));

export const microservicesConfig = registerAs("microservices", () => ({
  auth: process.env.AUTH_SERVICE_URL || "http://localhost:3002",
  authGrpc: process.env.AUTH_GRPC_URL || "localhost:50051",
  user: process.env.USER_SERVICE_URL || "http://localhost:3003",
  userGrpc: process.env.USER_GRPC_URL || "localhost:50052",
  question: process.env.QUESTION_SERVICE_URL || "http://localhost:3004",
  questionGrpc: process.env.QUESTION_GRPC_URL || "localhost:50054",
  interview: process.env.INTERVIEW_SERVICE_URL || "http://localhost:3005",
  interviewGrpc: process.env.INTERVIEW_GRPC_URL || "localhost:50053",
  ai: process.env.AI_SERVICE_URL || "http://localhost:3006",
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
