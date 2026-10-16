// Test case evaluation and scoring logic

import type {
  TestCaseEvaluator,
  ExecutionResponse,
  TestCase,
  TestResult,
  ScoreResult,
  ExecutionResult,
} from "./types";

const OUT_OF_MEMORY_EXIT_CODE = 137;

export const RUN_FAILURE = {
  timeLimit: "Time limit exceeded",
  memoryLimit: "Memory limit exceeded",
  outputLimit: "Output limit exceeded",
  runtime: "Runtime error",
} as const;

export function describeRunFailure(run: ExecutionResult): string {
  switch (run.status) {
    case "TO":
      return RUN_FAILURE.timeLimit;
    case "OL":
    case "EL":
      return RUN_FAILURE.outputLimit;
    case "RE":
      if (run.code === OUT_OF_MEMORY_EXIT_CODE) {
        return RUN_FAILURE.memoryLimit;
      }
      return run.stderr || run.message || RUN_FAILURE.runtime;
    default:
      return run.stderr || run.message || RUN_FAILURE.runtime;
  }
}

const HIDDEN_SAFE_ERRORS = new Set<string>(Object.values(RUN_FAILURE));

export function redactHiddenResult(
  result: TestResult,
  keepError: boolean,
): TestResult {
  return {
    ...result,
    actualOutput: "",
    expectedOutput: "",
    outputsTruncated: undefined,
    error:
      keepError ||
      result.error === undefined ||
      HIDDEN_SAFE_ERRORS.has(result.error)
        ? result.error
        : RUN_FAILURE.runtime,
  };
}

export class TestCaseEvaluatorImpl implements TestCaseEvaluator {
  // Normalize output by standardizing whitespace and line endings
  normalizeOutput(output: string): string {
    return output
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n")
      .map((line) => line.trimEnd())
      .join("\n")
      .trim();
  }

  // Evaluate a single test case against execution response
  evaluateTestCase(
    executionResponse: ExecutionResponse,
    testCase: TestCase,
  ): TestResult {
    // Check for compilation errors
    if (executionResponse.compile && executionResponse.compile.code !== 0) {
      return {
        testCaseId: testCase.id,
        passed: false,
        actualOutput:
          executionResponse.compile.stderr || executionResponse.compile.output,
        expectedOutput: testCase.expectedOutput,
        pointsEarned: 0,
        pointsAvailable: testCase.points,
        error: executionResponse.compile.stderr || "Compilation failed",
      };
    }

    // Check for runtime errors
    if (executionResponse.run.code !== 0) {
      return {
        testCaseId: testCase.id,
        passed: false,
        actualOutput:
          executionResponse.run.stdout || executionResponse.run.output,
        expectedOutput: testCase.expectedOutput,
        pointsEarned: 0,
        pointsAvailable: testCase.points,
        error: describeRunFailure(executionResponse.run),
      };
    }

    // Normalize outputs for comparison
    const actualOutput = executionResponse.run.stdout;
    const normalizedActual = this.normalizeOutput(actualOutput);
    const normalizedExpected = this.normalizeOutput(testCase.expectedOutput);

    // Compare normalized outputs
    const passed = normalizedActual === normalizedExpected;

    return {
      testCaseId: testCase.id,
      passed,
      actualOutput,
      expectedOutput: testCase.expectedOutput,
      pointsEarned: passed ? testCase.points : 0,
      pointsAvailable: testCase.points,
    };
  }

  // Calculate aggregate score from multiple test results
  calculateScore(results: TestResult[]): ScoreResult {
    const totalPoints = results.reduce((sum, r) => sum + r.pointsAvailable, 0);
    const earnedPoints = results.reduce((sum, r) => sum + r.pointsEarned, 0);

    const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

    let status: "passed" | "failed" | "partial";
    if (earnedPoints === totalPoints) {
      status = "passed";
    } else if (earnedPoints === 0) {
      status = "failed";
    } else {
      status = "partial";
    }

    return {
      totalPoints,
      earnedPoints,
      percentage,
      status,
    };
  }
}

// Create a test case evaluator instance
export function createTestCaseEvaluator(): TestCaseEvaluator {
  return new TestCaseEvaluatorImpl();
}
