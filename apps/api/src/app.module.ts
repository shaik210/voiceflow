import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { RecordingsModule } from './recordings/recordings.module';

@Module({
  imports: [HealthModule, PrismaModule, RedisModule, RecordingsModule],
})
export class AppModule {}
