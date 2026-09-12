import { SetMetadata } from '@nestjs/common';
import { RATE_LIMIT_METADATA_KEY } from './rate-limit.constants';
import { RateLimitOptions } from './rate-limit.types';

/**
 * Route decorator to declare rate limiting configuration.
 *
 * Example:
 * ```ts
 * @RateLimit({
 *   limit: 5,
 *   windowSeconds: 60,
 *   keyPrefix: 'transcribe',
 * })
 * ```
 */
export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_METADATA_KEY, options);
