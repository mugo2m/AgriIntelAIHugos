// lib/rag/cacheManager.ts
import Redis from 'ioredis';
import { createHash } from 'crypto';
import { supabase } from '@/lib/supabase/client';

// Initialize Redis (optional - falls back to memory if not available)
let redis: Redis | null = null;
try {
  if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => Math.min(times * 50, 2000)
    });

    redis.on('error', (err) => {
      console.log('⚠️ Redis unavailable, using memory cache');
      redis = null;
    });
  }
} catch (error) {
  console.log('⚠️ Redis initialization failed, using memory cache');
}

// Memory cache fallback
const memoryCache = new Map<string, {
  value: any;
  expires: number;
}>();

// Clean memory cache every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, { expires }] of memoryCache.entries()) {
    if (expires < now) {
      memoryCache.delete(key);
    }
  }
}, 60000);

export class CacheManager {
  private static getKey(prefix: string, key: string): string {
    return `${prefix}:${createHash('sha256').update(key).digest('hex').substring(0, 32)}`;
  }

  static async get<T>(key: string): Promise<T | null> {
    const cacheKey = this.getKey('rag', key);

    // Try Redis first
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          console.log(`🎯 Redis cache HIT for ${key.substring(0, 30)}...`);
          return JSON.parse(cached);
        }
      } catch (error) {
        console.log('Redis get failed, falling back to memory');
      }
    }

    // Fallback to memory cache
    const memoryItem = memoryCache.get(cacheKey);
    if (memoryItem && memoryItem.expires > Date.now()) {
      console.log(`🎯 Memory cache HIT for ${key.substring(0, 30)}...`);
      return memoryItem.value;
    }

    return null;
  }

  static async set(
    key: string,
    value: any,
    ttlSeconds: number = 3600 // Default 1 hour
  ): Promise<void> {
    const cacheKey = this.getKey('rag', key);
    const expires = Date.now() + (ttlSeconds * 1000);

    // Store in memory always
    memoryCache.set(cacheKey, { value, expires });

    // Try Redis if available
    if (redis) {
      try {
        await redis.setex(cacheKey, ttlSeconds, JSON.stringify(value));
      } catch (error) {
        console.log('Redis set failed, using memory only');
      }
    }
  }

  static async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 3600
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached) return cached;

    const fresh = await fetcher();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }

  static async invalidate(pattern: string): Promise<void> {
    const patternKey = this.getKey('rag', pattern);

    // Clear memory cache (by prefix)
    for (const key of memoryCache.keys()) {
      if (key.includes(patternKey)) {
        memoryCache.delete(key);
      }
    }

    // Clear Redis if available
    if (redis) {
      try {
        const keys = await redis.keys(`rag:${patternKey}*`);
        if (keys.length) {
          await redis.del(...keys);
        }
      } catch (error) {
        console.log('Redis invalidation failed');
      }
    }
  }

  static async clearAll(): Promise<void> {
    memoryCache.clear();

    if (redis) {
      try {
        const keys = await redis.keys('rag:*');
        if (keys.length) {
          await redis.del(...keys);
        }
      } catch (error) {
        console.log('Redis clear failed');
      }
    }
  }
}

// Specialized caches
export const EmbeddingCache = {
  async get(text: string): Promise<number[] | null> {
    const hash = createHash('sha256').update(text).digest('hex');
    return CacheManager.get<number[]>(`embed:${hash}`);
  },

  async set(text: string, embedding: number[]): Promise<void> {
    const hash = createHash('sha256').update(text).digest('hex');
    await CacheManager.set(`embed:${hash}`, embedding, 86400); // 24 hours
  }
};

export const SearchCache = {
  async get(query: string, filters: any): Promise<any | null> {
    const key = `search:${query}:${JSON.stringify(filters)}`;
    return CacheManager.get(key);
  },

  async set(query: string, filters: any, results: any): Promise<void> {
    const key = `search:${query}:${JSON.stringify(filters)}`;
    await CacheManager.set(key, results, 3600); // 1 hour
  }
};

export const AnswerCache = {
  async get(question: string, context: any): Promise<string | null> {
    const key = `answer:${question}:${JSON.stringify(context)}`;
    return CacheManager.get<string>(key);
  },

  async set(question: string, context: any, answer: string): Promise<void> {
    const key = `answer:${question}:${JSON.stringify(context)}`;
    await CacheManager.set(key, answer, 86400); // 24 hours
  }
};