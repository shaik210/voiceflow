import { Controller, Post, Get, Query, UseInterceptors, UploadedFile, HttpCode, HttpStatus, Param, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RecordingsService } from './recordings.service';
import { TranscriptionService } from '../transcription/transcription.service';
import { AIService } from '../ai/ai.service';

@Controller('recordings')
export class RecordingsController {
  constructor(
    private readonly recordingsService: RecordingsService,
    private readonly transcriptionService: TranscriptionService,
    private readonly aiService: AIService,

  ) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('audio'))
  async uploadRecording(@UploadedFile() file: Express.Multer.File) {
    const metadata = await this.recordingsService.validateAndExtractMetadata(file);

    return {
      success: true,
      recording: metadata,
    };
  }

  @Post(':id/transcribe')
  async transcribeRecording(@Param('id') id: string) {
    const transcription = await this.transcriptionService.transcribeRecording(id);

    return {
      success: true,
      transcription,
    };
  }

  @Get()
  async listRecordings(
    @Query('limit') limitStr?: string,
  ) {
    let limit = 20;
    if (limitStr !== undefined) {
      const parsed = parseInt(limitStr, 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 50) {
        throw new BadRequestException('Limit must be a number between 1 and 50');
      }
      limit = parsed;
    }

    const recordings = await this.recordingsService.listRecordings(limit);
    return { items: recordings };
  }

  @Get(':id')
  async getRecording(@Param('id') id: string) {
    const recording = await this.recordingsService.getRecording(id);
    return recording;
  }


  @Post(':id/ai-response')
  async generateAIResponse(@Param('id') id: string) {
    const response = await this.aiService.generateResponseForRecording(id);

    return {
      success: true,
      response,
    };
  }


}
