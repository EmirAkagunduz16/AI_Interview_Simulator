import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { join } from "path";
import { AppModule } from "./app.module";

async function bootstrap() {
  const logger = new Logger("AuthService");

  // Create a lightweight app context to read config
  const appContext = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn", "log", "debug"],
  });
  const configService = appContext.get(ConfigService);
  const grpcPort = configService.get<number>("service.grpcPort", 50051);
  const nodeEnv = configService.get<string>("service.nodeEnv", "development");
  await appContext.close();

  // Create gRPC-only microservice
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
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
      logger: ["error", "warn", "log", "debug"],
    },
  );

  app.enableShutdownHooks();
  await app.listen();

  logger.log(`Auth Service gRPC running on port ${grpcPort}`);
  logger.log(`Environment: ${nodeEnv}`);
}

bootstrap().catch((error) => {
  console.error("Failed to start Auth Service:", error);
  process.exit(1);
});
