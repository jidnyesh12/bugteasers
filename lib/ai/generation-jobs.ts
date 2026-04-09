import { createHash, randomUUID } from "node:crypto";
import { supabase } from "@/lib/supabase/client";
import {
  dedupeSupportedLanguages,
  SUPPORTED_EXECUTION_LANGUAGES,
} from "@/lib/execution/languages";
import type { SupportedLanguage } from "@/lib/execution/types";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from "@/lib/env";
import {
  generateProblems,
  generateProblemsWithRetryContext,
  repairProblemSolutionCode,
} from "./problem-generator";
import type {
  GeneratedProblem,
  ProblemGenerationJobStatus,
  ProblemGenerationRequest,
  RetryHistoryEntry,
} from "./types";
import {
  annotateGeneratedProblems,
  validateProblemsAgainstModel,
} from "./generation-problem-processing";
import type { OracleValidationFailure } from "./generation-problem-processing";
import { SYSTEM_PROMPT, buildOracleRepairPrompt } from "./prompt-templates";

const JOB_SELECT_FIELDS = [
  "id",
  "created_by",
  "status",
  "request_payload",
  "result_payload",
  "progress_message",
  "error_message",
  "processing_token",
  "processing_started_at",
  "created_at",
  "updated_at",
  "completed_at",
  "retry_count",
  "max_retries",
  "retry_history",
].join(", ");

const TERMINAL_JOB_STATUSES: ReadonlySet<ProblemGenerationJobStatus> = new Set([
  "completed",
  "discarded",
  "error",
]);

const ACTIVE_JOB_STATUSES: readonly ProblemGenerationJobStatus[] = [
  "queued",
  "ai_generating",
  "validating",
  "retrying",
];

const DEFAULT_MAX_RETRIES = 3;

/** Maximum number of in-pipeline Oracle self-correction repair attempts. */
const MAX_ORACLE_REPAIR_ATTEMPTS = 3;

const MAX_ACTIVE_GENERATION_JOBS_PER_USER = 2;
const STALE_JOB_TIMEOUT_MS = 24 * 60 * 60 * 1000;
// Keep lock expiry far above normal generation time while still allowing timely crash recovery.
const PROCESSING_LOCK_TIMEOUT_MS = 20 * 60 * 1000;
const MAINTENANCE_INTERVAL_MS = 60 * 1000;

let lastMaintenanceAt = 0;

interface ProblemGenerationJobRow {
  id: string;
  created_by: string;
  status: ProblemGenerationJobStatus;
  request_payload: ProblemGenerationRequest;
  result_payload: { problems?: GeneratedProblem[] } | null;
  progress_message: string | null;
  error_message: string | null;
  processing_token: string | null;
  processing_started_at: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  retry_count: number;
  max_retries: number;
  retry_history: RetryHistoryEntry[];
}

export interface ProblemGenerationJobSummary {
  jobId: string;
  status: ProblemGenerationJobStatus;
  progressMessage: string | null;
  errorMessage: string | null;
  problems: GeneratedProblem[] | null;
  retryCount: number;
  maxRetries: number;
  retryHistory: RetryHistoryEntry[];
}

export class ProblemGenerationConcurrencyLimitError extends Error {
  constructor(
    message = "Too many active generation jobs. Wait for one to finish before starting another.",
  ) {
    super(message);
    this.name = "ProblemGenerationConcurrencyLimitError";
  }
}

function isJobStatus(value: unknown): value is ProblemGenerationJobStatus {
  return (
    value === "queued" ||
    value === "ai_generating" ||
    value === "validating" ||
    value === "retrying" ||
    value === "completed" ||
    value === "discarded" ||
    value === "error"
  );
}

function normalizeLanguages(rawLanguages: unknown): SupportedLanguage[] {
  if (!Array.isArray(rawLanguages)) {
    return [...SUPPORTED_EXECUTION_LANGUAGES];
  }

  const values = rawLanguages.filter(
    (value): value is string => typeof value === "string",
  );

  const deduped = dedupeSupportedLanguages(values);
  return deduped.length > 0 ? deduped : [...SUPPORTED_EXECUTION_LANGUAGES];
}

function normalizeJobRequest(
  request: ProblemGenerationRequest,
): ProblemGenerationRequest {
  return {
    topic: request.topic.trim(),
    difficulty: request.difficulty,
    tags: Array.isArray(request.tags)
      ? request.tags.map((tag) => tag.trim()).filter(Boolean)
      : [],
    constraints: request.constraints?.trim() || undefined,
    numProblems: Math.min(Math.max(request.numProblems ?? 1, 1), 5),
    languages: normalizeLanguages(request.languages),
  };
}

