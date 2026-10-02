import { GenerationSeed } from "@/lib/ai/oracle-pairs/seeding";

export function deriveCaseSeed(
  jobSeed: string,
  problemIndex: number,
  caseIndex: number,
): string {
  return GenerationSeed.derive({
    masterSeed: jobSeed,
    problemId: `problem-${problemIndex + 1}`,
    testCaseIndex: caseIndex + 1,
  }).getValue();
}

export function deriveFanoutSeed(
  jobSeed: string,
  problemIndex: number,
  caseIndex: number,
  candidateIndex: number,
): string {
  return GenerationSeed.derive({
    masterSeed: jobSeed,
    problemId: `problem-${problemIndex + 1}:case-${caseIndex + 1}`,
    testCaseIndex: candidateIndex,
  }).getValue();
}
