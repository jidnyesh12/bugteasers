'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getDefaultStarterCode } from '../utils/editor-code-utils';
import type { Problem } from '../solve-types';

type ToastKind = 'success' | 'error' | 'info' | 'warning';

interface UseProblemLoaderOptions {
  problemId: string;
  setInitialEditorContent: (value: string) => void;
  toast: (message: string, type?: ToastKind) => void;
}

interface UseProblemLoaderResult {
  problem: Problem | null;
  isLoading: boolean;
  loadError: string | null;
  loadProblem: () => Promise<void>;
}

export function useProblemLoader(options: UseProblemLoaderOptions): UseProblemLoaderResult {
  const { problemId, setInitialEditorContent, toast } = options;

  const [problem, setProblem] = useState<Problem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const toastRef = useRef(toast);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const loadProblem = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      const response = await fetch(`/api/problems/${problemId}`);
      if (!response.ok) {
        throw new Error('Failed to load problem');
      }

      const data = await response.json();
      const nextProblem = data.problem as Problem;

      setProblem(nextProblem);

      const starter = typeof nextProblem.starter_code === 'string' && nextProblem.starter_code.trim()
        ? nextProblem.starter_code
        : getDefaultStarterCode('cpp');

      setInitialEditorContent(starter);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error loading problem:', error);
      setProblem(null);
      setLoadError(message);
      toastRef.current(`Failed to load problem: ${message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [problemId, setInitialEditorContent]);

  return {
    problem,
    isLoading,
    loadError,
    loadProblem,
  };
}
