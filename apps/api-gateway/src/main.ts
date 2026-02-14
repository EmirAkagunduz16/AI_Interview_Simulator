import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
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

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global filters and interceptors
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger documentation
  if (nodeEnv !== "production") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("AI Coach API")
      .setDescription("AI Coach - Mock Interview Platform API Gateway")
      .setVersion("1.0")
      .addTag("Users", "User profile endpoints")
      .addTag("Questions", "Question bank endpoints")
      .addTag("Interviews", "Interview session endpoints")
      .addTag("AI", "AI-powered endpoints")
      .addTag("Health", "Health check endpoints")
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("docs", app, document);
  }

  app.enableShutdownHooks();
  await app.listen(port);

  logger.log(`API Gateway running on port ${port}`);
  logger.log(`Environment: ${nodeEnv}`);
  if (nodeEnv !== "production") {
    logger.log(`Swagger docs: http://localhost:${port}/docs`);
  }
}

bootstrap().catch((error) => {
  console.error("Failed to start API Gateway:", error);
  process.exit(1);
});
