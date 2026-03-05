import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { join } from "path";
import { AppModule } from "./app.module";

async function bootstrap() {
  const logger = new Logger("AuthService");
  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log", "debug"],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>("service.port", 3002);
  const grpcPort = configService.get<number>("service.grpcPort", 50051);
  const nodeEnv = configService.get<string>("service.nodeEnv", "development");

  // ── gRPC Microservice ──────────────────────────────────────────
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: "auth",
      protoPath: join(
        require.resolve("@ai-coach/grpc/package.json"),
        "..",
        "dist",
        "proto",
        "auth.proto",
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

  app.enableShutdownHooks();

  // Start both transports
  await app.startAllMicroservices();
  await app.listen(port);

  logger.log(`Auth Service HTTP running on port ${port}`);
  logger.log(`Auth Service gRPC running on port ${grpcPort}`);
  logger.log(`Environment: ${nodeEnv}`);
}

bootstrap().catch((error) => {
  console.error("Failed to start Auth Service:", error);
  process.exit(1);
});
