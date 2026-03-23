import { Module, Global } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import { ConfigService } from "@nestjs/config";
import { redisStore } from "cache-manager-ioredis-yet";
import { RedisService } from "./redis.service";

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: async (configService: ConfigService) => {
        const store = await redisStore({
          host: configService.get("REDIS_HOST") || "localhost",
          port: configService.get("REDIS_PORT") || 6379,
          password: configService.get("REDIS_PASSWORD") || undefined,
          ttl: 3600 * 1000, // 1 hour default — interview question caches
        });

        return {
          store,
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [RedisService],
  exports: [CacheModule, RedisService],
})
export class RedisModule {}
