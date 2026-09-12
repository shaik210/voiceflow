import {
  Controller,
  Post,
  Get,
  Query,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  Param,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RecordingsService } from './recordings.service';
import { TranscriptionService } from '../transcription/transcription.service';
import { AIService } from '../ai/ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { RateLimit } from '../common/rate-limit/rate-limit.decorator';
import { RateLimitGuard } from '../common/rate-limit/rate-limit.guard';

@Controller('recordings')
@UseGuards(JwtAuthGuard, RateLimitGuard)
export class RecordingsController {
  constructor(
    private readonly recordingsService: RecordingsService,
    private readonly transcriptionService: TranscriptionService,
    private readonly aiService: AIService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({
    limit: 10,
    windowSeconds: 60,
    keyPrefix: 'upload',
  })
  @UseInterceptors(FileInterceptor('audio'))
  async uploadRecording(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const metadata = await this.recordingsService.validateAndExtractMetadata(file, user.id);

    return {
      success: true,
      recording: metadata,
    };
  }

  @Post(':id/transcribe')
  @RateLimit({
    limit: 5,
    windowSeconds: 60,
    keyPrefix: 'transcribe',
  })
  async transcribeRecording(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const transcription = await this.transcriptionService.transcribeRecording(id, user.id);

    return {
      success: true,
      transcription,
    };
  }

  @Get()
  @RateLimit({
    limit: 60,
    windowSeconds: 60,
    keyPrefix: 'recordings-list',
  })
  async listRecordings(
    @CurrentUser() user: AuthenticatedUser,
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

    const recordings = await this.recordingsService.listRecordings(user.id, limit);
    return { items: recordings };
  }

  @Get(':id')
  @RateLimit({
    limit: 60,
    windowSeconds: 60,
    keyPrefix: 'recordings-get',
  })
  async getRecording(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const recording = await this.recordingsService.getRecording(id, user.id);
    return recording;
  }

  @Post(':id/ai-response')
  @RateLimit({
    limit: 5,
    windowSeconds: 60,
    keyPrefix: 'ai-response',
  })
  async generateAIResponse(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const response = await this.aiService.generateResponseForRecording(id, user.id);

    return {
      success: true,
      response,
    };
  }
}
