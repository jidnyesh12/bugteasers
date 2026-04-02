/**
 * Template DSL — Schema Validator
 *
 * Validates a raw (possibly AI-generated) JSON object against the TemplateDSL
 * schema.  Returns a typed TemplateDSL on success, throws SchemaError on
 * failure.  This module is intentionally dependency-free (no Zod, no ajv) so
 * it runs in any JS runtime.
 */

import {
  TemplateDSL,
  VariableSpec,
  IntSpec,
  FloatSpec,
  StringSpec,
  ArraySpec,
  MatrixSpec,
  PermutationSpec,
  GraphSpec,
  TreeSpec,
  GenerationProfile,
  NumericExpr,
} from "./types";
import { SchemaError } from "./errors";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validate and normalise a raw object as a TemplateDSL.
 * @throws SchemaError with a descriptive message on any violation.
 */
export function validateTemplate(raw: unknown): TemplateDSL {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new SchemaError("Template must be a non-null JSON object");
  }

  const obj = raw as Record<string, unknown>;

  // version
  if (!obj.version || typeof obj.version !== "string") {
    throw new SchemaError("Template must have a string 'version' field");
  }

  // problem_id
  if (!obj.problem_id || typeof obj.problem_id !== "string") {
    throw new SchemaError("Template must have a string 'problem_id' field");
  }

  // description
  if (!obj.description || typeof obj.description !== "string") {
    throw new SchemaError("Template must have a string 'description' field");
  }

  // variables
  if (
    typeof obj.variables !== "object" ||
    obj.variables === null ||
    Array.isArray(obj.variables)
  ) {
    throw new SchemaError("Template must have a 'variables' object");
  }
  const variablesRaw = obj.variables as Record<string, unknown>;
  if (Object.keys(variablesRaw).length === 0) {
    throw new SchemaError("Template must declare at least one variable");
  }
  const variables: Record<string, VariableSpec> = {};
  for (const [name, spec] of Object.entries(variablesRaw)) {
    validateVariableName(name);
    variables[name] = validateVariableSpec(name, spec);
  }

  // constraints
  if (!Array.isArray(obj.constraints)) {
    throw new SchemaError("Template must have a 'constraints' array");
  }
  const constraints: string[] = [];
  for (const c of obj.constraints as unknown[]) {
    if (typeof c !== "string") {
      throw new SchemaError("Each constraint must be a string expression");
    }
    constraints.push(c);
  }

  // profiles
  const VALID_PROFILES: GenerationProfile[] = [
    "random",
    "edge_cases",
    "worst_case",
    "adversarial",
  ];
  if (!Array.isArray(obj.profiles) || (obj.profiles as unknown[]).length === 0) {
    throw new SchemaError(
      "Template must have a non-empty 'profiles' array. " +
        `Valid values: ${VALID_PROFILES.join(", ")}`
    );
  }
  const profiles: GenerationProfile[] = [];
  for (const p of obj.profiles as unknown[]) {
    if (!VALID_PROFILES.includes(p as GenerationProfile)) {
      throw new SchemaError(
        `Invalid profile "${p}". Valid values: ${VALID_PROFILES.join(", ")}`
      );
    }
    profiles.push(p as GenerationProfile);
  }

  // cases_per_profile (optional)
  let cases_per_profile: number | undefined;
  if (obj.cases_per_profile !== undefined) {
    if (
      typeof obj.cases_per_profile !== "number" ||
      !Number.isInteger(obj.cases_per_profile) ||
      obj.cases_per_profile < 1
    ) {
      throw new SchemaError(
        "'cases_per_profile' must be a positive integer"
      );
    }
    cases_per_profile = obj.cases_per_profile;
  }

  // format (optional)
  let format: string | undefined;
  if (obj.format !== undefined) {
    if (typeof obj.format !== "string") {
      throw new SchemaError("'format' must be a string");
    }
    format = obj.format;
  }

  return {
    version: obj.version as string,
    problem_id: obj.problem_id as string,
    description: obj.description as string,
    variables,
    constraints,
    profiles,
    cases_per_profile,
    format,
  };
}

// ---------------------------------------------------------------------------
// Variable name validation
// ---------------------------------------------------------------------------

function validateVariableName(name: string): void {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    throw new SchemaError(
      `Invalid variable name "${name}". Must match [a-zA-Z_][a-zA-Z0-9_]*`
    );
  }
}

