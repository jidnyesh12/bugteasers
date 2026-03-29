import type { ProblemSubmissionHistoryItem } from './types';

export interface ProblemSubmissionDisplayItem extends ProblemSubmissionHistoryItem {
  isOptimistic?: boolean;
}