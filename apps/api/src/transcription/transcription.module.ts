import { Module } from '@nestjs/common';
import { TranscriptionService } from './transcription.service';
import { OpenAITranscriptionProvider } from './providers/openai-transcription.provider';
import { LocalTranscriptionProvider } from './providers/local-transcription.provider';
import { StorageModule } from '../storage/storage.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [StorageModule, PrismaModule],
  providers: [
    TranscriptionService,
    OpenAITranscriptionProvider,
    LocalTranscriptionProvider,
    {
      provide: 'SpeechToTextProvider',
      useFactory: (
        localProvider: LocalTranscriptionProvider,
        openAiProvider: OpenAITranscriptionProvider,
      ) => {
        const provider = process.env.TRANSCRIPTION_PROVIDER || 'local';
        return provider === 'openai' ? openAiProvider : localProvider;
      },
      inject: [LocalTranscriptionProvider, OpenAITranscriptionProvider],
    },
  ],
  exports: [TranscriptionService],
})
export class TranscriptionModule {}
