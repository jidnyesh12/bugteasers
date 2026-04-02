/**
 * Template DSL — Type Definitions
 *
 * A structured, schema-validated DSL for generating test-case inputs for
 * competitive-programming problems.  The key design principle is that the DSL
 * describes *structural constraints* only; expected outputs are derived later by
 * an independent consensus oracle, thereby resolving the chicken-and-egg
 * problem (i.e., neither the test inputs nor the reference solution is
 * privileged — both are cross-validated).
 */

// ---------------------------------------------------------------------------
// Primitive expression types
// ---------------------------------------------------------------------------

/**
 * A numeric literal or a reference to another variable.
 *   - number  → literal value (e.g. 100000)
 *   - string  → variable reference prefixed with "$" (e.g. "$n")
 *              or a simple arithmetic expression (e.g. "$n - 1", "2 * $n")
 */
export type NumericExpr = number | string;

// ---------------------------------------------------------------------------
// Variable Specifications
// ---------------------------------------------------------------------------

export interface IntSpec {
  type: "int";
  min: NumericExpr;
  max: NumericExpr;
  /** Sampling distribution.  Defaults to "uniform". */
  distribution?: "uniform" | "log_uniform" | "extreme_bias";
}

export interface FloatSpec {
  type: "float";
  min: NumericExpr;
  max: NumericExpr;
  precision?: number; // decimal places; defaults to 6
}

export interface StringSpec {
  type: "string";
  length_min: NumericExpr;
  length_max: NumericExpr;
  charset?: "lowercase" | "uppercase" | "alpha" | "alphanum" | "printable" | string;
}

export interface ArraySpec {
  type: "array";
  length: NumericExpr;
  element: IntSpec | FloatSpec | StringSpec;
  sorted?: boolean;
  distinct?: boolean;
  sorted_dir?: "asc" | "desc";
}

export interface MatrixSpec {
  type: "matrix";
  rows: NumericExpr;
  cols: NumericExpr;
  element: IntSpec | FloatSpec;
}

export interface PermutationSpec {
  type: "permutation";
  length: NumericExpr;
  /** 1-indexed when true (default false → 0-indexed) */
  one_indexed?: boolean;
}

export interface GraphSpec {
  type: "graph";
  nodes: NumericExpr;
  directed: boolean;
  weighted?: boolean;
  connected?: boolean;
  acyclic?: boolean; // DAG when directed; tree/forest when undirected
  self_loops?: boolean;
  multi_edges?: boolean;
  weight_min?: NumericExpr;
  weight_max?: NumericExpr;
}

export interface TreeSpec {
  type: "tree";
  nodes: NumericExpr;
  /** "random" | "path" | "star" | "caterpillar" | "balanced" */
  shape?: "random" | "path" | "star" | "caterpillar" | "balanced";
  weighted?: boolean;
  weight_min?: NumericExpr;
  weight_max?: NumericExpr;
  rooted?: boolean;
}

export type VariableSpec =
  | IntSpec
  | FloatSpec
  | StringSpec
  | ArraySpec
  | MatrixSpec
  | PermutationSpec
  | GraphSpec
  | TreeSpec;

// ---------------------------------------------------------------------------
// Generation profiles
// ---------------------------------------------------------------------------

/**
 * Each profile controls how variables are sampled.
 *
 * - "random"     : Uniformly random within declared bounds.
 * - "edge_cases" : Boundary values (min/max, length 0/1, etc.).
 * - "worst_case" : Maximum-size inputs designed to stress time limits.
 * - "adversarial": Inputs crafted to defeat naive O(n²) or greedy strategies.
 */
export type GenerationProfile =
  | "random"
  | "edge_cases"
  | "worst_case"
  | "adversarial";

// ---------------------------------------------------------------------------
// Constraints
// ---------------------------------------------------------------------------

/**
 * A plain-text boolean expression over declared variables.
 * Supported operators: <, <=, >, >=, ==, !=, &&, ||, !
 * Variable references: $var_name
 * Functions: len($arr), sum($arr), min($arr), max($arr)
 *
 * Examples:
 *   "$n >= 1 && $n <= 100000"
 *   "len($arr) == $n"
 *   "$k <= $n"
 */
export type ConstraintExpr = string;

// ---------------------------------------------------------------------------
// Output format
// ---------------------------------------------------------------------------

/**
 * A template string describing how to render the generated variables to
 * stdin-compatible text.
 *
 * Syntax:
 *   {var_name}         → renders the value of var_name
 *   {var_name sep="\n"} → renders an array/matrix with the given separator
 *   {var_name format="edge_list"} → graph render mode
 *
 * Examples:
 *   "{n}\n{arr}"           → first line: n, second line: space-separated array
 *   "{n} {m}\n{graph format=edge_list}"
 */
