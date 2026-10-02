import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { deriveCaseSeed, deriveFanoutSeed } from "@/lib/ai/case-seeds";
import { annotateGeneratedProblems } from "@/lib/ai/generation-problem-processing";
import type { GeneratedProblem } from "@/lib/ai/types";

const JOB_SEED = "a".repeat(64);

function hmac(key: string, message: string) {
  return createHmac("sha256", key).update(message).digest("hex");
}

function buildProblem(seeds: Array<string | undefined>): GeneratedProblem {
  return {
    title: "Array Sum",
    description: "Sum the array.",
    difficulty: "easy",
    tags: [],
    constraints: "",
    examples: [],
    hints: [],
    time_limit: 1000,
    memory_limit: 256,
    solution_code: "int main(){}",
    test_cases: seeds.map((seed) => ({
      input_data: "1\n1",
      expected_output: "1",
      is_sample: false,
      points: 1,
      generation_seed: seed,
    })),
  };
}

describe("case seeds", () => {
  it("derives case seeds as HMAC-SHA256(job seed, problem | case index)", () => {
    expect(deriveCaseSeed(JOB_SEED, 0, 0)).toBe(hmac(JOB_SEED, "problem-1|1"));
    expect(deriveCaseSeed(JOB_SEED, 1, 4)).toBe(hmac(JOB_SEED, "problem-2|5"));
  });

  it("derives fan-out seeds under the case they expand", () => {
    expect(deriveFanoutSeed(JOB_SEED, 0, 2, 3)).toBe(
      hmac(JOB_SEED, "problem-1:case-3|3"),
    );
  });

  it("gives every case and candidate its own seed", () => {
    const seeds = new Set<string>();
    for (let caseIndex = 0; caseIndex < 10; caseIndex += 1) {
      seeds.add(deriveCaseSeed(JOB_SEED, 0, caseIndex));
      for (let candidate = 1; candidate < 8; candidate += 1) {
        seeds.add(deriveFanoutSeed(JOB_SEED, 0, caseIndex, candidate));
      }
    }
    expect(seeds.size).toBe(80);
  });

  it("depends on the job seed", () => {
    expect(deriveCaseSeed(JOB_SEED, 0, 0)).not.toBe(
      deriveCaseSeed("b".repeat(64), 0, 0),
    );
  });
});

describe("annotateGeneratedProblems", () => {
  it("assigns HMAC case seeds to cases without one", () => {
    const [annotated] = annotateGeneratedProblems(
      [buildProblem([undefined, undefined])],
      "gemini",
      JOB_SEED,
    );

    expect(annotated.test_cases.map((tc) => tc.generation_seed)).toEqual([
      deriveCaseSeed(JOB_SEED, 0, 0),
      deriveCaseSeed(JOB_SEED, 0, 1),
    ]);
  });

  it("keeps a seed a case already carries", () => {
    const [annotated] = annotateGeneratedProblems(
      [buildProblem(["existing-seed"])],
      "gemini",
      JOB_SEED,
    );

    expect(annotated.test_cases[0].generation_seed).toBe("existing-seed");
  });
});
