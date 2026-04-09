import { describe, expect, it } from "vitest";
import { buildRetryContextSection } from "@/lib/ai/prompt-templates";
import type { RetryHistoryEntry } from "@/lib/ai/types";

describe("buildRetryContextSection", () => {
  it("returns empty string when retry history is empty", () => {
    const result = buildRetryContextSection([]);
    expect(result).toBe("");
  });

  it("includes attempt count for single retry", () => {
    const history: RetryHistoryEntry[] = [
      {
        attempt: 1,
        stage: "ai_generating",
        error: "JSON parse error",
        timestamp: "2026-01-01T00:00:01.000Z",
      },
    ];

    const result = buildRetryContextSection(history);

    expect(result).toContain("attempt 2");
    expect(result).toContain("previous");
    expect(result).toContain("FAILED");
  });

  it("includes all previous errors in output", () => {
    const history: RetryHistoryEntry[] = [
      {
        attempt: 1,
        stage: "ai_generating",
        error: "JSON parse error",
        timestamp: "2026-01-01T00:00:01.000Z",
      },
      {
        attempt: 2,
        stage: "validating",
        error: "Compile error in C++",
        timestamp: "2026-01-01T00:00:05.000Z",
      },
    ];

    const result = buildRetryContextSection(history);

    expect(result).toContain("Attempt 1");
    expect(result).toContain("JSON parse error");
    expect(result).toContain("Attempt 2");
    expect(result).toContain("Compile error in C++");
  });

  it('adds JSON fix instructions when errors contain "json" or "parse"', () => {
    const history: RetryHistoryEntry[] = [
      {
        attempt: 1,
        stage: "ai_generating",
        error: "Invalid JSON format",
        timestamp: "2026-01-01T00:00:01.000Z",
      },
    ];

    const result = buildRetryContextSection(history);

    expect(result).toContain("JSON FORMAT");
    expect(result).toContain("valid JSON object");
  });

  it('adds code fix instructions when errors contain "compile" or "syntax"', () => {
    const history: RetryHistoryEntry[] = [
      {
        attempt: 1,
        stage: "validating",
        error: "Compile error in solution",
        timestamp: "2026-01-01T00:00:01.000Z",
      },
    ];

    const result = buildRetryContextSection(history);

    expect(result).toContain("CODE ERRORS");
    expect(result).toContain("stdin");
  });

  it('adds template fix instructions when errors contain "template"', () => {
    const history: RetryHistoryEntry[] = [
      {
        attempt: 1,
        stage: "ai_generating",
        error: "Test case has invalid input_template",
        timestamp: "2026-01-01T00:00:01.000Z",
      },
    ];

    const result = buildRetryContextSection(history);

    expect(result).toContain("TEMPLATE DSL");
    expect(result).toContain("variables");
  });

  it('adds output mismatch instructions when errors contain "mismatch"', () => {
    const history: RetryHistoryEntry[] = [
      {
        attempt: 1,
        stage: "validating",
        error: "model solution output mismatch",
        timestamp: "2026-01-01T00:00:01.000Z",
      },
    ];

    const result = buildRetryContextSection(history);

    expect(result).toContain("OUTPUT MISMATCH");
    expect(result).toContain("algorithm");
  });

  it("adds multiple fix sections when multiple error types exist", () => {
    const history: RetryHistoryEntry[] = [
      {
        attempt: 1,
        stage: "ai_generating",
        error: "Invalid JSON parse error",
        timestamp: "2026-01-01T00:00:01.000Z",
      },
      {
        attempt: 2,
        stage: "validating",
        error: "Compile syntax error",
        timestamp: "2026-01-01T00:00:05.000Z",
      },
    ];

    const result = buildRetryContextSection(history);

    expect(result).toContain("JSON FORMAT");
    expect(result).toContain("CODE ERRORS");
  });

  it("labels stage correctly for ai_generating", () => {
    const history: RetryHistoryEntry[] = [
      {
        attempt: 1,
        stage: "ai_generating",
        error: "Some error",
        timestamp: "2026-01-01T00:00:01.000Z",
      },
    ];

    const result = buildRetryContextSection(history);

    expect(result).toContain("Generation/Parsing");
  });

  it("labels stage correctly for validating", () => {
    const history: RetryHistoryEntry[] = [
      {
        attempt: 1,
        stage: "validating",
        error: "Some error",
        timestamp: "2026-01-01T00:00:01.000Z",
      },
    ];

    const result = buildRetryContextSection(history);

    expect(result).toContain("Validation/Execution");
  });

  it("always ends with a critical instruction", () => {
    const history: RetryHistoryEntry[] = [
      {
        attempt: 1,
        stage: "ai_generating",
        error: "Some error",
        timestamp: "2026-01-01T00:00:01.000Z",
      },
    ];

    const result = buildRetryContextSection(history);

    expect(result).toContain("CRITICAL");
    expect(result).toContain("COMPLETELY NEW");
    expect(result).toContain("Do NOT repeat");
  });
});
