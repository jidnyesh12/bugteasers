import type {
  OraclePair,
  OracleValidationResult,
  ExecutionResult,
  OutputMismatch,
  FailureAttribution,
  TestCaseStatus,
  ModelAnswerStatus,
  MaterializedTestCaseWithVariables,
} from "./types";
import { ConstraintLevel } from "./types";
import type { DSLConstraint } from "./types";
import type { TestCaseInputTemplate } from "../template-dsl/types";
import { ConstraintRegistry } from "./constraints";

/**
 * Validator configuration
 */
export interface ValidatorConfig {
  timeout: number; // ms - max execution time
  maxDifferentialOracles: number; // max reference implementations to try
  confidenceThreshold: number; // 0-1: when to escalate vs auto-repair
  outputMaxLength: number; // max characters to compare
  strictDeterminism: boolean; // fail on non-determinism
}

export const DEFAULT_VALIDATOR_CONFIG: ValidatorConfig = {
  timeout: 5000,
  maxDifferentialOracles: 3,
  confidenceThreshold: 0.85,
  outputMaxLength: 100_000,
  strictDeterminism: true,
};

/**
 * Comprehensive oracle validation result with diagnostics
 */
export interface ValidationDiagnostics {
  constraintViolations: Array<{
    constraint: string;
    level: string;
    reason: string;
  }>;
  executionErrors: Array<{ type: string; message: string }>;
  nonDeterminismDetected: boolean;
  differentialOracleResults?: Array<{
    name: string;
    output: string;
    matches: boolean;
    error?: string;
  }>;
  outputDiffContext: string;
}

/**
 * Validate hard constraints on test case
 *
 * Hard constraints = violations make test invalid (cannot repair)
 */
