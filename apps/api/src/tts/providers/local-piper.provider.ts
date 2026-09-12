import {
  Injectable,
  Logger,
  BadRequestException,
  ServiceUnavailableException,
  InternalServerErrorException,
  BadGatewayException,
  GatewayTimeoutException,
} from '@nestjs/common';
import {
  TextToSpeechProvider,
  TTSInput,
  TTSResult,
} from '../interfaces/tts-provider.interface';

@Injectable()
export class LocalPiperProvider implements TextToSpeechProvider {
  private readonly logger = new Logger(LocalPiperProvider.name);
  private readonly url: string;
  private readonly defaultVoice: string;
  private readonly timeoutMs: number;

  constructor() {
    this.url = process.env.LOCAL_TTS_URL || 'http://localhost:8001';
    this.defaultVoice = process.env.TTS_MODEL || 'en_US-lessac-medium';
    this.timeoutMs = parseInt(process.env.TTS_TIMEOUT_MS || '15000', 10);
  }

  async synthesize(input: TTSInput): Promise<TTSResult> {
    if (!input || !input.text || !input.text.trim()) {
      throw new BadRequestException('Text cannot be empty or whitespace only');
    }

    const cleanText = input.text.trim();
    this.logger.log(`Synthesizing speech via local Piper worker: ${cleanText.length} characters`);

    try {
      const response = await fetch(`${this.url}/synthesize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: cleanText,
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (!response.ok) {
        this.logger.error(`Local Piper worker returned error status: ${response.status}`);
        
        let detail: string | undefined;
        try {
          const errData = (await response.json()) as { detail?: string };
          detail = errData.detail;
        } catch {
          // If response body is not JSON, ignore
        }

        if (response.status === 400 || response.status === 422) {
          throw new BadRequestException(detail || 'Invalid text for speech synthesis');
        }

        if (response.status === 503) {
          throw new ServiceUnavailableException(detail || 'Local TTS service is unavailable');
        }

        throw new InternalServerErrorException(detail || 'Failed to synthesize speech via local TTS service');
      }

      // Validate Content-Type header
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('audio/wav') && !contentType.includes('audio/x-wav')) {
        this.logger.error(`Unexpected Content-Type received from Piper worker: ${contentType}`);
        throw new BadGatewayException(`Unexpected content type from TTS service: ${contentType}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuffer);

      if (audioBuffer.length === 0) {
        throw new InternalServerErrorException('Local TTS service returned empty audio data');
      }

      this.logger.log(`Speech synthesized successfully: ${audioBuffer.length} bytes`);

      return {
        audio: audioBuffer,
        mimeType: 'audio/wav',
        voice: input.voice || this.defaultVoice,
        model: 'piper',
      };
    } catch (error: unknown) {
      if (
        error instanceof BadRequestException ||
        error instanceof ServiceUnavailableException ||
        error instanceof InternalServerErrorException ||
        error instanceof BadGatewayException
      ) {
        throw error;
      }

      const err = error as { name?: string; message?: string; cause?: { code?: string } };

      if (err.name === 'TimeoutError') {
        this.logger.error(`Local TTS synthesis timed out after ${this.timeoutMs}ms`);
        throw new GatewayTimeoutException('Local TTS service timed out');
      }

      if (err.cause?.code === 'ECONNREFUSED' || err.message?.includes('fetch failed')) {
        this.logger.error('Local TTS service connection refused');
        throw new ServiceUnavailableException('Local TTS service is unavailable');
      }

      this.logger.error('Failed to synthesize audio via local Piper worker', err.message);
      throw new InternalServerErrorException('Failed to synthesize speech');
    }
  }
}
