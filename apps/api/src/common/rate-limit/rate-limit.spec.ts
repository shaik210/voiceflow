import test, { describe, before, after } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import Redis from 'ioredis';
import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitService } from './rate-limit.service';
import { RateLimitGuard } from './rate-limit.guard';
import { RedisService } from '../../redis/redis.service';
import {
  RATE_LIMIT_HEADER_LIMIT,
  RATE_LIMIT_HEADER_REMAINING,
  RATE_LIMIT_HEADER_RESET,
  RATE_LIMIT_HEADER_RETRY_AFTER,
} from './rate-limit.constants';

describe('VoiceFlow Rate Limiting Suite (Step 9.2B)', () => {
  let redisClient: Redis;
  let redisService: RedisService;
  let rateLimitService: RateLimitService;
  let reflector: Reflector;
  let guard: RateLimitGuard;

  const testKeyPrefix = `test:rl:${Date.now()}`;

  before(async () => {
    redisService = new RedisService();
    redisClient = redisService.getClient();
    rateLimitService = new RateLimitService(redisService);
    reflector = new Reflector();
    guard = new RateLimitGuard(reflector, rateLimitService);
  });

  after(async () => {
    // Clean up all keys matching our test prefix
    const keys = await redisClient.keys(`${testKeyPrefix}*`);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
    await redisService.onModuleDestroy();
  });

  test('1. Basic: 5 requests allowed, 6th request rejected with allowed=false', async () => {
    const key = `${testKeyPrefix}:basic`;
    const limit = 5;
    const windowSeconds = 60;

    for (let i = 1; i <= 5; i++) {
      const res = await rateLimitService.check({ key, limit, windowSeconds });
      assert.strictEqual(res.allowed, true, `Request ${i} should be allowed`);
      assert.strictEqual(res.limit, limit);
      assert.strictEqual(res.remaining, limit - i, `Remaining count after request ${i} should be ${limit - i}`);
      assert.ok(res.resetSeconds > 0 && res.resetSeconds <= windowSeconds, 'Reset seconds should be within window');
    }

    // 6th request must be rejected
    const sixth = await rateLimitService.check({ key, limit, windowSeconds });
    assert.strictEqual(sixth.allowed, false, 'Request 6 must be rejected');
    assert.strictEqual(sixth.remaining, 0, 'Remaining count on rejected request must be 0');
    assert.ok(sixth.resetSeconds > 0, 'Reset seconds must be positive');
  });

  test('2. Remaining count and Reset seconds: decreases monotonically and resetSeconds is valid', async () => {
    const key = `${testKeyPrefix}:remaining_check`;
    const limit = 3;
    const windowSeconds = 60;

    const r1 = await rateLimitService.check({ key, limit, windowSeconds });
    assert.strictEqual(r1.remaining, 2);

    const r2 = await rateLimitService.check({ key, limit, windowSeconds });
    assert.strictEqual(r2.remaining, 1);

    const r3 = await rateLimitService.check({ key, limit, windowSeconds });
    assert.strictEqual(r3.remaining, 0);

    const r4 = await rateLimitService.check({ key, limit, windowSeconds });
    assert.strictEqual(r4.allowed, false);
    assert.strictEqual(r4.remaining, 0);
    assert.ok(r4.resetSeconds <= 60 && r4.resetSeconds >= 1);
  });

  test('3. User isolation: User A limit exhausted does not affect User B', async () => {
    const userAKey = `${testKeyPrefix}:usr:user-alpha:transcribe`;
    const userBKey = `${testKeyPrefix}:usr:user-beta:transcribe`;
    const limit = 3;
    const windowSeconds = 60;

    // User A consumes all 3 requests
    for (let i = 0; i < limit; i++) {
      await rateLimitService.check({ key: userAKey, limit, windowSeconds });
    }
    const userABlocked = await rateLimitService.check({ key: userAKey, limit, windowSeconds });
    assert.strictEqual(userABlocked.allowed, false, 'User A should be blocked');

    // User B should have full quota
    const userBFirst = await rateLimitService.check({ key: userBKey, limit, windowSeconds });
    assert.strictEqual(userBFirst.allowed, true, 'User B should be allowed independently');
    assert.strictEqual(userBFirst.remaining, limit - 1, 'User B should have limit - 1 remaining');
  });

  test('4. IP isolation: IP A limit reached does not affect IP B', async () => {
    const ipAKey = `${testKeyPrefix}:ip:198.51.100.10:login`;
    const ipBKey = `${testKeyPrefix}:ip:203.0.113.50:login`;
    const limit = 2;
    const windowSeconds = 60;

    await rateLimitService.check({ key: ipAKey, limit, windowSeconds });
    await rateLimitService.check({ key: ipAKey, limit, windowSeconds });
    const ipABlocked = await rateLimitService.check({ key: ipAKey, limit, windowSeconds });
    assert.strictEqual(ipABlocked.allowed, false, 'IP A should be blocked');

    const ipBAllowed = await rateLimitService.check({ key: ipBKey, limit, windowSeconds });
    assert.strictEqual(ipBAllowed.allowed, true, 'IP B should be allowed independently');
  });

  test('5. Multi-server / Concurrency simulation: race condition at count=4, limit=5', async () => {
    const key = `${testKeyPrefix}:concurrency`;
    const limit = 5;
    const windowSeconds = 60;

    // Send 4 requests first
    for (let i = 0; i < 4; i++) {
      const res = await rateLimitService.check({ key, limit, windowSeconds });
      assert.strictEqual(res.allowed, true);
    }

    // Now count = 4, exactly 1 slot remains.
    // Simulate 5 concurrent requests arriving simultaneously from different API instances
    const concurrentRequests = Array.from({ length: 5 }, () =>
      rateLimitService.check({ key, limit, windowSeconds }),
    );

    const results = await Promise.all(concurrentRequests);

    const allowedCount = results.filter((r) => r.allowed).length;
    const rejectedCount = results.filter((r) => !r.allowed).length;

    assert.strictEqual(allowedCount, 1, 'Exactly one concurrent request should be allowed');
    assert.strictEqual(rejectedCount, 4, 'Remaining 4 concurrent requests must be rejected');
  });

  test('6. Redis failure behavior: fails open when Redis is unreachable or errors', async () => {
    // Mock a broken Redis client that throws
    const brokenRedisService = {
      getClient: () => ({
        eval: () => Promise.reject(new Error('Connection to Redis lost (ECONNREFUSED)')),
      }),
    } as unknown as RedisService;

    const resilientService = new RateLimitService(brokenRedisService);
    const result = await resilientService.check({
      key: `${testKeyPrefix}:failopen`,
      limit: 5,
      windowSeconds: 60,
    });

    assert.strictEqual(result.allowed, true, 'Must fail open when Redis fails');
    assert.strictEqual(result.remaining, 1, 'Should indicate remaining 1 on fail-open');
    assert.strictEqual(result.resetSeconds, 0);
  });

  test('7. Redis key TTL: Keys expire automatically and have bounded TTL', async () => {
    const key = `${testKeyPrefix}:ttl_check`;
    const limit = 5;
    const windowSeconds = 60;

    await rateLimitService.check({ key, limit, windowSeconds });

    // Look for matching keys created in Redis
    const matchingKeys = await redisClient.keys(`${key}*`);
    assert.ok(matchingKeys.length > 0, 'Keys should be created in Redis');

    for (const k of matchingKeys) {
      const ttl = await redisClient.ttl(k);
      assert.ok(ttl > 0, `TTL for key ${k} must be positive`);
      assert.ok(ttl <= windowSeconds * 2, `TTL for key ${k} must not exceed 2 * window`);
    }
  });

  test('8. Login email protection: Hashed email key used without raw email exposure', async () => {
    const rawEmail = `victim-${Date.now()}@example.com`;
    const emailHash = crypto.createHash('sha256').update(rawEmail.toLowerCase()).digest('hex').substring(0, 32);

    assert.strictEqual(emailHash.includes(rawEmail), false);
    assert.strictEqual(emailHash.length, 32);

    // Verify RateLimitGuard creates targeted key
    const headersSet: Record<string, unknown> = {};
    const mockResponse = {
      setHeader: (k: string, v: unknown) => {
        headersSet[k] = v;
      },
    };

    const uniqueIp = `198.51.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}`;
    const mockRequest = {
      ip: uniqueIp,
      headers: {},
      body: { email: rawEmail },
      socket: { remoteAddress: uniqueIp },
    };

    const mockContext = {
      getHandler: () => ({ name: 'login' }),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as unknown as ExecutionContext;

    // Set metadata on handler
    reflector.getAllAndOverride = () => ({
      limit: 2,
      windowSeconds: 60,
      keyPrefix: 'login',
    });

    // Request 1: allowed
    const pass1 = await guard.canActivate(mockContext);
    assert.strictEqual(pass1, true);

    // Request 2: allowed
    const pass2 = await guard.canActivate(mockContext);
    assert.strictEqual(pass2, true);

    // Request 3: blocked by target key limit
    let errorThrown: HttpException | null = null;
    try {
      await guard.canActivate(mockContext);
    } catch (err) {
      errorThrown = err as HttpException;
    }

    assert.ok(errorThrown, 'Should throw HttpException on breach');
    assert.strictEqual(errorThrown?.getStatus(), HttpStatus.TOO_MANY_REQUESTS);
    assert.strictEqual(errorThrown?.message, 'Too Many Requests');

    // Verify Redis keys do NOT contain raw email
    const createdKeys = await redisClient.keys(`*${rawEmail}*`);
    assert.strictEqual(createdKeys.length, 0, 'No Redis key should contain raw email');

    // But key with hash exists
    const hashedKeys = await redisClient.keys(`*${emailHash}*`);
    assert.ok(hashedKeys.length > 0, 'Key with SHA-256 email hash should exist in Redis');
  });

  test('9. HTTP 429 and headers: sets RFC/draft and legacy rate limit headers', async () => {
    const headersSet: Record<string, unknown> = {};
    const mockResponse = {
      setHeader: (k: string, v: unknown) => {
        headersSet[k] = v;
      },
    };

    const mockRequest = {
      user: { id: `user-headers-${Date.now()}` },
      headers: {},
      socket: { remoteAddress: '127.0.0.1' },
    };

    const mockContext = {
      getHandler: () => ({ name: 'transcribeRecording' }),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as unknown as ExecutionContext;

    reflector.getAllAndOverride = () => ({
      limit: 1,
      windowSeconds: 60,
      keyPrefix: 'transcribe',
    });

    // Request 1: allowed
    await guard.canActivate(mockContext);
    assert.strictEqual(headersSet[RATE_LIMIT_HEADER_LIMIT], 1);
    assert.strictEqual(headersSet[RATE_LIMIT_HEADER_REMAINING], 0);
    assert.ok(Number(headersSet[RATE_LIMIT_HEADER_RESET]) > 0);

    // Request 2: rejected with 429
    let errorThrown: HttpException | null = null;
    try {
      await guard.canActivate(mockContext);
    } catch (err) {
      errorThrown = err as HttpException;
    }

    assert.ok(errorThrown);
    assert.strictEqual(errorThrown?.getStatus(), HttpStatus.TOO_MANY_REQUESTS);
    assert.strictEqual(headersSet[RATE_LIMIT_HEADER_REMAINING], 0);
    assert.ok(Number(headersSet[RATE_LIMIT_HEADER_RETRY_AFTER]) > 0);
    assert.strictEqual(headersSet['X-RateLimit-Limit'], 1);
    assert.strictEqual(headersSet['X-RateLimit-Remaining'], 0);
  });
});
