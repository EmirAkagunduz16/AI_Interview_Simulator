import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/filters";
import { LoggingInterceptor } from "./common/interceptors";

async function bootstrap() {
  const logger = new Logger("ApiGateway");
  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log", "debug"],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>("service.port", 3001);
  const nodeEnv = configService.get<string>("service.nodeEnv", "development");

  // Global prefix
  app.setGlobalPrefix("api/v1");

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-user-id"],
  });

  // Global filters and interceptors
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  app.enableShutdownHooks();
  await app.listen(port);

  logger.log(`API Gateway running on port ${port}`);
  logger.log(`Environment: ${nodeEnv}`);
}

bootstrap().catch((error) => {
  console.error("Failed to start API Gateway:", error);
  process.exit(1);
});
