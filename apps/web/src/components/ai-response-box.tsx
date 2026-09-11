'use client';

import React, { useState } from 'react';
import { Sparkles, Copy, Check, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIResponseBoxProps {
  response?: string;
  model?: string | null;
  isLoading?: boolean;
}

export function AIResponseBox({ response, model, isLoading }: AIResponseBoxProps) {
  const [copied, setCopied] = useState(false);

  const defaultPlaceholder =
    'AI response will appear here after transcription completes.';

  const handleCopy = () => {
    if (!response) return;
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl bg-slate-900/60 border border-slate-800 p-6 backdrop-blur-sm shadow-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-slate-200">AI Response</h3>
          {model && (
            <span className="text-[11px] font-mono bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full border border-violet-500/30">
              {model}
            </span>
          )}
        </div>

        {response && (
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
        {isLoading ? (
          <div className="flex flex-col items-center gap-2 py-4 text-violet-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm font-medium">Generating response...</span>
          </div>
        ) : response ? (
          <div className="w-full text-left">
            <ReactMarkdown
              components={{
                h1: ({ children, ...props }) => (
                  <h1 className="text-xl font-bold text-slate-100 mt-4 mb-2 first:mt-0" {...props}>
                    {children}
                  </h1>
                ),
                h2: ({ children, ...props }) => (
                  <h2 className="text-lg font-bold text-slate-100 mt-4 mb-2 first:mt-0" {...props}>
                    {children}
                  </h2>
                ),
                h3: ({ children, ...props }) => (
                  <h3 className="text-base font-semibold text-slate-100 mt-3 mb-1.5 first:mt-0" {...props}>
                    {children}
                  </h3>
                ),
                h4: ({ children, ...props }) => (
                  <h4 className="text-sm font-semibold text-slate-200 mt-2 mb-1 first:mt-0" {...props}>
                    {children}
                  </h4>
                ),
                p: ({ children, ...props }) => (
                  <p className="text-slate-200 text-[15px] leading-relaxed mb-3 last:mb-0" {...props}>
                    {children}
                  </p>
                ),
                strong: ({ children, ...props }) => (
                  <strong className="font-semibold text-slate-100" {...props}>
                    {children}
                  </strong>
                ),
                em: ({ children, ...props }) => (
                  <em className="italic text-slate-300" {...props}>
                    {children}
                  </em>
                ),
                ul: ({ children, ...props }) => (
                  <ul className="list-disc list-outside pl-5 mb-3 space-y-1 text-slate-200 text-[15px]" {...props}>
                    {children}
                  </ul>
                ),
                ol: ({ children, ...props }) => (
                  <ol className="list-decimal list-outside pl-5 mb-3 space-y-1 text-slate-200 text-[15px]" {...props}>
                    {children}
                  </ol>
                ),
                li: ({ children, ...props }) => (
                  <li className="leading-relaxed pl-1" {...props}>
                    {children}
                  </li>
                ),
                blockquote: ({ children, ...props }) => (
                  <blockquote className="border-l-2 border-violet-500/50 pl-3 my-2 italic text-slate-400 text-sm" {...props}>
                    {children}
                  </blockquote>
                ),
                pre: ({ children, ...props }) => (
                  <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 overflow-x-auto my-3 text-xs font-mono text-slate-200" {...props}>
                    {children}
                  </pre>
                ),
                code: ({ className, children, ...props }) => {
                  const isBlock = /language-/.test(className || '');
                  if (isBlock) {
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }
                  return (
                    <code className="bg-slate-800/80 text-violet-300 px-1.5 py-0.5 rounded text-xs font-mono border border-slate-700/50" {...props}>
                      {children}
                    </code>
                  );
                },
                a: ({ children, ...props }) => (
                  <a
                    className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                    {...props}
                  >
                    {children}
                  </a>
                ),
                hr: ({ ...props }) => <hr className="border-slate-800 my-4" {...props} />,
              }}
            >
              {response}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="text-center text-base leading-relaxed text-slate-500 italic">
            {defaultPlaceholder}
          </p>
        )}
      </div>
    </div>
  );
}
