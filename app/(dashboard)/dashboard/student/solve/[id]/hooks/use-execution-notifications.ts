'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { ExecutionMode, ExecutionPanelResult } from './use-problem-execution';
import { getExecutionErrorToastMessage } from './execution-error-utils';

type ToastKind = 'success' | 'error' | 'info' | 'warning';

interface UseSubmissionResultNotificationsOptions {
  executionResult: ExecutionPanelResult | null;
  toast: (message: string, type?: ToastKind) => void;
}

export function useExecutionErrorNotifier(
  toast: (message: string, type?: ToastKind) => void
): (mode: ExecutionMode, error: unknown) => void {
  return useCallback((_mode: ExecutionMode, error: unknown) => {
    toast(getExecutionErrorToastMessage(error), 'error');
  }, [toast]);
}

export function useSubmissionResultNotifications(
  options: UseSubmissionResultNotificationsOptions
): void {
  const { executionResult, toast } = options;
  const lastSubmitToastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!executionResult || executionResult.mode !== 'submit' || executionResult.status === 'running') {
      return;
    }

    const toastKey = `${executionResult.submissionId ?? 'no-submission-id'}:${executionResult.status}`;
    if (lastSubmitToastKeyRef.current === toastKey) {
      return;
    }

    lastSubmitToastKeyRef.current = toastKey;

    if (executionResult.status === 'passed') {
      toast('Submission recorded: accepted.', 'success');
      return;
    }

    if (executionResult.status === 'partial') {
      toast('Submission recorded: partially accepted.', 'warning');
      return;
    }

    if (executionResult.status === 'failed') {
      toast('Submission recorded: failed tests.', 'warning');
    }
  }, [executionResult, toast]);
}