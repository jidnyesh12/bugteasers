import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ExecutionServiceImpl } from "@/lib/execution/service";
import { TestCaseEvaluatorImpl } from "@/lib/execution/evaluator";
import type {
  ExecutionRequest,
  ExecutionResponse,
  PistonClient,
} from "@/lib/execution/types";

const rows = [
  {
    id: "sample-1",
    input_data: "1 2",
    input_template: null,
    generation_seed: null,
    expected_output: "3",
    is_sample: true,
    points: 1,
  },
  {
    id: "hidden-1",
    input_data: "40 2",
    input_template: null,
    generation_seed: null,
    expected_output: "42",
    is_sample: false,
    points: 2,
  },
];

function buildService(
  respond: (request: ExecutionRequest) => ExecutionResponse,
) {
  const insert = vi.fn().mockReturnValue({
    select: () => ({
      single: async () => ({ data: { id: "submission-1" }, error: null }),
    }),
  });
  const chain = {
    eq: () => chain,
    then: (resolve: (value: unknown) => void) =>
      resolve({ data: rows, error: null }),
  };

  const service = new ExecutionServiceImpl({
    pistonClient: {
      execute: vi.fn(async (request: ExecutionRequest) => respond(request)),
      mapLanguage: vi.fn(() => "python"),
      getRuntimes: vi.fn(),
      validateResponse: vi.fn(),
    } as unknown as PistonClient,
    evaluator: new TestCaseEvaluatorImpl(),
    supabase: {
      from: (table: string) =>
        table === "test_cases" ? { select: () => chain } : { insert },
    } as unknown as SupabaseClient,
    maxConcurrency: 1,
    logger: {
      logExecutionStarted: vi.fn(),
      logExecutionCompleted: vi.fn(),
      logExecutionFailed: vi.fn(),
      logExecutionWarning: vi.fn(),
    },
  });

  return { service, insert };
}

function run(stdout: string, stderr = "", code = 0): ExecutionResponse {
  return {
    language: "python",
    version: "3.12.0",
    run: { stdout, stderr, code, signal: null, output: stdout },
  };
}

function compileError(): ExecutionResponse {
  return {
    language: "c++",
    version: "10.2.0",
    compile: {
      stdout: "",
      stderr: "error: expected ';'",
      code: 1,
      signal: null,
      output: "",
    },
    run: { stdout: "", stderr: "", code: 1, signal: null, output: "" },
  };
}

describe("submit results for hidden test cases", () => {
  it("does not return hidden inputs echoed to stdout or hidden answers", async () => {
    const { service } = buildService((request) => run(request.stdin));

    const { results } = await service.submitCode(
      { code: "print(input())", language: "python", problemId: "p" },
      "student-1",
    );

    const sample = results.find((result) => result.testCaseId === "sample-1");
    const hidden = results.find((result) => result.testCaseId === "hidden-1");

    expect(sample?.actualOutput).toBe("1 2");
    expect(sample?.expectedOutput).toBe("3");
    expect(hidden?.actualOutput).toBe("");
    expect(hidden?.expectedOutput).toBe("");
    expect(hidden?.passed).toBe(false);
    expect(hidden?.pointsAvailable).toBe(2);
  });

  it("does not return hidden inputs echoed to stderr", async () => {
    const { service } = buildService((request) => run("", request.stdin, 1));

    const { results } = await service.submitCode(
      { code: "raise SystemExit(input())", language: "python", problemId: "p" },
      "student-1",
    );

    const hidden = results.find((result) => result.testCaseId === "hidden-1");
    expect(hidden?.error).toBe("Runtime error");
    expect(JSON.stringify(results)).not.toContain("40 2");
  });

  it("keeps the verdict for hidden cases", async () => {
    const { service } = buildService((request) =>
      request.stdin === "40 2"
        ? {
            ...run(""),
            run: {
              stdout: "",
              stderr: "",
              code: 1,
              signal: "SIGKILL",
              output: "",
              status: "TO",
            },
          }
        : run("3"),
    );

    const { results } = await service.submitCode(
      { code: "x", language: "python", problemId: "p" },
      "student-1",
    );

    expect(
      results.find((result) => result.testCaseId === "hidden-1")?.error,
    ).toBe("Time limit exceeded");
  });

  it("keeps compile errors, which never see the input", async () => {
    const { service } = buildService(() => compileError());

    const { results } = await service.submitCode(
      { code: "int main( {}", language: "cpp", problemId: "p" },
      "student-1",
    );

    const hidden = results.find((result) => result.testCaseId === "hidden-1");
    expect(hidden?.error).toContain("expected ';'");
    expect(hidden?.expectedOutput).toBe("");
  });

  it("stores full results for the instructor", async () => {
    const { service, insert } = buildService((request) => run(request.stdin));

    await service.submitCode(
      { code: "print(input())", language: "python", problemId: "p" },
      "student-1",
    );

    const stored = insert.mock.calls[0][0].test_results as Array<{
      testCaseId: string;
      expectedOutput: string;
    }>;
    expect(
      stored.find((result) => result.testCaseId === "hidden-1")?.expectedOutput,
    ).toBe("42");
  });
});
