// React hook for AI hint generation

import { useState, useCallback, useEffect } from "react";
import type {
  HintGenerationRequest,
  HintGenerationResponse,
  ExecutionContext,
} from "@/lib/ai/hint-types";
import type { SupportedLanguage } from "@/lib/execution/types";

interface UseAiHintsParams {
  problemId: string;
  assignmentId?: string;
}

interface GenerateHintParams {
  code: string;
  language: SupportedLanguage;
  executionResults?: ExecutionContext;
}

export function useAiHints({ problemId, assignmentId }: UseAiHintsParams) {
  const [hints, setHints] = useState<string[]>([]);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [resetAt, setResetAt] = useState<string | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Storage key for persisting hints in sessionStorage
  const storageKey = `hints_${problemId}_${assignmentId || "practice"}`;

  // Load hints from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setHints(parsed);
        }
      }
    } catch (err) {
      console.error("Failed to load hints from sessionStorage:", err);
    }
  }, [storageKey]);

  // Save hints to sessionStorage whenever they change
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(hints));
    } catch (err) {
      console.error("Failed to save hints to sessionStorage:", err);
    }
  }, [hints, storageKey]);

  const generateHint = useCallback(
    async ({ code, language, executionResults }: GenerateHintParams) => {
      setIsGenerating(true);
      setError(null);

      try {
        const requestBody: HintGenerationRequest = {
          code,
          language,
          executionResults,
          previousHints: hints,
          hintLevel: hints.length + 1,
          assignmentId,
        };

        const response = await fetch(`/api/problems/${problemId}/hints`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json();

          if (response.status === 429) {
            // Rate limit exceeded
            setError(
              errorData.resetAt
                ? `No hints remaining. Reset available at ${new Date(errorData.resetAt).toLocaleString()}`
                : "No hints remaining for this problem.",
            );
            setResetAt(errorData.resetAt);
            return null;
          }

          throw new Error(errorData.error || "Failed to generate hint");
        }

        const data: HintGenerationResponse = await response.json();

        // Add hint to state
        setHints((prev) => [...prev, data.hint]);
        setHintsRemaining(data.hintsRemaining);
        setResetAt(data.resetAt);

        return data.hint;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to generate hint";
        setError(errorMessage);
        console.error("Error generating hint:", err);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [problemId, assignmentId, hints],
  );

  const clearHints = useCallback(() => {
    setHints([]);
    setError(null);
    try {
      sessionStorage.removeItem(storageKey);
    } catch (err) {
      console.error("Failed to clear hints from sessionStorage:", err);
    }
  }, [storageKey]);

  return {
    hints,
    hintsRemaining,
    resetAt,
    isGenerating,
    error,
    generateHint,
    clearHints,
    canGetMoreHints: hints.length < 3 && hintsRemaining > 0,
  };
}
