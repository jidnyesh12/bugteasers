import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  OUTPUT_PREVIEW_LIMIT,
  shortenForPreview,
  shortenTestResult,
} from "@/lib/execution/output-preview";
import { ExecutionServiceImpl } from "@/lib/execution/service";
import { TestCaseEvaluatorImpl } from "@/lib/execution/evaluator";
import type { PistonClient } from "@/lib/execution/types";

const longText = "1 ".repeat(OUTPUT_PREVIEW_LIMIT);

describe("shortenForPreview", () => {
  it("keeps short text as it is", () => {
    expect(shortenForPreview("42")).toEqual({ text: "42", truncated: false });
  });

  it("cuts long text to the preview limit", () => {
    const shortened = shortenForPreview(longText);
    expect(shortened.truncated).toBe(true);
    expect(shortened.text).toHaveLength(OUTPUT_PREVIEW_LIMIT);
  });
});

describe("shortenTestResult", () => {
  const base = {
    testCaseId: "case-1",
    passed: true,
    pointsEarned: 1,
    pointsAvailable: 1,
  };

  it("returns small results unchanged", () => {
    const result = { ...base, actualOutput: "3", expectedOutput: "3" };
    expect(shortenTestResult(result)).toBe(result);
  });

  it("shortens both outputs and flags the result", () => {
    const shortened = shortenTestResult({
      ...base,
      actualOutput: longText,
      expectedOutput: longText,
    });

    expect(shortened.actualOutput).toHaveLength(OUTPUT_PREVIEW_LIMIT);
    expect(shortened.expectedOutput).toHaveLength(OUTPUT_PREVIEW_LIMIT);
    expect(shortened.outputsTruncated).toBe(true);
    expect(shortened.passed).toBe(true);
  });
});

describe("execution results with large outputs", () => {
  it("grades on the full output and returns a shortened copy", async () => {
    const fullOutput = longText.trim();
    const wrongTail = `${fullOutput.slice(0, -1)}9`;

    const chain = {
      eq: () => chain,
      then: (resolve: (value: unknown) => void) =>
        resolve({
          data: [
            {
              id: "case-1",
              input_data: "1",
              input_template: null,
              generation_seed: null,
              expected_output: fullOutput,
              is_sample: true,
              points: 1,
            },
          ],
          error: null,
        }),
    };

    const service = new ExecutionServiceImpl({
      pistonClient: {
        execute: vi.fn(async () => ({
          language: "c++",
          version: "10.2.0",
          run: { stdout: wrongTail, stderr: "", code: 0, signal: null, output: wrongTail },
        })),
        mapLanguage: vi.fn(() => "c++"),
        getRuntimes: vi.fn(),
        validateResponse: vi.fn(),
      } as unknown as PistonClient,
      evaluator: new TestCaseEvaluatorImpl(),
      supabase: {
        from: () => ({ select: () => chain }),
      } as unknown as SupabaseClient,
      maxConcurrency: 1,
      logger: {
        logExecutionStarted: vi.fn(),
        logExecutionCompleted: vi.fn(),
        logExecutionFailed: vi.fn(),
        logExecutionWarning: vi.fn(),
      },
    });

    const { results } = await service.runCode({
      code: "int main(){}",
      language: "cpp",
      problemId: "problem-1",
    });

    expect(results[0].passed).toBe(false);
    expect(results[0].outputsTruncated).toBe(true);
    expect(results[0].actualOutput.length).toBeLessThanOrEqual(
      OUTPUT_PREVIEW_LIMIT,
    );
  });
});
