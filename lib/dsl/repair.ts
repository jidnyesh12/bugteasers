/**
 * Template DSL — Self-Healing Repair Loop
 *
 * When a DSL template fails validation or materialisation, the repair loop
 * attempts to patch the template automatically before giving up.  Each
 * failure kind has a dedicated recovery strategy:
 *
 *  schema_error        → Remove or default the offending field.
 *  unsat_constraints   → Widen bounds of the constrained variable.
 *  generator_error     → Replace the failing variable spec with safe defaults.
 *  oracle_error        → Retry with fewer invocations.
 *  nondeterminism_error → Quarantine the seed.
 *  format_error        → Reset to auto-format (remove custom format string).
 *
 * The repair loop is bounded to avoid infinite cycles.
 */

import { RepairContext, RepairResult, VariableSpec } from "./types";
import { validateTemplate } from "./validator";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

// ---------------------------------------------------------------------------
// Strategy implementations
// ---------------------------------------------------------------------------

function repairSchemaError(ctx: RepairContext): RepairResult {
  const template = deepCopy(ctx.template);

  // If a specific variable is named, try to remove it
  if (ctx.variable && ctx.variable in template.variables) {
    delete template.variables[ctx.variable];
    // Remove constraints that reference this variable
    const ref = `$${ctx.variable}`;
    template.constraints = template.constraints.filter((c) => !c.includes(ref));

    try {
      validateTemplate(template);
      return {
        success: true,
        template,
        patch_description: `Removed invalid variable "${ctx.variable}" and related constraints`,
      };
    } catch {
      // fall through
    }
  }

  // Try to reset format
  if (template.format) {
    const noFormat = deepCopy(template);
    delete noFormat.format;
    try {
      validateTemplate(noFormat);
      return {
        success: true,
        template: noFormat,
        patch_description: "Removed custom format string (was causing schema error)",
      };
    } catch {
      // fall through
    }
  }

  return {
    success: false,
    error: `Cannot automatically repair schema error: ${ctx.message}`,
  };
}

function repairUnsatConstraints(ctx: RepairContext): RepairResult {
  const template = deepCopy(ctx.template);

  // Strategy: for each integer variable, widen bounds by 10x
  let patched = false;
  for (const spec of Object.values(template.variables)) {
    if (spec.type === "int") {
      const s = spec as VariableSpec & { type: "int"; min: number | string; max: number | string };
      if (typeof s.min === "number" && typeof s.max === "number") {
        const range = s.max - s.min;
        if (range < 10) {
          s.max = s.min + Math.max(range * 10, 100);
          patched = true;
        }
      }
    }
  }

  if (patched) {
    // Remove the unsatisfied constraints
    template.constraints = [];
    return {
      success: true,
      template,
      patch_description:
        "Widened integer variable bounds and cleared constraints to resolve unsatisfiability",
    };
  }

  return {
    success: false,
    error: `Cannot automatically repair unsatisfiable constraints: ${ctx.message}`,
  };
}

function repairGeneratorError(ctx: RepairContext): RepairResult {
  const template = deepCopy(ctx.template);

  if (ctx.variable && ctx.variable in template.variables) {
    // Replace with a safe int spec
    template.variables[ctx.variable] = {
      type: "int",
      min: 1,
      max: 100,
    };
    const ref = `$${ctx.variable}`;
    template.constraints = template.constraints.filter((c) => !c.includes(ref));

    return {
      success: true,
      template,
      patch_description: `Replaced failing variable "${ctx.variable}" with safe int(1..100)`,
    };
  }

  return {
    success: false,
    error: `Cannot identify the failing variable to repair`,
  };
}

function repairFormatError(ctx: RepairContext): RepairResult {
  const template = deepCopy(ctx.template);
  delete template.format;
  return {
    success: true,
    template,
    patch_description:
      "Removed custom format string; materializer will use automatic formatting",
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const MAX_REPAIR_ATTEMPTS = 3;

/**
 * Attempt to repair a failing template.
 *
 * Callers should check `result.success` and use `result.template` if true.
 */
export function repairTemplate(ctx: RepairContext): RepairResult {
  if (ctx.attempts >= MAX_REPAIR_ATTEMPTS) {
    return {
      success: false,
      error: `Max repair attempts (${MAX_REPAIR_ATTEMPTS}) reached for ${ctx.kind}: ${ctx.message}`,
    };
  }

  switch (ctx.kind) {
    case "schema_error":
      return repairSchemaError(ctx);
    case "unsat_constraints":
      return repairUnsatConstraints(ctx);
    case "generator_error":
      return repairGeneratorError(ctx);
    case "format_error":
      return repairFormatError(ctx);
    case "oracle_error":
      // Oracle errors are handled at the pipeline level (retry with fewer invocations)
      return {
        success: false,
        error: "Oracle errors must be handled by the pipeline layer",
      };
    case "nondeterminism_error":
      return {
        success: false,
        error: "Nondeterminism errors require manual investigation",
      };
    default:
      return {
        success: false,
        error: `No repair strategy for failure kind "${ctx.kind}"`,
      };
  }
}
