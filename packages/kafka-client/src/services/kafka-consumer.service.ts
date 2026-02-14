import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Inject } from '@nestjs/common';
import { Kafka, Consumer, logLevel, EachMessagePayload } from 'kafkajs';
import { KafkaTopics, IKafkaEvent } from '@ai-coach/shared-types';
import {
  KafkaModuleOptions,
  KafkaEventHandler,
  KafkaEventMetadata,
  KAFKA_MODULE_OPTIONS,
  KAFKA_EVENT_HANDLERS,
} from '../interfaces/kafka.interfaces';

const LOG_LEVEL_MAP = {
  NOTHING: logLevel.NOTHING,
  ERROR: logLevel.ERROR,
  WARN: logLevel.WARN,
  INFO: logLevel.INFO,
  DEBUG: logLevel.DEBUG,
};

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private kafka: Kafka;
  private consumer: Consumer | null = null;
  private isConnected = false;
  private readonly clientId: string;
  private readonly groupId: string;
  private handlers = new Map<KafkaTopics, KafkaEventHandler['handler']>();

  constructor(
    @Inject(KAFKA_MODULE_OPTIONS) private readonly options: KafkaModuleOptions,
    @Inject(KAFKA_EVENT_HANDLERS) private readonly eventHandlers: KafkaEventHandler[],
  ) {
    this.clientId = options.clientId;
    this.groupId = options.groupId || `${options.clientId}-group`;

    this.kafka = new Kafka({
      clientId: options.clientId,
      brokers: options.brokers,
      logLevel: LOG_LEVEL_MAP[options.logLevel || 'WARN'],
      retry: {
        initialRetryTime: 1000,
        retries: 10,
      },
    });

    // Register handlers
    for (const handler of eventHandlers) {
      this.handlers.set(handler.topic, handler.handler);
    }
  }

  async onModuleInit(): Promise<void> {
    if (this.handlers.size === 0) {
      this.logger.log(`[${this.clientId}] No event handlers registered, skipping consumer`);
      return;
    }
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    try {
      this.consumer = this.kafka.consumer({ groupId: this.groupId });
      await this.consumer.connect();
      this.isConnected = true;
      this.logger.log(`[${this.clientId}] Kafka consumer connected (group: ${this.groupId})`);

      // Subscribe to all registered topics
      const topics = Array.from(this.handlers.keys());
      for (const topic of topics) {
        await this.consumer.subscribe({ topic, fromBeginning: false });
        this.logger.log(`[${this.clientId}] Subscribed to topic: ${topic}`);
      }

      // Start consuming
      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });
    } catch (error) {
      this.logger.error(`[${this.clientId}] Failed to connect Kafka consumer`, error);
      this.retryConnection();
    }
  }

  private async retryConnection(): Promise<void> {
    const maxRetries = 10;
    const retryDelay = 5000;

    for (let i = 0; i < maxRetries; i++) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      try {
        await this.connect();
        return;
      } catch {
        this.logger.warn(`[${this.clientId}] Consumer reconnection attempt ${i + 1}/${maxRetries} failed`);
      }
    }
    this.logger.error(`[${this.clientId}] Consumer failed to connect after ${maxRetries} retries`);
  }

  private async disconnect(): Promise<void> {
    if (this.consumer && this.isConnected) {
      await this.consumer.disconnect();
      this.isConnected = false;
      this.logger.log(`[${this.clientId}] Kafka consumer disconnected`);
    }
  }

  private async handleMessage({ topic, partition, message }: EachMessagePayload): Promise<void> {
    const handler = this.handlers.get(topic as KafkaTopics);
    if (!handler) {
      this.logger.warn(`[${this.clientId}] No handler for topic: ${topic}`);
      return;
    }

    try {
      const value = message.value?.toString();
      if (!value) {
        this.logger.warn(`[${this.clientId}] Empty message on topic: ${topic}`);
        return;
      }

      const event: IKafkaEvent = JSON.parse(value);
      const metadata: KafkaEventMetadata = {
        eventId: event.eventId,
        eventType: event.eventType,
        timestamp: event.timestamp,
        source: event.source,
        correlationId: event.correlationId,
        partition,
        offset: message.offset,
      };

      this.logger.debug(
        `[${this.clientId}] Processing event: ${topic} (${event.eventId}) from ${event.source}`,
      );

      await handler(event.payload, metadata);

      this.logger.debug(`[${this.clientId}] Event processed: ${topic} (${event.eventId})`);
    } catch (error) {
      this.logger.error(`[${this.clientId}] Error processing message on topic ${topic}`, error);
    }
  }

  /**
   * Check if consumer is connected
   */
  isReady(): boolean {
    return this.isConnected;
  }
}
