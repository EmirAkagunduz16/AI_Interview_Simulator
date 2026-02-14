import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaModule } from '@ai-coach/kafka-client';
import configuration from './config/configuration';
import { AiModule } from './ai/ai.module';
import { HealthModule } from './health/health.module';
import { RedisModule } from './common/redis';
import { KafkaHandlersModule } from './kafka/kafka-handlers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    // Kafka - Event Streaming (for general producer usage)
    KafkaModule.forRootAsync(
      {
        useFactory: (configService: ConfigService) => ({
          clientId: 'ai-service',
          brokers: configService.get<string>('KAFKA_BROKERS')?.split(',') || ['localhost:9092'],
          groupId: 'ai-service-group',
          logLevel: 'WARN',
        }),
        inject: [ConfigService],
      },
      [],
    ),

    RedisModule,
    AiModule,
    HealthModule,
    
    // Kafka Event Handlers (Consumer + Producer for evaluation)
    KafkaHandlersModule,
  ],
})
export class AppModule {}
