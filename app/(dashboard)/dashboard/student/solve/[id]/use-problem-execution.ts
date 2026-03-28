'use client';

import { useCallback, useState } from 'react';
import type {
  RunResponse,
  SubmitResponse,
  SupportedLanguage,
  TestResult,
} from '@/lib/execution/types';
import {
  ExecutionHttpError,
  runProblemCode,
  submitProblemCode,
} from '@/lib/api/execution-client';

type ToastKind = 'success' | 'error' | 'info' | 'warning';

interface UseProblemExecutionOptions {
  problemId: string;
  code: string;
  language: SupportedLanguage;
  assignmentId?: string;
  toast: (message: string, type?: ToastKind) => void;
}

interface UseProblemExecutionResult {
  isRunning: boolean;
  isSubmitting: boolean;
  output: string | null;
  showOutput: boolean;
  runCode: () => Promise<void>;
  submitCode: () => Promise<void>;
  closeOutput: () => void;
}

export function useProblemExecution(options: UseProblemExecutionOptions): UseProblemExecutionResult {
  const { problemId, code, language, assignmentId, toast } = options;

  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [showOutput, setShowOutput] = useState(false);

  const runCode = useCallback(async () => {
    setIsRunning(true);
    setShowOutput(true);
    setOutput('Running...');

    try {
      const response = await runProblemCode({
        problemId,
        code,
        language,
      });

      setOutput(formatRunOutput(response));
      toast('Run completed', 'success');
    } catch (error) {
      setOutput(formatErrorOutput(error));
      toast(getErrorToastMessage(error), 'error');
    } finally {
      setIsRunning(false);
    }
  }, [code, language, problemId, toast]);

  const submitCode = useCallback(async () => {
    setIsSubmitting(true);
    setShowOutput(true);
    setOutput('Submitting and running all test cases...');

    try {
      const response = await submitProblemCode({
        problemId,
        code,
        language,
        assignmentId,
      });

      setOutput(formatSubmitOutput(response));
      toast('Solution submitted!', 'success');
    } catch (error) {
      setOutput(formatErrorOutput(error));
      toast(getErrorToastMessage(error), 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [assignmentId, code, language, problemId, toast]);

  const closeOutput = useCallback(() => {
    setShowOutput(false);
  }, []);

  return {
    isRunning,
    isSubmitting,
    output,
    showOutput,
    runCode,
    submitCode,
    closeOutput,
  };
}

function formatRunOutput(response: RunResponse): string {
  const lines = [
    `Run completed`,
    '',
    formatScore(response.score),
    '',
    ...formatResultLines(response.results),
  ];

  return lines.join('\n');
}

function formatSubmitOutput(response: SubmitResponse): string {
  const lines = [
    `Submission saved: ${response.submissionId}`,
    '',
    formatScore(response.score),
    '',
    ...formatResultLines(response.results),
  ];

  return lines.join('\n');
}

function formatScore(score: RunResponse['score']): string {
  return `Score: ${score.earnedPoints}/${score.totalPoints} (${score.percentage.toFixed(2)}%) - ${score.status.toUpperCase()}`;
}

function formatResultLines(results: TestResult[]): string[] {
  if (results.length === 0) {
    return ['No test results available.'];
  }

  return results.flatMap((result, index) => {
    const status = result.passed ? 'PASS' : 'FAIL';
    const header = `Case ${index + 1} [${status}] ${result.pointsEarned}/${result.pointsAvailable}`;
    const details: string[] = [];

    if (result.error) {
      details.push(`  Error: ${result.error}`);
    }

    if (!result.passed) {
      details.push(`  Expected: ${result.expectedOutput}`);
      details.push(`  Actual: ${result.actualOutput}`);
    }

    return [header, ...details];
  });
}

function formatErrorOutput(error: unknown): string {
  if (error instanceof ExecutionHttpError) {
    if (error.status === 429 && error.retryAfterSeconds) {
      return `Rate limit exceeded. Try again in ${error.retryAfterSeconds} seconds.`;
    }

    return `Request failed (${error.status}): ${error.message}`;
  }

  if (error instanceof Error) {
    return `Request failed: ${error.message}`;
  }

  return 'Request failed due to an unknown error.';
}

function getErrorToastMessage(error: unknown): string {
  if (error instanceof ExecutionHttpError) {
    if (error.status === 401) {
      return 'Please sign in to continue.';
    }

    if (error.status === 403) {
      return 'You do not have access to this problem.';
    }

    if (error.status === 404) {
      return 'Problem not found.';
    }

    if (error.status === 429) {
      return error.retryAfterSeconds
        ? `Too many requests. Retry in ${error.retryAfterSeconds}s.`
        : 'Too many requests. Please try again shortly.';
    }

    if (error.status >= 500) {
      return 'Execution service is temporarily unavailable.';
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong.';
}
