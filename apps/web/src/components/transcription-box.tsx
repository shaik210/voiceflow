'use client';

import React from 'react';
import { FileText, Copy, Check } from 'lucide-react';

interface TranscriptionBoxProps {
  transcription?: string;
  isSimulated?: boolean;
}

export function TranscriptionBox({ transcription, isSimulated }: TranscriptionBoxProps) {
  const [copied, setCopied] = React.useState(false);

  const defaultPlaceholder =
    'Your audio transcription will appear here. Press the record button above to get started with VoiceFlow.';

  const displayText = transcription || defaultPlaceholder;

  const handleCopy = () => {
    if (!displayText) return;
    navigator.clipboard.writeText(displayText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl bg-slate-900/60 border border-slate-800 p-6 backdrop-blur-sm shadow-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-200">Transcription Result</h3>
          {isSimulated && (
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
              Demo Output
            </span>
          )}
        </div>

        {transcription && (
          <button
            onClick={handleCopy}
            type="button"
            className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700/50 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="min-h-[140px] flex items-center justify-center p-4 rounded-xl bg-slate-950/40 border border-slate-800/40">
        <p className={`text-center text-base leading-relaxed ${transcription ? 'text-slate-100 font-medium' : 'text-slate-500 italic'}`}>
          {displayText}
        </p>
      </div>
    </div>
  );
}
