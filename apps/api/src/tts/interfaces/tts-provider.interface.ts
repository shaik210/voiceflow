export interface TTSInput {
  text: string;
  voice?: string;
}

export interface TTSResult {
  audio: Buffer;
  mimeType: string;
  voice: string;
  model: string;
  duration?: number;
}

export interface TextToSpeechProvider {
  synthesize(input: TTSInput): Promise<TTSResult>;
}

export const TTS_PROVIDER = 'TTS_PROVIDER';
