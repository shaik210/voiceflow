import { Injectable, BadRequestException, PayloadTooLargeException, UnsupportedMediaTypeException, InternalServerErrorException } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { RecordingStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class RecordingsService {
  private readonly MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
  private readonly ALLOWED_MIME_TYPES: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/webm;codecs=opus': 'webm',
    'audio/mp4': 'mp4',
    'audio/ogg': 'ogg',
    'audio/ogg;codecs=opus': 'ogg',
    'audio/aac': 'aac',
    'audio/mpeg': 'mp3',
  };

  constructor(
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  async validateAndExtractMetadata(file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Audio file is required');
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new PayloadTooLargeException(`File size exceeds the limit of ${this.MAX_FILE_SIZE / (1024 * 1024)} MB`);
    }

    const mimeKey = Object.keys(this.ALLOWED_MIME_TYPES).find((mime) => file.mimetype.startsWith(mime));
    
    if (!mimeKey) {
      throw new UnsupportedMediaTypeException('Unsupported media type: ' + file.mimetype);
    }

    const extension = this.ALLOWED_MIME_TYPES[mimeKey];
    const recordingId = crypto.randomUUID();
    const objectKey = `recordings/${recordingId}/audio.${extension}`;

    // Upload to MinIO
    await this.storageService.upload({
      key: objectKey,
      body: file.buffer,
      mimeType: file.mimetype,
    });

    try {
      const recording = await this.prisma.recording.create({
        data: {
          id: recordingId,
          objectKey,
          mimeType: file.mimetype,
          size: file.size,
          originalName: file.originalname,
          status: RecordingStatus.READY,
        },
      });

      return {
        id: recording.id,
        mimeType: recording.mimeType,
        size: recording.size,
        status: recording.status,
        createdAt: recording.createdAt,
      };
    } catch {
      await this.storageService.delete(objectKey);
      throw new InternalServerErrorException('Failed to save recording metadata');
    }
  }
}