// ---------------------------------------------------------------------------
// Variable spec dispatch
// ---------------------------------------------------------------------------

function validateVariableSpec(name: string, raw: unknown): VariableSpec {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new SchemaError(`Variable "${name}" spec must be an object`);
  }
  const obj = raw as Record<string, unknown>;
  const type = obj.type;

  switch (type) {
    case "int":
      return validateIntSpec(name, obj);
    case "float":
      return validateFloatSpec(name, obj);
    case "string":
      return validateStringSpec(name, obj);
    case "array":
      return validateArraySpec(name, obj);
    case "matrix":
      return validateMatrixSpec(name, obj);
    case "permutation":
      return validatePermutationSpec(name, obj);
    case "graph":
      return validateGraphSpec(name, obj);
    case "tree":
      return validateTreeSpec(name, obj);
    default:
      throw new SchemaError(
        `Variable "${name}" has unknown type "${type}". ` +
          `Valid types: int, float, string, array, matrix, permutation, graph, tree`
      );
  }
}

// ---------------------------------------------------------------------------
// Per-type validators
// ---------------------------------------------------------------------------

function assertNumericExpr(name: string, field: string, value: unknown): NumericExpr {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim().length > 0) return value;
  throw new SchemaError(
    `Variable "${name}".${field} must be a number or a "$var" expression string`
  );
}

function validateIntSpec(name: string, obj: Record<string, unknown>): IntSpec {
  const VALID_DIST = ["uniform", "log_uniform", "extreme_bias"] as const;
  const spec: IntSpec = {
    type: "int",
    min: assertNumericExpr(name, "min", obj.min),
    max: assertNumericExpr(name, "max", obj.max),
  };
  if (obj.distribution !== undefined) {
    if (!VALID_DIST.includes(obj.distribution as (typeof VALID_DIST)[number])) {
      throw new SchemaError(
        `Variable "${name}".distribution must be one of: ${VALID_DIST.join(", ")}`
      );
    }
    spec.distribution = obj.distribution as IntSpec["distribution"];
  }
  return spec;
}

function validateFloatSpec(name: string, obj: Record<string, unknown>): FloatSpec {
  const spec: FloatSpec = {
    type: "float",
    min: assertNumericExpr(name, "min", obj.min),
    max: assertNumericExpr(name, "max", obj.max),
  };
  if (obj.precision !== undefined) {
    if (typeof obj.precision !== "number" || obj.precision < 0) {
      throw new SchemaError(`Variable "${name}".precision must be a non-negative number`);
    }
    spec.precision = obj.precision;
  }
  return spec;
}

function validateStringSpec(name: string, obj: Record<string, unknown>): StringSpec {
  const VALID_CHARSETS = [
    "lowercase",
    "uppercase",
    "alpha",
    "alphanum",
    "printable",
  ] as const;
  const spec: StringSpec = {
    type: "string",
    length_min: assertNumericExpr(name, "length_min", obj.length_min),
    length_max: assertNumericExpr(name, "length_max", obj.length_max),
  };
  if (obj.charset !== undefined) {
    if (typeof obj.charset !== "string") {
      throw new SchemaError(`Variable "${name}".charset must be a string`);
    }
    if (
      !VALID_CHARSETS.includes(obj.charset as (typeof VALID_CHARSETS)[number]) &&
      obj.charset.length === 0
    ) {
      throw new SchemaError(`Variable "${name}".charset must be non-empty`);
    }
    spec.charset = obj.charset;
  }
  return spec;
}

function validateArraySpec(name: string, obj: Record<string, unknown>): ArraySpec {
  const spec: ArraySpec = {
    type: "array",
    length: assertNumericExpr(name, "length", obj.length),
    element: validateElementSpec(name, obj.element),
  };
  if (obj.sorted !== undefined) {
    if (typeof obj.sorted !== "boolean") {
      throw new SchemaError(`Variable "${name}".sorted must be a boolean`);
    }
    spec.sorted = obj.sorted;
  }
  if (obj.distinct !== undefined) {
    if (typeof obj.distinct !== "boolean") {
      throw new SchemaError(`Variable "${name}".distinct must be a boolean`);
    }
    spec.distinct = obj.distinct;
  }
  if (obj.sorted_dir !== undefined) {
    if (!["asc", "desc"].includes(obj.sorted_dir as string)) {
      throw new SchemaError(`Variable "${name}".sorted_dir must be "asc" or "desc"`);
    }
    spec.sorted_dir = obj.sorted_dir as "asc" | "desc";
  }
  return spec;
}

