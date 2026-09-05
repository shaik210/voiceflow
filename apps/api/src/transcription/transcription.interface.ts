export type TranscriptionInput = {
  audio: Buffer;
  filename: string;
  mimeType: string;
};

export type TranscriptionResult = {
  text: string;
};

export interface SpeechToTextProvider {
  transcribe(input: TranscriptionInput): Promise<TranscriptionResult>;
}
