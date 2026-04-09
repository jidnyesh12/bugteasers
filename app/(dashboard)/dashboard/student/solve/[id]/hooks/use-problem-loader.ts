"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchProblemDetail } from "@/lib/api/problems-client";
import { queryKeys } from "@/lib/state/query";
import { DEFAULT_EXECUTION_LANGUAGE } from "@/lib/execution/languages";
import { getDefaultStarterCode } from "../utils/editor-code-utils";
import type { Problem } from "../solve-types";

type ToastKind = "success" | "error" | "info" | "warning";

interface UseProblemLoaderOptions {
  problemId: string;
  setInitialEditorContent: (value: string) => void;
  toast: (message: string, type?: ToastKind) => void;
  enabled?: boolean;
}

interface UseProblemLoaderResult {
  problem: Problem | null;
  isLoading: boolean;
  loadError: string | null;
  loadProblem: () => Promise<void>;
}

export function useProblemLoader(
  options: UseProblemLoaderOptions,
): UseProblemLoaderResult {
  const { problemId, setInitialEditorContent, toast, enabled = true } = options;

  const toastRef = useRef(toast);
  const hydratedProblemIdRef = useRef<string | null>(null);
  const lastToastErrorRef = useRef<string | null>(null);
  const queryKey = useMemo(
    () => queryKeys.problems.detail(problemId),
    [problemId],
  );

  const { data, error, isPending, isFetching, refetch } = useQuery<Problem>({
    queryKey,
    queryFn: () => fetchProblemDetail<Problem>(problemId),
    enabled,
  });

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  useEffect(() => {
    hydratedProblemIdRef.current = null;
  }, [problemId]);

  useEffect(() => {
    if (!data) {
      return;
    }

    if (hydratedProblemIdRef.current === data.id) {
      return;
    }

    hydratedProblemIdRef.current = data.id;
    setInitialEditorContent(getDefaultStarterCode(DEFAULT_EXECUTION_LANGUAGE));
  }, [data, setInitialEditorContent]);

  const loadError = !enabled
    ? null
    : error instanceof Error
      ? error.message
      : error
        ? "Failed to load problem"
        : null;

  useEffect(() => {
    if (!enabled || !loadError) {
      lastToastErrorRef.current = null;
      return;
    }

    if (lastToastErrorRef.current === loadError) {
      return;
    }

    lastToastErrorRef.current = loadError;
    toastRef.current(`Failed to load problem: ${loadError}`, "error");
  }, [enabled, loadError]);

  const loadProblem = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const isLoading = enabled ? isPending || (isFetching && !data) : false;

  return {
    problem: enabled ? (data ?? null) : null,
    isLoading,
    loadError,
    loadProblem,
  };
}
