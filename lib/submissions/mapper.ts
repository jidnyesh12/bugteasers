import type { ProblemSubmissionHistoryItem, SubmissionStatus } from "./types";
import { normalizeSupportedLanguage } from "@/lib/execution/languages";

export interface RawProblemSubmissionRow {
  id: string;
  language: string;
  status: string;
  score: unknown;
  earned_points: unknown;
  total_points: unknown;
  submitted_at: string;
  code: string;
  test_results: unknown;
}

interface NumericBounds {
  min?: number;
  max?: number;
}

const VALID_SUBMISSION_STATUSES: ReadonlySet<SubmissionStatus> = new Set([
  "pending",
  "passed",
  "failed",
  "partial",
  "error",
]);

export function parseNullableNumber(
  value: unknown,
  bounds?: NumericBounds,
): number | null {
  const isWithinBounds = (candidate: number): boolean => {
    if (!Number.isFinite(candidate)) {
      return false;
    }

    if (typeof bounds?.min === "number" && candidate < bounds.min) {
      return false;
    }

    if (typeof bounds?.max === "number" && candidate > bounds.max) {
      return false;
    }

    return true;
  };

  if (typeof value === "number" && Number.isFinite(value)) {
    return isWithinBounds(value) ? value : null;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return isWithinBounds(parsed) ? parsed : null;
  }

  return null;
}

export function normalizeSubmissionStatus(status: string): SubmissionStatus {
  if (VALID_SUBMISSION_STATUSES.has(status as SubmissionStatus)) {
    return status as SubmissionStatus;
  }

  return "error";
}

export function summarizeTestResults(testResults: unknown): {
  passedCount: number;
  totalTestCount: number;
} {
  if (!Array.isArray(testResults)) {
    return { passedCount: 0, totalTestCount: 0 };
  }

  const passedCount = testResults.reduce((count, entry) => {
    if (!entry || typeof entry !== "object") {
      return count;
    }

    const passed = (entry as { passed?: unknown }).passed;
    return passed === true ? count + 1 : count;
  }, 0);

  return {
    passedCount,
    totalTestCount: testResults.length,
  };
}

export function mapRawProblemSubmission(
  submission: RawProblemSubmissionRow,
): ProblemSubmissionHistoryItem {
  const { passedCount, totalTestCount } = summarizeTestResults(
    submission.test_results,
  );
  const normalizedLanguage = normalizeSupportedLanguage(submission.language);

  return {
    id: submission.id,
    language: normalizedLanguage ?? submission.language,
    status: normalizeSubmissionStatus(submission.status),
    score: parseNullableNumber(submission.score, { min: 0, max: 100 }),
    earnedPoints: parseNullableNumber(submission.earned_points, { min: 0 }),
    totalPoints: parseNullableNumber(submission.total_points, { min: 0 }),
    passedCount,
    totalTestCount,
    submittedAt: submission.submitted_at,
    code: submission.code,
  };
}
