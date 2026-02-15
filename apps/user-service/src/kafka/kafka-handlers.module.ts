import { Module, OnModuleInit, Logger, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Kafka, Consumer, EachMessagePayload, logLevel } from "kafkajs";
import { IKafkaEvent, IUserRegisteredPayload } from "@ai-coach/shared-types";
import { UsersService } from "../users/users.service";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [UsersModule],
})
export class KafkaHandlersModule implements OnModuleInit {
  private readonly logger = new Logger(KafkaHandlersModule.name);
  private consumer: Consumer | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  async onModuleInit() {
    const brokers = this.configService
      .get<string>("KAFKA_BROKERS")
      ?.split(",") || ["localhost:9092"];

    const kafka = new Kafka({
      clientId: "user-service-consumer",
      brokers,
      logLevel: logLevel.WARN,
      retry: {
        initialRetryTime: 1000,
        retries: 10,
      },
    });

    this.consumer = kafka.consumer({ groupId: "user-service-handlers" });

    try {
      await this.consumer.connect();
      this.logger.log("Kafka consumer connected");

      // Subscribe to user.registered events from auth-service
      await this.consumer.subscribe({
        topic: "user.registered",
        fromBeginning: false,
      });
      this.logger.log("Subscribed to user.registered topic");

      await this.consumer.run({
        eachMessage: async (payload) => this.handleMessage(payload),
      });
    } catch (error) {
      this.logger.error("Failed to initialize Kafka consumer", error);
    }
  }

  private async handleMessage({
    topic,
    message,
  }: EachMessagePayload): Promise<void> {
    const value = message.value?.toString();
    if (!value) return;

    try {
      const event: IKafkaEvent<IUserRegisteredPayload> = JSON.parse(value);
      this.logger.debug(`Received event: ${topic} (${event.eventId})`);

      if (topic === "user.registered") {
        await this.handleUserRegistered(event.payload);
      }
    } catch (error) {
      this.logger.error(`Error processing message on topic ${topic}`, error);
    }
  }

  private async handleUserRegistered(
    payload: IUserRegisteredPayload,
  ): Promise<void> {
    try {
      // Check if user already exists (idempotency)
      const existing = await this.usersService.findByAuthIdSafe(payload.userId);
      if (existing) {
        this.logger.log(
          `User profile already exists for authId: ${payload.userId}`,
        );
        return;
      }

      await this.usersService.createInternal({
        authId: payload.userId,
        email: payload.email,
        name: payload.name,
      });

      this.logger.log(`User profile auto-created for: ${payload.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to create user profile for ${payload.email}`,
        error,
      );
    }
  }
}
