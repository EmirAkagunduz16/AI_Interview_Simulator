import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Inject } from '@nestjs/common';
import { Kafka, Producer, logLevel, Partitioners } from 'kafkajs';
import { KafkaTopics, IKafkaEvent } from '@ai-coach/shared-types';
import { v4 as uuidv4 } from 'uuid';
import { KafkaModuleOptions, KAFKA_MODULE_OPTIONS } from '../interfaces/kafka.interfaces';

const LOG_LEVEL_MAP = {
  NOTHING: logLevel.NOTHING,
  ERROR: logLevel.ERROR,
  WARN: logLevel.WARN,
  INFO: logLevel.INFO,
  DEBUG: logLevel.DEBUG,
};

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private kafka: Kafka;
  private producer: Producer;
  private isConnected = false;
  private readonly clientId: string;

  constructor(
    @Inject(KAFKA_MODULE_OPTIONS) private readonly options: KafkaModuleOptions,
  ) {
    this.clientId = options.clientId;
    
    this.kafka = new Kafka({
      clientId: options.clientId,
      brokers: options.brokers,
      logLevel: LOG_LEVEL_MAP[options.logLevel || 'WARN'],
      retry: {
        initialRetryTime: 1000,
        retries: 10,
      },
    });

    this.producer = this.kafka.producer({
      createPartitioner: Partitioners.LegacyPartitioner,
      allowAutoTopicCreation: true,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    try {
      await this.producer.connect();
      this.isConnected = true;
      this.logger.log(`[${this.clientId}] Kafka producer connected`);
    } catch (error) {
      this.logger.error(`[${this.clientId}] Failed to connect Kafka producer`, error);
      this.retryConnection();
    }
  }

  private async retryConnection(): Promise<void> {
    const maxRetries = 10;
    const retryDelay = 5000;

    for (let i = 0; i < maxRetries; i++) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      try {
        await this.producer.connect();
        this.isConnected = true;
        this.logger.log(`[${this.clientId}] Kafka producer reconnected`);
        return;
      } catch {
        this.logger.warn(`[${this.clientId}] Kafka reconnection attempt ${i + 1}/${maxRetries} failed`);
      }
    }
    this.logger.error(`[${this.clientId}] Failed to connect after ${maxRetries} retries`);
  }

  private async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.producer.disconnect();
      this.isConnected = false;
      this.logger.log(`[${this.clientId}] Kafka producer disconnected`);
    }
  }

  /**
   * Emit a Kafka event to a specific topic
   */
  async emit<T>(
    topic: KafkaTopics,
    payload: T,
    options?: { correlationId?: string; key?: string },
  ): Promise<string> {
    if (!this.isConnected) {
      await this.connect();
      if (!this.isConnected) {
        throw new Error(`[${this.clientId}] Kafka producer not connected`);
      }
    }

    const eventId = uuidv4();
    const event: IKafkaEvent<T> = {
      eventId,
      eventType: topic,
      timestamp: new Date().toISOString(),
      source: this.clientId,
      correlationId: options?.correlationId,
      payload,
    };

    try {
      await this.producer.send({
        topic,
        messages: [{
          key: options?.key || eventId,
          value: JSON.stringify(event),
          headers: {
            'event-id': eventId,
            'event-type': topic,
            'source': this.clientId,
            ...(options?.correlationId && { 'correlation-id': options.correlationId }),
          },
        }],
      });

      this.logger.debug(`[${this.clientId}] Event emitted: ${topic} (${eventId})`);
      return eventId;
    } catch (error) {
      this.logger.error(`[${this.clientId}] Failed to emit event: ${topic}`, error);
      throw error;
    }
  }

  /**
   * Check if producer is connected
   */
  isReady(): boolean {
    return this.isConnected;
  }
}
