import { OUTPUT_PREVIEW_LIMIT } from "@/lib/execution/output-preview";
import type { GeneratedProblem, GeneratedTestCase } from "./types";

export const PREVIEW_OUTPUT_LIMIT = OUTPUT_PREVIEW_LIMIT;

export class PreviewRestoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PreviewRestoreError";
  }
}

export function toPreviewProblems(
  problems: readonly GeneratedProblem[],
  jobId: string,
): GeneratedProblem[] {
  return problems.map((problem) => ({
    ...problem,
    source_job_id: jobId,
    test_cases: problem.test_cases.map((testCase) =>
      testCase.expected_output.length > PREVIEW_OUTPUT_LIMIT
        ? {
            ...testCase,
            expected_output: testCase.expected_output.slice(
              0,
              PREVIEW_OUTPUT_LIMIT,
            ),
            expected_output_truncated: true,
          }
        : testCase,
    ),
  }));
}

export function hasTruncatedOutputs(problem: GeneratedProblem): boolean {
  return (
    Array.isArray(problem.test_cases) &&
    problem.test_cases.some((testCase) => testCase?.expected_output_truncated)
  );
}

export function restoreTruncatedOutputs(
  problem: GeneratedProblem,
  storedProblems: readonly GeneratedProblem[] | null,
): GeneratedProblem {
  const fullOutputs = new Map<string, string>();
  for (const storedProblem of storedProblems ?? []) {
    for (const storedCase of storedProblem.test_cases) {
      if (storedCase.generation_seed) {
        fullOutputs.set(storedCase.generation_seed, storedCase.expected_output);
      }
    }
  }

  return {
    ...problem,
    test_cases: problem.test_cases.map(
      ({ expected_output_truncated, ...testCase }): GeneratedTestCase => {
        if (!expected_output_truncated) {
          return testCase;
        }

        const fullOutput = testCase.generation_seed
          ? fullOutputs.get(testCase.generation_seed)
          : undefined;

        if (fullOutput === undefined) {
          throw new PreviewRestoreError(
            "A test case output was shortened for preview and its generation job is no longer available. Generate the problem again.",
          );
        }

        return { ...testCase, expected_output: fullOutput };
      },
    ),
  };
}
