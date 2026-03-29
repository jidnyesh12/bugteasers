'use client';

import { LoadingSpinner } from '@/components/ui/loading';
import type { SupportedLanguage } from '@/lib/execution/types';

interface SolveEditorToolbarProps {
  language: SupportedLanguage;
  onLanguageChange: (language: SupportedLanguage) => void;
  onReset: () => void;
  onRun: () => void;
  onSubmit: () => void;
  isRunning: boolean;
  isSubmitting: boolean;
}

function getFileExtension(language: SupportedLanguage): string {
  if (language === 'cpp') {
    return 'cpp';
  }

  if (language === 'java') {
    return 'java';
  }

  if (language === 'python') {
    return 'py';
  }

  return 'c';
}

export function SolveEditorToolbar({
  language,
  onLanguageChange,
  onReset,
  onRun,
  onSubmit,
  isRunning,
  isSubmitting,
}: SolveEditorToolbarProps) {
  const isRunDisabled = isRunning || isSubmitting;
  const isSubmitDisabled = isRunning || isSubmitting;

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#3e3e42] shrink-0">
      <div className="flex items-center gap-3">
        <select
          value={language}
          onChange={(event) => onLanguageChange(event.target.value as SupportedLanguage)}
          className="bg-[#3c3c3c] text-gray-300 text-xs font-mono px-3 py-1.5 rounded-md border border-[#555] focus:outline-none focus:border-[var(--accent-primary)] cursor-pointer"
        >
          <option value="cpp">C++</option>
          <option value="c">C</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
        </select>
        <span className="text-[10px] text-gray-500 font-mono">solution.{getFileExtension(language)}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onReset}
          className="text-gray-400 hover:text-white text-xs font-mono px-2 py-1 rounded hover:bg-[#3c3c3c] transition-colors cursor-pointer"
          title="Reset code"
        >
          Reset
        </button>
        <button
          onClick={onRun}
          disabled={isRunDisabled}
          className="flex items-center gap-1.5 bg-[#3c3c3c] hover:bg-[#4c4c4c] text-gray-200 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-50"
          title="Run (Ctrl + ')"
        >
          {isRunning ? (
            <>
              <span className="inline-flex scale-75" aria-hidden="true">
                <LoadingSpinner size="sm" />
              </span>
              Running...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Run
            </>
          )}
        </button>
        <button
          onClick={onSubmit}
          disabled={isSubmitDisabled}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-50"
          title="Submit (Ctrl + Enter)"
        >
          {isSubmitting ? (
            <>
              <span className="inline-flex scale-75" aria-hidden="true">
                <LoadingSpinner size="sm" />
              </span>
              Submitting...
            </>
          ) : (
            'Submit'
          )}
        </button>
      </div>
    </div>
  );
}
