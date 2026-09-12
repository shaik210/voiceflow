import {
  Injectable,
  Inject,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import {
  TextToSpeechProvider,
  TTS_PROVIDER,
  TTSInput,
  TTSResult,
} from './interfaces/tts-provider.interface';

@Injectable()
export class TTSService {
  private readonly logger = new Logger(TTSService.name);

  constructor(
    @Inject(TTS_PROVIDER)
    private readonly provider: TextToSpeechProvider,
  ) {}

  /**
   * Synthesize spoken audio from text using the configured TTS provider.
   */
  async synthesize(input: TTSInput): Promise<TTSResult> {
    if (!input || !input.text || !input.text.trim()) {
      throw new BadRequestException('Text cannot be empty or whitespace only');
    }

    this.logger.log(`Synthesizing text of length ${input.text.trim().length}`);
    return this.provider.synthesize({
      text: input.text.trim(),
      voice: input.voice,
    });
  }
}