function mapJobRow(row: unknown): ProblemGenerationJobRow {
  if (!row || typeof row !== "object") {
    throw new Error("Invalid job row received from database");
  }

  const raw = row as Record<string, unknown>;

  if (typeof raw.id !== "string" || raw.id.length === 0) {
    throw new Error("Invalid generation job row: missing id");
  }

  if (typeof raw.created_by !== "string" || raw.created_by.length === 0) {
    throw new Error("Invalid generation job row: missing created_by");
  }

  if (!isJobStatus(raw.status)) {
    throw new Error("Invalid generation job row: unsupported status");
  }

  const requestPayload = raw.request_payload;
  if (!requestPayload || typeof requestPayload !== "object") {
    throw new Error("Invalid generation job row: request_payload missing");
  }

  const requestRecord = requestPayload as Record<string, unknown>;
  const topic =
    typeof requestRecord.topic === "string" ? requestRecord.topic : "";
  const difficulty = requestRecord.difficulty;

  if (
    !topic ||
    (difficulty !== "easy" && difficulty !== "medium" && difficulty !== "hard")
  ) {
    throw new Error("Invalid generation job row: malformed request payload");
  }

  return {
    id: raw.id,
    created_by: raw.created_by,
    status: raw.status,
    request_payload: {
      topic,
      difficulty,
      tags: Array.isArray(requestRecord.tags)
        ? requestRecord.tags.filter(
            (tag): tag is string => typeof tag === "string",
          )
        : [],
      constraints:
        typeof requestRecord.constraints === "string"
          ? requestRecord.constraints
          : undefined,
      numProblems:
        typeof requestRecord.numProblems === "number"
          ? requestRecord.numProblems
          : undefined,
      languages: normalizeLanguages(requestRecord.languages),
    },
    result_payload:
      raw.result_payload && typeof raw.result_payload === "object"
        ? (raw.result_payload as { problems?: GeneratedProblem[] })
        : null,
    progress_message:
      typeof raw.progress_message === "string" ? raw.progress_message : null,
    error_message:
      typeof raw.error_message === "string" ? raw.error_message : null,
    processing_token:
      typeof raw.processing_token === "string" ? raw.processing_token : null,
    processing_started_at:
      typeof raw.processing_started_at === "string"
        ? raw.processing_started_at
        : null,
    created_at:
      typeof raw.created_at === "string"
        ? raw.created_at
        : new Date().toISOString(),
    updated_at:
      typeof raw.updated_at === "string"
        ? raw.updated_at
        : new Date().toISOString(),
    completed_at:
      typeof raw.completed_at === "string" ? raw.completed_at : null,
    retry_count: typeof raw.retry_count === "number" ? raw.retry_count : 0,
    max_retries:
      typeof raw.max_retries === "number"
        ? raw.max_retries
        : DEFAULT_MAX_RETRIES,
    retry_history: Array.isArray(raw.retry_history)
      ? (raw.retry_history as RetryHistoryEntry[])
      : [],
  };
}

function toSummary(job: ProblemGenerationJobRow): ProblemGenerationJobSummary {
  return {
    jobId: job.id,
    status: job.status,
    progressMessage: job.progress_message,
    errorMessage: job.error_message,
    problems: job.result_payload?.problems ?? null,
    retryCount: job.retry_count,
    maxRetries: job.max_retries,
    retryHistory: job.retry_history,
  };
}

async function fetchJobById(
  jobId: string,
): Promise<ProblemGenerationJobRow | null> {
  const { data, error } = await supabase
    .from("problem_generation_jobs")
    .select(JOB_SELECT_FIELDS)
    .eq("id", jobId)
    .single();

  if (error) {
    const errorCode = (error as { code?: string }).code;
    if (errorCode === "PGRST116") {
      return null;
    }

    throw new Error(`Failed to fetch generation job: ${error.message}`);
  }

  return mapJobRow(data);
}

