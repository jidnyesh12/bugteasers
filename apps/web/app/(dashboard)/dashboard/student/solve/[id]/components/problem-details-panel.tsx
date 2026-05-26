"use client";

import { useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import type { Problem } from "../solve-types";
import type { ProblemSubmissionDisplayItem } from "@/lib/submissions/view-types";
import type { ExecutionPanelResult } from "../hooks/use-problem-execution";
import { SubmissionsTabContent } from "./submissions-tab-content";
import { AiHintsSection } from "./ai-hints-section";

const difficultyColor = {
  easy: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  medium: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  hard: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

interface ProblemDetailsPanelProps {
  problem: Problem;
  onBack: () => void;
  submissions: ProblemSubmissionDisplayItem[];
  isSubmissionsLoading: boolean;
  submissionsError: string | null;
  onRetrySubmissions: () => void;
  onLoadSubmissionCode: (submission: ProblemSubmissionDisplayItem) => void;
  // AI Hints props
  aiHints: string[];
  hintsRemaining: number;
  resetAt?: string;
  isGeneratingHint: boolean;
  hintError: string | null;
  onGenerateHint: () => void;
}

export function ProblemDetailsPanel({
  problem,
  onBack,
  submissions,
  isSubmissionsLoading,
  submissionsError,
  onRetrySubmissions,
  onLoadSubmissionCode,
  aiHints,
  hintsRemaining,
  resetAt,
  isGeneratingHint,
  hintError,
  onGenerateHint,
}: ProblemDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState<
    "description" | "hints" | "submissions"
  >("description");
  const [revealedHints, setRevealedHints] = useState<number[]>([]);

  const dc = difficultyColor[problem.difficulty] || difficultyColor.easy;

  const revealHint = (index: number) => {
    setRevealedHints((previous) =>
      previous.includes(index) ? previous : [...previous, index],
    );
  };

  return (
    <div className="w-full lg:w-[var(--solve-left-pane-width)] lg:shrink-0 h-full flex flex-col border-r border-[var(--border-primary)] lg:border-r-0 bg-white overflow-hidden">
      <div className="flex items-center gap-0 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] px-2 shrink-0">
        <button
          onClick={() => setActiveTab("description")}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors relative cursor-pointer ${
            activeTab === "description"
              ? "text-[var(--accent-primary)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          Description
          {activeTab === "description" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-primary)]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("hints")}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors relative cursor-pointer ${
            activeTab === "hints"
              ? "text-[var(--accent-primary)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          Hints
          {activeTab === "hints" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-primary)]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("submissions")}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors relative cursor-pointer ${
            activeTab === "submissions"
              ? "text-[var(--accent-primary)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          Submissions
          {activeTab === "submissions" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-primary)]" />
          )}
        </button>
        <div className="ml-auto pr-2">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === "description" && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-xl font-black text-[var(--text-primary)]">
                {problem.title}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${dc.bg} ${dc.text} ${dc.border} border`}
              >
                {problem.difficulty}
              </span>
              <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] ml-auto">
                {problem.time_limit && (
                  <span>Time: {problem.time_limit}ms</span>
                )}
                {problem.memory_limit && (
                  <span>Mem: {problem.memory_limit}MB</span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-6">
              {problem.tags?.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded border border-[var(--border-primary)]"
                >
                  {tag}
                </span>
              ))}
            </div>

            <MarkdownRenderer content={problem.description} />

            {problem.examples && problem.examples.length > 0 && (
              <div className="mt-8 space-y-6">
                {problem.examples.map((example, index) => (
                  <div
                    key={index}
                    className="rounded-md border border-[var(--border-primary)] overflow-hidden text-sm"
                  >
                    <div className="grid grid-cols-2 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)]">
                      <div className="px-4 py-2 font-bold text-[var(--text-primary)] border-r border-[var(--border-primary)]">
                        Input
                      </div>
                      <div className="px-4 py-2 font-bold text-[var(--text-primary)]">
                        Output
                      </div>
                    </div>
                    <div className="grid grid-cols-2">
                      <div className="p-4 font-mono whitespace-pre-wrap text-[var(--text-secondary)] border-r border-[var(--border-primary)]">
                        {example.input}
                      </div>
                      <div className="p-4 font-mono whitespace-pre-wrap text-[var(--text-secondary)]">
                        {example.output}
                      </div>
                    </div>
                    {example.explanation && (
                      <>
                        <div className="bg-[var(--bg-secondary)] px-4 py-2 border-y border-[var(--border-primary)] font-bold text-[var(--text-primary)]">
                          Explanation
                        </div>
                        <div className="p-4 bg-[var(--bg-secondary)]/10">
                          <MarkdownRenderer
                            content={example.explanation}
                            className="text-[var(--text-secondary)]"
                          />
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "hints" && (
          <div className="space-y-6">
            {/* Static Hints Section (Primary) */}
            {problem.hints && problem.hints.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    Problem Hints
                  </h3>
                </div>

                {/* Static hints list */}
                <div className="space-y-3">
                  {problem.hints.map((hint, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-[var(--border-primary)] overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      {revealedHints.includes(index) ? (
                        <div className="p-4 bg-amber-50/50">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                              {index + 1}
                            </div>
                            <p className="text-xs font-bold text-amber-700">
                              Hint {index + 1}
                            </p>
                          </div>
                          <MarkdownRenderer
                            content={hint}
                            className="text-sm text-[var(--text-secondary)]"
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => revealHint(index)}
                          className="w-full p-4 text-left hover:bg-[var(--bg-secondary)] transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                              {index + 1}
                            </div>
                            <span className="text-sm font-semibold text-[var(--text-primary)]">
                              Hint {index + 1}
                            </span>
                          </div>
                          <span className="text-xs text-amber-600 font-bold px-2.5 py-1 bg-amber-50 rounded-full">
                            Reveal
                          </span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 px-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-sm text-[var(--text-muted)]">
                  No problem hints available for this problem.
                </p>
              </div>
            )}

            {/* Divider with "Need More Help?" */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border-primary)]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 py-1.5 text-xs font-semibold text-purple-700 uppercase tracking-wider rounded-full border-2 border-purple-200 bg-purple-50">
                  💡 Need More Help?
                </span>
              </div>
            </div>

            {/* AI Hints Section (Secondary/On-Demand) */}
            <AiHintsSection
              hints={aiHints}
              hintsRemaining={hintsRemaining}
              resetAt={resetAt}
              isGenerating={isGeneratingHint}
              error={hintError}
              canGetMoreHints={hintsRemaining > 0}
              onGenerateHint={onGenerateHint}
            />
          </div>
        )}

        {activeTab === "submissions" && (
          <SubmissionsTabContent
            submissions={submissions}
            isLoading={isSubmissionsLoading}
            error={submissionsError}
            onRetry={onRetrySubmissions}
            onLoadSubmissionCode={onLoadSubmissionCode}
          />
        )}
      </div>
    </div>
  );
}
