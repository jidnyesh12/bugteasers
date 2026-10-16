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
import {
  materializeTestCaseInputTemplate,
  type TestCaseInputTemplate,
} from "@/lib/ai/template-dsl";
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

  it("reports a reference killed for time as a timeout", async () => {
    pistonExecuteMock.mockResolvedValue({
      ...pistonRun(""),
      run: {
        stdout: "",
        stderr: "",
        code: 1,
        signal: "SIGKILL",
        output: "",
        status: "TO",
        message: "Time limit exceeded (wall clock)",
      },
    });

    const outcome = await validateProblemsAgainstModel([buildProblem()], "seed");

    expect(outcome.failure?.errorType).toBe("model_answer_error");
    expect(outcome.failure?.message).toContain("execution timed out");
  });
});

const JOB_SEED = "d".repeat(64);

const arrayTemplate: TestCaseInputTemplate = {
  version: 1,
  variables: {
    n: { type: "int", min: 1, max: 40 },
    arr: { type: "int_array", length: { ref: "n" }, min: -50, max: 50 },
  },
  output: [
    { type: "line", values: [{ ref: "n" }] },
    { type: "line", values: [{ ref: "arr" }] },
  ],
};

function sumOfSecondLine(stdin: string): string {
  const [, numbers = ""] = stdin.split("\n");
  return String(
    numbers
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .reduce((total, value) => total + Number(value), 0),
  );
}

function sumReference() {
  pistonExecuteMock.mockImplementation(async (payload: { stdin: string }) =>
    pistonRun(`${sumOfSecondLine(payload.stdin)}\n`),
  );
}

function templatedProblem(
  hiddenTemplate: TestCaseInputTemplate = arrayTemplate,
): GeneratedProblem {
  return {
    ...buildProblem(),
    test_cases: [
      { input_data: "2\n1 2", expected_output: "3", is_sample: true, points: 1 },
      {
        input_data: "",
        input_template: hiddenTemplate,
        expected_output: "__AUTO_EXPECTED_OUTPUT__",
        is_sample: false,
        points: 2,
      },
    ],
  };
}

describe("validateProblemsAgainstModel fan-out", () => {
  beforeEach(() => {
    pistonExecuteMock.mockReset();
  });

  it("expands a hidden template into extra seeded cases", async () => {
    sumReference();

    const outcome = await validateProblemsAgainstModel(
      [templatedProblem()],
      JOB_SEED,
      { fanoutCandidates: 8, fanoutKeep: 3, concurrency: 2 },
    );

    expect(outcome.ok).toBe(true);
    const cases = outcome.problems?.[0].test_cases ?? [];
    expect(cases).toHaveLength(4);
    expect(cases[0].is_sample).toBe(true);
    expect(cases.slice(1).every((tc) => !tc.is_sample && tc.points === 2)).toBe(
      true,
    );
    expect(new Set(cases.slice(1).map((tc) => tc.generation_seed)).size).toBe(3);
  });

  it("stores hidden template cases as template and seed only, with answers that replay", async () => {
    sumReference();

    const outcome = await validateProblemsAgainstModel(
      [templatedProblem()],
      JOB_SEED,
      { fanoutCandidates: 8, fanoutKeep: 3 },
    );

    const [sample, ...hidden] = outcome.problems?.[0].test_cases ?? [];
    expect(sample.input_data).toBe("2\n1 2");

    for (const testCase of hidden) {
      expect(testCase.input_data).toBe("");
      expect(testCase.input_template).toEqual(arrayTemplate);
      const replayed = materializeTestCaseInputTemplate(arrayTemplate, {
        seedMaterial: testCase.generation_seed ?? "",
      }).inputData;
      expect(testCase.expected_output).toBe(sumOfSecondLine(replayed));
    }
  });

  it("is deterministic for the same job seed", async () => {
    sumReference();

    const first = await validateProblemsAgainstModel(
      [templatedProblem()],
      JOB_SEED,
    );
    const second = await validateProblemsAgainstModel(
      [templatedProblem()],
      JOB_SEED,
    );

    expect(first.problems).toEqual(second.problems);
  });

  it("keeps today's single case when fan-out keeps one per template", async () => {
    sumReference();

    const outcome = await validateProblemsAgainstModel(
      [templatedProblem()],
      JOB_SEED,
      { fanoutKeep: 1 },
    );

    expect(outcome.problems?.[0].test_cases).toHaveLength(2);
  });

  it("adds nothing for a template that can only produce one input", async () => {
    sumReference();
    const constTemplate: TestCaseInputTemplate = {
      version: 1,
      variables: {
        n: { type: "const", value: 3 },
        arr: { type: "const", value: [4, 5, 6] },
      },
      output: [
        { type: "line", values: [{ ref: "n" }] },
        { type: "line", values: [{ ref: "arr" }] },
      ],
    };

    const outcome = await validateProblemsAgainstModel(
      [templatedProblem(constTemplate)],
      JOB_SEED,
    );

    expect(outcome.ok).toBe(true);
    expect(outcome.problems?.[0].test_cases).toHaveLength(2);
    expect(outcome.problems?.[0].test_cases[1].expected_output).toBe("15");
  });

  it("skips extra inputs the reference fails on", async () => {
    let calls = 0;
    pistonExecuteMock.mockImplementation(async (payload: { stdin: string }) => {
      calls += 1;
      return calls <= 2
        ? pistonRun(`${sumOfSecondLine(payload.stdin)}\n`)
        : pistonRun("", 139);
    });

    const outcome = await validateProblemsAgainstModel(
      [templatedProblem()],
      JOB_SEED,
      { fanoutCandidates: 5, fanoutKeep: 3, concurrency: 1 },
    );

    expect(outcome.ok).toBe(true);
    expect(outcome.problems?.[0].test_cases).toHaveLength(2);
  });

  it("fails the job when the sandbox goes down while expanding", async () => {
    let calls = 0;
    pistonExecuteMock.mockImplementation(async (payload: { stdin: string }) => {
      calls += 1;
      if (calls <= 2) {
        return pistonRun(`${sumOfSecondLine(payload.stdin)}\n`);
      }
      throw new FakeInfrastructureError();
    });

    const outcome = await validateProblemsAgainstModel(
      [templatedProblem()],
      JOB_SEED,
      { concurrency: 1 },
    );

    expect(outcome.ok).toBe(false);
    expect(outcome.failure?.errorType).toBe("infrastructure_error");
  });

  it("never runs more sandbox jobs at once than allowed", async () => {
    let active = 0;
    let peak = 0;
    pistonExecuteMock.mockImplementation(async (payload: { stdin: string }) => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 2));
      active -= 1;
      return pistonRun(`${sumOfSecondLine(payload.stdin)}\n`);
    });

    const problem = templatedProblem();
    problem.test_cases.push(
      ...Array.from({ length: 4 }, () => ({ ...problem.test_cases[1] })),
    );

    const outcome = await validateProblemsAgainstModel([problem], JOB_SEED, {
      concurrency: 3,
    });

    expect(outcome.ok).toBe(true);
    expect(peak).toBeLessThanOrEqual(3);
    expect(peak).toBeGreaterThan(1);
  });
});
