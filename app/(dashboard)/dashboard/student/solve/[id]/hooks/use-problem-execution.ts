'use client';

import { useCallback, useState } from 'react';
import type {
  ScoreResult,
  SupportedLanguage,
  TestResult,
} from '@/lib/execution/types';
import {
  runProblemCode,
  submitProblemCode,
} from '@/lib/api/execution-client';
import {
  formatExecutionErrorOutput,
  getExecutionErrorToastMessage,
} from './execution-error-utils';

type ToastKind = 'success' | 'error' | 'info' | 'warning';

export type ExecutionMode = 'run' | 'submit';
export type ExecutionStatus = 'running' | 'passed' | 'failed' | 'partial' | 'error';

export interface ExecutionPanelResult {
  mode: ExecutionMode;
  status: ExecutionStatus;
  score?: ScoreResult;
  results: TestResult[];
  submissionId?: string;
  message?: string;
}

interface UseProblemExecutionOptions {
  problemId: string;
  getCode: () => string;
  language: SupportedLanguage;
  assignmentId?: string;
  toast: (message: string, type?: ToastKind) => void;
  onResultReady?: (result: ExecutionPanelResult) => void;
}

interface UseProblemExecutionResult {
  isRunning: boolean;
  isSubmitting: boolean;
  executionResult: ExecutionPanelResult | null;
  showOutput: boolean;
  runCode: () => Promise<void>;
  submitCode: () => Promise<void>;
  closeOutput: () => void;
}

export function useProblemExecution(options: UseProblemExecutionOptions): UseProblemExecutionResult {
  const { problemId, getCode, language, assignmentId, toast, onResultReady } = options;

  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionPanelResult | null>(null);
  const [showOutput, setShowOutput] = useState(false);

  const runCode = useCallback(async () => {
    setIsRunning(true);
    setShowOutput(true);
    setExecutionResult({
      mode: 'run',
      status: 'running',
      results: [],
      message: 'Running...'
    });

    try {
      const response = await runProblemCode({
        problemId,
        code: getCode(),
        language,
      });

      const nextResult: ExecutionPanelResult = {
        mode: 'run',
        status: response.score.status,
        score: response.score,
        results: response.results,
      };

      setExecutionResult(nextResult);
      onResultReady?.(nextResult);
    } catch (error) {
      const nextResult: ExecutionPanelResult = {
        mode: 'run',
        status: 'error',
        results: [],
        message: formatExecutionErrorOutput(error),
      };

      setExecutionResult(nextResult);
      onResultReady?.(nextResult);
      toast(getExecutionErrorToastMessage(error), 'error');
    } finally {
      setIsRunning(false);
    }
  }, [getCode, language, onResultReady, problemId, toast]);

  const submitCode = useCallback(async () => {
    setIsSubmitting(true);
    setShowOutput(true);
    setExecutionResult({
      mode: 'submit',
      status: 'running',
      results: [],
      message: 'Submitting and running all test cases...'
    });

    try {
      const response = await submitProblemCode({
        problemId,
        code: getCode(),
        language,
        assignmentId,
      });

      const nextResult: ExecutionPanelResult = {
        mode: 'submit',
        status: response.score.status,
        score: response.score,
        results: response.results,
        submissionId: response.submissionId,
      };

      setExecutionResult(nextResult);
      onResultReady?.(nextResult);
    } catch (error) {
      const nextResult: ExecutionPanelResult = {
        mode: 'submit',
        status: 'error',
        results: [],
        message: formatExecutionErrorOutput(error),
      };

      setExecutionResult(nextResult);
      onResultReady?.(nextResult);
      toast(getExecutionErrorToastMessage(error), 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [assignmentId, getCode, language, onResultReady, problemId, toast]);

  const closeOutput = useCallback(() => {
    setShowOutput(false);
  }, []);

  return {
    isRunning,
    isSubmitting,
    executionResult,
    showOutput,
    runCode,
    submitCode,
    closeOutput,
  };
}
