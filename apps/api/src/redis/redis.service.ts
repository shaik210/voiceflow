import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;

  getClient(): Redis {
    if (!this.client) {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6380';
      this.client = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            return null;
          }
          return Math.min(times * 100, 2000);
        },
      });

      this.client.on('connect', () => {
        this.logger.log('Redis connected successfully');
      });

      this.client.on('error', (err) => {
        this.logger.warn(`Redis connection warning: ${err.message}`);
      });
    }

    return this.client;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const client = this.getClient();
      if (client.status !== 'ready' && client.status !== 'connecting') {
        await client.connect();
      }
      const pong = await client.ping();
      return pong === 'PONG';
    } catch {
      return false;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }
}
