import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let redisClient: Redis | null = null;
let redisAvailable = false;

try {
  redisClient = new Redis(redisUrl, {
    retryStrategy: () => null, // Don't retry, fail fast
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    lazyConnect: true, // Don't connect immediately
  });

  // Try to connect once
  redisClient.connect().then(() => {
    redisAvailable = true;
    console.log('✅ [Redis] Connected successfully');
  }).catch(() => {
    redisAvailable = false;
    console.log('⚠️  [Redis] Not available - using in-memory cache');
    redisClient?.disconnect();
    redisClient = null;
  });

  // Suppress error logs
  redisClient.on('error', () => {
    // Silent - already logged connection failure
  });
} catch (error) {
  console.log('⚠️  [Redis] Not available - using in-memory cache');
  redisClient = null;
}

export const redis = redisClient;

// Cache TTL: 7 days in seconds
export const CACHE_TTL = 7 * 24 * 60 * 60;

// In-memory cache fallback
const memoryCache = new Map<string, { value: any; expires: number }>();

/**
 * Get cached value with automatic JSON parsing
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    if (redis) {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } else {
      // Use in-memory cache
      const cached = memoryCache.get(key);
      if (cached && cached.expires > Date.now()) {
        return cached.value;
      }
      return null;
    }
  } catch (error) {
    return null;
  }
}

/**
 * Set cached value with automatic JSON stringification
 */
export async function setCached(key: string, value: any, ttl: number = CACHE_TTL): Promise<void> {
  try {
    if (redis) {
      await redis.setex(key, ttl, JSON.stringify(value));
    } else {
      // Use in-memory cache
      memoryCache.set(key, {
        value,
        expires: Date.now() + ttl * 1000,
      });
    }
  } catch (error) {
    // Silent fail - caching is optional
  }
}
