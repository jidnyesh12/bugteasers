import { beforeEach, describe, expect, it, vi } from "vitest";

const { pistonExecuteMock } = vi.hoisted(() => ({
  pistonExecuteMock: vi.fn(),
}));

vi.mock("@/lib/execution/client", () => ({
  PistonClientImpl: class MockPistonClientImpl {
    execute(payload: unknown) {
      return pistonExecuteMock(payload);
    }
  },
}));

import { validateProblemsAgainstModel } from "@/lib/ai/generation-problem-processing";
import type { GeneratedProblem } from "@/lib/ai/types";

class FakeInfrastructureError extends Error {
  readonly statusCode = 503;

  constructor() {
    super("Piston API infrastructure error (HTTP 503)");
    this.name = "PistonInfrastructureError";
  }
}

function pistonRun(stdout: string, code = 0) {
  return {
    language: "c++",
    version: "10.2.0",
    compile: { stdout: "", stderr: "", code: 0, signal: null, output: "" },
    run: { stdout, stderr: "", code, signal: null, output: stdout },
  };
}

function buildProblem(): GeneratedProblem {
  return {
    title: "Array Sum",
    description: "Print the sum of n integers.",
    difficulty: "easy",
    tags: ["arrays"],
    constraints: "1 <= n <= 10",
    examples: [{ input: "2\n1 2", output: "3" }],
    hints: ["Add them up."],
    time_limit: 2000,
    memory_limit: 256,
    solution_code: "int main(){}",
    test_cases: [
      {
        input_data: "2\n1 2",
        expected_output: "3",
        is_sample: true,
        points: 1,
      },
    ],
  };
}

describe("validateProblemsAgainstModel", () => {
  beforeEach(() => {
    pistonExecuteMock.mockReset();
  });

  it("reports a sandbox outage as an infrastructure error, not a code fault", async () => {
    pistonExecuteMock.mockRejectedValue(new FakeInfrastructureError());

    const outcome = await validateProblemsAgainstModel([buildProblem()], "seed");

    expect(outcome.ok).toBe(false);
    expect(outcome.failure?.errorType).toBe("infrastructure_error");
  });

  it("still treats a crashing reference as a model answer error", async () => {
    pistonExecuteMock.mockResolvedValue(pistonRun("", 139));

    const outcome = await validateProblemsAgainstModel([buildProblem()], "seed");

    expect(outcome.ok).toBe(false);
    expect(outcome.failure?.errorType).toBe("model_answer_error");
  });
});
