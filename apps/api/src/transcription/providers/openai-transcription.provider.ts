import { Injectable, Logger } from '@nestjs/common';
import { SpeechToTextProvider, TranscriptionInput, TranscriptionResult } from '../transcription.interface';
import OpenAI, { toFile } from 'openai';

@Injectable()
export class OpenAITranscriptionProvider implements SpeechToTextProvider {
  private readonly openai: OpenAI;
  private readonly model: string;
  private readonly logger = new Logger(OpenAITranscriptionProvider.name);

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy_key',
    });
    this.model = process.env.OPENAI_TRANSCRIPTION_MODEL || 'whisper-1';
  }

  async transcribe(input: TranscriptionInput): Promise<TranscriptionResult> {
    try {
      const file = await toFile(input.audio, input.filename, { type: input.mimeType });
      
      const response = await this.openai.audio.transcriptions.create({
        file: file,
        model: this.model,
      });

      return {
        text: response.text,
      };
    } catch (error) {
      this.logger.error('Failed to transcribe audio via OpenAI', error);
      throw new Error('Failed to transcribe recording', { cause: error });
    }
  }
}
