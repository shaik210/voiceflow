'use client';

import React, { useState } from 'react';
import { AppHeader } from '@/components/app-header';
import { RecordButton } from '@/components/record-button';
import { TranscriptionBox } from '@/components/transcription-box';
import { Layers, Database, Cpu, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const [transcriptionText, setTranscriptionText] = useState<string | undefined>();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <AppHeader />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-center">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            VoiceFlow V1 Architecture Foundation
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-300">
            Turn your voice into text.
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Experience seamless speech-to-text intelligence. Powered by a high-performance monorepo with Node.js, Next.js, Prisma PostgreSQL, and Redis.
          </p>
        </div>

        {/* Interactive Placeholder Section */}
        <div className="w-full max-w-3xl space-y-6">
          <RecordButton onTranscriptionComplete={setTranscriptionText} />
          <TranscriptionBox transcription={transcriptionText} isSimulated={false} />
        </div>

        {/* System Architecture Overview Grid */}
        <div className="w-full max-w-3xl mt-16 pt-12 border-t border-slate-800/80">
          <h2 className="text-xs uppercase tracking-widest text-slate-500 text-center font-bold mb-8">
            System Stack & Architecture Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 space-y-2">
              <div className="flex items-center space-x-2 text-indigo-400">
                <Layers className="w-5 h-5" />
                <h3 className="font-semibold text-sm text-slate-200">Frontend App</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Next.js App Router with TypeScript & Tailwind CSS. Designed for real-time reactivity.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 space-y-2">
              <div className="flex items-center space-x-2 text-indigo-400">
                <Cpu className="w-5 h-5" />
                <h3 className="font-semibold text-sm text-slate-200">Express API</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                RESTful Node.js backend configured with modular routes, health checks, and middleware.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 space-y-2">
              <div className="flex items-center space-x-2 text-indigo-400">
                <Database className="w-5 h-5" />
                <h3 className="font-semibold text-sm text-slate-200">DB & Cache</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                PostgreSQL via Prisma ORM for relational persistence, paired with Dockerized Redis caching layer.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600">
        <p>VoiceFlow V1 Setup &copy; {new Date().getFullYear()} — Built for scalable voice-to-text intelligence</p>
      </footer>
    </div>
  );
}
