import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3
});

redis.on('connect', () => {
  console.log('[Redis] Connected successfully');
});

redis.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});

// Cache TTL: 7 days in seconds
export const CACHE_TTL = 7 * 24 * 60 * 60;

/**
 * Get cached value with automatic JSON parsing
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`[Redis] Get error for key ${key}:`, error);
    return null;
  }
}

/**
 * Set cached value with automatic JSON stringification
 */
export async function setCached(key: string, value: any, ttl: number = CACHE_TTL): Promise<void> {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error(`[Redis] Set error for key ${key}:`, error);
  }
}
