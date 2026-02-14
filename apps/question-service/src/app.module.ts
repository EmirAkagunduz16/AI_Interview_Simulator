import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { KafkaModule } from '@ai-coach/kafka-client';
import configuration from './config/configuration';
import { QuestionsModule } from './questions/questions.module';
import { HealthModule } from './health/health.module';
import { RedisModule } from './common/redis';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    // Database
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
      }),
      inject: [ConfigService],
    }),

    // Kafka - Event Streaming (Producer only, no consumers)
    KafkaModule.forRootAsync(
      {
        useFactory: (configService: ConfigService) => ({
          clientId: 'question-service',
          brokers: configService.get<string>('KAFKA_BROKERS')?.split(',') || ['localhost:9092'],
          groupId: 'question-service-group',
          logLevel: 'WARN',
        }),
        inject: [ConfigService],
      },
      [],
    ),

    // Redis - Caching
    RedisModule,

    // Feature Modules
    QuestionsModule,
    HealthModule,
  ],
})
export class AppModule {}
