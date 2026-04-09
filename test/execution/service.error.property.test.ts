import { describe, expect, it, vi } from "vitest";
import * as fc from "fast-check";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PistonClient } from "@/lib/execution/types";
import { ExecutionServiceImpl } from "@/lib/execution/service";
import { TestCaseEvaluatorImpl } from "@/lib/execution/evaluator";

function createSupabaseWithTestCases(
  testCases: Array<{
    id: string;
    input_data: string;
    expected_output: string | null;
    is_sample: boolean;
    points: number;
  }>,
): SupabaseClient {
  const mockEqResult = {
    data: testCases,
    error: null,
  };

  const mockEq = vi.fn().mockImplementation(() => {
    const chainable = {
      eq: mockEq,
      then: (resolve: (value: typeof mockEqResult) => void) =>
        resolve(mockEqResult),
    };
    return chainable;
  });

  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: mockEq }),
    }),
  } as unknown as SupabaseClient;
}

describe("Execution Service Error Handling Properties", () => {
  it("Property 19: runtime errors are captured and included in test results", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 250 }),
        async (runtimeError) => {
          const mockSupabase = createSupabaseWithTestCases([
            {
              id: "test-1",
              input_data: "1 2",
              expected_output: "3",
              is_sample: true,
              points: 10,
            },
          ]);

          const mockPistonClient: PistonClient = {
            execute: vi.fn().mockResolvedValue({
              language: "python",
              version: "3.10.0",
              run: {
                stdout: "",
                stderr: runtimeError,
                code: 1,
                signal: null,
                output: runtimeError,
              },
            }),
            mapLanguage: vi.fn().mockReturnValue("python"),
            getRuntimes: vi.fn(),
            validateResponse: vi.fn(),
          };

          const service = new ExecutionServiceImpl({
            pistonClient: mockPistonClient,
            evaluator: new TestCaseEvaluatorImpl(),
            supabase: mockSupabase,
          });

          const result = await service.runCode({
            code: "print(x)",
            language: "python",
            problemId: "problem-1",
          });

          expect(result.results).toHaveLength(1);
          expect(result.results[0].passed).toBe(false);
          expect(result.results[0].error).toContain(runtimeError);
        },
      ),
      { numRuns: 20 },
    );
  });

  it("invalid test case data should produce a descriptive validation error", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 64 }),
        async (badValue) => {
          const mockSupabase = createSupabaseWithTestCases([
            {
              id: "test-1",
              input_data: badValue,
              expected_output: null,
              is_sample: true,
              points: 10,
            },
          ]);

          const mockPistonClient: PistonClient = {
            execute: vi.fn(),
            mapLanguage: vi.fn().mockReturnValue("python"),
            getRuntimes: vi.fn(),
            validateResponse: vi.fn(),
          };

          const service = new ExecutionServiceImpl({
            pistonClient: mockPistonClient,
            evaluator: new TestCaseEvaluatorImpl(),
            supabase: mockSupabase,
          });

          await expect(
            service.runCode({
              code: "print(1)",
              language: "python",
              problemId: "problem-1",
            }),
          ).rejects.toThrow(/invalid test case/i);
        },
      ),
      { numRuns: 20 },
    );
  });
});
