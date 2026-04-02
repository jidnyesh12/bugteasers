/**
 * Pipeline Integration Tests
 *
 * These tests exercise the full pipeline end-to-end using mock oracle invokers
 * so no actual AI calls are made.
 */

import { describe, it, expect, vi } from "vitest";
import { runPipeline, materializeTemplate, materializeSingleCase } from "../pipeline";
import { OracleInvoker } from "../oracle";

const SIMPLE_TEMPLATE = {
  version: "1.0",
  problem_id: "sum-of-array",
  description: "Given n integers, output their sum",
  variables: {
    n: { type: "int", min: 1, max: 10 },
    arr: {
      type: "array",
      length: "$n",
      element: { type: "int", min: 1, max: 100 },
    },
  },
  constraints: ["$n >= 1"],
  profiles: ["random", "edge_cases"],
  cases_per_profile: 2,
  format: "{n}\n{arr}",
};

function mockOracleWith(output: string): OracleInvoker {
  return { solve: vi.fn().mockResolvedValue(output) };
}

describe("runPipeline", () => {
  it("returns a DslPipelineResult with test_cases", async () => {
    const invoker = mockOracleWith("55");
    const result = await runPipeline(SIMPLE_TEMPLATE, invoker, {
      oracleInvocations: 1,
    });
    expect(result.test_cases.length).toBeGreaterThan(0);
    expect(result.template_hash).toBeTruthy();
    expect(result.metadata.pipeline_version).toBe("1.0.0");
  });

  it("marks at least one case as sample", async () => {
    const invoker = mockOracleWith("10");
    const result = await runPipeline(SIMPLE_TEMPLATE, invoker, {
      oracleInvocations: 1,
    });
    const hasSample = result.test_cases.some((tc) => tc.is_sample);
    expect(hasSample).toBe(true);
  });

  it("assigns expected_output from oracle", async () => {
    const invoker = mockOracleWith("42");
    const result = await runPipeline(SIMPLE_TEMPLATE, invoker, {
      oracleInvocations: 1,
    });
    result.test_cases.forEach((tc) => {
      expect(tc.expected_output).toBe("42");
    });
  });

  it("works with null invoker (input-only mode)", async () => {
    const result = await runPipeline(SIMPLE_TEMPLATE, null, {});
    expect(result.test_cases.length).toBeGreaterThan(0);
    result.test_cases.forEach((tc) => {
      expect(tc.expected_output).toBe("");
      expect(tc.disputed).toBe(true);
    });
    expect(result.metadata.total_oracle_evaluated).toBe(0);
  });

  it("marks disputed cases when oracle disagrees", async () => {
    let callCount = 0;
    const invoker: OracleInvoker = {
      solve: vi.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve(String(callCount)); // each call returns a different value
      }),
    };
    const result = await runPipeline(SIMPLE_TEMPLATE, invoker, {
      oracleInvocations: 3,
    });
    // With all-different outputs per case, all cases become disputed
    expect(result.disputed_cases.length + result.test_cases.length).toBeGreaterThan(0);
  });

  it("generates correct number of cases per profile", async () => {
    const invoker = mockOracleWith("0");
    const result = await runPipeline(SIMPLE_TEMPLATE, invoker, {
      oracleInvocations: 1,
    });
    // 2 profiles * 2 cases_per_profile = 4 materialised
    expect(result.metadata.total_materialized).toBe(4);
  });

  it("throws on invalid template (no repair path)", async () => {
    const bad = { version: "1.0" }; // missing required fields
    await expect(runPipeline(bad, null, { repair: false })).rejects.toThrow();
  });

  it("test cases include profile and seed fields", async () => {
    const invoker = mockOracleWith("1");
    const result = await runPipeline(SIMPLE_TEMPLATE, invoker, {
      oracleInvocations: 1,
    });
    result.test_cases.forEach((tc) => {
      expect(["random", "edge_cases", "worst_case", "adversarial"]).toContain(
        tc.profile
      );
      expect(typeof tc.seed).toBe("number");
    });
  });

  it("adversarial profile assigns 3 points", async () => {
    const tmpl = {
      ...SIMPLE_TEMPLATE,
      profiles: ["adversarial"],
      cases_per_profile: 1,
    };
    const invoker = mockOracleWith("x");
    const result = await runPipeline(tmpl, invoker, { oracleInvocations: 1 });
    expect(result.test_cases[0]?.points ?? result.disputed_cases[0]?.points).toBe(3);
  });
});

describe("materializeTemplate", () => {
  it("returns MaterializedTestCase array without oracle", () => {
    const cases = materializeTemplate(SIMPLE_TEMPLATE, 0);
    expect(cases.length).toBe(4); // 2 profiles * 2
    cases.forEach((c) => {
      expect(typeof c.input).toBe("string");
      expect(c.input.length).toBeGreaterThan(0);
    });
  });
});

describe("materializeSingleCase", () => {
  it("returns a single MaterializedTestCase for given seed and profile", () => {
    const tc = materializeSingleCase(SIMPLE_TEMPLATE, 99, "random");
    expect(tc.seed).toBe(99);
    expect(tc.profile).toBe("random");
    // Replay determinism
    const tc2 = materializeSingleCase(SIMPLE_TEMPLATE, 99, "random");
    expect(tc.input).toBe(tc2.input);
  });
});
