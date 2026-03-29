export type SubmissionStatus = 'pending' | 'passed' | 'failed' | 'partial' | 'error';

export interface ProblemSubmissionHistoryItem {
  id: string;
  language: string;
  status: SubmissionStatus;
  score: number | null;
  earnedPoints: number | null;
  totalPoints: number | null;
  passedCount: number;
  totalTestCount: number;
  submittedAt: string;
  code: string;
}
