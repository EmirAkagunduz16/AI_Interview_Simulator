import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { join } from "path";
import { AppModule } from "./app.module";

async function bootstrap() {
  const logger = new Logger("InterviewService");
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>("service.port", 3005);
  const grpcPort = configService.get<number>("service.grpcPort", 50053);
  const nodeEnv = configService.get<string>("service.nodeEnv", "development");

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: "interview",
      protoPath: join(
        require.resolve("@ai-coach/grpc/package.json"),
        "..",
        "dist",
        "proto",
        "interview.proto",
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

  app.enableShutdownHooks();
  await app.startAllMicroservices();
  await app.listen(port);

  logger.log(`Interview Service HTTP running on port ${port}`);
  logger.log(`Interview Service gRPC running on port ${grpcPort}`);
}

bootstrap().catch((error) => {
  console.error("Failed to start Interview Service:", error);
  process.exit(1);
});
