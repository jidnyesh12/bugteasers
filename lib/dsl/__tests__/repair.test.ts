/**
 * Repair Tests
 */

import { describe, it, expect } from "vitest";
import { repairTemplate, MAX_REPAIR_ATTEMPTS } from "../repair";
import { TemplateDSL } from "../types";

const BASE: TemplateDSL = {
  version: "1.0",
  problem_id: "test",
  description: "test",
  variables: { n: { type: "int", min: 1, max: 100 } },
  constraints: [],
  profiles: ["random"],
};

describe("repairTemplate", () => {
  it("returns failure when max attempts reached", () => {
    const result = repairTemplate({
      kind: "schema_error",
      message: "some error",
      template: BASE,
      attempts: MAX_REPAIR_ATTEMPTS,
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("Max repair attempts");
  });

  it("format_error: removes custom format string", () => {
    const t: TemplateDSL = { ...BASE, format: "{undefined_var}" };
    const result = repairTemplate({
      kind: "format_error",
      message: "undefined variable",
      template: t,
      attempts: 0,
    });
    expect(result.success).toBe(true);
    expect(result.template?.format).toBeUndefined();
  });

  it("unsat_constraints: widens bounds and clears constraints", () => {
    const t: TemplateDSL = {
      ...BASE,
      variables: { n: { type: "int", min: 1, max: 2 } },
      constraints: ["$n > 1000"],
    };
    const result = repairTemplate({
      kind: "unsat_constraints",
      message: "constraints unsatisfied",
      template: t,
      attempts: 0,
    });
    expect(result.success).toBe(true);
    expect(result.template?.constraints).toHaveLength(0);
  });

  it("generator_error: replaces failing variable with safe int", () => {
    const result = repairTemplate({
      kind: "generator_error",
      message: "failed to generate",
      template: BASE,
      variable: "n",
      attempts: 0,
    });
    expect(result.success).toBe(true);
    expect(result.template?.variables["n"]).toEqual({
      type: "int",
      min: 1,
      max: 100,
    });
  });

  it("oracle_error: returns failure (handled by pipeline)", () => {
    const result = repairTemplate({
      kind: "oracle_error",
      message: "oracle failed",
      template: BASE,
      attempts: 0,
    });
    expect(result.success).toBe(false);
  });

  it("nondeterminism_error: returns failure", () => {
    const result = repairTemplate({
      kind: "nondeterminism_error",
      message: "nondeterminism detected",
      template: BASE,
      attempts: 0,
    });
    expect(result.success).toBe(false);
  });

  it("schema_error with named variable: removes it", () => {
    const t: TemplateDSL = {
      ...BASE,
      variables: {
        n: { type: "int", min: 1, max: 100 },
        bad: { type: "int", min: 1, max: 10 },
      },
      constraints: ["$bad > $n"],
    };
    const result = repairTemplate({
      kind: "schema_error",
      message: "invalid",
      template: t,
      variable: "bad",
      attempts: 0,
    });
    expect(result.success).toBe(true);
    expect("bad" in (result.template?.variables ?? {})).toBe(false);
    // Constraint referencing $bad should be gone
    expect(result.template?.constraints.some((c) => c.includes("$bad"))).toBe(false);
  });
});
