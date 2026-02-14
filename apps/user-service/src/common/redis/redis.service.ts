import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    try {
      return await this.cacheManager.get<T>(key);
    } catch (error) {
      this.logger.error(`Error getting cache key: ${key}`, error);
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttlMs);
    } catch (error) {
      this.logger.error(`Error setting cache key: ${key}`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      this.logger.error(`Error deleting cache key: ${key}`, error);
    }
  }

  // User specific caching
  async cacheUser(userId: string, userData: Record<string, unknown>, ttlMs: number = 300000): Promise<void> {
    const key = `user:${userId}`;
    await this.set(key, userData, ttlMs);
  }

  async getCachedUser(userId: string): Promise<Record<string, unknown> | undefined> {
    const key = `user:${userId}`;
    return await this.get<Record<string, unknown>>(key);
  }

  async invalidateUser(userId: string): Promise<void> {
    const key = `user:${userId}`;
    await this.del(key);
  }
}
