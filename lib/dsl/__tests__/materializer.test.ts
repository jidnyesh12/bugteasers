/**
 * Materializer Tests
 */

import { describe, it, expect } from "vitest";
import { materializeOne, materializeAll } from "../materializer";
import { validateTemplate } from "../validator";
import { hashTemplate } from "../hash";
import { TemplateDSL } from "../types";
import { UnsatConstraintsError } from "../errors";

function makeTemplate(overrides: Partial<TemplateDSL> = {}): TemplateDSL {
  return validateTemplate({
    version: "1.0",
    problem_id: "test",
    description: "test",
    variables: { n: { type: "int", min: 1, max: 10 } },
    constraints: [],
    profiles: ["random"],
    cases_per_profile: 1,
    ...overrides,
  }) as TemplateDSL;
}

describe("materializeOne", () => {
  it("produces a MaterializedTestCase", () => {
    const t = makeTemplate();
    const hash = hashTemplate(t);
    const tc = materializeOne(t, 42, "random", hash);
    expect(tc.input).toBeDefined();
    expect(typeof tc.input).toBe("string");
    expect(tc.seed).toBe(42);
    expect(tc.profile).toBe("random");
    expect(tc.template_hash).toBe(hash);
  });

  it("is deterministic for the same seed", () => {
    const t = makeTemplate({ variables: { n: { type: "int", min: 1, max: 100000 } } });
    const hash = hashTemplate(t);
    const a = materializeOne(t, 99, "random", hash);
    const b = materializeOne(t, 99, "random", hash);
    expect(a.input).toBe(b.input);
  });

  it("produces different outputs for different seeds", () => {
    const t = makeTemplate({ variables: { n: { type: "int", min: 1, max: 1000000 } } });
    const hash = hashTemplate(t);
    const a = materializeOne(t, 1, "random", hash);
    const b = materializeOne(t, 2, "random", hash);
    // Not guaranteed but overwhelmingly likely with a large range
    expect(a.input).not.toBe(b.input);
  });

  it("edge_cases profile uses boundary values", () => {
    const t = makeTemplate({ variables: { n: { type: "int", min: 5, max: 5 } } });
    const hash = hashTemplate(t);
    const tc = materializeOne(t, 0, "edge_cases", hash);
    expect(tc.values["n"]).toBe(5);
  });

  it("worst_case profile uses maximum value", () => {
    const t = makeTemplate({ variables: { n: { type: "int", min: 1, max: 9999 } } });
    const hash = hashTemplate(t);
    const tc = materializeOne(t, 0, "worst_case", hash);
    expect(tc.values["n"]).toBe(9999);
  });

  it("materialises an array variable", () => {
    const t = makeTemplate({
      variables: {
        n: { type: "int", min: 5, max: 5 },
        arr: { type: "array", length: "$n", element: { type: "int", min: 1, max: 100 } },
      },
      format: "{n}\n{arr}",
    });
    const hash = hashTemplate(t);
    const tc = materializeOne(t, 0, "random", hash);
    const lines = tc.input.split("\n");
    expect(lines[0]).toBe("5");
    const nums = lines[1].split(" ").map(Number);
    expect(nums).toHaveLength(5);
    nums.forEach((v) => expect(v).toBeGreaterThanOrEqual(1));
    nums.forEach((v) => expect(v).toBeLessThanOrEqual(100));
  });

  it("sorted array is in ascending order", () => {
    const t = makeTemplate({
      variables: {
        n: { type: "int", min: 5, max: 5 },
        arr: {
          type: "array",
          length: "$n",
          element: { type: "int", min: 1, max: 1000 },
          sorted: true,
        },
      },
    });
    const hash = hashTemplate(t);
    const tc = materializeOne(t, 0, "random", hash);
    const arr = tc.values["arr"] as number[];
    for (let i = 1; i < arr.length; i++) {
      expect(arr[i]).toBeGreaterThanOrEqual(arr[i - 1]);
    }
  });

  it("distinct array has unique elements", () => {
    const t = makeTemplate({
      variables: {
        n: { type: "int", min: 5, max: 5 },
        arr: {
          type: "array",
          length: "$n",
          element: { type: "int", min: 1, max: 1000 },
          distinct: true,
        },
      },
    });
    const hash = hashTemplate(t);
    const tc = materializeOne(t, 0, "random", hash);
    const arr = tc.values["arr"] as number[];
    expect(new Set(arr).size).toBe(arr.length);
  });

  it("materialises a permutation", () => {
    const t = makeTemplate({
      variables: {
        n: { type: "int", min: 4, max: 4 },
        perm: { type: "permutation", length: "$n", one_indexed: true },
      },
    });
    const hash = hashTemplate(t);
    const tc = materializeOne(t, 0, "random", hash);
    const perm = tc.values["perm"] as number[];
    expect(perm.sort((a, b) => a - b)).toEqual([1, 2, 3, 4]);
  });

  it("materialises a graph", () => {
    const t = makeTemplate({
      variables: {
        n: { type: "int", min: 4, max: 4 },
        g: { type: "graph", nodes: "$n", directed: false, connected: true },
      },
    });
    const hash = hashTemplate(t);
    const tc = materializeOne(t, 0, "random", hash);
    const g = tc.values["g"] as { nodes: number; edges: { u: number; v: number }[] };
    expect(g.nodes).toBe(4);
    // Connected undirected graph must have at least n-1 undirected edges
    expect(g.edges.length).toBeGreaterThanOrEqual(3);
  });

  it("materialises a tree", () => {
    const t = makeTemplate({
      variables: {
        n: { type: "int", min: 5, max: 5 },
        tree: { type: "tree", nodes: "$n", shape: "random" },
      },
    });
    const hash = hashTemplate(t);
    const tc = materializeOne(t, 0, "random", hash);
    const tree = tc.values["tree"] as { nodes: number; edges: { u: number; v: number }[] };
    // A tree with n nodes has n-1 edges
    expect(tree.edges.length).toBe(4);
  });

  it("throws UnsatConstraintsError when constraints cannot be satisfied", () => {
    const t = makeTemplate({
      variables: {
        n: { type: "int", min: 5, max: 10 },
        k: { type: "int", min: 100, max: 200 },
      },
      constraints: ["$k <= $n"],
    });
    const hash = hashTemplate(t);
    expect(() => materializeOne(t, 0, "random", hash)).toThrow(
      UnsatConstraintsError
    );
  });

  it("uses format string if provided", () => {
    const t = makeTemplate({
      variables: {
        n: { type: "int", min: 3, max: 3 },
        m: { type: "int", min: 7, max: 7 },
      },
      format: "{n} {m}",
    });
    const hash = hashTemplate(t);
    const tc = materializeOne(t, 0, "random", hash);
    expect(tc.input).toBe("3 7");
  });

  it("materialises a matrix", () => {
    const t = makeTemplate({
      variables: {
        mat: {
          type: "matrix",
          rows: 2,
          cols: 3,
          element: { type: "int", min: 0, max: 9 },
        },
      },
    });
    const hash = hashTemplate(t);
    const tc = materializeOne(t, 0, "random", hash);
    const mat = tc.values["mat"] as number[][];
    expect(mat).toHaveLength(2);
    expect(mat[0]).toHaveLength(3);
  });

  it("float variable produces a float", () => {
    const t = makeTemplate({
      variables: {
        x: { type: "float", min: 0.0, max: 1.0, precision: 4 },
      },
    });
    const hash = hashTemplate(t);
    const tc = materializeOne(t, 0, "random", hash);
    const x = Number(tc.values["x"]);
    expect(x).toBeGreaterThanOrEqual(0.0);
    expect(x).toBeLessThanOrEqual(1.0);
  });

  it("string variable produces correct charset", () => {
    const t = makeTemplate({
      variables: {
        n: { type: "int", min: 5, max: 5 },
        s: { type: "string", length_min: "$n", length_max: "$n", charset: "lowercase" },
      },
    });
    const hash = hashTemplate(t);
    const tc = materializeOne(t, 0, "random", hash);
    const s = tc.values["s"] as string;
    expect(s).toHaveLength(5);
    expect(/^[a-z]+$/.test(s)).toBe(true);
  });
});

describe("materializeAll", () => {
  it("generates cases_per_profile * profiles cases", () => {
    const t = makeTemplate({
      profiles: ["random", "edge_cases"],
      cases_per_profile: 3,
    });
    const hash = hashTemplate(t);
    const cases = materializeAll(t, hash, 0);
    expect(cases).toHaveLength(6);
  });

  it("uses different seeds across cases", () => {
    const t = makeTemplate({
      variables: { n: { type: "int", min: 1, max: 1000000 } },
      profiles: ["random"],
      cases_per_profile: 3,
    });
    const hash = hashTemplate(t);
    const cases = materializeAll(t, hash, 0);
    const inputs = cases.map((c) => c.input);
    // At least some should be different
    expect(new Set(inputs).size).toBeGreaterThan(1);
  });

  it("all cases have template_hash", () => {
    const t = makeTemplate({ profiles: ["random"], cases_per_profile: 2 });
    const hash = hashTemplate(t);
    const cases = materializeAll(t, hash);
    cases.forEach((c) => expect(c.template_hash).toBe(hash));
  });
});