async function transitionJob(
  jobId: string,
  fromStatuses: readonly ProblemGenerationJobStatus[],
  updates: Record<string, unknown>,
  options: { lockToken?: string } = {},
): Promise<ProblemGenerationJobRow | null> {
  let query = supabase
    .from("problem_generation_jobs")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId)
    .in("status", [...fromStatuses]);

  if (options.lockToken) {
    query = query.eq("processing_token", options.lockToken);
  }

  const { data, error } = await query.select(JOB_SELECT_FIELDS).maybeSingle();

  if (error) {
    throw new Error(`Failed to transition generation job: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapJobRow(data);
}

function buildGenerationSeed(request: ProblemGenerationRequest): string {
  const payload = JSON.stringify({
    topic: request.topic,
    difficulty: request.difficulty,
    tags: request.tags ?? [],
    constraints: request.constraints ?? "",
    numProblems: request.numProblems ?? 1,
    languages: request.languages ?? [...SUPPORTED_EXECUTION_LANGUAGES],
  });

  return createHash("sha256").update(payload).digest("hex");
}

async function discardStaleActiveJobs(): Promise<void> {
  const staleCutoffIso = new Date(
    Date.now() - STALE_JOB_TIMEOUT_MS,
  ).toISOString();
  const nowIso = new Date().toISOString();

  const { error } = await supabase
    .from("problem_generation_jobs")
    .update({
      status: "discarded",
      progress_message: "Generation discarded: job expired before completion.",
      error_message:
        "Generation job expired due to inactivity. Please retry generation.",
      completed_at: nowIso,
      processing_token: null,
      processing_started_at: null,
      updated_at: nowIso,
    })
    .in("status", [...ACTIVE_JOB_STATUSES])
    .lt("updated_at", staleCutoffIso);

  if (error) {
    throw new Error(
      `Failed to discard stale generation jobs: ${error.message}`,
    );
  }
}

async function releaseExpiredProcessingLocks(): Promise<void> {
  const staleLockCutoffIso = new Date(
    Date.now() - PROCESSING_LOCK_TIMEOUT_MS,
  ).toISOString();
  const nowIso = new Date().toISOString();

  const { error } = await supabase
    .from("problem_generation_jobs")
    .update({
      processing_token: null,
      processing_started_at: null,
      updated_at: nowIso,
    })
    .in("status", ["ai_generating", "validating"])
    .not("processing_started_at", "is", null)
    .lt("processing_started_at", staleLockCutoffIso);

  if (error) {
    throw new Error(
      `Failed to release stale generation locks: ${error.message}`,
    );
  }
}

async function runMaintenanceIfDue(): Promise<void> {
  const now = Date.now();
  if (now - lastMaintenanceAt < MAINTENANCE_INTERVAL_MS) {
    return;
  }

  lastMaintenanceAt = now;

  try {
    await Promise.all([
      discardStaleActiveJobs(),
      releaseExpiredProcessingLocks(),
    ]);
  } catch (error) {
    console.error("Problem generation maintenance failed:", error);
  }
}

async function claimJobProcessingLock(
  jobId: string,
  status: "ai_generating" | "validating",
  lockToken: string,
): Promise<ProblemGenerationJobRow | null> {
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("problem_generation_jobs")
    .update({
      processing_token: lockToken,
      processing_started_at: nowIso,
      updated_at: nowIso,
    })
    .eq("id", jobId)
    .eq("status", status)
    .is("processing_token", null)
    .select(JOB_SELECT_FIELDS)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to claim generation job processing lock: ${error.message}`,
    );
  }

  if (!data) {
    return null;
  }

  return mapJobRow(data);
}

