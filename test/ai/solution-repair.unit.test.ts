/**
 * Unit tests for the solution repair building blocks.
 *
 * These test the pure functions that are used when a validation failure triggers
 * a targeted solution repair rather than a full problem regeneration.
 *
 * - buildSolutionRepairPrompt  (lib/ai/prompt-templates.ts)
 *
 * The orchestration dispatch (repairProblemSolutionCode, parseFailingProblemIndex)
 * is covered by generation-jobs.unit.test.ts.
 */
import { describe, expect, it } from "vitest";
import { buildSolutionRepairPrompt } from "@/lib/ai/prompt-templates";
import type { RetryHistoryEntry } from "@/lib/ai/types";

const SAMPLE_PROBLEM = {
  title: "Range Sum Query",
  description: "Given an array, answer sum queries over a range.",
  constraints: "1 ≤ n, q ≤ 10^5",
};

describe("buildSolutionRepairPrompt", () => {
  it("identifies this as a repair (not a full regen) request", () => {
    const history: RetryHistoryEntry[] = [
      {
        attempt: 1,
        stage: "validating",
        error: "runtime error - SyntaxError: invalid syntax",
        timestamp: "2026-01-01T00:00:01.000Z",
      },
    ];

    const prompt = buildSolutionRepairPrompt(SAMPLE_PROBLEM, history);

    expect(prompt).toContain("SOLUTION REPAIR");
    expect(prompt).toContain("FIX C++ CODE ONLY");
  });

  it("includes the problem title in the prompt", () => {
    const history: RetryHistoryEntry[] = [
      {
        attempt: 1,
        stage: "validating",
        error: "compile error",
        timestamp: "2026-01-01T00:00:01.000Z",
      },
    ];
    const prompt = buildSolutionRepairPrompt(SAMPLE_PROBLEM, history);
    expect(prompt).toContain("Range Sum Query");
  });

  it("includes the problem description in the prompt", () => {
    const history: RetryHistoryEntry[] = [
      {
        attempt: 1,
        stage: "validating",
        error: "compile error",
        timestamp: "2026-01-01T00:00:01.000Z",
      },
    ];
    const prompt = buildSolutionRepairPrompt(SAMPLE_PROBLEM, history);
    expect(prompt).toContain("Given an array, answer sum queries");
  });

  it("includes the problem constraints in the prompt", () => {
    const history: RetryHistoryEntry[] = [
      {
        attempt: 1,
        stage: "validating",
        error: "compile error",
        timestamp: "2026-01-01T00:00:01.000Z",
      },
    ];
    const prompt = buildSolutionRepairPrompt(SAMPLE_PROBLEM, history);
    expect(prompt).toContain("10^5");
  });

  it("injects all validation-stage errors from retry history", () => {
    const history: RetryHistoryEntry[] = [
      {
        attempt: 1,
        stage: "validating",
        error: "compile error: undefined reference to main",
        timestamp: "2026-01-01T00:00:01.000Z",
      },
      {
        attempt: 2,
        stage: "validating",
        error: "runtime error: time limit exceeded",
        timestamp: "2026-01-01T00:00:05.000Z",
      },
    ];

    const prompt = buildSolutionRepairPrompt(SAMPLE_PROBLEM, history);

    expect(prompt).toContain("undefined reference to main");
    expect(prompt).toContain("time limit exceeded");
    expect(prompt).toContain("Attempt 1 error");
    expect(prompt).toContain("Attempt 2 error");
  });

  it("skips ai_generating stage entries (those are structural errors, not solution errors)", () => {
    const history: RetryHistoryEntry[] = [
      {
        attempt: 1,
        stage: "ai_generating",
        error: "JSON parse error — this should not appear",
        timestamp: "2026-01-01T00:00:01.000Z",
      },
      {
        attempt: 2,
        stage: "validating",
        error: "runtime error: seg fault",
        timestamp: "2026-01-01T00:00:05.000Z",
      },
    ];

    const prompt = buildSolutionRepairPrompt(SAMPLE_PROBLEM, history);

    // Only the validating error should appear
    expect(prompt).toContain("seg fault");
    expect(prompt).not.toContain("JSON parse error");
  });

  it("requires C++ ONLY in the rules section", () => {
    const history: RetryHistoryEntry[] = [
      {
        attempt: 1,
        stage: "validating",
        error: "compile error",
        timestamp: "2026-01-01T00:00:01.000Z",
      },
    ];
    const prompt = buildSolutionRepairPrompt(SAMPLE_PROBLEM, history);
    expect(prompt).toContain("C++ ONLY");
  });

  it("prohibits comments in the rules section", () => {
    const history: RetryHistoryEntry[] = [
      {
        attempt: 1,
        stage: "validating",
        error: "compile error",
        timestamp: "2026-01-01T00:00:01.000Z",
      },
    ];
    const prompt = buildSolutionRepairPrompt(SAMPLE_PROBLEM, history);
    expect(prompt).toContain("DO NOT include ANY comments");
  });

  it("specifies #include <bits/stdc++.h>", () => {
    const history: RetryHistoryEntry[] = [
      {
        attempt: 1,
        stage: "validating",
        error: "compile error",
        timestamp: "2026-01-01T00:00:01.000Z",
      },
    ];
    const prompt = buildSolutionRepairPrompt(SAMPLE_PROBLEM, history);
    expect(prompt).toContain("#include <bits/stdc++.h>");
  });

  it("specifies cin/cout and int main()", () => {
    const history: RetryHistoryEntry[] = [
      {
        attempt: 1,
        stage: "validating",
        error: "compile error",
        timestamp: "2026-01-01T00:00:01.000Z",
      },
    ];
    const prompt = buildSolutionRepairPrompt(SAMPLE_PROBLEM, history);
    expect(prompt).toContain("int main()");
    expect(prompt).toContain("cin/cout");
  });

  it('instructs AI to return only { "solution_code": "..." }', () => {
    const history: RetryHistoryEntry[] = [
      {
        attempt: 1,
        stage: "validating",
        error: "runtime error",
        timestamp: "2026-01-01T00:00:01.000Z",
      },
    ];
    const prompt = buildSolutionRepairPrompt(SAMPLE_PROBLEM, history);
    expect(prompt).toContain('"solution_code"');
    // Should NOT ask for full problem JSON
    expect(prompt).not.toContain('"problems"');
    expect(prompt).not.toContain('"test_cases"');
  });

  it("warns about JSON escaping requirements", () => {
    const history: RetryHistoryEntry[] = [
      {
        attempt: 1,
        stage: "validating",
        error: "runtime error",
        timestamp: "2026-01-01T00:00:01.000Z",
      },
    ];
    const prompt = buildSolutionRepairPrompt(SAMPLE_PROBLEM, history);
    expect(prompt).toContain("CRITICAL");
    expect(prompt).toContain("JSON must be valid");
  });

  it("clarifies that problem structure is correct and must not change", () => {
    const history: RetryHistoryEntry[] = [
      {
        attempt: 1,
        stage: "validating",
        error: "runtime error",
        timestamp: "2026-01-01T00:00:01.000Z",
      },
    ];
    const prompt = buildSolutionRepairPrompt(SAMPLE_PROBLEM, history);
    expect(prompt).toContain("CORRECT");
    expect(prompt).toMatch(/must NOT change|ALL CORRECT/);
  });
});
