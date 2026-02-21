import { KafkaModule, KafkaEventHandler } from "@ai-coach/kafka-client";
import { KafkaTopics, IUserRegisteredPayload } from "@ai-coach/shared-types";
import { ConfigService } from "@nestjs/config";
import { UserRegisteredHandler } from "./handlers/user-registered.handler";

// Event handlers for user-service
export const createUserKafkaHandlers = (
  userRegisteredHandler: UserRegisteredHandler,
): KafkaEventHandler[] => [
  {
    topic: KafkaTopics.USER_REGISTERED,
    handler: (payload, metadata) =>
      userRegisteredHandler.handle(payload as IUserRegisteredPayload, metadata),
  },
];

// Kafka module factory
export const createUserKafkaModule = (handlers: KafkaEventHandler[]) =>
  KafkaModule.forRootAsync(
    {
      useFactory: (configService: ConfigService) => ({
        clientId: "user-service",
        brokers: configService.get<string>("KAFKA_BROKERS")?.split(",") || [
          "localhost:9092",
        ],
        groupId: "user-service-group",
        logLevel: "WARN",
      }),
      inject: [ConfigService],
    },
    handlers,
  );
