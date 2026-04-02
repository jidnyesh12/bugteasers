/**
 * Oracle Tests
 */

import { describe, it, expect, vi } from "vitest";
import { runOracle, normaliseOutput, OracleInvoker } from "../oracle";
import { MaterializedTestCase } from "../types";
import { OracleError } from "../errors";

function makeFakeCase(): MaterializedTestCase {
  return {
    input: "5\n1 2 3 4 5",
    values: { n: 5, arr: [1, 2, 3, 4, 5] },
    profile: "random",
    seed: 42,
    template_hash: "abc123",
  };
}

describe("normaliseOutput", () => {
  it("trims whitespace", () => {
    expect(normaliseOutput("  42  ")).toBe("42");
  });

  it("normalises CRLF line endings", () => {
    expect(normaliseOutput("1\r\n2\r\n3")).toBe("1\n2\n3");
  });

  it("collapses internal spaces in each line", () => {
    expect(normaliseOutput("1  2   3")).toBe("1 2 3");
  });

  it("handles trailing newlines", () => {
    expect(normaliseOutput("42\n")).toBe("42");
  });

  it("preserves multi-line output structure", () => {
    const raw = "YES\n3\n1 2 3\n";
    expect(normaliseOutput(raw)).toBe("YES\n3\n1 2 3");
  });
});

describe("runOracle", () => {
  it("returns high confidence when all invocations agree", async () => {
    const invoker: OracleInvoker = {
      solve: vi.fn().mockResolvedValue("15"),
    };
    const result = await runOracle(invoker, "sum problem", makeFakeCase(), 3);
    expect(result.confidence).toBe("high");
    expect(result.expected_output).toBe("15");
    expect(result.agreement_count).toBe(3);
    expect(result.total_invocations).toBe(3);
  });

  it("returns medium confidence when 2/3 agree", async () => {
    const invoker: OracleInvoker = {
      solve: vi
        .fn()
        .mockResolvedValueOnce("15")
        .mockResolvedValueOnce("15")
        .mockResolvedValueOnce("99"),
    };
    const result = await runOracle(invoker, "sum problem", makeFakeCase(), 3);
    expect(result.confidence).toBe("high"); // 2/3 = 0.667 ≥ 2/3 threshold
    expect(result.expected_output).toBe("15");
  });

  it("returns disputed when all differ", async () => {
    const invoker: OracleInvoker = {
      solve: vi
        .fn()
        .mockResolvedValueOnce("1")
        .mockResolvedValueOnce("2")
        .mockResolvedValueOnce("3"),
    };
    const result = await runOracle(invoker, "problem", makeFakeCase(), 3);
    expect(result.confidence).toBe("disputed");
  });

  it("normalises outputs before voting", async () => {
    const invoker: OracleInvoker = {
      solve: vi
        .fn()
        .mockResolvedValueOnce("  15  ")
        .mockResolvedValueOnce("15\n")
        .mockResolvedValueOnce("15"),
    };
    const result = await runOracle(invoker, "problem", makeFakeCase(), 3);
    expect(result.expected_output).toBe("15");
    expect(result.agreement_count).toBe(3);
  });

  it("throws OracleError when invoker fails", async () => {
    const invoker: OracleInvoker = {
      solve: vi.fn().mockRejectedValue(new Error("API down")),
    };
    await expect(
      runOracle(invoker, "problem", makeFakeCase(), 1)
    ).rejects.toThrow(OracleError);
  });

  it("works with a single invocation", async () => {
    const invoker: OracleInvoker = {
      solve: vi.fn().mockResolvedValue("42"),
    };
    const result = await runOracle(invoker, "problem", makeFakeCase(), 1);
    expect(result.expected_output).toBe("42");
    // 1/1 = 100% → high confidence
    expect(result.confidence).toBe("high");
  });
});
