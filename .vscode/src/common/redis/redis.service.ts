import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as crypto from 'crypto';

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

  // AI response caching methods
  private generateCacheKey(prefix: string, input: string): string {
    const hash = crypto.createHash('md5').update(input).digest('hex');
    return `${prefix}:${hash}`;
  }

  async cacheEvaluation(
    questionId: string,
    answer: string,
    evaluation: Record<string, unknown>,
    ttlMs: number = 86400000, // 24 hours
  ): Promise<void> {
    const key = this.generateCacheKey(`eval:${questionId}`, answer);
    await this.set(key, evaluation, ttlMs);
    this.logger.debug(`Cached evaluation for question ${questionId}`);
  }

  async getCachedEvaluation(
    questionId: string,
    answer: string,
  ): Promise<Record<string, unknown> | undefined> {
    const key = this.generateCacheKey(`eval:${questionId}`, answer);
    return await this.get<Record<string, unknown>>(key);
  }

  async cacheTTS(text: string, audioData: Buffer, ttlMs: number = 3600000): Promise<void> {
    const key = this.generateCacheKey('tts', text);
    await this.set(key, audioData.toString('base64'), ttlMs);
    this.logger.debug(`Cached TTS audio`);
  }

  async getCachedTTS(text: string): Promise<Buffer | undefined> {
    const key = this.generateCacheKey('tts', text);
    const cached = await this.get<string>(key);
    if (cached) {
      return Buffer.from(cached, 'base64');
    }
    return undefined;
  }

  async cacheGeneratedQuestion(
    category: string,
    difficulty: string,
    question: Record<string, unknown>,
    ttlMs: number = 43200000, // 12 hours
  ): Promise<void> {
    const key = `genq:${category}:${difficulty}:${Date.now()}`;
    await this.set(key, question, ttlMs);
  }

  // Rate limiting for AI API calls
  async checkRateLimit(userId: string, maxRequests: number, windowMs: number): Promise<boolean> {
    const key = `ratelimit:ai:${userId}`;
    const current = await this.get<number>(key) || 0;
    
    if (current >= maxRequests) {
      return false;
    }
    
    await this.set(key, current + 1, windowMs);
    return true;
  }
}
