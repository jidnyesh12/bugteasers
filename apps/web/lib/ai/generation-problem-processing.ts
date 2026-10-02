import { createHash } from "node:crypto";
import { TestCaseEvaluatorImpl } from "@/lib/execution/evaluator";
import { isPistonInfrastructureError } from "@/lib/execution/errors";
import { resolveRunMemoryLimitBytes } from "@/lib/execution/languages";
import {
  createConcurrencyLimiter,
  type ConcurrencyLimiter,
} from "@/lib/execution/concurrency";
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
import { deriveCaseSeed } from "./case-seeds";
import {
  hashInput,
  materializeFanoutCandidates,
  orderBySizeSpread,
} from "./hidden-case-fanout";
import type { GeneratedProblem, GeneratedTestCase } from "./types";

// Constants

/** Model answer validation always runs in C++. */
const MODEL_ANSWER_LANGUAGE = "cpp" as const;

/** Sentinel value placed by the LLM in hidden test cases. */
const AUTO_EXPECTED_OUTPUT_SENTINEL = "__AUTO_EXPECTED_OUTPUT__";

export const DEFAULT_FANOUT_CANDIDATES = 8;
export const DEFAULT_FANOUT_KEEP = 3;
export const DEFAULT_VALIDATION_CONCURRENCY = 4;

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

export interface ValidationOptions {
  fanoutCandidates?: number;
  fanoutKeep?: number;
  concurrency?: number;
}

// Annotation helper

