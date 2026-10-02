import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ExecutionServiceImpl } from "@/lib/execution/service";
import { TestCaseEvaluatorImpl } from "@/lib/execution/evaluator";
import type {
  ExecutionRequest,
  ExecutionResponse,
  PistonClient,
} from "@/lib/execution/types";

function buildSupabase(count: number): SupabaseClient {
  const rows = Array.from({ length: count }, (_, index) => ({
    id: `case-${index}`,
    input_data: String(index),
    input_template: null,
    generation_seed: null,
    expected_output: String(index),
    is_sample: true,
    points: 1,
  }));

  const chain = {
    eq: () => chain,
    then: (resolve: (value: unknown) => void) =>
      resolve({ data: rows, error: null }),
  };

  return {
    from: () => ({ select: () => chain }),
  } as unknown as SupabaseClient;
}

function response(stdout: string, compileCode = 0): ExecutionResponse {
  return {
    language: "c++",
    version: "10.2.0",
    compile: { stdout: "", stderr: compileCode ? "error: expected ';'" : "", code: compileCode, signal: null, output: "" },
    run: { stdout, stderr: "", code: 0, signal: null, output: stdout },
  };
}

function buildService(
  execute: (request: ExecutionRequest) => Promise<ExecutionResponse>,
  count: number,
  maxConcurrency: number,
) {
  const pistonClient = {
    execute: vi.fn(execute),
    mapLanguage: vi.fn(() => "c++"),
    getRuntimes: vi.fn(),
    validateResponse: vi.fn(),
  } as unknown as PistonClient;

  const service = new ExecutionServiceImpl({
    pistonClient,
    evaluator: new TestCaseEvaluatorImpl(),
    supabase: buildSupabase(count),
    maxConcurrency,
    logger: {
      logExecutionStarted: vi.fn(),
      logExecutionCompleted: vi.fn(),
      logExecutionFailed: vi.fn(),
      logExecutionWarning: vi.fn(),
    },
  });

  return { service, pistonClient };
}

describe("ExecutionServiceImpl test case scheduling", () => {
  it("runs test cases concurrently up to the limit and keeps their order", async () => {
    let active = 0;
    let peak = 0;

    const { service } = buildService(
      async (request) => {
        active += 1;
        peak = Math.max(peak, active);
        await new Promise((resolve) => setTimeout(resolve, 5));
        active -= 1;
        return response(request.stdin);
      },
      9,
      3,
    );

    const result = await service.runCode({
      code: "int main(){}",
      language: "cpp",
      problemId: "problem-1",
    });

    expect(result.results.map((entry) => entry.testCaseId)).toEqual(
      Array.from({ length: 9 }, (_, index) => `case-${index}`),
    );
    expect(result.results.every((entry) => entry.passed)).toBe(true);
    expect(peak).toBe(3);
  });

  it("stops after a compile error instead of compiling every case", async () => {
    const { service, pistonClient } = buildService(
      async () => response("", 1),
      5,
      4,
    );

    const result = await service.runCode({
      code: "int main( {}",
      language: "cpp",
      problemId: "problem-1",
    });

    expect(pistonClient.execute).toHaveBeenCalledTimes(1);
    expect(result.results).toHaveLength(5);
    expect(result.results.every((entry) => !entry.passed)).toBe(true);
    expect(result.results[4].error).toContain("expected ';'");
  });

  it("sends the problem time limit scaled for the language", async () => {
    const { service, pistonClient } = buildService(
      async (request) => response(request.stdin),
      2,
      2,
    );

    await service.runCode({
      code: "print(input())",
      language: "python",
      problemId: "problem-1",
      timeLimitMs: 1000,
    });

    const sent = vi.mocked(pistonClient.execute).mock.calls.map(
      ([request]) => request.run_timeout,
    );
    expect(sent).toEqual([3000, 3000]);
  });

  it("leaves run_timeout unset without a problem time limit", async () => {
    const { service, pistonClient } = buildService(
      async (request) => response(request.stdin),
      1,
      1,
    );

    await service.runCode({
      code: "int main(){}",
      language: "cpp",
      problemId: "problem-1",
    });

    const [request] = vi.mocked(pistonClient.execute).mock.calls[0];
    expect(request).not.toHaveProperty("run_timeout");
  });
});
