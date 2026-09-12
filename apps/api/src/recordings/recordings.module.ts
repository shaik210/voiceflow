import { Module } from '@nestjs/common';
import { RecordingsController } from './recordings.controller';
import { RecordingsService } from './recordings.service';
import { StorageModule } from '../storage/storage.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TranscriptionModule } from '../transcription/transcription.module';
import { AiModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [StorageModule, PrismaModule, TranscriptionModule, AiModule, AuthModule],
  controllers: [RecordingsController],
  providers: [RecordingsService],
})
export class RecordingsModule { }
