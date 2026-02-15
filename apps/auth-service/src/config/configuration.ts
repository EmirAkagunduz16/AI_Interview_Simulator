import { registerAs } from "@nestjs/config";

export const databaseConfig = registerAs("database", () => ({
  uri: process.env.MONGODB_URI || "mongodb://localhost:27017/auth_db",
}));

export const serviceConfig = registerAs("service", () => ({
  port: parseInt(process.env.PORT || "3002", 10),
  nodeEnv: process.env.NODE_ENV || "development",
}));

export const jwtConfig = registerAs("jwt", () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET || "access-secret-dev",
  refreshSecret: process.env.JWT_REFRESH_SECRET || "refresh-secret-dev",
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
}));

export default () => ({
  database: databaseConfig(),
  service: serviceConfig(),
  jwt: jwtConfig(),
});
