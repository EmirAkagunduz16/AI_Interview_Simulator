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

  // Question specific caching
  async cacheQuestion(questionId: string, question: Record<string, unknown>, ttlMs: number = 3600000): Promise<void> {
    const key = `question:${questionId}`;
    await this.set(key, question, ttlMs);
  }

  async getCachedQuestion(questionId: string): Promise<Record<string, unknown> | undefined> {
    const key = `question:${questionId}`;
    return await this.get<Record<string, unknown>>(key);
  }

  async cacheQuestionsByCategory(
    category: string, 
    difficulty: string, 
    questions: Record<string, unknown>[], 
    ttlMs: number = 1800000
  ): Promise<void> {
    const key = `questions:${category}:${difficulty}`;
    await this.set(key, questions, ttlMs);
  }

  async getCachedQuestionsByCategory(
    category: string, 
    difficulty: string
  ): Promise<Record<string, unknown>[] | undefined> {
    const key = `questions:${category}:${difficulty}`;
    return await this.get<Record<string, unknown>[]>(key);
  }

  async invalidateQuestion(questionId: string): Promise<void> {
    const key = `question:${questionId}`;
    await this.del(key);
  }

  async invalidateCategoryCache(category: string): Promise<void> {
    // Note: In a real scenario, you might want to use Redis SCAN
    // to find and delete all keys matching the pattern
    const difficulties = ['easy', 'medium', 'hard'];
    for (const diff of difficulties) {
      await this.del(`questions:${category}:${diff}`);
    }
  }
}
