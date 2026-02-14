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

  // Interview specific methods
  async cacheInterview(interviewId: string, data: Record<string, unknown>, ttlMs: number = 3600000): Promise<void> {
    const key = `interview:${interviewId}`;
    await this.set(key, data, ttlMs);
  }

  async getCachedInterview(interviewId: string): Promise<Record<string, unknown> | undefined> {
    const key = `interview:${interviewId}`;
    return await this.get<Record<string, unknown>>(key);
  }

  async cacheInterviewProgress(interviewId: string, progress: Record<string, unknown>): Promise<void> {
    const key = `interview:progress:${interviewId}`;
    await this.set(key, progress, 7200000); // 2 hours
  }

  async getInterviewProgress(interviewId: string): Promise<Record<string, unknown> | undefined> {
    const key = `interview:progress:${interviewId}`;
    return await this.get<Record<string, unknown>>(key);
  }

  async cacheUserInterviews(userId: string, interviewIds: string[]): Promise<void> {
    const key = `user:interviews:${userId}`;
    await this.set(key, interviewIds, 3600000); // 1 hour
  }

  async getUserInterviews(userId: string): Promise<string[] | undefined> {
    const key = `user:interviews:${userId}`;
    return await this.get<string[]>(key);
  }

  async invalidateUserInterviews(userId: string): Promise<void> {
    const key = `user:interviews:${userId}`;
    await this.del(key);
  }
}