function validateElementSpec(
  parentName: string,
  raw: unknown
): IntSpec | FloatSpec | StringSpec {
  if (typeof raw !== "object" || raw === null) {
    throw new SchemaError(
      `Variable "${parentName}".element must be an int/float/string spec`
    );
  }
  const obj = raw as Record<string, unknown>;
  switch (obj.type) {
    case "int":
      return validateIntSpec(`${parentName}.element`, obj);
    case "float":
      return validateFloatSpec(`${parentName}.element`, obj);
    case "string":
      return validateStringSpec(`${parentName}.element`, obj);
    default:
      throw new SchemaError(
        `Variable "${parentName}".element.type must be int, float, or string`
      );
  }
}

function validateMatrixSpec(
  name: string,
  obj: Record<string, unknown>
): MatrixSpec {
  return {
    type: "matrix",
    rows: assertNumericExpr(name, "rows", obj.rows),
    cols: assertNumericExpr(name, "cols", obj.cols),
    element: validateElementSpec(name, obj.element) as IntSpec | FloatSpec,
  };
}

function validatePermutationSpec(
  name: string,
  obj: Record<string, unknown>
): PermutationSpec {
  const spec: PermutationSpec = {
    type: "permutation",
    length: assertNumericExpr(name, "length", obj.length),
  };
  if (obj.one_indexed !== undefined) {
    if (typeof obj.one_indexed !== "boolean") {
      throw new SchemaError(`Variable "${name}".one_indexed must be a boolean`);
    }
    spec.one_indexed = obj.one_indexed;
  }
  return spec;
}

function validateGraphSpec(
  name: string,
  obj: Record<string, unknown>
): GraphSpec {
  if (typeof obj.directed !== "boolean") {
    throw new SchemaError(`Variable "${name}".directed must be a boolean`);
  }
  const spec: GraphSpec = {
    type: "graph",
    nodes: assertNumericExpr(name, "nodes", obj.nodes),
    directed: obj.directed,
  };
  const booleanFlags: (keyof GraphSpec)[] = [
    "weighted",
    "connected",
    "acyclic",
    "self_loops",
    "multi_edges",
  ];
  for (const flag of booleanFlags) {
    if (obj[flag] !== undefined) {
      if (typeof obj[flag] !== "boolean") {
        throw new SchemaError(`Variable "${name}".${flag} must be a boolean`);
      }
      (spec as unknown as Record<string, unknown>)[flag] = obj[flag];
    }
  }
  if (obj.weight_min !== undefined) {
    spec.weight_min = assertNumericExpr(name, "weight_min", obj.weight_min);
  }
  if (obj.weight_max !== undefined) {
    spec.weight_max = assertNumericExpr(name, "weight_max", obj.weight_max);
  }
  return spec;
}

function validateTreeSpec(
  name: string,
  obj: Record<string, unknown>
): TreeSpec {
  const VALID_SHAPES = [
    "random",
    "path",
    "star",
    "caterpillar",
    "balanced",
  ] as const;
  const spec: TreeSpec = {
    type: "tree",
    nodes: assertNumericExpr(name, "nodes", obj.nodes),
  };
  if (obj.shape !== undefined) {
    if (!VALID_SHAPES.includes(obj.shape as (typeof VALID_SHAPES)[number])) {
      throw new SchemaError(
        `Variable "${name}".shape must be one of: ${VALID_SHAPES.join(", ")}`
      );
    }
    spec.shape = obj.shape as TreeSpec["shape"];
  }
  if (obj.weighted !== undefined) {
    if (typeof obj.weighted !== "boolean") {
      throw new SchemaError(`Variable "${name}".weighted must be a boolean`);
    }
    spec.weighted = obj.weighted;
  }
  if (obj.weight_min !== undefined) {
    spec.weight_min = assertNumericExpr(name, "weight_min", obj.weight_min);
  }
  if (obj.weight_max !== undefined) {
    spec.weight_max = assertNumericExpr(name, "weight_max", obj.weight_max);
  }
  if (obj.rooted !== undefined) {
    if (typeof obj.rooted !== "boolean") {
      throw new SchemaError(`Variable "${name}".rooted must be a boolean`);
    }
    spec.rooted = obj.rooted;
  }
  return spec;
}
