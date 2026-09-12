export interface RateLimitOptions {
  limit: number;
  windowSeconds: number;
  keyPrefix?: string;
}

export interface RateLimitCheckParams {
  key: string;
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}
