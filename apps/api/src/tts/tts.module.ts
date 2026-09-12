import { Module } from '@nestjs/common';
import { TTSService } from './tts.service';
import { LocalPiperProvider } from './providers/local-piper.provider';
import { TTS_PROVIDER } from './interfaces/tts-provider.interface';

@Module({
  providers: [
    TTSService,
    LocalPiperProvider,
    {
      provide: TTS_PROVIDER,
      useFactory: (localPiperProvider: LocalPiperProvider) => {
        const provider = process.env.TTS_PROVIDER || 'local';
        if (provider === 'local') {
          return localPiperProvider;
        }
        return localPiperProvider;
      },
      inject: [LocalPiperProvider],
    },
  ],
  exports: [TTSService],
})
export class TTSModule {}
