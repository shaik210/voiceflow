import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { RecordingsModule } from './recordings/recordings.module';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { RateLimitModule } from './common/rate-limit/rate-limit.module';
import { TTSModule } from './tts/tts.module';

@Module({
  imports: [HealthModule, PrismaModule, RedisModule, RecordingsModule, AiModule, AuthModule, RateLimitModule, TTSModule],
})
export class AppModule { }