export function validateHardConstraints(
  testCase: MaterializedTestCaseWithVariables,
  constraints?: DSLConstraint[],
): { valid: boolean; violations: DSLConstraint[] } {
  const registry = ConstraintRegistry.getInstance();
  const constraintsToCheck =
    constraints ?? registry.getByLevel(ConstraintLevel.HARD);

  const violations: DSLConstraint[] = [];

  for (const constraint of constraintsToCheck) {
    try {
      const satisfied = constraint.check(testCase);
      if (!satisfied) {
        violations.push(constraint);
      }
    } catch {
      // Treat check failures as violations
      violations.push(constraint);
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Validate soft constraints on test case
 *
 * Soft constraints = violations trigger warnings + repair attempts
 */
export function validateSoftConstraints(
  testCase: MaterializedTestCaseWithVariables,
  constraints?: DSLConstraint[],
): {
  valid: boolean;
  violations: DSLConstraint[];
  repairable: DSLConstraint[];
} {
  const registry = ConstraintRegistry.getInstance();
  const constraintsToCheck =
    constraints ?? registry.getByLevel(ConstraintLevel.SOFT);

  const violations: DSLConstraint[] = [];
  const repairable: DSLConstraint[] = [];

  for (const constraint of constraintsToCheck) {
    try {
      const satisfied = constraint.check(testCase);
      if (!satisfied) {
        violations.push(constraint);
        if (constraint.repair) {
          repairable.push(constraint);
        }
      }
    } catch {
      violations.push(constraint);
    }
  }

  return {
    valid: violations.length === 0,
    violations,
    repairable,
  };
}

/**
 * Compare expected vs actual output
 *
 * Returns detailed mismatch info for attribution
 */
export function compareOutputs(
  expected: string,
  actual: string,
  maxLength: number = 100_000,
): {
  matches: boolean;
  mismatch?: OutputMismatch; // <-- Kept your strict typing here!
  context: string;
} {
  // 1. CP Normalization: Trim outer whitespace and standardize newlines
  const normalize = (str: string) => str.trim().replace(/\r\n/g, "\n");

  // Apply normalization and cut to max length
  const exp = normalize(expected).substring(0, maxLength);
  const act = normalize(actual).substring(0, maxLength);

  // Equality check
  if (exp === act) {
    return { matches: true, context: "" };
  }

  // Find first difference for debugging
  let diffStart = 0;
  for (let i = 0; i < Math.min(exp.length, act.length); i++) {
    if (exp[i] !== act[i]) {
      diffStart = i;
      break;
    }
  }

  if (diffStart === Math.min(exp.length, act.length)) {
    diffStart = Math.min(exp.length, act.length);
  }

  const contextStart = Math.max(0, diffStart - 20);
  const contextEnd = Math.min(Math.max(exp.length, act.length), diffStart + 20);
  const context = `Expected[${contextStart}:${contextEnd}]: "${exp.substring(contextStart, contextEnd)}" vs Actual: "${act.substring(contextStart, contextEnd)}"`;

  return {
    matches: false,
    mismatch: {
      expected: exp,
      actual: act,
      expectedLength: expected.length,
      actualLength: actual.length,
      diffStart,
      context,
    },
    context,
  };
}
/**
 * Attribute failure to test case or model answer
 *
 * Uses heuristics:
 * - If constraints violated → test case error
 * - If execution error → model answer error
 * - If output mismatch → differential oracle to decide
 */
export function attributeFailure(params: {
  testCaseStatus: TestCaseStatus;
  modelAnswerStatus: ModelAnswerStatus;
  hardConstraintViolations: number;
  softConstraintViolations: number;
  executionErrors?: number;
}): { attribution: FailureAttribution; confidence: number } {
  const {
    testCaseStatus,
    modelAnswerStatus,
    hardConstraintViolations,
    softConstraintViolations,
  } = params;

  // If hard constraints violated → definitely test case error
  if (hardConstraintViolations > 0) {
    return { attribution: "test_case_error", confidence: 0.95 };
  }

  // If execution error or timeout → model answer error
  if (
    modelAnswerStatus === "runtime_error" ||
    modelAnswerStatus === "timeout"
  ) {
    return { attribution: "model_answer_error", confidence: 0.9 };
  }

  // If syntax error in answer → model answer error
  if (modelAnswerStatus === "syntax_error") {
    return { attribution: "model_answer_error", confidence: 0.85 };
  }

  // If soft constraints violated → slight bias to test case error
  if (softConstraintViolations > 0) {
    return { attribution: "test_case_error", confidence: 0.6 };
  }

  // If both statuses are valid but mismatched output → needs differential oracle
  if (testCaseStatus === "valid" && modelAnswerStatus === "correct") {
    return { attribution: "unknown", confidence: 0.0 };
  }

  // Default: unknown
  return { attribution: "unknown", confidence: 0.3 };
}

/**
 * Main bidirectional oracle validation function
 *
 * Validates test case constraints + model answer execution
 * Returns comprehensive result with diagnostics
 */
export async function validateOraclePair(
  pair: OraclePair,
  config: ValidatorConfig = DEFAULT_VALIDATOR_CONFIG,
): Promise<OracleValidationResult> {
  const diagnostics: ValidationDiagnostics = {
    constraintViolations: [],
    executionErrors: [],
    nonDeterminismDetected: false,
    outputDiffContext: "",
  };

  // Phase 1: Validate test case constraints
  let testCaseStatus: TestCaseStatus = "valid";
  const hardResult = validateHardConstraints({
    inputData: pair.testCase.inputData,
    expectedOutput: pair.testCase.expectedOutput,
    resolvedSeed: pair.testCase.resolvedSeed,
    variables: pair.testCase.variables,
    template: {} as TestCaseInputTemplate,
  });

  if (!hardResult.valid) {
    testCaseStatus = "constraint_violation";
    diagnostics.constraintViolations = hardResult.violations.map((c) => ({
      constraint: c.name,
      level: "HARD",
      reason: c.description,
    }));
  }

  const softResult = validateSoftConstraints({
    inputData: pair.testCase.inputData,
    expectedOutput: pair.testCase.expectedOutput,
    resolvedSeed: pair.testCase.resolvedSeed,
    variables: pair.testCase.variables,
    template: {} as TestCaseInputTemplate,
  });

  if (!softResult.valid && testCaseStatus === "valid") {
    testCaseStatus = "constraint_violation";
    diagnostics.constraintViolations.push(
      ...softResult.violations.map((c) => ({
        constraint: c.name,
        level: "SOFT",
        reason: c.description,
      })),
    );
  }

  // Phase 2: Execute model answer via Piston
  let modelAnswerStatus: ModelAnswerStatus = "correct";
  let executionResult: ExecutionResult | undefined;
  let actualOutput = "";

  try {
    const { executeCode, DEFAULT_EXECUTOR_CONFIG } = await import("./executor");
    executionResult = await executeCode(
      pair.modelAnswer,
      pair.testCase.inputData,
      {
        ...DEFAULT_EXECUTOR_CONFIG,
        timeout: config.timeout,
        // Never inject RNG seeding into the model answer — the AI's solution code
        // is self-contained (reads stdin, writes stdout). prepareCodeForExecution
        // was prepending srand() at C++ global scope, causing compile errors.
        seedRNG: false,
      },
    );

    actualOutput = executionResult.output;

    if (executionResult.status === "timeout") {
      modelAnswerStatus = "timeout";
      diagnostics.executionErrors.push({
        type: "TIMEOUT",
        message: `Execution timed out after ${config.timeout}ms`,
      });
    } else if (
      executionResult.status === "error" ||
      executionResult.exitCode !== 0
    ) {
      modelAnswerStatus = "runtime_error";
      diagnostics.executionErrors.push({
        type: "RUNTIME_ERROR",
        message:
          executionResult.stderr ||
          `Non-zero exit code: ${executionResult.exitCode}`,
      });
    }
  } catch (error) {
    modelAnswerStatus = "runtime_error";
    diagnostics.executionErrors.push({
      type: "EXECUTION_FAILED",
      message: error instanceof Error ? error.message : String(error),
    });
  }

  // Phase 3: Compare outputs
  const comparison = compareOutputs(
    pair.testCase.expectedOutput,
    actualOutput,
    config.outputMaxLength,
  );
  const outputMatch = comparison.matches;
  diagnostics.outputDiffContext = comparison.context;

  // Phase 4: Attribute failure
  const attributionResult = attributeFailure({
    testCaseStatus,
    modelAnswerStatus,
    hardConstraintViolations: hardResult.violations.length,
    softConstraintViolations: softResult.violations.length,
    executionErrors: diagnostics.executionErrors.length,
  });

  // Phase 5: Build result
  const isConsistent =
    testCaseStatus === "valid" &&
    modelAnswerStatus === "correct" &&
    outputMatch;

  const result: OracleValidationResult = {
    version: 1,
    oraclePairId: `${pair.generationSeed}`,
    generationSeed: pair.generationSeed,
    timestamp: new Date().toISOString(),

    isConsistent,

    testCaseStatus,
    modelAnswerStatus,
    executionResult,

    expectedOutput: pair.testCase.expectedOutput,
    actualOutput,
    outputMatch,
    mismatch: comparison.mismatch,

    failureAttributed: attributionResult.attribution,
    confidence: attributionResult.confidence,

    diagnostics: {
      constraintViolations: diagnostics.constraintViolations.map(
        (c) => c.constraint,
      ),
      executionErrors: diagnostics.executionErrors.map((e) => e.message),
      nonDeterminismDetected: diagnostics.nonDeterminismDetected,
    },
  };

  return result;
}

/**
 * Validate oracle pair with full determinism check
 *
 * Runs validation twice with same seed, ensures identical results
 */
export async function validateOraclePairWithDeterminismCheck(
  pair: OraclePair,
  config: ValidatorConfig = DEFAULT_VALIDATOR_CONFIG,
): Promise<OracleValidationResult> {
  const result1 = await validateOraclePair(pair, config);
  const result2 = await validateOraclePair(pair, config);

  // Check determinism
  if (
    result1.actualOutput !== result2.actualOutput ||
    result1.outputMatch !== result2.outputMatch ||
    result1.failureAttributed !== result2.failureAttributed
  ) {
    // Non-determinism detected
    if (!result1.diagnostics) {
      result1.diagnostics = {
        constraintViolations: [],
        executionErrors: [],
        nonDeterminismDetected: true,
      };
    } else {
      result1.diagnostics.nonDeterminismDetected = true;
    }
    result1.failureAttributed = "non_determinism";
    result1.confidence = 0.0;
  }

  return result1;
}
