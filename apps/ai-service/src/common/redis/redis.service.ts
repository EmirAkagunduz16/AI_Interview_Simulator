import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CachedQuestion } from '../../ai/types';

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

  // ── Interview question caching ─────────────────────────────────────
  // Replaces the in-memory Map that was previously used in InterviewFlowService

  async cacheInterviewQuestions(
    interviewId: string,
    questions: CachedQuestion[],
    ttlMs: number = 2 * 60 * 60 * 1000, // 2 hours
  ): Promise<void> {
    const key = `interview:questions:${interviewId}`;
    await this.set(key, questions, ttlMs);
  }

  async getCachedInterviewQuestions(
    interviewId: string,
  ): Promise<CachedQuestion[] | undefined> {
    const key = `interview:questions:${interviewId}`;
    return await this.get<CachedQuestion[]>(key);
  }

  async deleteCachedInterviewQuestions(interviewId: string): Promise<void> {
    const key = `interview:questions:${interviewId}`;
    await this.del(key);
  }
}
