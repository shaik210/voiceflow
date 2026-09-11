import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { AIInput, AIProvider, AIResponse } from '../ai.interface';

@Injectable()
export class LocalAIProvider implements AIProvider {
    private readonly logger = new Logger(LocalAIProvider.name);
    private readonly baseUrl =
        process.env.LOCAL_AI_URL || 'http://localhost:11434';
    private readonly model =
        process.env.LOCAL_AI_MODEL || 'qwen3:4b';

    async generateResponse(input: AIInput): Promise<AIResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
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
                    stream: false,
                    think: false,
                    options: {
                        num_predict: 256,
                    },
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();

                this.logger.error(
                    `Local AI request failed with status ${response.status}: ${errorText}`,
                );

                throw new Error('Local AI request failed');
            }

            const data = await response.json();

            const text = data?.message?.content?.trim();

            if (!text) {
                throw new Error('Local AI provider returned an empty response');
            }

            return {
                text,
                model: this.model,
            };
        } catch (error) {
            this.logger.error('Failed to generate response using local AI', error);

            if (error instanceof ServiceUnavailableException) {
                throw error;
            }

            throw new ServiceUnavailableException(
                'Local AI service is unavailable',
            );
        }
    }
}