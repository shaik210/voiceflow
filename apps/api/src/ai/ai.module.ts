import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AI_PROVIDER, AIService } from './ai.service';
import { LocalAIProvider } from './providers/local-ai.provider';
import { OpenAIAIProvider } from './providers/openai-ai.provider';

@Module({
    imports: [PrismaModule],
    providers: [
        AIService,
        OpenAIAIProvider,
        LocalAIProvider,
        {
            provide: AI_PROVIDER,
            useFactory: (
                openAIProvider: OpenAIAIProvider,
                localAIProvider: LocalAIProvider,
            ) => {
                return process.env.AI_PROVIDER === 'openai'
                    ? openAIProvider
                    : localAIProvider;
            },
            inject: [OpenAIAIProvider, LocalAIProvider],
        },
    ],
    exports: [AIService],
})
export class AiModule { }