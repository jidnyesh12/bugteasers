import { beforeEach, describe, expect, it, vi } from "vitest";

const { pistonExecuteMock } = vi.hoisted(() => ({
  pistonExecuteMock: vi.fn(),
}));

vi.mock("@/lib/execution/client", () => ({
  PistonClientImpl: class MockPistonClientImpl {
    execute(payload: unknown) {
      return pistonExecuteMock(payload);
    }
  },
}));

import {
  DEFAULT_EXECUTOR_CONFIG,
  executeCode,
} from "@/lib/ai/oracle-pairs/executor";
import type { ModelAnswer } from "@/lib/ai/oracle-pairs/types";

const answer = {
  code: "int main(){}",
  language: "cpp",
  generationSeed: "seed",
} as ModelAnswer;

function run(stdout: string, extra: Record<string, unknown> = {}) {
  return {
    language: "c++",
    version: "10.2.0",
    compile: { stdout: "", stderr: "", code: 0, signal: null, output: "" },
    run: { stdout, stderr: "", code: 0, signal: null, output: stdout, ...extra },
  };
}

describe("executeCode output handling", () => {
  beforeEach(() => {
    pistonExecuteMock.mockReset();
  });

  it("returns outputs past a megabyte in full", async () => {
    const output = "7 ".repeat(1_500_000).trim();
    pistonExecuteMock.mockResolvedValue(run(output));

    const result = await executeCode(answer, "1", {
      ...DEFAULT_EXECUTOR_CONFIG,
      seedRNG: false,
    });

    expect(result.status).toBe("success");
    expect(result.output).toHaveLength(output.length);
  });

  it("fails instead of truncating output over the limit", async () => {
    pistonExecuteMock.mockResolvedValue(run("x".repeat(101)));

    const result = await executeCode(answer, "1", {
      ...DEFAULT_EXECUTOR_CONFIG,
      seedRNG: false,
      maxOutputLength: 100,
    });

    expect(result.status).toBe("error");
    expect(result.output).toBe("");
    expect(result.stderr).toContain("Output limit exceeded");
  });

  it("fails when the sandbox stops a program for printing too much", async () => {
    pistonExecuteMock.mockResolvedValue(
      run("partial", { code: null, signal: "SIGKILL", status: "OL" }),
    );

    const result = await executeCode(answer, "1", {
      ...DEFAULT_EXECUTOR_CONFIG,
      seedRNG: false,
    });

    expect(result.status).toBe("error");
    expect(result.output).toBe("");
  });
});
