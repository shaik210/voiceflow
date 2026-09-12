import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import crypto from 'crypto';
import { RateLimitService } from './rate-limit.service';
import {
  RATE_LIMIT_METADATA_KEY,
  RATE_LIMIT_HEADER_LIMIT,
  RATE_LIMIT_HEADER_REMAINING,
  RATE_LIMIT_HEADER_RESET,
  RATE_LIMIT_HEADER_RETRY_AFTER,
  X_RATE_LIMIT_HEADER_LIMIT,
  X_RATE_LIMIT_HEADER_REMAINING,
  X_RATE_LIMIT_HEADER_RESET,
} from './rate-limit.constants';
import { RateLimitOptions } from './rate-limit.types';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) {
      return true;
    }

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const action = options.keyPrefix || context.getHandler().name;
    const user = (request as unknown as { user?: { id?: string } }).user;

    let primaryKey: string;
    if (user && user.id) {
      // Authenticated route: key by User ID to avoid multi-tenant NAT IP collisions
      primaryKey = `rl:usr:${user.id}:${action}`;
    } else {
      // Unauthenticated route: key by resolved Client IP
      const clientIp = this.getClientIp(request);
      primaryKey = `rl:ip:${clientIp}:${action}`;
    }

    // Special defense-in-depth for login: account-targeted limiter using hashed email
    let targetKey: string | null = null;
    if (action === 'login' && request.body && typeof request.body.email === 'string') {
      const normalizedEmail = request.body.email.trim().toLowerCase();
      if (normalizedEmail.length > 0) {
        const emailHash = crypto.createHash('sha256').update(normalizedEmail).digest('hex').substring(0, 32);
        targetKey = `rl:login:target:${emailHash}`;
      }
    }

    // Execute primary rate check
    const primaryResult = await this.rateLimitService.check({
      key: primaryKey,
      limit: options.limit,
      windowSeconds: options.windowSeconds,
    });

    let allowed = primaryResult.allowed;
    let remaining = primaryResult.remaining;
    let resetSeconds = primaryResult.resetSeconds;

    // If login has account target key, check that as well
    if (targetKey) {
      const targetResult = await this.rateLimitService.check({
        key: targetKey,
        limit: options.limit,
        windowSeconds: options.windowSeconds,
      });

      if (!targetResult.allowed) {
        allowed = false;
      }
      remaining = Math.min(primaryResult.remaining, targetResult.remaining);
      resetSeconds = Math.max(primaryResult.resetSeconds, targetResult.resetSeconds);
    }

    // Set standard RateLimit headers (IETF draft & RFC 6585)
    response.setHeader(RATE_LIMIT_HEADER_LIMIT, options.limit);
    response.setHeader(RATE_LIMIT_HEADER_REMAINING, remaining);
    response.setHeader(RATE_LIMIT_HEADER_RESET, resetSeconds);

    // Set legacy X- headers for backwards compatibility
    response.setHeader(X_RATE_LIMIT_HEADER_LIMIT, options.limit);
    response.setHeader(X_RATE_LIMIT_HEADER_REMAINING, remaining);
    response.setHeader(X_RATE_LIMIT_HEADER_RESET, resetSeconds);

    if (!allowed) {
      response.setHeader(RATE_LIMIT_HEADER_RETRY_AFTER, resetSeconds);
      // Return standard generic message to avoid leaking account-existence/email info
      throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }

  /**
   * Resolves the real client IP address safely, taking proxy headers into account.
   * Avoids pooling unresolvable requests into a single shared bucket.
   */
  private getClientIp(request: Request): string {
    // 1. Check req.ip (populated by Express if 'trust proxy' is configured)
    if (request.ip && request.ip !== '::1' && request.ip !== '127.0.0.1') {
      return request.ip;
    }

    // 2. Check X-Forwarded-For if available
    const xForwardedFor = request.headers['x-forwarded-for'];
    if (xForwardedFor) {
      const ips = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor.split(',')[0];
      const clientIp = ips?.trim();
      if (clientIp) {
        return clientIp;
      }
    }

    // 3. Fallback to direct request.ip or socket remoteAddress
    if (request.ip) {
      return request.ip;
    }

    if (request.socket?.remoteAddress) {
      return request.socket.remoteAddress;
    }

    // 4. Safe fallback: generate unique ephemeral id so unresolved clients never block each other
    return `unresolved-${Math.random().toString(36).substring(2, 10)}`;
  }
}
