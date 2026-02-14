import { Module, DynamicModule, Global, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaProducerService } from './services/kafka-producer.service';
import { KafkaConsumerService } from './services/kafka-consumer.service';
import {
  KafkaModuleOptions,
  KafkaModuleAsyncOptions,
  KafkaEventHandler,
  KAFKA_MODULE_OPTIONS,
  KAFKA_EVENT_HANDLERS,
} from './interfaces/kafka.interfaces';

@Global()
@Module({})
export class KafkaModule {
  /**
   * Register Kafka module with static configuration
   */
  static forRoot(options: KafkaModuleOptions, handlers: KafkaEventHandler[] = []): DynamicModule {
    const providers: Provider[] = [
      {
        provide: KAFKA_MODULE_OPTIONS,
        useValue: options,
      },
      {
        provide: KAFKA_EVENT_HANDLERS,
        useValue: handlers,
      },
      KafkaProducerService,
      KafkaConsumerService,
    ];

    return {
      module: KafkaModule,
      providers,
      exports: [KafkaProducerService, KafkaConsumerService],
    };
  }

  /**
   * Register Kafka module with async configuration (for using ConfigService)
   */
  static forRootAsync(
    asyncOptions: KafkaModuleAsyncOptions,
    handlers: KafkaEventHandler[] = [],
  ): DynamicModule {
    const providers: Provider[] = [
      {
        provide: KAFKA_MODULE_OPTIONS,
        useFactory: asyncOptions.useFactory,
        inject: asyncOptions.inject || [],
      },
      {
        provide: KAFKA_EVENT_HANDLERS,
        useValue: handlers,
      },
      KafkaProducerService,
      KafkaConsumerService,
    ];

    return {
      module: KafkaModule,
      providers,
      exports: [KafkaProducerService, KafkaConsumerService],
    };
  }

  /**
   * Helper to create async options from ConfigService
   */
  static createAsyncOptionsProvider(clientId: string): KafkaModuleAsyncOptions {
    return {
      useFactory: (configService: ConfigService) => ({
        clientId,
        brokers: configService.get<string>('KAFKA_BROKERS')?.split(',') || ['localhost:9092'],
        groupId: `${clientId}-group`,
        logLevel: 'WARN' as const,
      }),
      inject: [ConfigService],
    };
  }
}
