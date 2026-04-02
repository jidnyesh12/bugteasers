/**
 * Validator Tests
 */

import { describe, it, expect } from "vitest";
import { validateTemplate } from "../validator";
import { SchemaError } from "../errors";

const MINIMAL_VALID: Record<string, unknown> = {
  version: "1.0",
  problem_id: "two-sum",
  description: "Two-sum problem",
  variables: {
    n: { type: "int", min: 1, max: 100000 },
  },
  constraints: ["$n >= 1"],
  profiles: ["random"],
};

describe("validateTemplate", () => {
  it("accepts a minimal valid template", () => {
    const t = validateTemplate(MINIMAL_VALID);
    expect(t.problem_id).toBe("two-sum");
    expect(t.variables.n.type).toBe("int");
  });

  it("throws SchemaError on null input", () => {
    expect(() => validateTemplate(null)).toThrow(SchemaError);
  });

  it("throws SchemaError when version is missing", () => {
    const bad = { ...MINIMAL_VALID, version: undefined };
    expect(() => validateTemplate(bad)).toThrow(SchemaError);
  });

  it("throws SchemaError when variables is empty", () => {
    const bad = { ...MINIMAL_VALID, variables: {} };
    expect(() => validateTemplate(bad)).toThrow(SchemaError);
  });

  it("throws SchemaError for unknown variable type", () => {
    const bad = {
      ...MINIMAL_VALID,
      variables: { n: { type: "matrix_of_doom", rows: 3, cols: 3 } },
    };
    expect(() => validateTemplate(bad)).toThrow(SchemaError);
  });

  it("throws SchemaError for invalid profile", () => {
    const bad = { ...MINIMAL_VALID, profiles: ["best_case"] };
    expect(() => validateTemplate(bad)).toThrow(SchemaError);
  });

  it("throws SchemaError for invalid variable name", () => {
    const bad = {
      ...MINIMAL_VALID,
      variables: { "123bad": { type: "int", min: 1, max: 10 } },
    };
    expect(() => validateTemplate(bad)).toThrow(SchemaError);
  });

  it("accepts all supported types", () => {
    const t = validateTemplate({
      ...MINIMAL_VALID,
      variables: {
        n: { type: "int", min: 1, max: 1000 },
        x: { type: "float", min: 0.0, max: 1.0 },
        s: { type: "string", length_min: 1, length_max: 10, charset: "lowercase" },
        arr: { type: "array", length: "$n", element: { type: "int", min: 1, max: 100 } },
        mat: { type: "matrix", rows: 3, cols: 3, element: { type: "int", min: 0, max: 9 } },
        perm: { type: "permutation", length: "$n", one_indexed: true },
        g: {
          type: "graph",
          nodes: "$n",
          directed: false,
          connected: true,
          weighted: true,
          weight_min: 1,
          weight_max: 100,
        },
        tree: {
          type: "tree",
          nodes: "$n",
          shape: "random",
          weighted: false,
        },
      },
    });
    expect(Object.keys(t.variables)).toHaveLength(8);
  });

  it("accepts numeric string expressions for bounds", () => {
    const t = validateTemplate({
      ...MINIMAL_VALID,
      variables: {
        n: { type: "int", min: 1, max: 100000 },
        arr: { type: "array", length: "$n", element: { type: "int", min: 1, max: "$n" } },
      },
    });
    expect((t.variables.arr as { length: unknown }).length).toBe("$n");
  });

  it("preserves cases_per_profile", () => {
    const t = validateTemplate({ ...MINIMAL_VALID, cases_per_profile: 5 });
    expect(t.cases_per_profile).toBe(5);
  });

  it("throws SchemaError for non-integer cases_per_profile", () => {
    const bad = { ...MINIMAL_VALID, cases_per_profile: 1.5 };
    expect(() => validateTemplate(bad)).toThrow(SchemaError);
  });
});