export function annotateGeneratedProblems(
  problems: GeneratedProblem[],
  model: string,
  seed: string,
): GeneratedProblem[] {
  const generatedAt = new Date().toISOString();

  return problems.map((problem, problemIndex) => ({
    ...problem,
    test_cases: problem.test_cases.map((testCase, index) => {
      const caseSeed =
        testCase.generation_seed && testCase.generation_seed.trim().length > 0
          ? testCase.generation_seed
          : deriveCaseSeed(seed, problemIndex, index);

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

function resolvePositiveInteger(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : fallback;
}

// Per-test-case Oracle Execution

interface ExecutedTestCaseResult {
  ok: true;
  validatedTestCase: GeneratedTestCase;
  actualOutput: string;
  executedInput: string;
}

interface ExecutedTestCaseFailure {
  ok: false;
  failure: OracleValidationFailure;
}

type ReferenceFailureReason =
  | "compile"
  | "runtime"
  | "timeout"
  | "exception"
  | "infrastructure";

type ReferenceRun =
  | { ok: true; output: string }
  | {
      ok: false;
      reason: ReferenceFailureReason;
      detail: string;
      statusCode?: number;
    };

function errorTypeFor(reason: ReferenceFailureReason): OracleErrorType {
  switch (reason) {
    case "compile":
      return "compile_error";
    case "infrastructure":
      return "infrastructure_error";
    default:
      return "model_answer_error";
  }
}

interface ReferenceLimits {
  timeoutMs: number;
  memoryLimitBytes?: number;
}

async function runReference(
  input: string,
  solutionCode: string,
  caseSeed: string,
  limits: ReferenceLimits,
  schedule: ConcurrencyLimiter,
): Promise<ReferenceRun> {
  try {
    const oraclePair = createOraclePair(
      createTestCase(input, "", caseSeed, caseSeed, {}, 1),
      createModelAnswer(
        solutionCode,
        MODEL_ANSWER_LANGUAGE,
        caseSeed,
        "gemini-3-flash",
      ),
    );

    const validationResult = await schedule(() =>
      validateOraclePair(oraclePair, {
        ...DEFAULT_VALIDATOR_CONFIG,
        timeout: limits.timeoutMs,
        memoryLimitBytes: limits.memoryLimitBytes,
        maxDifferentialOracles: 1,
        confidenceThreshold: 0.8,
      }),
    );

    if (validationResult.modelAnswerStatus === "syntax_error") {
      return {
        ok: false,
        reason: "compile",
        detail:
          validationResult.diagnostics?.executionErrors?.[0] ||
          "Compilation error",
      };
    }

    if (validationResult.modelAnswerStatus === "runtime_error") {
      return {
        ok: false,
        reason: "runtime",
        detail:
          validationResult.diagnostics?.executionErrors?.[0] ||
          "Runtime error",
      };
    }

    if (validationResult.modelAnswerStatus === "timeout") {
      return {
        ok: false,
        reason: "timeout",
        detail: `Execution timed out after ${limits.timeoutMs}ms`,
      };
    }

    return { ok: true, output: validationResult.actualOutput || "" };
  } catch (error) {
    if (isPistonInfrastructureError(error)) {
      return {
        ok: false,
        reason: "infrastructure",
        detail: error.message,
        statusCode: error.statusCode,
      };
    }

    return {
      ok: false,
      reason: "exception",
      detail:
        error instanceof Error ? error.message : "Unknown execution failure",
    };
  }
}

function describeReferenceFailure(
  run: Extract<ReferenceRun, { ok: false }>,
): string {
  switch (run.reason) {
    case "compile":
      return `compile error - ${run.detail}`;
    case "runtime":
      return `runtime error - ${run.detail}`;
    case "timeout":
      return "execution timed out";
    case "exception":
      return `execution failed - ${run.detail}`;
    case "infrastructure":
      return (
        `Piston API infrastructure failure (HTTP ${run.statusCode}). ` +
        "The execution sandbox is unavailable — this is not a code error."
      );
  }
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
  caseSeed: string,
  limits: ReferenceLimits,
  evaluator: TestCaseEvaluatorImpl,
  schedule: ConcurrencyLimiter,
): Promise<ExecutedTestCaseResult | ExecutedTestCaseFailure> {
  const location = `Problem ${problemIndex + 1}, test case ${testCaseIndex + 1}`;

  // Phase 1: Materialization
  let expandedInput =
    typeof testCase.input_data === "string" ? testCase.input_data : "";
  let inputHash =
    typeof testCase.input_hash === "string" &&
    testCase.input_hash.trim().length > 0
      ? testCase.input_hash
      : createHash("sha256").update(expandedInput).digest("hex");

  if (testCase.input_template) {
    try {
      expandedInput = materializeTestCaseInputTemplate(
        testCase.input_template,
        { seedMaterial: caseSeed },
      ).inputData;
      inputHash = hashTemplateSpec(testCase.input_template);
    } catch (error) {
      return {
        ok: false,
        failure: {
          errorType: "materialization_error",
          message:
            `${location}: ` +
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
        message: `${location}: input_data is empty after template materialization.`,
        problemIndex,
        testCaseIndex,
        failedCode: solutionCode,
      },
    };
  }

  // Phase 2: Sandbox Hand-off (Piston execution)
  const run = await runReference(
    expandedInput,
    solutionCode,
    caseSeed,
    limits,
    schedule,
  );

  // Phase 3: Failure Attribution
  if (!run.ok) {
    return {
      ok: false,
      failure: {
        errorType: errorTypeFor(run.reason),
        message: `${location}: ${describeReferenceFailure(run)}`,
        problemIndex,
        testCaseIndex,
        ...(run.reason === "infrastructure"
          ? {}
          : { failedCode: solutionCode, inputData: expandedInput }),
        stderr: run.detail,
      },
    };
  }

  const expectedOutput =
    typeof testCase.expected_output === "string"
      ? testCase.expected_output
      : "";
  const persistedInput =
    testCase.input_template && !testCase.is_sample ? "" : expandedInput;

  return {
    ok: true,
    validatedTestCase: {
      ...testCase,
      input_data: persistedInput,
      expected_output: expectedOutput,
      generation_seed: caseSeed,
      input_hash: inputHash,
    },
    actualOutput: evaluator.normalizeOutput(run.output),
    executedInput: expandedInput,
  };
}

async function expandHiddenTemplateCase(params: {
  original: GeneratedTestCase;
  jobSeed: string;
  problemIndex: number;
  caseIndex: number;
  solutionCode: string;
  limits: ReferenceLimits;
  evaluator: TestCaseEvaluatorImpl;
  schedule: ConcurrencyLimiter;
  candidateCount: number;
  extraCount: number;
  seenInputHashes: Set<string>;
}): Promise<
  { ok: true; cases: GeneratedTestCase[] } | { ok: false; failure: OracleValidationFailure }
> {
  const { original, extraCount, seenInputHashes } = params;
  if (!original.input_template || extraCount <= 0) {
    return { ok: true, cases: [] };
  }

  const candidates = orderBySizeSpread(
    materializeFanoutCandidates({
      template: original.input_template,
      jobSeed: params.jobSeed,
      problemIndex: params.problemIndex,
      caseIndex: params.caseIndex,
      candidateCount: params.candidateCount,
    }),
  );

  const cases: GeneratedTestCase[] = [];

  for (const candidate of candidates) {
    if (cases.length >= extraCount) {
      break;
    }
    if (seenInputHashes.has(candidate.inputHash)) {
      continue;
    }
    seenInputHashes.add(candidate.inputHash);

    const run = await runReference(
      candidate.input,
      params.solutionCode,
      candidate.seed,
      params.limits,
      params.schedule,
    );

    if (!run.ok) {
      if (run.reason === "infrastructure") {
        return {
          ok: false,
          failure: {
            errorType: "infrastructure_error",
            message: `Problem ${params.problemIndex + 1}, test case ${params.caseIndex + 1}: ${describeReferenceFailure(run)}`,
            problemIndex: params.problemIndex,
            testCaseIndex: params.caseIndex,
            stderr: run.detail,
          },
        };
      }
      continue;
    }

    cases.push({
      ...original,
      input_data: "",
      expected_output: params.evaluator.normalizeOutput(run.output),
      is_sample: false,
      generation_seed: candidate.seed,
      input_hash: candidate.inputHash,
    });
  }

  return { ok: true, cases };
}

// Main Validation Orchestrator - Two-Pass Execution Model

export async function validateProblemsAgainstModel(
  problems: readonly GeneratedProblem[],
  seedMaterial: string,
  options: ValidationOptions = {},
): Promise<ValidationOutcome> {
  const evaluator = new TestCaseEvaluatorImpl();
  const schedule = createConcurrencyLimiter(
    resolvePositiveInteger(options.concurrency, DEFAULT_VALIDATION_CONCURRENCY),
  );
  const candidateCount = resolvePositiveInteger(
    options.fanoutCandidates,
    DEFAULT_FANOUT_CANDIDATES,
  );
  const extraCount =
    resolvePositiveInteger(options.fanoutKeep, DEFAULT_FANOUT_KEEP) - 1;
  const validatedProblems: GeneratedProblem[] = [];

  for (
    let problemIndex = 0;
    problemIndex < problems.length;
    problemIndex += 1
  ) {
    const problem = problems[problemIndex];
    const solutionCode = stripCppComments(problem.solution_code);
    const limits: ReferenceLimits = {
      timeoutMs: Math.min(Math.max(problem.time_limit || 2000, 500), 10_000),
      memoryLimitBytes: resolveRunMemoryLimitBytes(
        MODEL_ANSWER_LANGUAGE,
        problem.memory_limit,
      ),
    };

    const caseSeedFor = (testCase: GeneratedTestCase, index: number) =>
      testCase.generation_seed && testCase.generation_seed.trim().length > 0
        ? testCase.generation_seed
        : deriveCaseSeed(seedMaterial, problemIndex, index);

    const execute = (testCase: GeneratedTestCase, index: number) =>
      executeTestCaseAgainstOracle(
        testCase,
        solutionCode,
        problemIndex,
        index,
        caseSeedFor(testCase, index),
        limits,
        evaluator,
        schedule,
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

    const validatedTestCases: GeneratedTestCase[] = new Array(
      problem.test_cases.length,
    );
    const seenInputHashes = new Set<string>();

    // PASS 1: Sample test cases - verify AI-provided expected outputs

    const sampleCases = sampleIndices.map((tcIndex) => {
      const testCase = problem.test_cases[tcIndex];

      // Map __AUTO_EXPECTED_OUTPUT__ to examples[i].output for sample cases
      if (isAutoPlaceholder(testCase.expected_output)) {
        const materializedInput =
          typeof testCase.input_data === "string" ? testCase.input_data : "";
        const matchingExample = problem.examples.find(
          (ex) => ex.input === materializedInput,
        );
        if (matchingExample) {
          return { ...testCase, expected_output: matchingExample.output };
        }
      }

      return testCase;
    });

    const sampleResults = await Promise.all(
      sampleCases.map((testCase, position) =>
        execute(testCase, sampleIndices[position]),
      ),
    );

    for (let position = 0; position < sampleResults.length; position += 1) {
      const result = sampleResults[position];
      const tcIndex = sampleIndices[position];

      if (!result.ok) {
        return {
          ok: false,
          message: result.failure.message,
          failure: result.failure,
        };
      }

      // Normalize BOTH expected and actual outputs to handle trailing newlines, whitespace differences
      const providedExpected =
        typeof sampleCases[position].expected_output === "string"
          ? sampleCases[position].expected_output
          : "";
      const normalizedExpected = evaluator.normalizeOutput(providedExpected);
      const normalizedActual = evaluator.normalizeOutput(result.actualOutput);

      if (normalizedExpected !== normalizedActual) {
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
            inputData: result.executedInput,
          },
        };
      }

      seenInputHashes.add(hashInput(result.executedInput));
      validatedTestCases[tcIndex] = {
        ...result.validatedTestCase,
        expected_output: providedExpected,
      };
    }

    // PASS 2: Hidden test cases - derive expected outputs from Oracle execution
    const hiddenResults = await Promise.all(
      hiddenIndices.map((tcIndex) =>
        execute(problem.test_cases[tcIndex], tcIndex),
      ),
    );

    for (let position = 0; position < hiddenResults.length; position += 1) {
      const result = hiddenResults[position];

      if (!result.ok) {
        return {
          ok: false,
          message: result.failure.message,
          failure: result.failure,
        };
      }

      seenInputHashes.add(hashInput(result.executedInput));
      validatedTestCases[hiddenIndices[position]] = {
        ...result.validatedTestCase,
        expected_output: result.actualOutput,
      };
    }

    const expansions = await Promise.all(
      hiddenIndices.map((tcIndex) =>
        expandHiddenTemplateCase({
          original: validatedTestCases[tcIndex],
          jobSeed: seedMaterial,
          problemIndex,
          caseIndex: tcIndex,
          solutionCode,
          limits,
          evaluator,
          schedule,
          candidateCount,
          extraCount,
          seenInputHashes,
        }),
      ),
    );

    const extrasByIndex = new Map<number, GeneratedTestCase[]>();
    for (let position = 0; position < expansions.length; position += 1) {
      const expansion = expansions[position];
      if (!expansion.ok) {
        return {
          ok: false,
          message: expansion.failure.message,
          failure: expansion.failure,
        };
      }
      extrasByIndex.set(hiddenIndices[position], expansion.cases);
    }

    validatedProblems.push({
      ...problem,
      test_cases: validatedTestCases.flatMap((testCase, index) => [
        testCase,
        ...(extrasByIndex.get(index) ?? []),
      ]),
    });
  }

  return {
    ok: true,
    problems: validatedProblems,
  };
}
