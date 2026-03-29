'use client';

import { Button } from '@/components/ui/button';
import {
  formatSubmissionScore,
  formatSubmissionTime,
  submissionStatusStyle,
} from '@/lib/submissions/formatting';
import type { ProblemSubmissionDisplayItem } from '@/lib/submissions/view-types';

interface SubmissionsTabContentProps {
  submissions: ProblemSubmissionDisplayItem[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onLoadSubmissionCode: (submission: ProblemSubmissionDisplayItem) => void;
}

function OpenInEditorIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

export function SubmissionsTabContent(props: SubmissionsTabContentProps) {
  const {
    submissions,
    isLoading,
    error,
    onRetry,
    onLoadSubmissionCode,
  } = props;

  const hasSubmissions = submissions.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[var(--text-primary)]">Submissions</h2>
        <Button
          onClick={onRetry}
          loading={isLoading}
          size="xs"
          className="h-8"
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {isLoading && !hasSubmissions ? (
        <p className="text-sm text-[var(--text-muted)]">Loading submissions...</p>
      ) : error && !hasSubmissions ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-2">
          <p className="text-sm font-semibold text-red-700">Failed to load submissions</p>
          <p className="text-xs text-red-700/90">{error}</p>
          <Button
            onClick={onRetry}
            variant="outline"
            size="xs"
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            Try again
          </Button>
        </div>
      ) : !hasSubmissions ? (
        <div className="rounded-xl border border-[var(--border-primary)] p-5 text-center bg-[var(--bg-secondary)]/30">
          <p className="text-sm text-[var(--text-muted)]">No submissions yet for this problem.</p>
        </div>
      ) : (
        <>
          {error && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 flex items-center justify-between gap-3">
              <p className="text-xs text-amber-800">Could not refresh right now. Showing your latest loaded submissions.</p>
              <Button
                onClick={onRetry}
                variant="outline"
                size="xs"
                className="border-amber-300 text-amber-800 hover:bg-amber-100"
              >
                Retry
              </Button>
            </div>
          )}

          <div className="space-y-2">
            {submissions.map((submission, index) => {
              const statusStyle = submissionStatusStyle[submission.status] ?? submissionStatusStyle.error;
              const displayNumber = submissions.length - index;
              const isOptimistic = submission.isOptimistic === true;

              return (
                <div
                  key={submission.id}
                  className={`group w-full rounded-xl border p-3 transition-colors ${
                    isOptimistic
                      ? 'border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/5'
                      : 'border-[var(--border-primary)] hover:bg-[var(--bg-secondary)]/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-[180px]">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">Submission {displayNumber}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">{formatSubmissionTime(submission.submittedAt)}</p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        ID: {isOptimistic && submission.id === '__pending_submission__' ? 'pending...' : submission.id.slice(0, 8)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${statusStyle.badge}`}>
                        <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusStyle.dot} ${isOptimistic ? 'animate-pulse' : ''}`} />
                        {isOptimistic ? 'Submitting' : statusStyle.label}
                      </span>
                      <Button
                        onClick={() => onLoadSubmissionCode(submission)}
                        disabled={isOptimistic}
                        size="xs"
                        className="h-7 px-2.5"
                        title="Open in editor"
                      >
                        <OpenInEditorIcon />
                        Open in editor
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Language</p>
                      <p className="text-[var(--text-primary)] font-semibold">{submission.language}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Score</p>
                      <p className="text-[var(--text-primary)] font-semibold">
                        {isOptimistic
                          ? 'Calculating...'
                          : formatSubmissionScore(submission.score)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Passed</p>
                      <p className="text-[var(--text-primary)] font-semibold">
                        {isOptimistic
                          ? 'Running...'
                          : `${submission.passedCount}/${submission.totalTestCount}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Points</p>
                      <p className="text-[var(--text-primary)] font-semibold">
                        {isOptimistic
                          ? 'Pending...'
                          : `${submission.earnedPoints ?? '--'}/${submission.totalPoints ?? '--'}`}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}