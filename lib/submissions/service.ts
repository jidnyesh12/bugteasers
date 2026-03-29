import { ExecutionDatabaseError } from '@/lib/execution/errors';
import {
  mapRawProblemSubmission,
  type RawProblemSubmissionRow,
} from './mapper';
import type { ProblemSubmissionHistoryItem } from './types';

type SupabaseClient = typeof import('@/lib/supabase/client').supabase;

interface ListProblemSubmissionsOptions {
  supabase: SupabaseClient;
  problemId: string;
  studentId: string;
  assignmentId?: string;
  limit: number;
}

export async function listProblemSubmissions(
  options: ListProblemSubmissionsOptions
): Promise<ProblemSubmissionHistoryItem[]> {
  const {
    supabase,
    problemId,
    studentId,
    assignmentId,
    limit,
  } = options;

  let query = supabase
    .from('problem_submissions')
    .select('id, language, status, score, earned_points, total_points, submitted_at, code, test_results')
    .eq('problem_id', problemId)
    // Keep this user filter even after access checks as a defense-in-depth boundary.
    .eq('student_id', studentId);

  if (assignmentId) {
    query = query.eq('assignment_id', assignmentId);
  }

  const { data, error } = await query
    .order('submitted_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new ExecutionDatabaseError(`Failed to fetch submissions: ${error.message}`, error);
  }

  return (data as RawProblemSubmissionRow[] | null ?? []).map(mapRawProblemSubmission);
}