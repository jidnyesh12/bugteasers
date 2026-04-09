import { createHash } from "node:crypto";
import { TestCaseEvaluatorImpl } from "@/lib/execution/evaluator";
import { PistonInfrastructureError } from "@/lib/execution/client";
import {
  hasUnresolvedPlaceholder,
  hashTemplateSpec,
  materializeTestCaseInputTemplate,
} from "@/lib/ai/template-dsl";
import {
  createTestCase,
  createModelAnswer,
  createOraclePair,
} from "@/lib/ai/oracle-pairs";
import {
  validateOraclePair,
  DEFAULT_VALIDATOR_CONFIG,
} from "@/lib/ai/oracle-pairs/validator";
import type { GeneratedProblem, GeneratedTestCase } from "./types";

// Constants

/** Model answer validation always runs in C++. */
const MODEL_ANSWER_LANGUAGE = "cpp" as const;

/** Sentinel value placed by the LLM in hidden test cases. */
const AUTO_EXPECTED_OUTPUT_SENTINEL = "__AUTO_EXPECTED_OUTPUT__";

// Error Types

/** Discriminated error types the Oracle Pipeline can produce. */
export type OracleErrorType =
  | "compile_error"
  | "model_answer_error"
  | "logic_consistency_error"
  | "materialization_error"
  | "infrastructure_error";

/**
 * Structured failure payload returned by the validation pipeline.
 * Carries all the context the Repair Loop needs to build an LLM prompt.
 */
export interface OracleValidationFailure {
  errorType: OracleErrorType;
  message: string;
  problemIndex: number;
  testCaseIndex: number;
  /** The C++ code that failed (for repair prompt context). */
  failedCode?: string;
  /** Compiler / runtime stderr (for repair prompt context). */
  stderr?: string;
  /** Expected output (for logic_consistency_error context). */
  expectedOutput?: string;
  /** Actual output from Piston (for logic_consistency_error context). */
  actualOutput?: string;
  /** The input that produced the mismatch (for repair prompt context). */
  inputData?: string;
}

export interface ValidationOutcome {
  ok: boolean;
  message?: string;
  problems?: GeneratedProblem[];
  /** Present when ok === false — carries structured failure data for the Repair Loop. */
  failure?: OracleValidationFailure;
}

// Annotation helper

export function annotateGeneratedProblems(
  problems: GeneratedProblem[],
  model: string,
  seed: string,
): GeneratedProblem[] {
  const generatedAt = new Date().toISOString();

  return problems.map((problem) => ({
    ...problem,
    test_cases: problem.test_cases.map((testCase, index) => {
      const caseSeed =
        testCase.generation_seed && testCase.generation_seed.trim().length > 0
          ? testCase.generation_seed
          : `${seed}:problem-${problem.title}:case-${index + 1}`;

      const templateHash = testCase.input_template
        ? hashTemplateSpec(testCase.input_template)
        : null;

      const inputHash =
        templateHash ??
        createHash("sha256")
          .update(
            typeof testCase.input_data === "string" ? testCase.input_data : "",
          )
          .digest("hex");

      return {
        ...testCase,
        generated_at: generatedAt,
        generation_model: model,
        generation_seed: caseSeed,
        is_generated: true,
        input_hash: inputHash,
      };
    }),
  }));
}

// Internal helpers

