'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Lock, Mail, User as UserIcon, Loader2, AlertCircle } from 'lucide-react';

export function AuthCard() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }
        await register(email, password, name || undefined);
      } else {
        await login(email, password);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto my-8 p-8 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-2xl backdrop-blur-sm">
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-white">
          {isRegister ? 'Create an account' : 'Sign in to VoiceFlow'}
        </h2>
        <p className="text-sm text-slate-400">
          {isRegister
            ? 'Sign up to start recording and generating AI responses'
            : 'Access your private recordings and AI history'}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegister && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Name (optional)
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Email address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          {isRegister && (
            <p className="text-[11px] text-slate-500 mt-1">Must be at least 6 characters</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{isRegister ? 'Creating account...' : 'Signing in...'}</span>
            </>
          ) : (
            <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
        <button
          type="button"
          onClick={() => {
            setIsRegister(!isRegister);
            setError(null);
          }}
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          {isRegister
            ? 'Already have an account? Sign in'
            : "Don't have an account? Create one"}
        </button>
      </div>
    </div>
  );
}
