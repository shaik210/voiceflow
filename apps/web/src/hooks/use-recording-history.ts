import { useState, useEffect, useCallback } from 'react';
import { listRecordings } from '@/lib/api/recordings';

export interface AIResponse {
  id: string;
  transcriptionId: string;
  text: string;
  model?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Transcription {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  aiResponse?: AIResponse | null;
}

export interface Recording {
  id: string;
  mimeType: string;
  size: number;
  originalName: string | null;
  duration: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  transcription: Transcription | null;
}

export function useRecordingHistory(limit: number = 20) {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecordings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listRecordings(limit);
      setRecordings(data.items);
    } catch (err: any) {
      setError(err.message || 'Unable to load recording history.');
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  return {
    recordings,
    isLoading,
    error,
    refetch: fetchRecordings,
  };
}
