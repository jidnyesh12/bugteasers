'use client';

interface ProblemLoadErrorViewProps {
  message: string;
  onRetry: () => void;
  onBack: () => void;
}

export function ProblemLoadErrorView({ message, onRetry, onBack }: ProblemLoadErrorViewProps) {
  return (
    <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center bg-[var(--bg-primary)] px-6">
      <div className="w-full max-w-lg rounded-xl border border-[var(--border-primary)] bg-white p-6 text-center shadow-sm">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Unable to Load Problem</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{message}</p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md bg-[var(--accent-primary)] px-4 py-2 text-xs font-bold text-white transition-colors hover:opacity-90"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={onBack}
            className="rounded-md border border-[var(--border-primary)] bg-white px-4 py-2 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-secondary)]"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