function categorizeGenerationError(error: unknown): {
  message: string;
  category: string;
} {
  if (!(error instanceof Error)) {
    return {
      message: "AI generation failed due to an unknown error",
      category: "unknown",
    };
  }

  const errorMessage = (error.message || "").toLowerCase();

  // API service errors (503, rate limits, etc.)
  if (
    errorMessage.includes("503") ||
    errorMessage.includes("service unavailable")
  ) {
    return {
      message:
        "The AI service is currently experiencing high demand. Please try again in a moment.",
      category: "service_unavailable",
    };
  }

  if (
    errorMessage.includes("429") ||
    errorMessage.includes("rate limit") ||
    errorMessage.includes("quota exceeded")
  ) {
    let cooldown = 0;
    // Look for "Please retry in 12.11s"
    const match = errorMessage.match(/please retry in ([\d\.]+)s/i);
    if (match && match[1]) {
      cooldown = Math.ceil(parseFloat(match[1]));
    } else {
      // Look for `"retryDelay":"12s"`
      const retryDelayMatch = errorMessage.match(
        /"retryDelay"\s*:\s*"(\d+)s"/i,
      );
      if (retryDelayMatch && retryDelayMatch[1]) {
        cooldown = parseInt(retryDelayMatch[1], 10);
      }
    }

    return {
      message:
        cooldown > 0
          ? `Rate limit reached. Please wait a moment before trying again. [COOLDOWN:${cooldown}]`
          : "Rate limit reached. Please wait a moment before trying again.",
      category: "rate_limit",
    };
  }

  if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
    return {
      message: "The AI request timed out. Please try again.",
      category: "timeout",
    };
  }

  // JSON parsing errors
  if (
    errorMessage.includes("invalid json") ||
    errorMessage.includes("parse") ||
    errorMessage.includes("json")
  ) {
    return {
      message:
        "The AI produced an improperly formatted response. Please try again.",
      category: "invalid_format",
    };
  }

  // Validation errors
  if (errorMessage.includes("validation") || errorMessage.includes("invalid")) {
    return {
      message: error.message,
      category: "validation_error",
    };
  }

  // Network errors
  if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
    return {
      message:
        "Network error occurred. Please check your connection and try again.",
      category: "network_error",
    };
  }

  // Default
  return {
    message: error.message,
    category: "unknown",
  };
}

/**
 * Parses the 0-based index of the failing problem from a validation error message.
 * Validation errors are formatted as "Problem N, test case M: ..." (1-indexed).
 * Defaults to 0 if the pattern is not found.
 */
function parseFailingProblemIndex(errorMessage: string): number {
  const match = errorMessage.match(/Problem\s+(\d+)/i);
  if (match && match[1]) {
    const oneBased = parseInt(match[1], 10);
    if (Number.isFinite(oneBased) && oneBased >= 1) {
      return oneBased - 1;
    }
  }
  return 0;
}

async function runAiGenerationStage(
  job: ProblemGenerationJobRow,
  lockToken: string,
): Promise<ProblemGenerationJobRow> {
  try {
    const lastRetryEntry = job.retry_history[job.retry_history.length - 1];
    const isSolutionRepair = lastRetryEntry?.stage === "validating";

    let generationResult;

    if (isSolutionRepair) {
      // The problem structure (templates, examples) is valid — only solution_code failed.
      // Repair it in-place rather than regenerating everything from scratch.
      const existingProblems = job.result_payload?.problems;
      if (existingProblems && existingProblems.length > 0) {
        const failingProblemIndex = parseFailingProblemIndex(
          lastRetryEntry.error,
        );
        generationResult = await repairProblemSolutionCode(
          existingProblems,
          failingProblemIndex,
          job.retry_history,
        );
      } else {
        // Stored problems missing - fall back to full regen
        generationResult = await generateProblemsWithRetryContext(
          job.request_payload,
          job.retry_history,
        );
      }
    } else if (job.retry_history.length > 0) {
      // Structural failure (bad JSON / bad template) — regenerate everything with error context
      generationResult = await generateProblemsWithRetryContext(
        job.request_payload,
        job.retry_history,
      );
    } else {
      // First attempt — generate from scratch
      generationResult = await generateProblems(job.request_payload);
    }

    const seed = buildGenerationSeed(job.request_payload);
    const problems = annotateGeneratedProblems(
      generationResult.problems,
      generationResult.metadata.model,
      seed,
    );

    const transitioned = await transitionJob(
      job.id,
      ["ai_generating"],
      {
        status: "validating",
        progress_message:
          job.retry_count > 0
            ? `Draft ready (attempt ${job.retry_count + 1}/${job.max_retries + 1}). Testing model answer on test cases...`
            : "Model code is ready. Now testing model answer on generated test cases.",
        result_payload: { problems },
        error_message: null,
        processing_token: null,
        processing_started_at: null,
      },
      { lockToken },
    );

    if (!transitioned) {
      const latestJob = await fetchJobById(job.id);
      if (!latestJob) {
        throw new Error("Generation job disappeared during transition");
      }
      return latestJob;
    }

    return transitioned;
  } catch (error) {
    const { message, category } = categorizeGenerationError(error);

    // Check if we can retry
    const canRetry =
      job.retry_count < job.max_retries && isRetryableCategory(category);

    if (canRetry) {
      const retryEntry: RetryHistoryEntry = {
        attempt: job.retry_count + 1,
        stage: "ai_generating",
        error: message,
        timestamp: new Date().toISOString(),
      };

      const transitioned = await transitionJob(
        job.id,
        ["ai_generating"],
        {
          status: "retrying",
          progress_message: `Generation failed: ${message}. Retrying... (Attempt ${job.retry_count + 2}/${job.max_retries + 1})`,
          error_message: message,
          retry_count: job.retry_count + 1,
          retry_history: [...job.retry_history, retryEntry],
          processing_token: null,
          processing_started_at: null,
        },
        { lockToken },
      );

      if (!transitioned) {
        const latestJob = await fetchJobById(job.id);
        if (!latestJob) {
          throw new Error("Generation job disappeared after retry transition");
        }
        return latestJob;
      }

      return transitioned;
    }

    // No retries left — mark as error
    const transitioned = await transitionJob(
      job.id,
      ["ai_generating"],
      {
        status: "error",
        progress_message:
          job.retry_count > 0
            ? `Generation failed after ${job.retry_count + 1} attempts.`
            : "Generation failed.",
        error_message: message,
        completed_at: new Date().toISOString(),
        processing_token: null,
        processing_started_at: null,
      },
      { lockToken },
    );

    if (!transitioned) {
      const latestJob = await fetchJobById(job.id);
      if (!latestJob) {
        throw new Error("Generation job disappeared after failure transition");
      }
      return latestJob;
    }

    return transitioned;
  }
}

