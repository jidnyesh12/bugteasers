import { describe, expect, it } from "vitest";
import {
  MAX_RUN_TIMEOUT_MS,
  MIN_RUN_TIMEOUT_MS,
  resolveRunTimeoutMs,
} from "@/lib/execution/languages";
import { describeRunFailure } from "@/lib/execution/evaluator";

describe("resolveRunTimeoutMs", () => {
  it("uses the problem time limit for compiled languages", () => {
    expect(resolveRunTimeoutMs("cpp", 2000)).toBe(2000);
    expect(resolveRunTimeoutMs("c", 1500)).toBe(1500);
  });

  it("gives slower runtimes a multiple of the limit", () => {
    expect(resolveRunTimeoutMs("java", 2000)).toBe(4000);
    expect(resolveRunTimeoutMs("python", 2000)).toBe(6000);
  });

  it("clamps to what the sandbox allows", () => {
    expect(resolveRunTimeoutMs("cpp", 100)).toBe(MIN_RUN_TIMEOUT_MS);
    expect(resolveRunTimeoutMs("python", 5000)).toBe(MAX_RUN_TIMEOUT_MS);
  });

  it("leaves the sandbox default when the problem has no usable limit", () => {
    expect(resolveRunTimeoutMs("cpp", null)).toBeUndefined();
    expect(resolveRunTimeoutMs("cpp", undefined)).toBeUndefined();
    expect(resolveRunTimeoutMs("cpp", 0)).toBeUndefined();
    expect(resolveRunTimeoutMs("cpp", Number.NaN)).toBeUndefined();
  });
});

describe("describeRunFailure", () => {
  const base = { stdout: "", stderr: "", code: 1, signal: null, output: "" };

  it("names a time limit kill", () => {
    expect(
      describeRunFailure({ ...base, signal: "SIGKILL", status: "TO" }),
    ).toBe("Time limit exceeded");
  });

  it("names an output limit kill", () => {
    expect(describeRunFailure({ ...base, status: "OL" })).toBe(
      "Output limit exceeded",
    );
  });

  it("prefers stderr for ordinary runtime errors", () => {
    expect(
      describeRunFailure({ ...base, stderr: "Segmentation fault", status: "SG" }),
    ).toBe("Segmentation fault");
    expect(describeRunFailure(base)).toBe("Runtime error");
  });
});
