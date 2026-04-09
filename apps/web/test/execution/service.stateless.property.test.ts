import { describe, expect, it, vi } from "vitest";
import * as fc from "fast-check";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PistonClient } from "@/lib/execution/types";
import { ExecutionServiceImpl } from "@/lib/execution/service";
import { TestCaseEvaluatorImpl } from "@/lib/execution/evaluator";

describe("Execution Service Stateless Property", () => {
  it("Property 20: execution service remains stateless across concurrent requests", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
          minLength: 2,
          maxLength: 8,
        }),
        async (inputs) => {
          const mockSupabase = {
            from: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockImplementation(() => {
                  const row = {
                    data: [
                      {
                        id: "test-1",
                        input_data: "in",
                        expected_output: "out",
                        is_sample: true,
                        points: 1,
                      },
                    ],
                    error: null,
                  };

                  return {
                    eq: vi.fn().mockReturnThis(),
                    then: (resolve: (value: typeof row) => void) =>
                      resolve(row),
                  };
                }),
              }),
            }),
          } as unknown as SupabaseClient;

          const mockPistonClient: PistonClient = {
            execute: vi.fn().mockResolvedValue({
              language: "python",
              version: "3.10.0",
              run: {
                stdout: "out",
                stderr: "",
                code: 0,
                signal: null,
                output: "out",
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

          const results = await Promise.all(
            inputs.map((code) =>
              service.runCode({
                code,
                language: "python",
                problemId: "problem-1",
              }),
            ),
          );

          expect(results).toHaveLength(inputs.length);
          for (const result of results) {
            expect(result.results).toHaveLength(1);
            expect(result.score.status).toBe("passed");
          }
        },
      ),
      { numRuns: 20 },
    );
  });
});