function isRetryableCategory(category: string): boolean {
  // Only retry errors that the AI can actually fix (formatting, validation).
  // Don't auto-retry infrastructure or rate limit errors as they need cooldowns or manual user intervention.
  const nonRetryableCategories = new Set([
    "rate_limit",
    "service_unavailable",
    "timeout",
    "network_error",
    "unknown",
  ]);
  return !nonRetryableCategories.has(category);
}

async function transitionToRetryOrError(
  job: ProblemGenerationJobRow,
  lockToken: string,
  fromStatus: "ai_generating" | "validating",
  errorMessage: string,
): Promise<ProblemGenerationJobRow> {
  const canRetry = job.retry_count < job.max_retries;

  if (canRetry) {
    const retryEntry: RetryHistoryEntry = {
      attempt: job.retry_count + 1,
      stage: fromStatus,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    };

    // When the failure is a validation (solution_code) error, the problem
    // structure is still valid — preserve result_payload so the repair
    // path in runAiGenerationStage can read the existing problems.
    // For structural (ai_generating) failures, there's nothing valid to keep.
    const retryUpdates: Record<string, unknown> = {
      status: "retrying",
      progress_message: `${fromStatus === "validating" ? "Solution" : "Generation"} failed: ${errorMessage}. Retrying... (Attempt ${job.retry_count + 2}/${job.max_retries + 1})`,
      error_message: errorMessage,
      retry_count: job.retry_count + 1,
      retry_history: [...job.retry_history, retryEntry],
      processing_token: null,
      processing_started_at: null,
    };

    if (fromStatus === "ai_generating") {
      // Structural failure — no valid problems to preserve
      retryUpdates.result_payload = null;
    }
    // fromStatus === 'validating': result_payload intentionally NOT cleared

    const transitioned = await transitionJob(
      job.id,
      [fromStatus],
      retryUpdates,
      { lockToken },
    );

    if (!transitioned) {
      const latestJob = await fetchJobById(job.id);
      if (!latestJob) {
        throw new Error("Generation job disappeared after retry transition");
      }
      return latestJob;
    }

    return transitioned;
  }

  // No retries left
  const transitioned = await transitionJob(
    job.id,
    [fromStatus],
    {
      status: "error",
      progress_message:
        job.retry_count > 0
          ? `${fromStatus === "validating" ? "Validation" : "Generation"} failed after ${job.retry_count + 1} attempts.`
          : `${fromStatus === "validating" ? "Validation" : "Generation"} failed.`,
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
      processing_token: null,
      processing_started_at: null,
    },
    { lockToken },
  );

  if (!transitioned) {
    const latestJob = await fetchJobById(job.id);
    if (!latestJob) {
      throw new Error("Generation job disappeared after error transition");
    }
    return latestJob;
  }

  return transitioned;
}

async function handleOracleRepairLoop(
  problems: GeneratedProblem[],
  failure: OracleValidationFailure,
  requestSeed: string,
  maxAttempts: number = MAX_ORACLE_REPAIR_ATTEMPTS,
): Promise<
  | { ok: true; repairedProblems: GeneratedProblem[] }
  | { ok: false; lastFailure: OracleValidationFailure; attemptsMade: number }
