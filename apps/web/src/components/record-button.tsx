'use client';

import React from 'react';
import { Mic, Square, AlertCircle, RefreshCw, UploadCloud, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { useVoicePipeline, PipelineStatus } from '@/hooks/use-voice-pipeline';
import { AIResponse } from '@/lib/api/recordings';

interface RecordButtonProps {
  onTranscriptionComplete?: (text: string | undefined) => void;
  onUploadComplete?: () => void;
  onAIResponseComplete?: (aiResponse: AIResponse | undefined) => void;
  onPipelineComplete?: () => void;
  onStatusChange?: (status: PipelineStatus) => void;
}

export function RecordButton({
  onTranscriptionComplete,
  onUploadComplete,
  onAIResponseComplete,
  onPipelineComplete,
  onStatusChange,
}: RecordButtonProps = {}) {
  const {
    status,
    isRecording,
    duration,
    errorStage,
    errorMessage,
    startRecording,
    stopRecording,
    retryUpload,
    retryTranscription,
    retryAI,
    reset,
  } = useVoicePipeline({
    onTranscriptionUpdate: onTranscriptionComplete,
    onAIResponseUpdate: onAIResponseComplete,
    onPipelineComplete: () => {
      onUploadComplete?.();
      onPipelineComplete?.();
    },
    onStatusChange,
  });

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else if (status === 'idle') {
      startRecording();
    }
  };

  // Uploading state
  if (status === 'uploading') {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 my-8 p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl max-w-md w-full">
        <UploadCloud className="w-10 h-10 text-indigo-400 animate-bounce" />
        <h3 className="text-lg font-semibold text-indigo-300">Uploading...</h3>
        <p className="text-sm text-slate-400">Please wait while your audio is uploaded.</p>
      </div>
    );
  }

  // Transcribing state
  if (status === 'transcribing') {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 my-8 p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl max-w-md w-full">
        <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
        <h3 className="text-lg font-semibold text-violet-300">Transcribing...</h3>
        <p className="text-sm text-slate-400">Converting speech to text.</p>
      </div>
    );
  }

  // Generating AI response state
  if (status === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 my-8 p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl max-w-md w-full">
        <Sparkles className="w-10 h-10 text-violet-400 animate-pulse" />
        <h3 className="text-lg font-semibold text-violet-300">Generating response...</h3>
        <p className="text-sm text-slate-400">Thinking and generating an AI response.</p>
      </div>
    );
  }

  // Completed / Success state
  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 my-8 p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl max-w-md w-full">
        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        <h3 className="text-lg font-semibold text-emerald-400">Success</h3>
        <p className="text-sm text-slate-400">Voice processed and response generated.</p>
        <button
          onClick={reset}
          className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Record Again
        </button>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 my-8 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl max-w-md w-full">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <h3 className="text-lg font-semibold text-red-400">
          {errorStage === 'upload' && 'Upload failed'}
          {errorStage === 'transcribe' && 'Transcription failed'}
          {errorStage === 'ai' && 'AI response failed'}
          {errorStage === 'recorder' && 'Recording failed'}
          {!errorStage && 'Error'}
        </h3>
        <p className="text-sm font-medium text-red-400/90 text-center">{errorMessage || 'An error occurred.'}</p>
        <div className="flex items-center gap-3 mt-4">
          {errorStage === 'upload' && (
            <button
              onClick={retryUpload}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Retry
            </button>
          )}
          {errorStage === 'transcribe' && (
            <button
              onClick={retryTranscription}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Retry transcription
            </button>
          )}
          {errorStage === 'ai' && (
            <button
              onClick={retryAI}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Retry AI response
            </button>
          )}
          <button
            onClick={reset}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm transition-colors"
          >
            {errorStage === 'recorder' ? 'Try Again' : 'Record Again'}
          </button>
        </div>
      </div>
    );
  }

  // Idle and Recording states
  return (
    <div className="flex flex-col items-center justify-center space-y-6 my-8">
      <div className="relative group">
        {/* Pulsing glow effect when recording */}
        {isRecording && (
          <>
            <div className="absolute -inset-1 rounded-full bg-rose-500/50 blur-lg animate-pulse" />
            <div className="absolute -inset-3 rounded-full bg-rose-500/20 blur-xl animate-ping" />
          </>
        )}

        <button
          id="record-button"
          onClick={handleClick}
          type="button"
          className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 transform active:scale-95 shadow-xl ${
            isRecording
              ? 'bg-gradient-to-tr from-rose-600 to-red-500 text-white ring-4 ring-rose-500/30'
              : 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 hover:shadow-indigo-500/25 ring-4 ring-indigo-500/20'
          }`}
          aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
        >
          {isRecording ? (
            <Square className="w-8 h-8 fill-current" />
          ) : (
            <Mic className="w-10 h-10" />
          )}
        </button>
      </div>

      <div className="text-center space-y-1 min-h-[3rem]">
        {isRecording ? (
          <div className="flex flex-col items-center gap-2">
            <span className="text-rose-400 font-semibold animate-pulse flex items-center justify-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              Recording
            </span>
            <span className="text-2xl font-mono tracking-wider text-slate-200">
              {formatTime(duration)}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm font-medium text-slate-300">
              🎙 Start Recording
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
