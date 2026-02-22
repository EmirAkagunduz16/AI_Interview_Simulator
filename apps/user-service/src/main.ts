import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { join } from "path";
import { AppModule } from "./app.module";

async function bootstrap() {
  const logger = new Logger("UserService");
  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log", "debug"],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>("service.port", 3003);
  const grpcPort = configService.get<number>("service.grpcPort", 50052);
  const nodeEnv = configService.get<string>("service.nodeEnv", "development");

  // ── gRPC Microservice ──────────────────────────────────────────
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: "user",
      protoPath: join(
        require.resolve("@ai-coach/grpc/package.json"),
        "..",
        "dist",
        "proto",
        "user.proto",
      ),
      url: `0.0.0.0:${grpcPort}`,
    },
  });

  // ── HTTP Config ────────────────────────────────────────────────
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
      .setTitle("User Service API")
      .setDescription(
        "AI Coach User Service - Profile & Subscription Management",
      )
      .setVersion("1.0")
      .addTag("Users", "User profile endpoints")
      .addTag("Health", "Health check endpoints")
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("docs", app, document);
  }

  app.enableShutdownHooks();
  await app.startAllMicroservices();
  await app.listen(port);

  logger.log(`User Service HTTP running on port ${port}`);
  logger.log(`User Service gRPC running on port ${grpcPort}`);
  logger.log(`Environment: ${nodeEnv}`);
  if (nodeEnv !== "production") {
    logger.log(`Swagger docs: http://localhost:${port}/docs`);
  }
}

bootstrap().catch((error) => {
  console.error("Failed to start User Service:", error);
  process.exit(1);
});
