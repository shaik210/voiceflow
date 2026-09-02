import Redis from 'ioredis';
import { config } from '../config/index.js';

let redisClient: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis(config.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          return null; // Stop retrying after 3 attempts
        }
        return Math.min(times * 100, 2000);
      }
    });

    redisClient.on('connect', () => {
      console.log('Redis connected successfully');
    });

    redisClient.on('error', (err) => {
      console.warn('Redis connection warning:', err.message);
    });
  }

  return redisClient;
};

export const checkRedisHealth = async (): Promise<boolean> => {
  try {
    const client = getRedisClient();
    if (client.status !== 'ready' && client.status !== 'connecting') {
      await client.connect();
    }
    const pong = await client.ping();
    return pong === 'PONG';
  } catch (_error) {
    return false;
  }
};
