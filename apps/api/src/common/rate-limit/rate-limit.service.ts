import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { DEFAULT_REDIS_TIMEOUT_MS } from './rate-limit.constants';
import { RATE_LIMIT_SLIDING_WINDOW_LUA } from './rate-limit.lua';
import { RateLimitCheckParams, RateLimitResult } from './rate-limit.types';

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly timeoutMs = DEFAULT_REDIS_TIMEOUT_MS;

  constructor(private readonly redisService: RedisService) {}

  /**
   * Check whether a rate-limit key has exceeded its limit in the given sliding window.
   * Executes an atomic Lua script in Redis.
   *
   * Resiliency:
   * Enforces a 250ms timeout. If Redis is unreachable, errors, or times out,
   * the operation logs an error and fails open (allows request) to preserve application availability.
   */
  async check(params: RateLimitCheckParams): Promise<RateLimitResult> {
    const { key, limit, windowSeconds } = params;

    try {
      const client = this.redisService.getClient();

      // Wrap Redis eval in a bounded timeout promise
      const checkPromise = client.eval(
        RATE_LIMIT_SLIDING_WINDOW_LUA,
        1,
        key,
        limit,
        windowSeconds,
      ) as Promise<[number, number, number, number]>;

      const timeoutPromise = new Promise<never>((_, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(`Redis rate limit operation timed out after ${this.timeoutMs}ms`));
        }, this.timeoutMs);
        if (timer.unref) {
          timer.unref();
        }
      });

      const res = await Promise.race([checkPromise, timeoutPromise]);

      const allowed = Number(res[0]) === 1;
      const resLimit = Number(res[1]);
      const remaining = Number(res[2]);
      const resetSeconds = Number(res[3]);

      return {
        allowed,
        limit: resLimit,
        remaining,
        resetSeconds,
      };
    } catch (err: unknown) {
      const error = err as Error;
      this.logger.error(
        `Redis rate limiting failed or timed out for key "${key}": ${error.message}. Failing open.`,
      );

      // Fail-open: allow request, remaining 1, resetSeconds 0
      return {
        allowed: true,
        limit,
        remaining: 1,
        resetSeconds: 0,
      };
    }
  }
}
