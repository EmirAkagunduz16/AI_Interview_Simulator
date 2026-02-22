import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { join } from "path";
import { AppModule } from "./app.module";

async function bootstrap() {
  const logger = new Logger("AIService");
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const port = configService.get<number>("service.port", 3006);
  const grpcPort = configService.get<number>("service.grpcPort", 50055);
  const nodeEnv = configService.get<string>("service.nodeEnv", "development");

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: "ai",
      protoPath: join(
        require.resolve("@ai-coach/grpc/package.json"),
        "..",
        "dist",
        "proto",
        "ai.proto",
      ),
      url: `0.0.0.0:${grpcPort}`,
    },
  });

  app.setGlobalPrefix("api/v1");
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (nodeEnv !== "production") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("AI Service API")
      .setDescription("AI Coach AI Service - Gemini Integration")
      .setVersion("1.0")
      .addTag("AI", "AI-powered endpoints")
      .addTag("Health", "Health check endpoints")
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("docs", app, document);
  }

  app.enableShutdownHooks();
  await app.startAllMicroservices();
  await app.listen(port);

  logger.log(`AI Service HTTP running on port ${port}`);
  logger.log(`AI Service gRPC running on port ${grpcPort}`);
  if (nodeEnv !== "production") {
    logger.log(`Swagger docs: http://localhost:${port}/docs`);
  }
}

bootstrap().catch((error) => {
  console.error("Failed to start AI Service:", error);
  process.exit(1);
});
