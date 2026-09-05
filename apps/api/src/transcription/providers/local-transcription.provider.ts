import { Injectable, Logger, ServiceUnavailableException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { SpeechToTextProvider, TranscriptionInput, TranscriptionResult } from '../transcription.interface';

@Injectable()
export class LocalTranscriptionProvider implements SpeechToTextProvider {
  private readonly logger = new Logger(LocalTranscriptionProvider.name);
  private readonly url: string;

  constructor() {
    this.url = process.env.LOCAL_TRANSCRIPTION_URL || 'http://localhost:8000';
  }

  async transcribe(input: TranscriptionInput): Promise<TranscriptionResult> {
    this.logger.log(`Starting local transcription for file: ${input.filename}`);
    
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(input.audio)], { type: input.mimeType });
    formData.append('audio', blob, input.filename);

    try {
      const response = await fetch(`${this.url}/transcribe`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        this.logger.error(`Local transcription failed with status: ${response.status}`);
        if (response.status === 400 || response.status === 422) {
          throw new BadRequestException('Invalid audio for local transcription');
        }
        throw new InternalServerErrorException('Failed to transcribe recording');
      }

      const data = await response.json();
      
      this.logger.log('Local transcription completed');
      
      return {
        text: data.text,
      };
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      
      this.logger.error('Failed to transcribe audio via local worker', error);
      
      if (error.cause?.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
        throw new ServiceUnavailableException('Local transcription service is unavailable');
      }
      
      throw new InternalServerErrorException('Failed to transcribe recording');
    }
  }
}
