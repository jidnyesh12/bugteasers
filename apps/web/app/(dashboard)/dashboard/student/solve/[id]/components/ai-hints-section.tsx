"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Lightbulb, Loader2, AlertCircle, Clock } from "lucide-react";
import "katex/dist/katex.min.css";

interface AiHintsSectionProps {
  hints: string[];
  hintsRemaining: number;
  resetAt?: string;
  isGenerating: boolean;
  error: string | null;
  canGetMoreHints: boolean;
  onGenerateHint: () => void;
}

export function AiHintsSection({
  hints,
  hintsRemaining,
  resetAt,
  isGenerating,
  error,
  canGetMoreHints,
  onGenerateHint,
}: AiHintsSectionProps) {
  const [expandedHints, setExpandedHints] = useState<Set<number>>(new Set());

  const toggleHint = (index: number) => {
    setExpandedHints((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <Lightbulb className="w-5 h-5 text-white fill-white" />
          </div>
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            AI Hints
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
            {hintsRemaining} left
          </div>
        </div>
      </div>

      {/* Get Hint Button */}
      {canGetMoreHints && (
        <button
          onClick={onGenerateHint}
          disabled={isGenerating}
          className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing your code...
            </>
          ) : (
            <>
              <Lightbulb className="w-4 h-4" />
              Get AI Hint
            </>
          )}
        </button>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800 font-medium mb-1">
                Unable to generate AI hint
              </p>
              <p className="text-xs text-red-700">
                {error}
              </p>
              {resetAt && (
                <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Resets at: {new Date(resetAt).toLocaleString()}
                </p>
              )}
              <p className="text-xs text-red-700 mt-2 font-medium">
                💡 Try the Problem Hints below for general guidance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* No Hints Remaining */}
      {!canGetMoreHints && hints.length >= 3 && !error && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
          <p className="text-sm text-purple-800 font-medium mb-1">
            You've used all 3 AI hints for this problem
          </p>
          <p className="text-xs text-purple-700">
            Review your hints above or check the Problem Hints below for additional guidance.
          </p>
        </div>
      )}

      {/* Hints List */}
      {hints.length > 0 && (
        <div className="space-y-3">
          {hints.map((hint, index) => (
            <div
              key={index}
              className="rounded-xl border border-[var(--border-primary)] overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Hint Header */}
              <button
                onClick={() => toggleHint(index)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--bg-secondary)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    {index + 1}
                  </div>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">
                    Hint {index + 1}
                  </span>
                </div>
                <svg
                  className={`w-5 h-5 text-[var(--text-muted)] transition-transform ${
                    expandedHints.has(index) ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Hint Content */}
              {expandedHints.has(index) && (
                <div className="px-4 py-4 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 border-t border-[var(--border-primary)]">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        p: ({ children }) => (
                          <p className="text-sm text-[var(--text-primary)] leading-relaxed mb-2 last:mb-0">
                            {children}
                          </p>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold text-purple-700">
                            {children}
                          </strong>
                        ),
                        em: ({ children }) => (
                          <em className="italic text-[var(--text-secondary)]">
                            {children}
                          </em>
                        ),
                        code: ({ children }) => (
                          <code className="px-1.5 py-0.5 bg-white rounded text-xs font-mono text-purple-700 border border-purple-200">
                            {children}
                          </code>
                        ),
                      }}
                    >
                      {hint}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {hints.length === 0 && !isGenerating && !error && (
        <div className="text-center py-10 px-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <Lightbulb className="w-8 h-8 text-white fill-white" />
          </div>
          <p className="text-sm text-[var(--text-primary)] font-medium mb-2">
            Get personalized guidance for your code
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            AI will analyze your specific code and provide tailored hints based on your approach.
          </p>
        </div>
      )}

      {/* Info Box */}
      {hints.length > 0 && (
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-xs text-purple-800">
            <strong>🤖 Personalized Hints:</strong> These hints are generated specifically for your code and build on each other progressively.
          </p>
        </div>
      )}
    </div>
  );
}
