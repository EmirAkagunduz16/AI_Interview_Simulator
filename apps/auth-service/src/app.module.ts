import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { KafkaModule } from "@ai-coach/kafka-client";
import configuration from "./config/configuration";
import { AuthModule } from "./auth/auth.module";
import { HealthModule } from "./health/health.module";
import { RedisModule } from "./common/redis/redis.module";

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [".env.local", ".env"],
      cache: true,
    }),

    // Database
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>("database.uri"),
      }),
      inject: [ConfigService],
    }),

    // Kafka
    KafkaModule.forRootAsync(
      KafkaModule.createAsyncOptionsProvider("auth-service"),
    ),

    // Redis - Token blacklist
    RedisModule,

    // Feature Modules
    AuthModule,
    HealthModule,
  ],
})
export class AppModule {}
