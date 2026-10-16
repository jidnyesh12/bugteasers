import { describe, expect, it } from "vitest";
import {
  materializeFanoutCandidates,
  orderBySizeSpread,
} from "@/lib/ai/hidden-case-fanout";
import type { TestCaseInputTemplate } from "@/lib/ai/template-dsl";

const JOB_SEED = "c".repeat(64);

const arrayTemplate: TestCaseInputTemplate = {
  version: 1,
  variables: {
    n: { type: "int", min: 1, max: 50 },
    arr: { type: "int_array", length: { ref: "n" }, min: -100, max: 100 },
  },
  output: [
    { type: "line", values: [{ ref: "n" }] },
    { type: "line", values: [{ ref: "arr" }] },
  ],
};

const constTemplate: TestCaseInputTemplate = {
  version: 1,
  variables: { n: { type: "const", value: 3 } },
  output: [{ type: "line", values: [{ ref: "n" }] }],
};

function item(size: number, candidateIndex: number) {
  return { size, candidateIndex };
}

describe("orderBySizeSpread", () => {
  it("visits the largest, the smallest, then fills in between", () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((size, index) =>
      item(size, index + 1),
    );

    expect(orderBySizeSpread(items).map((entry) => entry.size)).toEqual([
      9, 1, 5, 3, 7, 2, 4, 6, 8,
    ]);
  });

  it("returns every item exactly once", () => {
    const items = Array.from({ length: 13 }, (_, index) =>
      item((index * 7) % 13, index + 1),
    );
    const ordered = orderBySizeSpread(items);

    expect(ordered).toHaveLength(13);
    expect(new Set(ordered.map((entry) => entry.candidateIndex)).size).toBe(13);
  });

  it("puts the largest first for short lists", () => {
    expect(orderBySizeSpread([item(5, 1), item(9, 2)])).toEqual([
      item(9, 2),
      item(5, 1),
    ]);
    expect(orderBySizeSpread([])).toEqual([]);
  });

  it("breaks size ties by candidate index", () => {
    const ordered = orderBySizeSpread([item(4, 3), item(4, 1), item(4, 2)]);
    expect(ordered.map((entry) => entry.candidateIndex)).toEqual([3, 1, 2]);
  });
});

describe("materializeFanoutCandidates", () => {
  const params = {
    template: arrayTemplate,
    jobSeed: JOB_SEED,
    problemIndex: 0,
    caseIndex: 2,
    candidateCount: 8,
  };

  it("materializes one candidate per extra seed", () => {
    const candidates = materializeFanoutCandidates(params);

    expect(candidates.map((candidate) => candidate.candidateIndex)).toEqual([
      1, 2, 3, 4, 5, 6, 7,
    ]);
    expect(new Set(candidates.map((candidate) => candidate.inputHash)).size).toBe(7);
  });

  it("is deterministic for the same job seed", () => {
    expect(materializeFanoutCandidates(params)).toEqual(
      materializeFanoutCandidates(params),
    );
  });

  it("drops candidates that repeat an earlier input", () => {
    const candidates = materializeFanoutCandidates({
      ...params,
      template: constTemplate,
    });

    expect(candidates).toHaveLength(1);
  });

  it("produces nothing when only the original is requested", () => {
    expect(
      materializeFanoutCandidates({ ...params, candidateCount: 1 }),
    ).toEqual([]);
  });
});
