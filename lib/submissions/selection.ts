import type { ProblemSubmissionHistoryItem } from './types';

function toTimestamp(value: string): number {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function sortByLatest(
  left: ProblemSubmissionHistoryItem,
  right: ProblemSubmissionHistoryItem
): number {
  return toTimestamp(right.submittedAt) - toTimestamp(left.submittedAt);
}

export function selectRepresentativeSubmission(
  submissions: ProblemSubmissionHistoryItem[]
): ProblemSubmissionHistoryItem | null {
  if (submissions.length === 0) {
    return null;
  }

  const latestPassed = submissions
    .filter((submission) => submission.status === 'passed')
    .sort(sortByLatest)[0];

  if (latestPassed) {
    return latestPassed;
  }

  const bestPartial = submissions
    .filter((submission) => submission.status === 'partial')
    .sort((left, right) => {
      const pointsDelta = (right.earnedPoints ?? -1) - (left.earnedPoints ?? -1);
      if (pointsDelta !== 0) {
        return pointsDelta;
      }

      return sortByLatest(left, right);
    })[0];

  if (bestPartial) {
    return bestPartial;
  }

  const latestIncorrect = submissions
    .filter((submission) => submission.status === 'failed' || submission.status === 'error')
    .sort(sortByLatest)[0];

  if (latestIncorrect) {
    return latestIncorrect;
  }

  return [...submissions].sort(sortByLatest)[0] ?? null;
}
