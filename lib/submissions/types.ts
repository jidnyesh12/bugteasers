export type SubmissionStatus =
  | "pending"
  | "passed"
  | "failed"
  | "partial"
  | "error";

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

export interface AssignmentSubmissionStudent {
  id: string;
  fullName: string;
  email: string;
}

export interface AssignmentSubmissionProblem {
  id: string;
  title: string;
  orderIndex: number;
}

export interface AssignmentSubmissionSummary {
  studentId: string;
  problemId: string;
  attemptsCount: number;
  selectedSubmission: ProblemSubmissionHistoryItem | null;
}

export interface AssignmentSubmissionOverview {
  assignmentId: string;
  students: AssignmentSubmissionStudent[];
  problems: AssignmentSubmissionProblem[];
  summaries: AssignmentSubmissionSummary[];
}
