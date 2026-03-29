import type { SubmissionStatus } from './types';

export interface SubmissionStatusStyle {
  badge: string;
  dot: string;
  label: string;
}

export const submissionStatusStyle: Record<SubmissionStatus, SubmissionStatusStyle> = {
  pending: {
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-500',
    label: 'Pending',
  },
  passed: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'Passed',
  },
  failed: {
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    label: 'Failed',
  },
  partial: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    label: 'Partial',
  },
  error: {
    badge: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500',
    label: 'Error',
  },
};

export function formatSubmissionTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown time';
  }

  return parsed.toLocaleString();
}

export function formatSubmissionScore(score: number | null): string {
  if (score === null) {
    return '--';
  }

  return `${score.toFixed(2)}%`;
}