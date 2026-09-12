import { getAccessToken } from './token';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface RecordingMetadata {
  id: string;
  mimeType: string;
  size: number;
  status: string;
  createdAt: string;
}

export interface Transcription {
  id: string;
  recordingId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIResponse {
  id: string;
  transcriptionId: string;
  text: string;
  model?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UploadRecordingResponse {
  success: boolean;
  recording: RecordingMetadata;
}

export interface TranscribeResponse {
  success: boolean;
  transcription: Transcription;
}

export interface GenerateAIResponsePayload {
  success: boolean;
  response: AIResponse;
}

function getAuthHeaders(): Record<string, string> {
  const token = getAccessToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function uploadRecording(blob: Blob, originalName: string = 'recording.webm'): Promise<UploadRecordingResponse> {
  const formData = new FormData();
  formData.append('audio', blob, originalName);

  const response = await fetch(`${API_URL}/api/recordings`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = 'Upload failed';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // If parsing fails, stick to default error
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function transcribeRecording(id: string): Promise<Transcription> {
  const response = await fetch(`${API_URL}/api/recordings/${id}/transcribe`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    let errorMessage = 'Transcription failed';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // If parsing fails, stick to default error
    }
    throw new Error(errorMessage);
  }

  const data: TranscribeResponse = await response.json();
  return data.transcription;
}

export async function generateAIResponse(id: string): Promise<AIResponse> {
  const response = await fetch(`${API_URL}/api/recordings/${id}/ai-response`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    let errorMessage = 'AI response failed';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // If parsing fails, stick to default error
    }
    throw new Error(errorMessage);
  }

  const data: GenerateAIResponsePayload = await response.json();
  return data.response;
}

export async function listRecordings(limit: number = 20) {
  const response = await fetch(`${API_URL}/api/recordings?limit=${limit}`, {
    method: 'GET',
    headers: getAuthHeaders(),
    cache: 'no-store', // ensures we don't get stale data on refresh
  });

  if (!response.ok) {
    throw new Error('Failed to fetch recordings');
  }

  return response.json();
}

export async function getRecording(id: string) {
  const response = await fetch(`${API_URL}/api/recordings/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
    cache: 'no-store',
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Recording not found');
    }
    throw new Error('Failed to fetch recording details');
  }

  return response.json();
}
