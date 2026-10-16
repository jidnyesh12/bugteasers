import type { TestResult } from "./types";

export const OUTPUT_PREVIEW_LIMIT = 2_000;

export function shortenForPreview(text: string): {
  text: string;
  truncated: boolean;
} {
  return text.length > OUTPUT_PREVIEW_LIMIT
    ? { text: text.slice(0, OUTPUT_PREVIEW_LIMIT), truncated: true }
    : { text, truncated: false };
}

export function shortenTestResult(result: TestResult): TestResult {
  const actual = shortenForPreview(result.actualOutput ?? "");
  const expected = shortenForPreview(result.expectedOutput ?? "");

  if (!actual.truncated && !expected.truncated) {
    return result;
  }

  return {
    ...result,
    actualOutput: actual.text,
    expectedOutput: expected.text,
    outputsTruncated: true,
  };
}
