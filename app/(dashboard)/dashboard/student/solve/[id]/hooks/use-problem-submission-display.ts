'use client';

import { useMemo } from 'react';
import type { SupportedLanguage } from '@/lib/execution/types';
import type { ProblemSubmissionHistoryItem } from '@/lib/submissions/types';
import type { ProblemSubmissionDisplayItem } from '@/lib/submissions/view-types';
import type { ExecutionPanelResult } from './use-problem-execution';

export interface PendingSubmissionMeta {
  code: string;
  language: SupportedLanguage;
  submittedAt: string;
}

interface UseProblemSubmissionDisplayOptions {
  submissions: ProblemSubmissionHistoryItem[];
  executionResult: ExecutionPanelResult | null;
  isSubmitting: boolean;
  pendingSubmissionMeta: PendingSubmissionMeta | null;
}

function buildPendingPreviewSubmission(
  pendingSubmissionMeta: PendingSubmissionMeta
): ProblemSubmissionDisplayItem {
  return {
    id: '__pending_submission__',
    language: pendingSubmissionMeta.language,
    status: 'pending',
    score: null,
    earnedPoints: null,
    totalPoints: null,
    passedCount: 0,
    totalTestCount: 0,
    submittedAt: pendingSubmissionMeta.submittedAt,
    code: pendingSubmissionMeta.code,
    isOptimistic: true,
  };
}

function buildSubmitResultPreviewSubmission(
  executionResult: ExecutionPanelResult,
  pendingSubmissionMeta: PendingSubmissionMeta
): ProblemSubmissionDisplayItem | null {
  if (
    executionResult.mode !== 'submit' ||
    executionResult.status === 'running' ||
    !executionResult.submissionId ||
    !executionResult.score
  ) {
    return null;
  }

  const passedCount = executionResult.results.reduce((count, result) => (
    result.passed ? count + 1 : count
  ), 0);

  return {
    id: executionResult.submissionId,
    language: pendingSubmissionMeta.language,
    status: executionResult.status,
    score: executionResult.score.percentage,
    earnedPoints: executionResult.score.earnedPoints,
    totalPoints: executionResult.score.totalPoints,
    passedCount,
    totalTestCount: executionResult.results.length,
    submittedAt: pendingSubmissionMeta.submittedAt,
    code: pendingSubmissionMeta.code,
    isOptimistic: true,
  };
}

export function useProblemSubmissionDisplay(
  options: UseProblemSubmissionDisplayOptions
): ProblemSubmissionDisplayItem[] {
  const {
    submissions,
    executionResult,
    isSubmitting,
    pendingSubmissionMeta,
  } = options;

  return useMemo(() => {
    if (!pendingSubmissionMeta) {
      return submissions;
    }

    const previewSubmission = isSubmitting
      ? buildPendingPreviewSubmission(pendingSubmissionMeta)
      : executionResult
        ? buildSubmitResultPreviewSubmission(executionResult, pendingSubmissionMeta)
        : null;

    if (!previewSubmission) {
      return submissions;
    }

    if (
      previewSubmission.id !== '__pending_submission__' &&
      submissions.some((submission) => submission.id === previewSubmission.id)
    ) {
      return submissions;
    }

    return [previewSubmission, ...submissions];
  }, [executionResult, isSubmitting, pendingSubmissionMeta, submissions]);
}