import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { KafkaModule } from '@ai-coach/kafka-client';
import configuration from './config/configuration';
import { UsersModule } from './users/users.module';
import { HealthModule } from './health/health.module';
import { RedisModule } from './common/redis';
import { KafkaHandlersModule } from './kafka/kafka-handlers.module';

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

    // Kafka - Event Streaming  
    KafkaModule.forRootAsync(
      {
        useFactory: (configService: ConfigService) => ({
          clientId: 'user-service',
          brokers: configService.get<string>('KAFKA_BROKERS')?.split(',') || ['localhost:9092'],
          groupId: 'user-service-group',
          logLevel: 'WARN',
        }),
        inject: [ConfigService],
      },
      [], // No static handlers, using dynamic subscription
    ),

    // Redis - Caching
    RedisModule,

    // Feature Modules
    UsersModule,
    HealthModule,
    
    // Kafka Event Handlers
    KafkaHandlersModule,
  ],
})
export class AppModule {}