/** Strip single-line and multi-line comments from C++ source code. */
function stripCppComments(code: string): string {
  let result = code.replace(/\/\*[\s\S]*?\*\//g, "");
  result = result.replace(/\/\/.*/g, "");
  return result;
}

/** Check if an expected_output value is a placeholder that the Oracle must fill. */
function isAutoPlaceholder(expectedOutput: string): boolean {
  const trimmed = expectedOutput.trim();
  return (
    trimmed.length === 0 ||
    trimmed === AUTO_EXPECTED_OUTPUT_SENTINEL ||
    hasUnresolvedPlaceholder(trimmed)
  );
}

// Per-test-case Oracle Execution

interface ExecutedTestCaseResult {
  ok: true;
  validatedTestCase: GeneratedTestCase;
  actualOutput: string;
}

interface ExecutedTestCaseFailure {
  ok: false;
  failure: OracleValidationFailure;
}

/**
 * Materializes a single test case, sends C++ code to Piston, and returns
 * the execution result. This encapsulates Phases 1–3 for a single test case.
 */
async function executeTestCaseAgainstOracle(
  testCase: GeneratedTestCase,
  solutionCode: string,
  problemIndex: number,
  testCaseIndex: number,
  seedMaterial: string,
  runTimeout: number,
  evaluator: TestCaseEvaluatorImpl,
): Promise<ExecutedTestCaseResult | ExecutedTestCaseFailure> {
  const referenceLanguage = MODEL_ANSWER_LANGUAGE;
  const fallbackSeed =
    testCase.generation_seed && testCase.generation_seed.trim().length > 0
      ? testCase.generation_seed
      : `${seedMaterial}:problem-${problemIndex + 1}:case-${testCaseIndex + 1}`;

  // Phase 1: Materialization
  let expandedInput =
    typeof testCase.input_data === "string" ? testCase.input_data : "";
  let persistedInput = expandedInput;
  let inputHash =
    typeof testCase.input_hash === "string" &&
    testCase.input_hash.trim().length > 0
      ? testCase.input_hash
      : createHash("sha256").update(expandedInput).digest("hex");

  if (testCase.input_template) {
    try {
      const materialized = materializeTestCaseInputTemplate(
        testCase.input_template,
        {
          seedMaterial: fallbackSeed,
        },
      );
      expandedInput = materialized.inputData;
      inputHash = hashTemplateSpec(testCase.input_template);
      persistedInput = expandedInput;
    } catch (error) {
      return {
        ok: false,
        failure: {
          errorType: "materialization_error",
          message:
            `Problem ${problemIndex + 1}, test case ${testCaseIndex + 1}: ` +
            `template materialization failed - ${error instanceof Error ? error.message : "Unknown template error"}`,
          problemIndex,
          testCaseIndex,
          failedCode: solutionCode,
        },
      };
    }
  }

  if (expandedInput.trim().length === 0) {
    return {
      ok: false,
      failure: {
        errorType: "materialization_error",
        message:
          `Problem ${problemIndex + 1}, test case ${testCaseIndex + 1}: ` +
          "input_data is empty after template materialization.",
        problemIndex,
        testCaseIndex,
        failedCode: solutionCode,
      },
    };
  }

  // Phase 2: Sandbox Hand-off (Piston execution)
  const expectedOutput =
    typeof testCase.expected_output === "string"
      ? testCase.expected_output
      : "";
  const shouldAutoDeriveExpected = isAutoPlaceholder(expectedOutput);

  try {
    const oraclePair = createOraclePair(
      createTestCase(
        expandedInput,
        shouldAutoDeriveExpected ? "" : expectedOutput,
        fallbackSeed,
        fallbackSeed,
        {},
        1,
      ),
      createModelAnswer(
        solutionCode,
        referenceLanguage,
        fallbackSeed,
        "gemini-3-flash",
      ),
    );

    const validationResult = await validateOraclePair(oraclePair, {
      ...DEFAULT_VALIDATOR_CONFIG,
      timeout: runTimeout,
      maxDifferentialOracles: 1,
      confidenceThreshold: 0.8,
    });

    // Phase 3: Failure Attribution
    if (validationResult.modelAnswerStatus === "syntax_error") {
      const errMsg =
        validationResult.diagnostics?.executionErrors?.[0] ||
        "Compilation error";
      return {
        ok: false,
        failure: {
          errorType: "compile_error",
          message: `Problem ${problemIndex + 1}, test case ${testCaseIndex + 1}: compile error - ${errMsg}`,
          problemIndex,
          testCaseIndex,
          failedCode: solutionCode,
          stderr: errMsg,
          inputData: expandedInput,
        },
      };
    }

    if (validationResult.modelAnswerStatus === "runtime_error") {
      const errMsg =
        validationResult.diagnostics?.executionErrors?.[0] || "Runtime error";
      return {
        ok: false,
        failure: {
          errorType: "model_answer_error",
          message: `Problem ${problemIndex + 1}, test case ${testCaseIndex + 1}: runtime error - ${errMsg}`,
          problemIndex,
          testCaseIndex,
          failedCode: solutionCode,
          stderr: errMsg,
          inputData: expandedInput,
        },
      };
    }

    if (validationResult.modelAnswerStatus === "timeout") {
      return {
        ok: false,
        failure: {
          errorType: "model_answer_error",
          message: `Problem ${problemIndex + 1}, test case ${testCaseIndex + 1}: execution timed out`,
          problemIndex,
          testCaseIndex,
          failedCode: solutionCode,
          stderr: `Execution timed out after ${runTimeout}ms`,
          inputData: expandedInput,
        },
      };
    }

    const normalizedActual = evaluator.normalizeOutput(
      validationResult.actualOutput || "",
    );

    return {
      ok: true,
      validatedTestCase: {
        ...testCase,
        input_data: persistedInput,
        expected_output: expectedOutput, // will be overwritten in Phase 4 where applicable
        generation_seed: fallbackSeed,
        input_hash: inputHash,
      },
      actualOutput: normalizedActual,
    };
  } catch (error) {
    // ── Infrastructure errors (Piston 503, HTML pages) → DO NOT REPAIR ──
    if (error instanceof PistonInfrastructureError) {
      return {
        ok: false,
        failure: {
          errorType: "infrastructure_error",
          message:
            `Problem ${problemIndex + 1}, test case ${testCaseIndex + 1}: ` +
            `Piston API infrastructure failure (HTTP ${error.statusCode}). ` +
            `The execution sandbox is unavailable — this is not a code error.`,
          problemIndex,
          testCaseIndex,
          stderr: error.message,
        },
      };
    }

    return {
      ok: false,
      failure: {
        errorType: "model_answer_error",
        message:
          `Problem ${problemIndex + 1}, test case ${testCaseIndex + 1}: execution failed - ` +
          `${error instanceof Error ? error.message : "Unknown execution failure"}`,
        problemIndex,
        testCaseIndex,
        failedCode: solutionCode,
        stderr: error instanceof Error ? error.message : undefined,
        inputData: expandedInput,
      },
    };
  }
}

// Main Validation Orchestrator - Two-Pass Execution Model

export async function validateProblemsAgainstModel(
  problems: readonly GeneratedProblem[],
  seedMaterial: string,
): Promise<ValidationOutcome> {
  const evaluator = new TestCaseEvaluatorImpl();
  const validatedProblems: GeneratedProblem[] = [];

  for (
    let problemIndex = 0;
    problemIndex < problems.length;
    problemIndex += 1
  ) {
    const problem = problems[problemIndex];
    const solutionCode = stripCppComments(problem.solution_code);
    const runTimeout = Math.min(
      Math.max(problem.time_limit || 2000, 500),
      10_000,
    );

    // Partition test cases by is_sample
    const sampleIndices: number[] = [];
    const hiddenIndices: number[] = [];
    for (let i = 0; i < problem.test_cases.length; i++) {
      if (problem.test_cases[i].is_sample) {
        sampleIndices.push(i);
      } else {
        hiddenIndices.push(i);
      }
    }

    // Accumulate validated test cases (ordered: samples first, then hidden)
    const validatedTestCases: GeneratedTestCase[] = new Array(
      problem.test_cases.length,
    );

    // PASS 1: Sample test cases - verify AI-provided expected outputs

    for (const tcIndex of sampleIndices) {
      const testCase = problem.test_cases[tcIndex];

      // Map __AUTO_EXPECTED_OUTPUT__ to examples[i].output for sample cases
      if (testCase.is_sample && isAutoPlaceholder(testCase.expected_output)) {
        const materializedInput =
          typeof testCase.input_data === "string" ? testCase.input_data : "";
        const matchingExample = problem.examples.find(
          (ex) => ex.input === materializedInput,
        );
        if (matchingExample) {
          testCase.expected_output = matchingExample.output;
        }
      }

      const result = await executeTestCaseAgainstOracle(
        testCase,
        solutionCode,
        problemIndex,
        tcIndex,
        seedMaterial,
        runTimeout,
        evaluator,
      );

      if (!result.ok) {
        return {
          ok: false,
          message: result.failure.message,
          failure: result.failure,
        };
      }

      // Normalize both expected and actual outputs for comparison
      const providedExpected =
        typeof testCase.expected_output === "string"
          ? testCase.expected_output
          : "";
      // Normalize BOTH expected and actual outputs to handle trailing newlines, whitespace differences
      const normalizedExpected = evaluator.normalizeOutput(providedExpected);
      const normalizedActual = evaluator.normalizeOutput(result.actualOutput);
      const isMatch = normalizedExpected === normalizedActual;

      if (!isMatch) {
        return {
          ok: false,
          message:
            `Problem ${problemIndex + 1}, test case ${tcIndex + 1}: ` +
            `sample output mismatch (logic_consistency_error). ` +
            `Expected "${normalizedExpected}" but Oracle returned "${normalizedActual}".`,
          failure: {
            errorType: "logic_consistency_error",
            message: `Sample test case ${tcIndex + 1}: Expected "${normalizedExpected}" but Oracle returned "${normalizedActual}"`,
            problemIndex,
            testCaseIndex: tcIndex,
            failedCode: solutionCode,
            expectedOutput: normalizedExpected,
            actualOutput: normalizedActual,
            inputData: result.validatedTestCase.input_data,
          },
        };
      }

      // Sample case verified
      validatedTestCases[tcIndex] = {
        ...result.validatedTestCase,
        expected_output: providedExpected,
      };
    }

    // PASS 2: Hidden test cases - derive expected outputs from Oracle execution
    for (const tcIndex of hiddenIndices) {
      const testCase = problem.test_cases[tcIndex];

      const result = await executeTestCaseAgainstOracle(
        testCase,
        solutionCode,
        problemIndex,
        tcIndex,
        seedMaterial,
        runTimeout,
        evaluator,
      );

      if (!result.ok) {
        return {
          ok: false,
          message: result.failure.message,
          failure: result.failure,
        };
      }

      // Derive expected output from Oracle execution
      validatedTestCases[tcIndex] = {
        ...result.validatedTestCase,
        expected_output: result.actualOutput,
      };
    }

    validatedProblems.push({
      ...problem,
      test_cases: validatedTestCases,
    });
  }

  return {
    ok: true,
    problems: validatedProblems,
  };
}
