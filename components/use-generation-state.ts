import { useState, useCallback, useEffect } from "react";
import type {
  ProblemGenerationJobStatusResponse,
  RetryHistoryEntry,
} from "@/lib/ai/types";

export type GenerationPhase =
  | "idle"
  | "generating"
  | "retrying"
  | "stopped"
  | "exhausted"
  | "error";

/**
 * Returns a user-friendly status message based on the current job status.
 */
export function getGenerationStatusMessage(
  status: ProblemGenerationJobStatusResponse,
): string {
  if (status.progressMessage && status.progressMessage.trim().length > 0) {
    return status.progressMessage;
  }

  if (status.status === "queued") {
    return "Generation request queued. Preparing your problem draft...";
  }

  if (status.status === "ai_generating") {
    return "Drafting problem statement, model code, and base testcases...";
  }

  if (status.status === "validating") {
    return "Model code is ready. Now testing model answer on generated testcases.";
  }

  if (status.status === "retrying") {
    return "Retrying generation with corrections...";
  }

  if (status.status === "completed") {
    return "Validation complete. Opening preview...";
  }

  if (status.status === "discarded") {
    return "Generation was discarded because validation failed.";
  }

  if (status.status === "error") {
    return status.error || "Generation failed due to an unexpected error.";
  }

  return "Generation failed due to an unexpected error.";
}

/**
 * Custom hook to manage the complex state of the problem generation pipeline,
 * including tracking retries, job statuses, parsing errors, and UI phases.
 */
export function useGenerationState() {
  const [phase, setPhase] = useState<GenerationPhase>("idle");
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries, setMaxRetries] = useState(0);
  const [retryHistory, setRetryHistory] = useState<RetryHistoryEntry[]>([]);
  const [showRetryHistory, setShowRetryHistory] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<
    ProblemGenerationJobStatusResponse["status"] | null
  >(null);
  const [isStopping, setIsStopping] = useState(false);
  const [error, setError] = useState("");
  const [generationStatusMessage, setGenerationStatusMessage] = useState("");
  const [cooldownEndTime, setCooldownEndTime] = useState<number | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Extract cooldown from error message and start timer
  useEffect(() => {
    if (error) {
      const match = error.match(/\[COOLDOWN:(\d+)\]/i);
      if (match && match[1]) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCooldownEndTime(Date.now() + parseInt(match[1], 10) * 1000);
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCooldownEndTime(null);
        setCooldownSeconds(0);
      }
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCooldownEndTime(null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCooldownSeconds(0);
    }
  }, [error]);

  // Countdown timer for cooldown
  useEffect(() => {
    if (!cooldownEndTime) return;
    const interval = setInterval(() => {
      const remainingMs = cooldownEndTime - Date.now();
      if (remainingMs <= 0) {
        setCooldownSeconds(0);
        setCooldownEndTime(null);
        clearInterval(interval);
      } else {
        setCooldownSeconds(Math.ceil(remainingMs / 1000));
      }
    }, 100); // Check more frequently for accuracy, but we update seconds

    // Initial check
    const remainingMs = cooldownEndTime - Date.now();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCooldownSeconds(Math.max(0, Math.ceil(remainingMs / 1000)));

    return () => clearInterval(interval);
  }, [cooldownEndTime]);

  const displayError = error.replace(/\[COOLDOWN:\d+\]/gi, "").trim();

  /**
   * Updates local state based on the polling response from the server.
   */
  const updateFromStatus = useCallback(
    (status: ProblemGenerationJobStatusResponse) => {
      setBackendStatus(status.status);
      setGenerationStatusMessage(getGenerationStatusMessage(status));

      // Track job ID for cancellation
      if (status.jobId) {
        setCurrentJobId(status.jobId);
      }

      // Update retry state
      if (status.retryCount !== undefined) setRetryCount(status.retryCount);
      if (status.maxRetries !== undefined) setMaxRetries(status.maxRetries);
      if (status.retryHistory) setRetryHistory(status.retryHistory);

      // Update phase
      if (status.status === "retrying") {
        setPhase("retrying");
      } else if (
        status.status === "ai_generating" ||
        status.status === "validating" ||
        status.status === "queued"
      ) {
        if (status.retryCount && status.retryCount > 0) {
          setPhase("retrying");
        } else {
          setPhase("generating");
        }
      }
    },
    [],
  );

  /**
   * Complete reset of the generation state, useful before starting a new request.
   */
  const resetState = useCallback(() => {
    setError("");
    setRetryCount(0);
    setMaxRetries(0);
    setRetryHistory([]);
    setShowRetryHistory(false);
    setCurrentJobId(null);
    setBackendStatus(null);
    setIsStopping(false);
    setGenerationStatusMessage("");
    setCooldownEndTime(null);
    setCooldownSeconds(0);
  }, []);

  // Computed values
  const isRetrying = phase === "retrying";
  const canStop = isRetrying && !isStopping;
  const isExhausted = retryCount > 0 && retryCount >= maxRetries;

  return {
    // State
    phase,
    retryCount,
    maxRetries,
    retryHistory,
    showRetryHistory,
    currentJobId,
    backendStatus,
    isStopping,
    error,
    displayError,
    generationStatusMessage,
    cooldownSeconds,

    // Setters
    setPhase,
    setShowRetryHistory,
    setIsStopping,
    setError,
    setGenerationStatusMessage,

    // Helpers
    updateFromStatus,
    resetState,

    // Computed
    isRetrying,
    canStop,
    isExhausted,
  };
}
