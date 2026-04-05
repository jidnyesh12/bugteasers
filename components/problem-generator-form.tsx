'use client';

import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  GeneratedProblem,
} from '@/lib/ai/types';
import { useGenerationState } from '@/components/use-generation-state';
import {
  generateProblems,
  stopGenerationJob,
  clearStuckGenerationJobs,
  type GenerateProblemsInput,
} from '@/lib/api/problems-client';
import { EXECUTION_LANGUAGE_LABELS, SUPPORTED_EXECUTION_LANGUAGES } from '@/lib/execution/languages';
import type { SupportedLanguage } from '@/lib/execution/types';

interface ProblemGeneratorFormProps {
  onGenerate: (problems: GeneratedProblem[]) => void;
  isLoading: boolean;
  onGenerationStart?: () => void;
  onGenerationFinish?: () => void;
}

const INPUT_CLASS =
  'w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-primary)] bg-white text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/15 focus:border-[var(--accent-primary)] hover:border-[var(--border-secondary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const LABEL_CLASS = 'block text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)] mb-1.5';



function getStageLabel(stage: string): string {
  switch (stage) {
    case 'ai_generating': return 'AI Generation';
    case 'validating': return 'Validation';
    default: return stage;
  }
}

function getStageBadgeColor(stage: string): string {
  switch (stage) {
    case 'ai_generating': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'validating': return 'bg-purple-50 text-purple-700 border-purple-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

export default function ProblemGeneratorForm({
  onGenerate,
  isLoading: externalLoading,
  onGenerationStart,
  onGenerationFinish,
}: ProblemGeneratorFormProps) {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [tags, setTags] = useState('');
  const [constraints, setConstraints] = useState('');
  const [numProblems, setNumProblems] = useState(1);
  const [languages, setLanguages] = useState<SupportedLanguage[]>([...SUPPORTED_EXECUTION_LANGUAGES]);
  const [isClearing, setIsClearing] = useState(false);

  const {
    phase,
    retryCount,
    maxRetries,
    retryHistory,
    showRetryHistory,
    currentJobId,
    backendStatus,
    isStopping,
    error,
    displayError,
    generationStatusMessage,
    cooldownSeconds,
    setPhase,
    setShowRetryHistory,
    setIsStopping,
    setError,
    setGenerationStatusMessage,
    updateFromStatus,
    resetState,
    isRetrying,
  } = useGenerationState();

  const { mutateAsync: generateProblemsAsync, isPending: internalLoading } = useMutation({
    mutationFn: (input: GenerateProblemsInput) =>
      generateProblems(input, {
        onStatus: (status) => {
          updateFromStatus(status);
        },
      }),
  });
  const isLoading = externalLoading || internalLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();
    if (!topic.trim()) { setError('Please enter a topic'); return; }

    try {
      onGenerationStart?.();
      setPhase('generating');
      setGenerationStatusMessage('Generation request queued. Preparing your problem draft...');
      const problems = await generateProblemsAsync({
        topic: topic.trim(),
        difficulty,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        constraints: constraints.trim() || undefined,
        numProblems,
        languages,
      });
      setGenerationStatusMessage('Validation complete. Opening preview...');
      setError('');
      setPhase('idle');
      onGenerate(problems);
    } catch (err) {
      const rawMsg = err instanceof Error ? err.message : 'An error occurred';
      setError(rawMsg);
      setGenerationStatusMessage('');

      // Determine if stopped or exhausted
      if (rawMsg.includes('stopped by the user')) {
        setPhase('stopped');
      } else if (retryCount > 0 && retryCount >= maxRetries) {
        setPhase('exhausted');
      } else {
        setPhase('error');
      }
    } finally {
      setIsStopping(false);
      onGenerationFinish?.();
    }
  };

  const handleStop = useCallback(async () => {
    if (!currentJobId || isStopping) return;

    setIsStopping(true);
    try {
      await stopGenerationJob(currentJobId);
      // The polling loop will pick up the error status and throw
    } catch {
      setIsStopping(false);
      // If stop fails, the polling will still eventually time out
      console.error('[STOP] Failed to stop generation job');
    }
  }, [currentJobId, isStopping, setIsStopping]);

  const handleClearStuckJobs = async () => {
    setIsClearing(true);
    try {
      await clearStuckGenerationJobs();
      resetState();
      setPhase('idle');
    } catch (err) {
      const rawMsg = err instanceof Error ? err.message : 'An error occurred while clearing jobs';
      setError(rawMsg);
    } finally {
      setIsClearing(false);
    }
  };

  const difficultyOptions: { value: 'easy' | 'medium' | 'hard'; label: string; color: string }[] = [
    { value: 'easy', label: 'Easy', color: '#1DB97A' },
    { value: 'medium', label: 'Medium', color: '#F39C12' },
    { value: 'hard', label: 'Hard', color: '#E74C3C' },
  ];

  const toggleLanguage = (lang: SupportedLanguage) => {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const allLanguages = SUPPORTED_EXECUTION_LANGUAGES;

  const showStopButton = isLoading;
  const hasRetryHistory = retryHistory.length > 0;

  // Compute error category summary for exhausted state
  const errorCategorySummary = retryHistory.reduce((acc, entry) => {
    const key = entry.stage === 'ai_generating' ? 'Generation errors' : 'Validation errors';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Topic */}
      <div>
        <label htmlFor="topic" className={LABEL_CLASS}>
          Topic / Concept <span className="text-[var(--error)] normal-case tracking-normal">*</span>
        </label>
        <input
          id="topic"
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Binary Search, Dynamic Programming, Arrays"
          className={INPUT_CLASS}
          disabled={isLoading}
          required
        />
      </div>

      {/* Difficulty */}
      <div>
        <label className={LABEL_CLASS}>Difficulty</label>
        <div className="flex gap-2">
          {difficultyOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDifficulty(opt.value)}
              disabled={isLoading}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                ${difficulty === opt.value
                  ? 'text-white border-transparent'
                  : 'bg-white border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--border-secondary)]'
                }`}
              style={difficulty === opt.value ? { backgroundColor: opt.color, borderColor: opt.color } : undefined}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label htmlFor="tags" className={LABEL_CLASS}>Tags <span className="normal-case tracking-normal text-[var(--text-muted)] font-normal">comma-separated</span></label>
        <input
          id="tags"
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="arrays, sorting, two-pointers"
          className={INPUT_CLASS}
          disabled={isLoading}
        />
      </div>

      {/* Languages */}
      <div>
        <label className={LABEL_CLASS}>Languages</label>
        <div className="flex flex-wrap gap-2">
          {allLanguages.map((lang) => {
            const active = languages.includes(lang);
            return (
              <button
                key={lang}
                type="button"
                onClick={() => toggleLanguage(lang)}
                disabled={isLoading}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer disabled:opacity-50
                  ${active
                    ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white'
                    : 'bg-white border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--border-secondary)]'
                  }`}
              >
                {EXECUTION_LANGUAGE_LABELS[lang]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Number of Problems */}
      <div>
        <label htmlFor="numProblems" className={LABEL_CLASS}>
          Number of Problems <span className="normal-case tracking-normal text-[var(--text-muted)] font-normal">1–5</span>
        </label>
        <input
          id="numProblems"
          type="number"
          min="1"
          max="5"
          value={numProblems}
          onChange={(e) => setNumProblems(parseInt(e.target.value) || 1)}
          className={INPUT_CLASS}
          disabled={isLoading}
        />
      </div>

      {/* Constraints */}
      <div>
        <label htmlFor="constraints" className={LABEL_CLASS}>
          Constraints <span className="normal-case tracking-normal text-[var(--text-muted)] font-normal">optional</span>
        </label>
        <textarea
          id="constraints"
          value={constraints}
          onChange={(e) => setConstraints(e.target.value)}
          placeholder="e.g. Must use recursion, No built-in sort"
          rows={3}
          className={`${INPUT_CLASS} resize-none`}
          disabled={isLoading}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════
         STATUS PANEL — Visible during any active generation phase
         ═══════════════════════════════════════════════════════════ */}
      {isLoading && (phase === 'generating' || phase === 'retrying' || phase === 'idle') && (
        <div className="retry-status-panel animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <div className="retry-pulse-dot" />
            <span className="text-sm font-semibold text-amber-800">{isRetrying ? 'Retry in Progress' : 'Generation in Progress'}</span>
            {maxRetries > 0 && (
              <span className="ml-auto text-xs font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Attempt {retryCount + 1}/{maxRetries + 1}
              </span>
            )}
          </div>

          {retryHistory.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${getStageBadgeColor(retryHistory[retryHistory.length - 1].stage)}`}>
                  {getStageLabel(retryHistory[retryHistory.length - 1].stage)}
                </span>
                <span className="text-xs text-amber-700">
                  {retryHistory[retryHistory.length - 1].error.length > 100
                    ? retryHistory[retryHistory.length - 1].error.substring(0, 100) + '...'
                    : retryHistory[retryHistory.length - 1].error}
                </span>
              </div>

              {retryHistory.length > 1 && (
                <button
                  type="button"
                  onClick={() => setShowRetryHistory(!showRetryHistory)}
                  className="text-[10px] text-amber-600 hover:text-amber-800 font-medium flex items-center gap-1 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: showRetryHistory ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  {showRetryHistory ? 'Hide' : 'Show'} previous {retryHistory.length - 1} attempt{retryHistory.length > 2 ? 's' : ''}
                </button>
              )}

              {showRetryHistory && retryHistory.length > 1 && (
                <div className="retry-history-list animate-slide-down">
                  {retryHistory.slice(0, -1).map((entry, idx) => (
                    <div key={idx} className="retry-history-item">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold text-gray-400">#{entry.attempt}</span>
                        <span className={`inline-flex items-center px-1.5 py-0 rounded text-[9px] font-bold border ${getStageBadgeColor(entry.stage)}`}>
                          {getStageLabel(entry.stage)}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-tight">
                        {entry.error.length > 150 ? entry.error.substring(0, 150) + '...' : entry.error}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Stepper — granular generation stages */}
          <div className="mt-4 mb-2 flex flex-col gap-2.5">
            {(() => {
              const spinnerIcon = (
                <svg className="animate-spin text-amber-500 w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              );
              const checkIcon = (
                <svg className="text-green-500 w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              );
              const pendingDot = <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />;

              // Determine numeric rank of current stage for comparisons
              const stageRank: Record<string, number> = { queued: 0, ai_generating: 1, validating: 2, retrying: 2 };
              const currentRank = backendStatus ? (stageRank[backendStatus] ?? -1) : -1;

              const steps = [
                { rank: 0, activeLabel: 'Preparing generation request...', doneLabel: 'Request queued' },
                { rank: 1, activeLabel: 'AI drafting problem, testcases & solution...', doneLabel: 'Problem & solution generated' },
                { rank: 2, activeLabel: 'Materializing test case templates...', doneLabel: 'Test cases materialized' },
                { rank: 3, activeLabel: backendStatus === 'retrying' ? 'Repairing solution code (retrying)...' : 'Running model answer on every test case...', doneLabel: 'All test cases validated' },
              ];

              // Validation stage covers both rank 2 and 3 in the backend status
              // We split it visually: rank 2 = materialization, rank 3 = execution
              // Both map to backend 'validating'/'retrying'

              return steps.map((step, idx) => {
                // For our visual split: ranks 2 and 3 both correspond to backend validating/retrying.
                // When backend is at validating, we show rank 2 as active briefly, then rank 3.
                // Since we can't distinguish sub-phases easily, we show rank 2 as done
                // once rank >= 2 (validating reached means materialization finished).
                const isActive = idx <= 1
                  ? currentRank === step.rank
                  : idx === 2
                    ? currentRank === 2 && !generationStatusMessage?.includes('test case')
                    : currentRank >= 2 && (generationStatusMessage?.includes('test case') || generationStatusMessage?.includes('Testing'));
                const isDone = idx <= 1
                  ? currentRank > step.rank
                  : idx === 2
                    ? currentRank >= 2
                    : false;
                const isPending = !isActive && !isDone;

                return (
                  <div key={idx} className={`flex items-center gap-3 transition-opacity duration-300 ${isActive ? 'opacity-100' : isPending ? 'opacity-35' : 'opacity-65'}`}>
                    <div className="shrink-0 flex items-center justify-center w-5 h-5">
                      {isActive ? spinnerIcon : isDone ? checkIcon : pendingDot}
                    </div>
                    <span className={`text-xs leading-tight ${isActive ? 'text-amber-800 font-medium' : 'text-gray-500'}`}>
                      {isActive ? step.activeLabel : isDone ? step.doneLabel : step.doneLabel}
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
         STOPPED STATE — User clicked Stop
         ═══════════════════════════════════════════════════════════ */}
      {phase === 'stopped' && !isLoading && (
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <circle cx="12" cy="12" r="10" /><rect x="9" y="9" width="6" height="6" fill="#6B7280" />
            </svg>
            <span className="text-sm font-semibold text-gray-700">Generation Stopped</span>
          </div>
          {retryCount > 0 && (
            <p className="text-xs text-gray-500 mb-2">
              Stopped at attempt {retryCount + 1} of {maxRetries + 1}
            </p>
          )}
          {hasRetryHistory && (
            <p className="text-xs text-gray-500">
              Last error: {retryHistory[retryHistory.length - 1].error.substring(0, 100)}
              {retryHistory[retryHistory.length - 1].error.length > 100 && '...'}
            </p>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
         ERROR & EXHAUSTED STATE — All failures go here
         ═══════════════════════════════════════════════════════════ */}
      {(phase === 'exhausted' || phase === 'error') && !isLoading && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 animate-fade-in">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                {hasRetryHistory ? (
                  <><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></>
                ) : (
                  <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>
                )}
              </svg>
              <span className="text-sm font-semibold text-red-800">
                {hasRetryHistory ? 'Generation Failed' : 'API or Server Error'}
              </span>
              
              {hasRetryHistory && (
                <span className="ml-auto text-[10px] font-mono text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                  {retryHistory.length} attempts
                </span>
              )}
            </div>

            {!hasRetryHistory ? (
              // Infrastructure or API error (e.g. 503 Service Unavailable, Network Error)
              <p className="text-xs text-[var(--text-secondary)]">
                {displayError || error}
              </p>
            ) : (
              // AI logic/validation failures that exhausted their retries
              <>
                <p className="text-xs text-red-600">
                  Tried {retryHistory.length} times, but the AI could not produce a valid solution.
                </p>

                {Object.entries(errorCategorySummary).length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-red-700 uppercase tracking-wide">Error Breakdown:</p>
                    {Object.entries(errorCategorySummary).map(([category, count]) => (
                      <div key={category} className="flex items-center gap-2 text-xs text-red-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                        {category}: {count}×
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowRetryHistory(!showRetryHistory)}
                  className="text-[10px] text-red-500 hover:text-red-700 font-medium flex items-center gap-1 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: showRetryHistory ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  {showRetryHistory ? 'Hide' : 'Show'} attempt details
                </button>

                {showRetryHistory && (
                  <div className="retry-history-list animate-slide-down">
                    {retryHistory.map((entry, idx) => (
                      <div key={idx} className="retry-history-item">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-bold text-gray-400">#{entry.attempt}</span>
                          <span className={`inline-flex items-center px-1.5 py-0 rounded text-[9px] font-bold border ${getStageBadgeColor(entry.stage)}`}>
                            {getStageLabel(entry.stage)}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 leading-tight">
                          {entry.error.length > 150 ? entry.error.substring(0, 150) + '...' : entry.error}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-[10px] text-red-400 mt-1">
                  💡 Try a different topic, simpler constraints, or a different difficulty level.
                </p>
              </>
            )}

            {error && error.includes('already have 2 active generation jobs') && (
              <button
                type="button"
                onClick={handleClearStuckJobs}
                disabled={isClearing}
                className="self-center mt-2 px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 border border-red-300 transition-colors text-xs font-semibold flex items-center gap-2"
              >
                {isClearing ? (
                  <>
                    <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Clearing...
                  </>
                ) : (
                  'Clear All Jobs & Try Again'
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
         ACTION BUTTONS
         ═══════════════════════════════════════════════════════════ */}
      <div className="flex gap-2">
        {/* Main Generate / Retry Button */}
        <button
          type="submit"
          disabled={isLoading || languages.length === 0 || cooldownSeconds > 0}
          className={`flex-1 px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2
            ${isLoading || cooldownSeconds > 0
              ? 'bg-[var(--accent-primary)] text-white opacity-80 cursor-not-allowed'
              : error || phase === 'stopped' || phase === 'exhausted' || phase === 'error'
                ? 'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed'
                : 'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
        >
          {isLoading ? (
            isRetrying ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Retrying… ({retryCount + 1}/{maxRetries + 1})
              </>
            ) : (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating…
              </>
            )
          ) : phase === 'stopped' || phase === 'exhausted' || phase === 'error' ? (
            cooldownSeconds > 0 ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Cooldown ({cooldownSeconds}s)…
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                Try Again
              </>
            )
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              {`Generate ${numProblems > 1 ? `${numProblems} Problems` : 'Problem'}`}
            </>
          )}
        </button>

        {/* Stop Button — visible during retries */}
        {showStopButton && (
          <button
            type="button"
            onClick={handleStop}
            disabled={isStopping}
            className="px-4 py-3 rounded-xl bg-red-50 text-red-600 border border-red-200 font-semibold text-sm hover:bg-red-100 hover:border-red-300 transition-all flex items-center gap-2 animate-fade-in disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStopping ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Stopping…
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
                Stop
              </>
            )}
          </button>
        )}
      </div>

    </form>
  );
}
