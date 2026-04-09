"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProblemSubmissions } from "@/lib/api/submissions-client";
import type { ProblemSubmissionHistoryItem } from "@/lib/submissions/types";
import { queryKeys } from "@/lib/state/query";

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
  options: UseProblemSubmissionsOptions,
): UseProblemSubmissionsResult {
  const {
    problemId,
    assignmentId,
    enabled = true,
    refreshToken = null,
  } = options;
  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => queryKeys.submissions.history(problemId, assignmentId),
    [assignmentId, problemId],
  );

  const { data, error, isFetching, refetch } = useQuery<
    ProblemSubmissionHistoryItem[]
  >({
    queryKey,
    queryFn: () =>
      fetchProblemSubmissions({
        problemId,
        assignmentId,
      }),
    enabled,
  });

  const loadSubmissions = useCallback(async () => {
    await refetch();
  }, [refetch]);

  useEffect(() => {
    if (!enabled || !refreshToken) {
      return;
    }

    void queryClient.invalidateQueries({ queryKey });
  }, [enabled, queryClient, queryKey, refreshToken]);

  const loadError = !enabled
    ? null
    : error instanceof Error
      ? error.message
      : error
        ? "Failed to load submissions"
        : null;

  return {
    submissions: enabled ? (data ?? []) : [],
    isLoading: enabled ? isFetching : false,
    loadError,
    loadSubmissions,
  };
}
