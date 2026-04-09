/**
 * Oracle Pair Types: Definition of oracle pairs (test case + model answer)
 * and validation results for bidirectional oracle validation.
 *
 * Core concept: An oracle pair (T, A) consists of a test case (input + expected output)
 * and a model answer (reference implementation). Both are generated from the same
 * generation_seed to ensure reproducibility.
 */

import type {
  TemplateGeneratedValue,
  TestCaseInputTemplate,
} from "../template-dsl/types";

export type { TemplateGeneratedValue, TestCaseInputTemplate };

export const ORACLE_PAIR_VERSION = 1;

/**
 * Constraint Level: Severity of constraint violation
 * - HARD: Violation makes test case invalid (must be fixed)
 * - SOFT: Violation is a warning (can be repaired automatically)
 * - DISTRIBUTION: Validity measured at batch level, not single case
 */
export enum ConstraintLevel {
  HARD = "hard",
  SOFT = "soft",
  DISTRIBUTION = "distribution",
}

/**
 * Constraint Check Result: Outcome of a single constraint check
 */
export type ConstraintCheckOutcome = "satisfied" | "violated" | "unknown";

/**
 * DSL Constraint Definition
 */
export interface DSLConstraint {
  version: number;
  level: ConstraintLevel;
  name: string;
  description: string;
  /** Check function: true if constraint is satisfied */
  check: (testCase: MaterializedTestCaseWithVariables) => boolean;
  /** Repair function (for soft constraints only) */
  repair?: (
    testCase: MaterializedTestCaseWithVariables,
  ) => MaterializedTestCaseWithVariables;
  /** Max repair attempts before giving up */
  maxRepairAttempts?: number;
  /** Categories: bounds, structure, output, etc. */
  category: "bounds" | "structure" | "output" | "other";
}

/**
 * Constraint Check Result for a single constraint
 */
export interface ConstraintCheck {
  constraint: DSLConstraint;
  outcome: ConstraintCheckOutcome;
  repaired: boolean;
  repairAttempts: number;
}

/**
 * Complete constraint validation result for a test case
 */
export interface ConstraintValidationResult {
  testCaseId: string;
  generationSeed: string;
  timestamp: string;
  checks: ConstraintCheck[];
  summary: {
    hardViolations: ConstraintCheck[];
    softViolations: ConstraintCheck[];
    unknown: ConstraintCheck[];
    allSatisfied: boolean;
  };
  repairLog?: {
    attemptedRepairs: Array<{
      constraint: DSLConstraint;
      attempt: number;
      success: boolean;
      error?: string;
    }>;
    finalState:
      | "valid"
      | "violated_impossible_to_repair"
      | "exceeded_max_attempts";
  };
}

/**
 * Materialized Test Case with constraint context
 */
export interface MaterializedTestCaseWithVariables {
  inputData: string;
  expectedOutput: string;
  resolvedSeed: string;
  variables: Record<string, TemplateGeneratedValue>;
  template: TestCaseInputTemplate;
  constraints?: ConstraintValidationResult;
}

/**
 * Test Case (part of oracle pair)
 */
export interface TestCase {
  inputData: string;
  expectedOutput: string;
  generationSeed: string;
  resolvedSeed: string;
  variables: Record<string, TemplateGeneratedValue>;
  version: number;
  templateVersion?: number;
}

/**
 * Supported Programming Languages
 */
export type SupportedLanguage =
  | "python"
  | "cpp"
  | "java"
  | "javascript"
  | "typescript"
  | "csharp"
  | "go"
  | "rust";

/**
 * Model Answer (reference implementation)
 */
export interface ModelAnswer {
  code: string;
  language: SupportedLanguage;
  generationSeed: string;
  version: number;
  modelName?: string; // e.g., 'gpt-3.5-turbo', 'claude-3-opus'
  temperature?: number;
  auditTrail?: {
    originalSeed: string;
    timestamp: string;
    model: string;
    prompt?: string;
    retryCount: number;
  };
}

/**
 * Oracle Pair: Test case + Model Answer, generated from same seed
 */
export interface OraclePair {
  version: number;
  generationSeed: string;
  testCase: TestCase;
  modelAnswer: ModelAnswer;
  createdAt: string;
  metadata?: {
    problemId?: string;
    problemName?: string;
    difficulty?: "easy" | "medium" | "hard";
    tags?: string[];
  };
}

/**
 * Status of test case validation
 */
export type TestCaseStatus =
  | "valid"
  | "constraint_violation"
  | "malformed"
  | "pending_repair";

/**
 * Status of model answer validation
 */
export type ModelAnswerStatus =
  | "correct"
  | "wrong"
  | "runtime_error"
  | "timeout"
  | "syntax_error"
  | "pending_repair";

/**
 * Which side of the oracle pair is likely wrong
 */
