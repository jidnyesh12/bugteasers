'use client';

import { useCallback, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
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
} from './execution-error-utils';

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
  onExecutionError?: (mode: ExecutionMode, error: unknown) => void;
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
  const { problemId, getCode, language, assignmentId, onExecutionError, onResultReady } = options;

  const [executionResult, setExecutionResult] = useState<ExecutionPanelResult | null>(null);
  const [showOutput, setShowOutput] = useState(true);

  const {
    mutateAsync: runMutationAsync,
    isPending: isRunning,
  } = useMutation({
    mutationFn: runProblemCode,
  });

  const {
    mutateAsync: submitMutationAsync,
    isPending: isSubmitting,
  } = useMutation({
    mutationFn: submitProblemCode,
  });

  const runCode = useCallback(async () => {
    if (isRunning || isSubmitting) {
      return;
    }

    setShowOutput(true);
    setExecutionResult({
      mode: 'run',
      status: 'running',
      results: [],
      message: 'Running...'
    });

    try {
      const response = await runMutationAsync({
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
      onExecutionError?.('run', error);
    }
  }, [
    getCode,
    isRunning,
    isSubmitting,
    language,
    onExecutionError,
    onResultReady,
    problemId,
    runMutationAsync,
  ]);

  const submitCode = useCallback(async () => {
    if (isSubmitting || isRunning) {
      return;
    }

    setShowOutput(true);
    setExecutionResult({
      mode: 'submit',
      status: 'running',
      results: [],
      message: 'Submitting and running all test cases...'
    });

    try {
      const response = await submitMutationAsync({
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
      onExecutionError?.('submit', error);
    }
  }, [
    assignmentId,
    getCode,
    isRunning,
    isSubmitting,
    language,
    onExecutionError,
    onResultReady,
    problemId,
    submitMutationAsync,
  ]);

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
