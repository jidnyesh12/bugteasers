import { describe, expect, it } from "vitest";
import {
  hasTruncatedOutputs,
  PREVIEW_OUTPUT_LIMIT,
  PreviewRestoreError,
  restoreTruncatedOutputs,
  toPreviewProblems,
} from "@/lib/ai/generated-problem-preview";
import type { GeneratedProblem } from "@/lib/ai/types";

const longOutput = "9 ".repeat(PREVIEW_OUTPUT_LIMIT);

function buildProblem(): GeneratedProblem {
  return {
    title: "Sort",
    description: "Sort the array.",
    difficulty: "easy",
    tags: [],
    constraints: "",
    examples: [],
    hints: [],
    time_limit: 1000,
    memory_limit: 256,
    solution_code: "int main(){}",
    test_cases: [
      {
        input_data: "1\n5",
        expected_output: "5",
        is_sample: true,
        points: 1,
        generation_seed: "seed-sample",
      },
      {
        input_data: "",
        expected_output: longOutput,
        is_sample: false,
        points: 2,
        generation_seed: "seed-hidden",
      },
    ],
  };
}

describe("toPreviewProblems", () => {
  it("shortens long outputs and tags the source job", () => {
    const [preview] = toPreviewProblems([buildProblem()], "job-1");

    expect(preview.source_job_id).toBe("job-1");
    expect(preview.test_cases[0].expected_output).toBe("5");
    expect(preview.test_cases[0].expected_output_truncated).toBeUndefined();
    expect(preview.test_cases[1].expected_output).toHaveLength(
      PREVIEW_OUTPUT_LIMIT,
    );
    expect(preview.test_cases[1].expected_output_truncated).toBe(true);
    expect(hasTruncatedOutputs(preview)).toBe(true);
  });
});

describe("restoreTruncatedOutputs", () => {
  it("puts the stored full output back by generation seed", () => {
    const stored = [buildProblem()];
    const [preview] = toPreviewProblems(stored, "job-1");

    const restored = restoreTruncatedOutputs(
      { ...preview, title: "Sort (edited)" },
      stored,
    );

    expect(restored.title).toBe("Sort (edited)");
    expect(restored.test_cases[1].expected_output).toBe(longOutput);
    expect(restored.test_cases[1]).not.toHaveProperty(
      "expected_output_truncated",
    );
  });

  it("refuses to save a shortened output it cannot restore", () => {
    const [preview] = toPreviewProblems([buildProblem()], "job-1");

    expect(() => restoreTruncatedOutputs(preview, null)).toThrow(
      PreviewRestoreError,
    );
    expect(() =>
      restoreTruncatedOutputs(preview, [
        { ...buildProblem(), test_cases: [] },
      ]),
    ).toThrow(PreviewRestoreError);
  });

  it("leaves problems without shortened outputs alone", () => {
    const problem = buildProblem();
    problem.test_cases = [problem.test_cases[0]];

    expect(hasTruncatedOutputs(problem)).toBe(false);
    expect(restoreTruncatedOutputs(problem, null)).toEqual(problem);
  });
});
