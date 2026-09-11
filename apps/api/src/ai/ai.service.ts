import {
    BadRequestException,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AIInput, AIProvider, AIResponse } from './ai.interface';

export const AI_PROVIDER = 'AI_PROVIDER';

@Injectable()
export class AIService {
    private readonly logger = new Logger(AIService.name);

    constructor(
        @Inject(AI_PROVIDER)
        private readonly provider: AIProvider,
        private readonly prisma: PrismaService,
    ) { }

    async generateResponse(input: AIInput): Promise<AIResponse> {
        if (!input.text?.trim()) {
            throw new BadRequestException('AI input text cannot be empty');
        }

        return this.provider.generateResponse({
            text: input.text.trim(),
        });
    }

    async generateResponseForRecording(recordingId: string) {
        const recording = await this.prisma.recording.findUnique({
            where: { id: recordingId },
            include: {
                transcription: {
                    include: {
                        aiResponse: true,
                    },
                },
            },
        });

        if (!recording) {
            throw new NotFoundException('Recording not found');
        }

        if (!recording.transcription) {
            throw new BadRequestException(
                'Recording must be transcribed before generating an AI response',
            );
        }

        const existingResponse = recording.transcription.aiResponse;

        if (existingResponse) {
            return existingResponse;
        }

        const transcriptionId = recording.transcription.id;

        this.logger.log(
            `Generating AI response for recording ${recordingId}, transcription ${transcriptionId}`,
        );

        const response = await this.generateResponse({
            text: recording.transcription.text,
        });

        try {
            return await this.prisma.aIResponse.create({
                data: {
                    transcriptionId,
                    text: response.text,
                    model: response.model ?? null,
                },
            });
        } catch (error) {
            // Another request may have generated the response concurrently.
            if (
                error instanceof Error &&
                'code' in error &&
                error.code === 'P2002'
            ) {
                const existing = await this.prisma.aIResponse.findUnique({
                    where: { transcriptionId },
                });

                if (existing) {
                    return existing;
                }
            }

            throw error;
        }
    }
}