import { useState } from 'react';
import { transcribeRecording } from '@/lib/api/recordings';

export type TranscriptionState = 'idle' | 'transcribing' | 'completed' | 'error';

export function useTranscription(recordingId: string | undefined) {
  const [state, setState] = useState<TranscriptionState>('idle');
  const [transcriptionResult, setTranscriptionResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const transcribe = async () => {
    if (!recordingId) return;

    setState('transcribing');
    setError(null);

    try {
      const result = await transcribeRecording(recordingId);
      setTranscriptionResult(result.transcription);
      setState('completed');
    } catch (err: any) {
      setError(err.message || 'Failed to transcribe recording');
      setState('error');
    }
  };

  const resetTranscription = () => {
    setState('idle');
    setTranscriptionResult(null);
    setError(null);
  };

  return {
    transcriptionState: state,
    transcriptionResult,
    transcriptionError: error,
    transcribe,
    resetTranscription,
  };
}
