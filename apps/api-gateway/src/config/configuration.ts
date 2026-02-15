import { registerAs } from "@nestjs/config";

export const serviceConfig = registerAs("service", () => ({
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
}));

export const microservicesConfig = registerAs("microservices", () => ({
  auth: process.env.AUTH_SERVICE_URL || "http://localhost:3002",
  user: process.env.USER_SERVICE_URL || "http://localhost:3003",
  question: process.env.QUESTION_SERVICE_URL || "http://localhost:3004",
  interview: process.env.INTERVIEW_SERVICE_URL || "http://localhost:3005",
  ai: process.env.AI_SERVICE_URL || "http://localhost:3006",
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
