import { createHash } from "node:crypto";
import {
  materializeTestCaseInputTemplate,
  type TestCaseInputTemplate,
} from "@/lib/ai/template-dsl";
import { deriveFanoutSeed } from "./case-seeds";

export interface FanoutCandidate {
  candidateIndex: number;
  seed: string;
  input: string;
  inputHash: string;
  size: number;
}

export function hashInput(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function materializeFanoutCandidates(params: {
  template: TestCaseInputTemplate;
  jobSeed: string;
  problemIndex: number;
  caseIndex: number;
  candidateCount: number;
}): FanoutCandidate[] {
  const { template, jobSeed, problemIndex, caseIndex, candidateCount } = params;
  const candidates: FanoutCandidate[] = [];
  const seen = new Set<string>();

  for (let candidateIndex = 1; candidateIndex < candidateCount; candidateIndex += 1) {
    const seed = deriveFanoutSeed(jobSeed, problemIndex, caseIndex, candidateIndex);

    let input: string;
    try {
      input = materializeTestCaseInputTemplate(template, {
        seedMaterial: seed,
      }).inputData;
    } catch {
      continue;
    }

    if (input.trim().length === 0) {
      continue;
    }

    const inputHash = hashInput(input);
    if (seen.has(inputHash)) {
      continue;
    }
    seen.add(inputHash);

    candidates.push({
      candidateIndex,
      seed,
      input,
      inputHash,
      size: Buffer.byteLength(input, "utf8"),
    });
  }

  return candidates;
}

export function orderBySizeSpread<
  T extends { size: number; candidateIndex: number },
>(items: readonly T[]): T[] {
  const sorted = [...items].sort(
    (left, right) =>
      left.size - right.size || left.candidateIndex - right.candidateIndex,
  );

  if (sorted.length <= 2) {
    return sorted.reverse();
  }

  const order = [sorted.length - 1, 0];
  const intervals: Array<[number, number]> = [[0, sorted.length - 1]];

  for (let cursor = 0; cursor < intervals.length; cursor += 1) {
    const [low, high] = intervals[cursor];
    if (high - low < 2) {
      continue;
    }
    const middle = Math.floor((low + high) / 2);
    order.push(middle);
    intervals.push([low, middle], [middle, high]);
  }

  return order.map((index) => sorted[index]);
}
