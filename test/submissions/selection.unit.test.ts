import { describe, expect, it } from "vitest";
import type {
  ProblemSubmissionHistoryItem,
  SubmissionStatus,
} from "@/lib/submissions/types";
import { selectRepresentativeSubmission } from "@/lib/submissions/selection";

function createSubmission(overrides: {
  id: string;
  status: SubmissionStatus;
  submittedAt: string;
  earnedPoints?: number | null;
  score?: number | null;
}): ProblemSubmissionHistoryItem {
  return {
    id: overrides.id,
    language: "python",
    status: overrides.status,
    score: overrides.score ?? null,
    earnedPoints: overrides.earnedPoints ?? null,
    totalPoints: 10,
    passedCount: 0,
    totalTestCount: 0,
    submittedAt: overrides.submittedAt,
    code: `# ${overrides.id}`,
  };
}

describe("selectRepresentativeSubmission", () => {
  it("returns null for an empty submission list", () => {
    expect(selectRepresentativeSubmission([])).toBeNull();
  });

  it("prefers the latest passed submission over all other statuses", () => {
    const selected = selectRepresentativeSubmission([
      createSubmission({
        id: "failed-new",
        status: "failed",
        submittedAt: "2026-03-29T11:00:00.000Z",
      }),
      createSubmission({
        id: "partial-best",
        status: "partial",
        submittedAt: "2026-03-29T12:00:00.000Z",
        earnedPoints: 9,
      }),
      createSubmission({
        id: "passed-old",
        status: "passed",
        submittedAt: "2026-03-29T10:00:00.000Z",
      }),
      createSubmission({
        id: "passed-new",
        status: "passed",
        submittedAt: "2026-03-29T13:00:00.000Z",
      }),
    ]);

    expect(selected?.id).toBe("passed-new");
    expect(selected?.status).toBe("passed");
  });

  it("chooses the best partial by points, then latest time as tie-break", () => {
    const selected = selectRepresentativeSubmission([
      createSubmission({
        id: "partial-6",
        status: "partial",
        submittedAt: "2026-03-29T11:00:00.000Z",
        earnedPoints: 6,
      }),
      createSubmission({
        id: "partial-8-old",
        status: "partial",
        submittedAt: "2026-03-29T10:00:00.000Z",
        earnedPoints: 8,
      }),
      createSubmission({
        id: "partial-8-new",
        status: "partial",
        submittedAt: "2026-03-29T12:00:00.000Z",
        earnedPoints: 8,
      }),
      createSubmission({
        id: "failed",
        status: "failed",
        submittedAt: "2026-03-29T13:00:00.000Z",
      }),
    ]);

    expect(selected?.id).toBe("partial-8-new");
    expect(selected?.status).toBe("partial");
  });

  it("falls back to latest incorrect when no passed or partial exists", () => {
    const selected = selectRepresentativeSubmission([
      createSubmission({
        id: "error-old",
        status: "error",
        submittedAt: "2026-03-29T08:00:00.000Z",
      }),
      createSubmission({
        id: "failed-latest",
        status: "failed",
        submittedAt: "2026-03-29T10:00:00.000Z",
      }),
      createSubmission({
        id: "error-new",
        status: "error",
        submittedAt: "2026-03-29T09:00:00.000Z",
      }),
    ]);

    expect(selected?.id).toBe("failed-latest");
    expect(selected?.status).toBe("failed");
  });
});
