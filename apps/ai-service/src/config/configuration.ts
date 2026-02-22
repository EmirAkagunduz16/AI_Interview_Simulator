import { registerAs } from "@nestjs/config";

export const serviceConfig = registerAs("service", () => ({
  port: parseInt(process.env.PORT || "3006", 10),
  grpcPort: parseInt(process.env.GRPC_PORT || "50055", 10),
  nodeEnv: process.env.NODE_ENV || "development",
}));

export const geminiConfig = registerAs("gemini", () => ({
  apiKey: process.env.GEMINI_API_KEY || "",
  model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
}));

export const vapiConfig = registerAs("vapi", () => ({
  privateKey: process.env.VAPI_PRIVATE_KEY || "",
}));

export const microservicesConfig = registerAs("microservices", () => ({
  interviewGrpc: process.env.INTERVIEW_GRPC_URL || "localhost:50053",
  questionGrpc: process.env.QUESTION_GRPC_URL || "localhost:50054",
}));

export default () => ({
  service: serviceConfig(),
  gemini: geminiConfig(),
  vapi: vapiConfig(),
  microservices: microservicesConfig(),
});