> {
  let currentProblems = [...problems];
  let currentFailure = failure;

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const errorType = currentFailure.errorType;

    // Locate the failing problem
    const failIdx = currentFailure.problemIndex;
    const failingProblem = currentProblems[failIdx];
    if (!failingProblem) {
      return { ok: false, lastFailure: currentFailure, attemptsMade: attempt };
    }

    // Build the targeted repair prompt with full failure context
    const repairPrompt = buildOracleRepairPrompt(
      {
        title: failingProblem.title,
        description: failingProblem.description,
        constraints: failingProblem.constraints,
      },
      {
        errorType: currentFailure.errorType,
        message: currentFailure.message,
        failedCode: currentFailure.failedCode,
        stderr: currentFailure.stderr,
        expectedOutput: currentFailure.expectedOutput,
        actualOutput: currentFailure.actualOutput,
        inputData: currentFailure.inputData,
      },
      attempt,
      maxAttempts,
    );

    try {
      const result = await model.generateContent(
        `${SYSTEM_PROMPT}\n\n${repairPrompt}`,
      );
      const text = result.response.text();

      // Parse { "solution_code": "..." }
      let cleaned = text.trim();
      cleaned = cleaned.replace(/^```json\s*/i, "");
      cleaned = cleaned.replace(/^```\s*/, "");
      cleaned = cleaned.replace(/\s*```\s*$/g, "");
      cleaned = cleaned.trim();

      const parsed = JSON.parse(cleaned);
      if (
        !parsed ||
        typeof parsed !== "object" ||
        typeof parsed.solution_code !== "string" ||
        parsed.solution_code.trim().length === 0
      ) {
        throw new Error(
          "LLM returned invalid repair response (missing solution_code)",
        );
      }

      // Patch the solution into the problem
      currentProblems = currentProblems.map((p, i) =>
        i === failIdx ? { ...p, solution_code: parsed.solution_code } : p,
      );

      // Re-run the full Two-Pass validation pipeline
      const revalidation = await validateProblemsAgainstModel(
        currentProblems,
        requestSeed,
      );

      if (revalidation.ok && revalidation.problems) {
        return { ok: true, repairedProblems: revalidation.problems };
      }

      // Still failing - update failure for next iteration
      if (revalidation.failure) {
        currentFailure = revalidation.failure;
      }
    } catch (repairError) {
      // Continue to next attempt
    }
  }

  return { ok: false, lastFailure: currentFailure, attemptsMade: maxAttempts };
}

async function runValidationStage(
  job: ProblemGenerationJobRow,
  lockToken: string,
): Promise<ProblemGenerationJobRow> {
  try {
    const problems = job.result_payload?.problems;
    if (!problems || !Array.isArray(problems) || problems.length === 0) {
      return await transitionToRetryOrError(
        job,
        lockToken,
        "validating",
        "Validation could not start because generated problems were missing.",
      );
    }

    const requestSeed = buildGenerationSeed(job.request_payload);
    const validationResult = await validateProblemsAgainstModel(
      problems,
      requestSeed,
    );

    // ── Happy path: validation passed ──
    if (
      validationResult.ok &&
      validationResult.problems &&
      validationResult.problems.length > 0
    ) {
      const completionUpdate = {
        status: "completed",
        progress_message:
          job.retry_count > 0
            ? `Validation complete after ${job.retry_count + 1} attempts. Problems are ready for preview.`
            : "Validation complete. Problems are ready for preview.",
        result_payload: { problems: validationResult.problems },
        error_message: null,
        completed_at: new Date().toISOString(),
        processing_token: null,
        processing_started_at: null,
      };

      const transitioned = await transitionJob(
        job.id,
        ["validating"],
        completionUpdate,
        { lockToken },
      );

      if (!transitioned) {
        const latestJob = await fetchJobById(job.id);
        if (!latestJob) {
          throw new Error(
            "Generation job disappeared after completion transition",
          );
        }

        if (
          latestJob.status === "validating" &&
          latestJob.processing_token === lockToken
        ) {
          const retriedTransition = await transitionJob(
            job.id,
            ["validating"],
            completionUpdate,
            { lockToken },
          );

          if (retriedTransition) {
            return retriedTransition;
          }

          const retriedLatestJob = await fetchJobById(job.id);
          if (!retriedLatestJob) {
            throw new Error(
              "Generation job disappeared after completion transition retry",
            );
          }

          return retriedLatestJob;
        }

        if (
          latestJob.status === "completed" &&
          (!latestJob.result_payload?.problems ||
            latestJob.result_payload.problems.length === 0)
        ) {
          throw new Error(
            "Generation job completed without validated result payload after transition race",
          );
        }

        return latestJob;
      }

      return transitioned;
    }

    // ── Validation failed — attempt Oracle Repair Loop ──
    const failure = validationResult.failure;
    const isRepairableError =
      failure &&
      (failure.errorType === "compile_error" ||
        failure.errorType === "model_answer_error" ||
        failure.errorType === "logic_consistency_error");

    if (isRepairableError && failure) {
      const repairResult = await handleOracleRepairLoop(
        problems,
        failure,
        requestSeed,
      );

      if (repairResult.ok) {
        // Repair succeeded — complete the job with repaired problems
        const completionUpdate = {
          status: "completed",
          progress_message:
            `Validation complete after Oracle self-correction ` +
            `(${job.retry_count > 0 ? `generation attempt ${job.retry_count + 1}` : "first attempt"}). ` +
            `Problems are ready for preview.`,
          result_payload: { problems: repairResult.repairedProblems },
          error_message: null,
          completed_at: new Date().toISOString(),
          processing_token: null,
          processing_started_at: null,
        };

        const transitioned = await transitionJob(
          job.id,
          ["validating"],
          completionUpdate,
          { lockToken },
        );
        if (!transitioned) {
          const latestJob = await fetchJobById(job.id);
          if (!latestJob) {
            throw new Error(
              "Generation job disappeared after repair-completion transition",
            );
          }
          return latestJob;
        }
        return transitioned;
      }

      // Repair loop exhausted
      const exhaustionMessage =
        `Oracle self-correction failed after ${repairResult.attemptsMade} repair attempts. ` +
        `Last error: [${repairResult.lastFailure.errorType}] ${repairResult.lastFailure.message}`;

      return await transitionToRetryOrError(
        job,
        lockToken,
        "validating",
        exhaustionMessage,
      );
    }

    // Non-repairable errors - abort immediately
    if (failure && failure.errorType === "infrastructure_error") {
      return await transitionToRetryOrError(
        job,
        lockToken,
        "validating",
        `Piston execution sandbox unavailable (infrastructure error). ${failure.message}`,
      );
    }

    // Other non-repairable errors (e.g., materialization_error) — fall through to standard retry
    return await transitionToRetryOrError(
      job,
      lockToken,
      "validating",
      `Model solution failed validation: ${validationResult.message}`,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Validation failed due to an unknown error";

    return await transitionToRetryOrError(
      job,
      lockToken,
      "validating",
      message,
    );
  }
}

export async function enqueueProblemGenerationJob(params: {
  createdBy: string;
  request: ProblemGenerationRequest;
}): Promise<ProblemGenerationJobSummary> {
  await runMaintenanceIfDue();

  const normalizedRequest = normalizeJobRequest(params.request);

  const { data, error } = await supabase
    .from("problem_generation_jobs")
    .insert({
      created_by: params.createdBy,
      status: "queued",
      request_payload: normalizedRequest,
      progress_message: "Generation job queued. Preparing model draft.",
      error_message: null,
      processing_token: null,
      processing_started_at: null,
      started_at: null,
      completed_at: null,
      retry_count: 0,
      max_retries: DEFAULT_MAX_RETRIES,
      retry_history: [],
    })
    .select(JOB_SELECT_FIELDS)
    .single();

  if (error) {
    const errorCode = (error as { code?: string }).code;
    const normalizedMessage = (error.message || "").trim();
    const loweredMessage = (error.message || "").toLowerCase();
    if (
      (errorCode === "P0001" &&
        normalizedMessage === "TOO_MANY_ACTIVE_GENERATION_JOBS") ||
      (errorCode === "P0001" &&
        loweredMessage.includes("too many active generation jobs"))
    ) {
      const friendlyLimitMessage =
        `You already have ${MAX_ACTIVE_GENERATION_JOBS_PER_USER} active generation jobs. ` +
        "Wait for one to finish before starting another.";

      throw new ProblemGenerationConcurrencyLimitError(
        normalizedMessage === "TOO_MANY_ACTIVE_GENERATION_JOBS"
          ? friendlyLimitMessage
          : error.message || friendlyLimitMessage,
      );
    }

    throw new Error(
      `Failed to enqueue problem generation job: ${error.message}`,
    );
  }

  return toSummary(mapJobRow(data));
}

export async function getProblemGenerationJobForUser(
  jobId: string,
  userId: string,
): Promise<ProblemGenerationJobSummary | null> {
  const { data, error } = await supabase
    .from("problem_generation_jobs")
    .select(JOB_SELECT_FIELDS)
    .eq("id", jobId)
    .eq("created_by", userId)
    .single();

  if (error) {
    const errorCode = (error as { code?: string }).code;
    if (errorCode === "PGRST116") {
      return null;
    }

    throw new Error(
      `Failed to fetch generation job for user: ${error.message}`,
    );
  }

  return toSummary(mapJobRow(data));
}

export async function progressProblemGenerationJob(
  jobId: string,
): Promise<ProblemGenerationJobSummary | null> {
  await runMaintenanceIfDue();

  const job = await fetchJobById(jobId);
  if (!job) {
    return null;
  }

  if (TERMINAL_JOB_STATUSES.has(job.status)) {
    return toSummary(job);
  }

  if (job.status === "queued") {
    const transitioned = await transitionJob(job.id, ["queued"], {
      status: "ai_generating",
      progress_message:
        "Drafting problem statement, model code, and base testcases...",
      error_message: null,
      processing_token: null,
      processing_started_at: null,
      started_at: new Date().toISOString(),
    });

    if (!transitioned) {
      const latest = await fetchJobById(job.id);
      return latest ? toSummary(latest) : null;
    }

    return toSummary(transitioned);
  }

  // Handle retrying: transition back to ai_generating for another attempt
  if (job.status === "retrying") {
    const transitioned = await transitionJob(job.id, ["retrying"], {
      status: "ai_generating",
      progress_message: `Retrying generation... (Attempt ${job.retry_count + 1}/${job.max_retries + 1})`,
      error_message: null,
      processing_token: null,
      processing_started_at: null,
    });

    if (!transitioned) {
      const latest = await fetchJobById(job.id);
      return latest ? toSummary(latest) : null;
    }

    return toSummary(transitioned);
  }

  if (job.status === "ai_generating") {
    const lockToken = randomUUID();
    const claimed = await claimJobProcessingLock(
      job.id,
      "ai_generating",
      lockToken,
    );
    if (!claimed) {
      const latest = await fetchJobById(job.id);
      return latest ? toSummary(latest) : null;
    }

    const transitioned = await runAiGenerationStage(claimed, lockToken);
    return toSummary(transitioned);
  }

  if (job.status === "validating") {
    const lockToken = randomUUID();
    const claimed = await claimJobProcessingLock(
      job.id,
      "validating",
      lockToken,
    );
    if (!claimed) {
      const latest = await fetchJobById(job.id);
      return latest ? toSummary(latest) : null;
    }

    const transitioned = await runValidationStage(claimed, lockToken);
    return toSummary(transitioned);
  }

  return toSummary(job);
}

export async function cancelProblemGenerationJob(
  jobId: string,
  userId: string,
): Promise<ProblemGenerationJobSummary | null> {
  const job = await fetchJobById(jobId);
  if (!job) {
    return null;
  }

  if (job.created_by !== userId) {
    return null;
  }

  if (TERMINAL_JOB_STATUSES.has(job.status)) {
    return toSummary(job);
  }

  const transitioned = await transitionJob(job.id, [...ACTIVE_JOB_STATUSES], {
    status: "error",
    progress_message:
      job.retry_count > 0
        ? `Generation stopped by user at attempt ${job.retry_count + 1} of ${job.max_retries + 1}.`
        : "Generation stopped by user.",
    error_message: "Generation was stopped by the user.",
    completed_at: new Date().toISOString(),
    processing_token: null,
    processing_started_at: null,
  });

  if (!transitioned) {
    const latest = await fetchJobById(job.id);
    return latest ? toSummary(latest) : null;
  }

  return toSummary(transitioned);
}

export async function clearUserStuckJobs(userId: string): Promise<void> {
  const { error } = await supabase
    .from("problem_generation_jobs")
    .update({
      status: "error",
      error_message: "Manually cleared zombie job",
      completed_at: new Date().toISOString(),
    })
    .eq("created_by", userId)
    .in("status", ["queued", "ai_generating", "validating", "retrying"]);

  if (error) {
    throw new Error(`Failed to clear stuck jobs: ${error.message}`);
  }
}
