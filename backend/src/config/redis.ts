import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// In-Memory Fallback Cache Store (used if Redis is offline/not configured)
interface CacheEntry {
  value: string;
  expiresAt: number;
}

const memoryStore = new Map<string, CacheEntry>();

let redisClient: Redis | null = null;
let isConnected = false;

// Initialize Redis Client
const initRedis = (): Redis | null => {
  const redisUrl = process.env.REDIS_URL || process.env.REDIS_URI;

  try {
    const client = redisUrl
      ? new Redis(redisUrl, {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
          connectTimeout: 4000,
          retryStrategy: (times: number) => {
            if (times > 3) {
              return null; // Stop retrying after 3 attempts to avoid spamming logs
            }
            return Math.min(times * 1000, 3000);
          }
        })
      : new Redis({
          host: process.env.REDIS_HOST || '127.0.0.1',
          port: Number(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD || undefined,
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
          connectTimeout: 4000,
          retryStrategy: (times: number) => {
            if (times > 3) {
              return null;
            }
            return Math.min(times * 1000, 3000);
          }
        });

    client.on('connect', () => {
      isConnected = true;
      console.log('⚡ Redis Cache Connected successfully!');
    });

    client.on('ready', () => {
      isConnected = true;
    });

    client.on('error', (err: any) => {
      isConnected = false;
      // Graceful non-blocking warning
      if (err?.code !== 'ECONNREFUSED') {
        console.warn('⚠️ Redis Cache warning:', err.message || err);
      }
    });

    client.on('close', () => {
      isConnected = false;
    });

    // Attempt non-blocking connection
    client.connect().catch(() => {
      isConnected = false;
      console.log('ℹ️ Redis server not reachable, utilizing High-Speed In-Memory Cache fallback.');
    });

    return client;
  } catch (err: any) {
    console.warn('⚠️ Could not initialize Redis client, using In-Memory Cache:', err?.message);
    return null;
  }
};

redisClient = initRedis();

export const isRedisOnline = (): boolean => isConnected;

/**
 * Get cached data by key
 */
export const getCache = async <T = any>(key: string): Promise<T | null> => {
  // 1. Try Redis if connected
  if (redisClient && isConnected) {
    try {
      const raw = await redisClient.get(key);
      if (raw) {
        return JSON.parse(raw) as T;
      }
      return null;
    } catch {
      // Fallback to memory store
    }
  }

  // 2. Fallback to Memory Store
  const entry = memoryStore.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }

  try {
    return JSON.parse(entry.value) as T;
  } catch {
    return null;
  }
};

/**
 * Set cache with TTL in seconds (default: 1 hour)
 */
export const setCache = async (key: string, data: any, ttlSeconds: number = 3600): Promise<void> => {
  const jsonStr = JSON.stringify(data);

  // 1. Try Redis if connected
  if (redisClient && isConnected) {
    try {
      await redisClient.set(key, jsonStr, 'EX', ttlSeconds);
      return;
    } catch {
      // Fallback to memory store
    }
  }

  // 2. Fallback to Memory Store
  memoryStore.set(key, {
    value: jsonStr,
    expiresAt: Date.now() + ttlSeconds * 1000
  });

  // Limit memory store size to 1000 items to prevent memory leaks
  if (memoryStore.size > 1000) {
    const oldestKey = memoryStore.keys().next().value;
    if (oldestKey) memoryStore.delete(oldestKey);
  }
};

/**
 * Delete a specific cache key
 */
export const delCache = async (key: string): Promise<void> => {
  if (redisClient && isConnected) {
    try {
      await redisClient.del(key);
    } catch {}
  }
  memoryStore.delete(key);
};

/**
 * Flush all cache keys matching a specific pattern (e.g. 'cache:exercises*')
 */
export const flushCachePattern = async (pattern: string): Promise<void> => {
  // 1. Flush Redis keys
  if (redisClient && isConnected) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys && keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch {}
  }

  // 2. Flush In-Memory matching keys
  const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
  for (const k of memoryStore.keys()) {
    if (regex.test(k) || k.startsWith(pattern.replace('*', ''))) {
      memoryStore.delete(k);
    }
  }
};
