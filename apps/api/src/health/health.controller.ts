import { Controller, Get, UseGuards } from '@nestjs/common';
import { HealthService } from './health.service';
import { HealthResponse } from '@voiceflow/shared';
import { RateLimit } from '../common/rate-limit/rate-limit.decorator';
import { RateLimitGuard } from '../common/rate-limit/rate-limit.guard';

@Controller('health')
@UseGuards(RateLimitGuard)
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @RateLimit({
    limit: 120,
    windowSeconds: 60,
    keyPrefix: 'health',
  })
  getHealth(): HealthResponse {
    return this.healthService.getHealth();
  }
}
