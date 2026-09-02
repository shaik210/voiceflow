import { Request, Response, NextFunction } from 'express';

export type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

export interface HealthCheckResult {
  status: string;
  service: string;
  timestamp?: string;
  database?: string;
  redis?: string;
}
