import { registerAs } from "@nestjs/config";

export const serviceConfig = registerAs("service", () => ({
  port: parseInt(process.env.PORT!, 10),
  nodeEnv: process.env.NODE_ENV!,
}));

export const microservicesConfig = registerAs("microservices", () => ({
  authGrpc: process.env.AUTH_GRPC_URL,
  userGrpc: process.env.USER_GRPC_URL,
  questionGrpc: process.env.QUESTION_GRPC_URL,
  interviewGrpc: process.env.INTERVIEW_GRPC_URL,
  aiGrpc: process.env.AI_GRPC_URL,
}));

export const throttleConfig = registerAs("throttle", () => ({
  ttl: parseInt(process.env.THROTTLE_TTL!, 10),
  limit: parseInt(process.env.THROTTLE_LIMIT!, 10),
}));

export default () => ({
  service: serviceConfig(),
  microservices: microservicesConfig(),
  throttle: throttleConfig(),
});
