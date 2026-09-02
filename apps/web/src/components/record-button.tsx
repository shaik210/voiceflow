'use client';

import React, { useState } from 'react';
import { Mic, Square, Sparkles } from 'lucide-react';

interface RecordButtonProps {
  onSimulateRecord?: () => void;
}

export function RecordButton({ onSimulateRecord }: RecordButtonProps) {
  const [isRecording, setIsRecording] = useState(false);

  const handleClick = () => {
    setIsRecording(!isRecording);
    if (onSimulateRecord) {
      onSimulateRecord();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 my-8">
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

      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-slate-300">
          {isRecording ? (
            <span className="text-rose-400 font-semibold animate-pulse flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              Simulating recording...
            </span>
          ) : (
            'Click to start recording'
          )}
        </p>
        <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          Placeholder control for initial V1 setup
        </p>
      </div>
    </div>
  );
}
