'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAudioRecorder } from './use-audio-recorder';
import {
  uploadRecording,
  transcribeRecording,
  generateAIResponse,
  Transcription,
  AIResponse,
} from '@/lib/api/recordings';

export type PipelineStatus =
  | 'idle'
  | 'recording'
  | 'uploading'
  | 'transcribing'
  | 'generating'
  | 'success'
  | 'error';

export type PipelineErrorStage = 'recorder' | 'upload' | 'transcribe' | 'ai' | null;

export interface UseVoicePipelineOptions {
  onTranscriptionUpdate?: (text: string | undefined) => void;
  onAIResponseUpdate?: (aiResponse: AIResponse | undefined) => void;
  onPipelineComplete?: () => void;
  onStatusChange?: (status: PipelineStatus) => void;
}

export function useVoicePipeline(options?: UseVoicePipelineOptions) {
  const [status, setStatus] = useState<PipelineStatus>('idle');
  const [errorStage, setErrorStage] = useState<PipelineErrorStage>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<Transcription | null>(null);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [savedBlob, setSavedBlob] = useState<Blob | null>(null);

  // Guards against duplicate executions and race conditions
  const isBusyRef = useRef<boolean>(false);
  const processedBlobRef = useRef<Blob | null>(null);
  const recordingIdRef = useRef<string | null>(null);
  const transcriptionRef = useRef<Transcription | null>(null);
  const optionsRef = useRef<UseVoicePipelineOptions | undefined>(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  recordingIdRef.current = recordingId;
  transcriptionRef.current = transcription;

  const audioRecorder = useAudioRecorder();

  // Notify parent on status change
  const updateStatus = useCallback((newStatus: PipelineStatus) => {
    setStatus(newStatus);
    optionsRef.current?.onStatusChange?.(newStatus);
  }, []);

  // Stage 3: Generate AI response
  const executeAIStage = useCallback(async (recId: string) => {
    updateStatus('generating');
    setErrorStage(null);
    setErrorMessage(null);

    try {
      const ai = await generateAIResponse(recId);
      setAiResponse(ai);
      updateStatus('success');
      optionsRef.current?.onAIResponseUpdate?.(ai);
      optionsRef.current?.onPipelineComplete?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI response failed';
      setErrorStage('ai');
      setErrorMessage(msg);
      updateStatus('error');
    } finally {
      isBusyRef.current = false;
    }
  }, [updateStatus]);

  // Stage 2: Transcribe recording
  const executeTranscriptionStage = useCallback(async (recId: string) => {
    updateStatus('transcribing');
    setErrorStage(null);
    setErrorMessage(null);

    let trans: Transcription;
    try {
      trans = await transcribeRecording(recId);
      setTranscription(trans);
      transcriptionRef.current = trans;
      optionsRef.current?.onTranscriptionUpdate?.(trans.text);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Transcription failed';
      setErrorStage('transcribe');
      setErrorMessage(msg);
      updateStatus('error');
      isBusyRef.current = false;
      return;
    }

    // Automatically transition to Stage 3
    await executeAIStage(recId);
  }, [updateStatus, executeAIStage]);

  // Stage 1: Upload recording
  const executePipelineFromUpload = useCallback(async (blob: Blob) => {
    updateStatus('uploading');
    setErrorStage(null);
    setErrorMessage(null);

    let recId: string;
    try {
      const res = await uploadRecording(blob);
      recId = res.recording.id;
      setRecordingId(recId);
      recordingIdRef.current = recId;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setErrorStage('upload');
      setErrorMessage(msg);
      updateStatus('error');
      isBusyRef.current = false;
      return;
    }

    // Automatically transition to Stage 2
    await executeTranscriptionStage(recId);
  }, [updateStatus, executeTranscriptionStage]);

  // Triggered automatically when audioBlob is created after user stops recording
  useEffect(() => {
    if (audioRecorder.audioBlob && processedBlobRef.current !== audioRecorder.audioBlob) {
      if (isBusyRef.current) return;
      processedBlobRef.current = audioRecorder.audioBlob;
      isBusyRef.current = true;
      setSavedBlob(audioRecorder.audioBlob);
      executePipelineFromUpload(audioRecorder.audioBlob);
    }
  }, [audioRecorder.audioBlob, executePipelineFromUpload]);

  // Watch for audioRecorder microphone error
  useEffect(() => {
    if (audioRecorder.error) {
      setErrorStage('recorder');
      setErrorMessage(audioRecorder.error);
      updateStatus('error');
      isBusyRef.current = false;
    }
  }, [audioRecorder.error, updateStatus]);

  // Start recording
  const start = useCallback(async () => {
    if (isBusyRef.current) return;
    setErrorStage(null);
    setErrorMessage(null);
    setRecordingId(null);
    setTranscription(null);
    setAiResponse(null);
    setSavedBlob(null);
    processedBlobRef.current = null;
    recordingIdRef.current = null;
    transcriptionRef.current = null;
    optionsRef.current?.onTranscriptionUpdate?.(undefined);
    optionsRef.current?.onAIResponseUpdate?.(undefined);

    updateStatus('recording');
    await audioRecorder.startRecording();
  }, [audioRecorder, updateStatus]);

  // Stop recording
  const stop = useCallback(() => {
    if (audioRecorder.isRecording) {
      audioRecorder.stopRecording();
    }
  }, [audioRecorder]);

  // Independent retry for upload stage
  const retryUpload = useCallback(() => {
    if (isBusyRef.current || !savedBlob) return;
    isBusyRef.current = true;
    executePipelineFromUpload(savedBlob);
  }, [savedBlob, executePipelineFromUpload]);

  // Independent retry for transcription stage
  const retryTranscription = useCallback(() => {
    const id = recordingIdRef.current;
    if (isBusyRef.current || !id) return;
    isBusyRef.current = true;
    executeTranscriptionStage(id);
  }, [executeTranscriptionStage]);

  // Independent retry for AI generation stage
  const retryAI = useCallback(() => {
    const id = recordingIdRef.current;
    if (isBusyRef.current || !id) return;
    isBusyRef.current = true;
    executeAIStage(id);
  }, [executeAIStage]);

  // Generic retry based on current errorStage
  const retry = useCallback(() => {
    if (errorStage === 'upload') {
      retryUpload();
    } else if (errorStage === 'transcribe') {
      retryTranscription();
    } else if (errorStage === 'ai') {
      retryAI();
    }
  }, [errorStage, retryUpload, retryTranscription, retryAI]);

  // Reset entire pipeline back to idle
  const reset = useCallback(() => {
    isBusyRef.current = false;
    processedBlobRef.current = null;
    recordingIdRef.current = null;
    transcriptionRef.current = null;
    audioRecorder.resetRecording();

    setStatus('idle');
    setErrorStage(null);
    setErrorMessage(null);
    setRecordingId(null);
    setTranscription(null);
    setAiResponse(null);
    setSavedBlob(null);

    optionsRef.current?.onStatusChange?.('idle');
    optionsRef.current?.onTranscriptionUpdate?.(undefined);
    optionsRef.current?.onAIResponseUpdate?.(undefined);
  }, [audioRecorder]);

  return {
    status,
    isRecording: audioRecorder.isRecording,
    duration: audioRecorder.duration,
    recordingId,
    transcription,
    aiResponse,
    errorStage,
    errorMessage,
    startRecording: start,
    stopRecording: stop,
    retryUpload,
    retryTranscription,
    retryAI,
    retry,
    reset,
  };
}
