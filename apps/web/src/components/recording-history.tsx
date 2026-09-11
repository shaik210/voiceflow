'use client';

import React, { useState } from 'react';
import { useRecordingHistory, Recording } from '@/hooks/use-recording-history';
import { FileText, Clock, Calendar, RefreshCw, AlertCircle, ChevronRight, X, Sparkles } from 'lucide-react';

interface RecordingHistoryProps {
  refreshTrigger: number;
}

export function RecordingHistory({ refreshTrigger }: RecordingHistoryProps) {
  const { recordings, isLoading, error, refetch } = useRecordingHistory(20);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);

  // Re-fetch when refreshTrigger changes
  React.useEffect(() => {
    refetch();
  }, [refreshTrigger, refetch]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  const formatDuration = (duration: number | null) => {
    if (duration === null || isNaN(duration)) return 'Duration unavailable';
    const m = Math.floor(duration / 60);
    const s = Math.floor(duration % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const truncateText = (text: string, length: number = 60) => {
    if (text.length <= length) return text;
    return text.substring(0, length).trim() + '...';
  };

  if (isLoading && recordings.length === 0) {
    return (
      <div className="w-full mt-16 space-y-4">
        <h3 className="text-xl font-bold text-slate-200 border-b border-slate-800 pb-2">History</h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-900/50 rounded-xl border border-slate-800/50"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full mt-16 space-y-4">
        <h3 className="text-xl font-bold text-slate-200 border-b border-slate-800 pb-2">History</h3>
        <div className="flex flex-col items-center justify-center p-8 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
          <p className="text-sm font-medium text-red-400">{error}</p>
          <button
            onClick={refetch}
            className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-16 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <h3 className="text-xl font-bold text-slate-200">History</h3>
        <button
          onClick={refetch}
          className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {recordings.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-900/30 border border-slate-800/50 rounded-xl text-slate-500">
          <FileText className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-base font-medium text-slate-400">No recordings yet.</p>
          <p className="text-sm mt-1">Record your first voice note to see it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recordings.map((recording) => (
            <div
              key={recording.id}
              onClick={() => setSelectedRecording(recording)}
              className="group cursor-pointer p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 hover:bg-slate-800/60 hover:border-indigo-500/30 transition-all flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-slate-300 text-sm font-medium">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    <span>Recording • {formatDuration(recording.duration)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-500 text-xs">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(recording.createdAt)}</span>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="w-5 h-5 text-indigo-400" />
                </div>
              </div>

              <div className="mt-auto pt-3 border-t border-slate-800/60">
                {recording.transcription ? (
                  <p className="text-sm text-slate-300 italic line-clamp-2">
                    &quot;{truncateText(recording.transcription.text, 80)}&quot;
                  </p>
                ) : (
                  <div className="inline-block px-2 py-1 rounded bg-slate-800 text-slate-400 text-xs font-medium">
                    Not transcribed
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transcript Detail Modal / Overlay */}
      {selectedRecording && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
              <div>
                <h4 className="text-lg font-bold text-slate-200">Recording Details</h4>
                <p className="text-xs text-slate-500">{formatDate(selectedRecording.createdAt)}</p>
              </div>
              <button
                onClick={() => setSelectedRecording(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-6 space-y-2 text-sm text-slate-400 bg-slate-950 p-4 rounded-xl border border-slate-800/50">
                <p><span className="font-semibold text-slate-300">ID:</span> <span className="font-mono text-xs">{selectedRecording.id}</span></p>
                <p><span className="font-semibold text-slate-300">Format:</span> {selectedRecording.mimeType}</p>
                <p><span className="font-semibold text-slate-300">Duration:</span> {formatDuration(selectedRecording.duration)}</p>
              </div>

              <h5 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                Full Transcript
              </h5>
              
              {selectedRecording.transcription ? (
                <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl leading-relaxed text-slate-200 text-[15px] whitespace-pre-wrap">
                  {selectedRecording.transcription.text}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 italic bg-slate-800/10 border border-slate-700/30 rounded-xl">
                  No transcription available yet.
                </div>
              )}

              {selectedRecording.transcription?.aiResponse && (
                <div className="mt-6">
                  <h5 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    AI Response
                    {selectedRecording.transcription.aiResponse.model && (
                      <span className="text-[11px] font-mono font-normal normal-case bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full border border-violet-500/30 ml-2">
                        {selectedRecording.transcription.aiResponse.model}
                      </span>
                    )}
                  </h5>
                  <div className="p-4 bg-violet-950/20 border border-violet-800/30 rounded-xl leading-relaxed text-slate-200 text-[15px] whitespace-pre-wrap">
                    {selectedRecording.transcription.aiResponse.text}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
