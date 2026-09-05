import { Controller, Post, UseInterceptors, UploadedFile, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RecordingsService } from './recordings.service';
import { TranscriptionService } from '../transcription/transcription.service';

@Controller('recordings')
export class RecordingsController {
  constructor(
    private readonly recordingsService: RecordingsService,
    private readonly transcriptionService: TranscriptionService,
  ) {}

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
}
