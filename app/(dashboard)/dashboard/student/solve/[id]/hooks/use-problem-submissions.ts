'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchProblemSubmissions,
} from '@/lib/api/submissions-client';
import type { ProblemSubmissionHistoryItem } from '@/lib/submissions/types';

interface UseProblemSubmissionsOptions {
  problemId: string;
  assignmentId?: string;
  enabled?: boolean;
  // Changing this token triggers a refetch (used after successful submissions).
  refreshToken?: string | null;
}

interface UseProblemSubmissionsResult {
  submissions: ProblemSubmissionHistoryItem[];
  isLoading: boolean;
  loadError: string | null;
  loadSubmissions: () => Promise<void>;
}

export function useProblemSubmissions(
  options: UseProblemSubmissionsOptions
): UseProblemSubmissionsResult {
  const {
    problemId,
    assignmentId,
    enabled = true,
    refreshToken = null,
  } = options;

  const [submissions, setSubmissions] = useState<ProblemSubmissionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Tracks the latest request so slower earlier responses cannot overwrite newer data.
  const requestIdRef = useRef(0);

  const loadSubmissions = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setIsLoading(true);
    setLoadError(null);

    try {
      const history = await fetchProblemSubmissions({
        problemId,
        assignmentId,
      });

      if (requestIdRef.current !== requestId) {
        return;
      }

      setSubmissions(history);
    } catch (error) {
      if (requestIdRef.current !== requestId) {
        return;
      }

      const message = error instanceof Error ? error.message : 'Failed to load submissions';
      setSubmissions([]);
      setLoadError(message);
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }, [assignmentId, problemId]);

  useEffect(() => {
    if (!enabled) {
      setSubmissions([]);
      setIsLoading(false);
      setLoadError(null);
      return;
    }

    void loadSubmissions();
  }, [enabled, loadSubmissions, refreshToken]);

  return {
    submissions,
    isLoading,
    loadError,
    loadSubmissions,
  };
}
