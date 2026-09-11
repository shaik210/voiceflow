import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { AIInput, AIProvider, AIResponse } from '../ai.interface';

@Injectable()
export class OpenAIAIProvider implements AIProvider {
    private readonly openai: OpenAI;
    private readonly model: string;
    private readonly logger = new Logger(OpenAIAIProvider.name);

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || 'dummy_key',
        });

        this.model = process.env.OPENAI_AI_MODEL || 'gpt-4o-mini';
    }

    async generateResponse(input: AIInput): Promise<AIResponse> {
        try {
            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: `You are VoiceFlow, a helpful AI assistant.

Answer the user's request clearly and accurately.

If the user's transcript is unclear, make a reasonable interpretation,
but do not invent facts that are not supported by the user's request.

Prefer concise explanations unless the user asks for more detail.`,
                    },
                    {
                        role: 'user',
                        content: input.text,
                    },
                ],
            });

            const text = response.choices[0]?.message?.content?.trim();

            if (!text) {
                throw new Error('AI provider returned an empty response');
            }

            return {
                text,
                model: this.model,
            };
        } catch (error) {
            this.logger.error('Failed to generate AI response', error);

            throw new Error('Failed to generate AI response', {
                cause: error,
            });
        }
    }
}