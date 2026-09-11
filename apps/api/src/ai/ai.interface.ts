export interface AIInput {
    text: string;
}

export interface AIResponse {
    text: string;
    model?: string;
}

export interface AIProvider {
    generateResponse(input: AIInput): Promise<AIResponse>;
}