export type FailureAttribution =
  | "test_case_error"
  | "model_answer_error"
  | "both_wrong"
  | "unknown"
  | "non_determinism";

/**
 * Execution result from running a model answer on test input
 */
export interface ExecutionResult {
  output: string;
  exitCode: number;
  stderr?: string;
  duration: number; // ms
  status: "success" | "timeout" | "error";
}

/**
 * Mismatch details when outputs don't match
 */
export interface OutputMismatch {
  expected: string;
  actual: string;
  expectedLength: number;
  actualLength: number;
  diffStart: number;
  context?: string; // First N chars where they differ
}

/**
 * Oracle Pair Validation Result
 */
export interface OracleValidationResult {
  version: number;
  oraclePairId: string;
  generationSeed: string;
  timestamp: string;

  // Validation status
  isConsistent: boolean;

  // Test case validation
  testCaseStatus: TestCaseStatus;
  testCaseConstraints?: ConstraintValidationResult;

  // Model answer validation
  modelAnswerStatus: ModelAnswerStatus;
  executionResult?: ExecutionResult;

  // Output comparison
  expectedOutput: string;
  actualOutput: string;
  outputMatch: boolean;
  mismatch?: OutputMismatch;

  // Error attribution
  failureAttributed: FailureAttribution;
  confidence: number; // 0-1: how confident are we in the attribution?

  // Diagnostic info
  diagnostics?: {
    constraintViolations: string[];
    executionErrors: string[];
    nonDeterminismDetected: boolean;
    referenceResults?: Array<{
      name: string;
      output: string;
      matches: boolean;
    }>;
  };
}

/**
 * Repair Action Type
 */
export enum RepairActionType {
  UPDATE_EXPECTED_OUTPUT = "update_expected_output",
  REGEN_INPUT_DATA = "regen_input_data",
  REGEN_MODEL_ANSWER = "regen_model_answer",
  USE_REFERENCE_IMPL = "use_reference_implementation",
  MANUAL_REVIEW = "manual_review",
}

/**
 * Repair Recommendation
 */
export interface RepairRecommendation {
  action: RepairActionType;
  reason: string;
  confidence: number; // 0-1
  canAutoRepair: boolean;
  idempotent: boolean;
  details?: {
    newValue?: string; // For UPDATE_EXPECTED_OUTPUT
    repairStrategy?: string; // Description of repair
    evidence?: string[]; // Supporting evidence
  };
}

/**
 * Complete Repair Log for an oracle pair
 */
export interface RepairLog {
  version: number;
  generationSeed: string;
  oraclePairId: string;
  createdAt: string;

  // Original state
  originalPair: OraclePair;
  originalValidation: OracleValidationResult;

  // Repair history
  failures: OracleValidationResult[];
  repairs: Array<{
    action: RepairActionType;
    reason: string;
    timestamp: string;
    success: boolean;
    error?: string;
    resultingPair?: OraclePair;
    evidence?: string[];
  }>;

  // Final state
  finalStatus: "repaired" | "escalated" | "failed";
  finalValidation?: OracleValidationResult;
  finalPair?: OraclePair;
  requiresManualReview: boolean;
  manualReviewReason?: string;

  // Metadata
  repairDuration: number; // ms
  totalAttempts: number;
  successRate: number; // % of repairs that succeeded
}

/**
 * Oracle Pair with full metadata and logs
 */
export interface OraclePairWithMetadata extends OraclePair {
  validation?: OracleValidationResult;
  repairLog?: RepairLog;
  savedAt?: string;
  savedToDatabase?: boolean;
}

/**
 * Batch Oracle Generation Result
 */
export interface BatchOracleGenerationResult {
  totalRequested: number;
  successCount: number;
  repairSuccessCount: number;
  escalationCount: number;
  failureCount: number;
  pairs: OraclePairWithMetadata[];
  metrics: {
    successRate: number;
    averageTimePerPair: number;
    repairSuccessRate: number;
    escalationRate: number;
  };
}

/**
 * Type guard: Check if an object is an OraclePair
 */
export function isOraclePair(obj: unknown): obj is OraclePair {
  if (!obj || typeof obj !== "object") return false;
  const pair = obj as Record<string, unknown>;
  return (
    pair.version === ORACLE_PAIR_VERSION &&
    typeof pair.generationSeed === "string" &&
    typeof pair.testCase === "object" &&
    typeof pair.modelAnswer === "object" &&
    typeof pair.createdAt === "string"
  );
}

/**
 * Type guard: Check if OracleValidationResult indicates consistency
 */
export function isConsistent(result: OracleValidationResult): boolean {
  return (
    result.isConsistent &&
    result.testCaseStatus === "valid" &&
    (result.modelAnswerStatus === "correct" ||
      result.modelAnswerStatus === "pending_repair") &&
    result.outputMatch
  );
}
