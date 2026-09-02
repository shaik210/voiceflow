import { Injectable } from '@nestjs/common';
import { HealthResponse } from '@voiceflow/shared';

@Injectable()
export class HealthService {
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: 'voiceflow-api',
    };
  }
}