export type FormatTemplate = string;

// ---------------------------------------------------------------------------
// Core DSL template
// ---------------------------------------------------------------------------

export interface TemplateDSL {
  /** Semver string, e.g. "1.0" */
  version: string;

  /** Unique identifier for the problem this template belongs to */
  problem_id: string;

  /** Short human-readable description of what this template generates */
  description: string;

  /**
   * Ordered map of variable declarations.
   * Variables may reference earlier variables in their specs (topological order).
   */
  variables: Record<string, VariableSpec>;

  /**
   * Cross-variable boolean constraints that must hold after materialization.
   * The materializer retries up to a bounded number of times until all
   * constraints are satisfied.
   */
  constraints: ConstraintExpr[];

  /** Profiles to generate test cases for.  At least one required. */
  profiles: GenerationProfile[];

  /**
   * How many test cases to generate per profile.
   * Defaults to 2 per profile when omitted.
   */
  cases_per_profile?: number;

  /**
   * Stdin render format.  Uses {var_name} placeholders.
   * Defaults to a best-effort rendering if omitted.
   */
  format?: FormatTemplate;
}

// ---------------------------------------------------------------------------
// Materialized test case
// ---------------------------------------------------------------------------

export interface MaterializedValue {
  [variableName: string]: unknown;
}

export interface MaterializedTestCase {
  /** Rendered stdin string ready for judge input */
  input: string;
  /** The raw materialized variable values (for debugging/audit) */
  values: MaterializedValue;
  /** Which profile was used */
  profile: GenerationProfile;
  /**
   * Deterministic seed used.
   * Replay certificate: template_hash + ":" + seed → same input every time.
   */
  seed: number;
  /** SHA-256 hex of the template spec for provenance */
  template_hash: string;
}

// ---------------------------------------------------------------------------
// Oracle result
// ---------------------------------------------------------------------------

export type OracleConfidence = "high" | "medium" | "low" | "disputed";

export interface OracleSolution {
  /** Raw output produced by one solution invocation */
  output: string;
  /** Normalised (trimmed, normalised whitespace) output for comparison */
  normalised: string;
}

export interface OracleResult {
  /** The consensus expected output (most-voted normalised output) */
  expected_output: string;
  /** Raw outputs from each invocation */
  solutions: OracleSolution[];
  /** Number of invocations that agreed on the consensus output */
  agreement_count: number;
  /** Total invocations attempted */
  total_invocations: number;
  confidence: OracleConfidence;
}

// ---------------------------------------------------------------------------
// Final test case (after oracle evaluation)
// ---------------------------------------------------------------------------

export interface DslTestCase {
  input_data: string;
  expected_output: string;
  is_sample: boolean;
  points: number;
  /** Profile this case was generated from */
  profile: GenerationProfile;
  /** Replay seed */
  seed: number;
  /** SHA-256 hex of template spec */
  template_hash: string;
  /** Oracle confidence level */
  oracle_confidence: OracleConfidence;
  /** Whether this case was disputed and needs manual review */
  disputed: boolean;
}

// ---------------------------------------------------------------------------
// Pipeline result
// ---------------------------------------------------------------------------

export interface DslPipelineResult {
  /** DSL template used (as validated + normalised) */
  template: TemplateDSL;
  /** Template content hash */
  template_hash: string;
  /** All generated test cases */
  test_cases: DslTestCase[];
  /** Cases that could not be resolved by the oracle */
  disputed_cases: DslTestCase[];
  /** Pipeline run metadata */
  metadata: {
    generated_at: string;
    total_materialized: number;
    total_oracle_evaluated: number;
    total_disputed: number;
    pipeline_version: string;
  };
}

// ---------------------------------------------------------------------------
// Repair
// ---------------------------------------------------------------------------

export type FailureKind =
  | "schema_error"
  | "unsat_constraints"
  | "generator_error"
  | "oracle_error"
  | "nondeterminism_error"
  | "format_error";

export interface RepairContext {
  kind: FailureKind;
  message: string;
  /** The template that failed */
  template: TemplateDSL;
  /** The seed that caused the failure, if applicable */
  seed?: number;
  /** Which variable caused the failure, if identifiable */
  variable?: string;
  /** Number of repair attempts so far */
  attempts: number;
}

export interface RepairResult {
  success: boolean;
  /** Patched template if repair succeeded */
  template?: TemplateDSL;
  /** Human-readable explanation of what was patched */
  patch_description?: string;
  /** Error message if repair failed */
  error?: string;
}
