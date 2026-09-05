'use client';

import React, { useEffect } from 'react';
import { Mic, Square, AlertCircle, RefreshCw, UploadCloud, CheckCircle2, FileText, Loader2 } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { useRecordingUpload } from '@/hooks/use-recording-upload';
import { useTranscription } from '@/hooks/use-transcription';

interface RecordButtonProps {
  onTranscriptionComplete?: (text: string | undefined) => void;
}

export function RecordButton({ onTranscriptionComplete }: RecordButtonProps = {}) {
  const {
    isRecording,
    duration,
    audioBlob,
    error: recorderError,
    startRecording,
    stopRecording,
    resetRecording,
    mimeType
  } = useAudioRecorder();

  const {
    isUploading,
    isUploaded,
    uploadError,
    uploadedMetadata,
    upload,
    resetUpload
  } = useRecordingUpload();

  const {
    transcriptionState,
    transcriptionResult,
    transcriptionError,
    transcribe,
    resetTranscription,
  } = useTranscription(uploadedMetadata?.id);

  useEffect(() => {
    if (onTranscriptionComplete) {
      onTranscriptionComplete(transcriptionResult?.text);
    }
  }, [transcriptionResult, onTranscriptionComplete]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleReset = () => {
    resetRecording();
    resetUpload();
    resetTranscription();
    if (onTranscriptionComplete) {
      onTranscriptionComplete(undefined);
    }
  };

  useEffect(() => {
    if (audioBlob && !isUploading && !isUploaded && !uploadError) {
      upload(audioBlob);
    }
  }, [audioBlob, upload, isUploading, isUploaded, uploadError]);

  // Recorder Error state
  if (recorderError) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 my-8 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl max-w-md w-full">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <p className="text-sm font-medium text-red-400 text-center">{recorderError}</p>
        <button
          onClick={handleReset}
          className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Upload Error state
  if (uploadError && audioBlob) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 my-8 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl max-w-md w-full">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <p className="text-sm font-medium text-red-400 text-center">{uploadError}</p>
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => upload(audioBlob)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Retry
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm transition-colors"
          >
            Record Again
          </button>
        </div>
      </div>
    );
  }

  // Uploading state
  if (isUploading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 my-8 p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl max-w-md w-full">
        <UploadCloud className="w-10 h-10 text-indigo-400 animate-bounce" />
        <h3 className="text-lg font-semibold text-indigo-300">Uploading...</h3>
        <p className="text-sm text-slate-400">Please wait while your audio is uploaded.</p>
      </div>
    );
  }

  // Completed / Uploaded state
  if (isUploaded && uploadedMetadata) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 my-8 p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl max-w-md w-full">
        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-emerald-400">Upload successful</h3>
          <div className="text-sm text-slate-400 space-y-1 mt-2">
            <p>Recording ID: <span className="font-mono text-slate-300">{uploadedMetadata.id}</span></p>
            <p>Type: {uploadedMetadata.mimeType}</p>
            <p>Size: {formatSize(uploadedMetadata.size)}</p>
            <p>Status: <span className="text-emerald-400 font-medium">{uploadedMetadata.status}</span></p>
          </div>
        </div>

        <div className="w-full h-px bg-slate-800 my-2" />

        {transcriptionState === 'idle' && (
          <button
            onClick={transcribe}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-violet-500/25 w-full justify-center"
          >
            <FileText className="w-4 h-4" />
            Transcribe
          </button>
        )}

        {transcriptionState === 'transcribing' && (
          <div className="flex flex-col items-center gap-2 py-4 text-violet-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm font-medium">Transcribing...</span>
          </div>
        )}

        {transcriptionState === 'error' && (
          <div className="flex flex-col items-center gap-2 w-full p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-sm font-medium text-red-400 text-center">{transcriptionError}</p>
            <button
              onClick={transcribe}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm transition-colors mt-2"
            >
              Retry Transcription
            </button>
          </div>
        )}

        <button
          onClick={handleReset}
          className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors w-full justify-center"
        >
          <RefreshCw className="w-4 h-4" />
          Record Again
        </button>
      </div>
    );
  }

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
