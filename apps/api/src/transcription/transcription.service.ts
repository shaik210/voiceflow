import { Injectable, Logger, InternalServerErrorException, NotFoundException, Inject } from '@nestjs/common';
import { SpeechToTextProvider } from './transcription.interface';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TranscriptionService {
  private readonly logger = new Logger(TranscriptionService.name);

  constructor(
    @Inject('SpeechToTextProvider') private readonly provider: SpeechToTextProvider,
    private readonly storage: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  async transcribeRecording(recordingId: string) {
    const recording = await this.prisma.recording.findUnique({
      where: { id: recordingId },
      include: { transcription: true },
    });

    if (!recording) {
      throw new NotFoundException('Recording not found');
    }

    if (recording.transcription) {
      return recording.transcription;
    }

    let storageObject;
    try {
      storageObject = await this.storage.get(recording.objectKey);
    } catch {
      this.logger.error(`Failed to fetch audio for recording ${recordingId} from storage`);
      throw new InternalServerErrorException('Failed to retrieve recording audio');
    }

    let transcriptResult;
    try {
      const filename = recording.objectKey.split('/').pop() || 'audio.webm';
      transcriptResult = await this.provider.transcribe({
        audio: storageObject.body,
        filename,
        mimeType: storageObject.mimeType,
      });
    } catch {
      throw new InternalServerErrorException('Failed to transcribe recording');
    }

    if (!transcriptResult.text || transcriptResult.text.trim() === '') {
      throw new InternalServerErrorException('Transcription returned empty text');
    }

    const transcription = await this.prisma.transcription.create({
      data: {
        recordingId: recording.id,
        text: transcriptResult.text,
      },
    });

    return transcription;
  }
}
