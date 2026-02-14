import { KafkaTopics } from '@ai-coach/shared-types';
import { InjectionToken, OptionalFactoryDependency } from '@nestjs/common';

export interface KafkaModuleOptions {
  clientId: string;
  brokers: string[];
  groupId?: string;
  logLevel?: 'NOTHING' | 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
}

export interface KafkaModuleAsyncOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useFactory: (...args: any[]) => Promise<KafkaModuleOptions> | KafkaModuleOptions;
  inject?: (InjectionToken | OptionalFactoryDependency)[];
}

export interface KafkaEventHandler<T = unknown> {
  topic: KafkaTopics;
  handler: (payload: T, metadata: KafkaEventMetadata) => Promise<void>;
}

export interface KafkaEventMetadata {
  eventId: string;
  eventType: KafkaTopics;
  timestamp: string;
  source: string;
  correlationId?: string;
  partition: number;
  offset: string;
}

export const KAFKA_MODULE_OPTIONS = 'KAFKA_MODULE_OPTIONS';
export const KAFKA_EVENT_HANDLERS = 'KAFKA_EVENT_HANDLERS';
