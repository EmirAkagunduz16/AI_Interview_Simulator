import { Module, OnModuleInit, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Kafka, Consumer, EachMessagePayload, logLevel } from "kafkajs";
import { IKafkaEvent } from "@ai-coach/shared-types";

@Module({})
export class KafkaHandlersModule implements OnModuleInit {
  private readonly logger = new Logger(KafkaHandlersModule.name);
  private consumer: Consumer | null = null;

  constructor(private readonly configService: ConfigService) {}

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

      // Start consuming (no topics subscribed yet)
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
      const event: IKafkaEvent = JSON.parse(value);
      this.logger.debug(`Received event: ${topic} (${event.eventId})`);
    } catch (error) {
      this.logger.error(`Error processing message on topic ${topic}`, error);
    }
  }
}
