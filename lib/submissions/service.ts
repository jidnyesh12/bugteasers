import { ExecutionDatabaseError } from '@/lib/execution/errors';
import {
  mapRawProblemSubmission,
  type RawProblemSubmissionRow,
} from './mapper';
import {
  type AssignmentSubmissionOverview,
  type AssignmentSubmissionProblem,
  type AssignmentSubmissionStudent,
  type ProblemSubmissionHistoryItem,
} from './types';
import { selectRepresentativeSubmission } from './selection';

type SupabaseClient = typeof import('@/lib/supabase/client').supabase;

interface ListProblemSubmissionsOptions {
  supabase: SupabaseClient;
  problemId: string;
  studentId: string;
  assignmentId?: string;
  limit: number;
}

interface GetAssignmentSubmissionOverviewOptions {
  supabase: SupabaseClient;
  assignmentId: string;
}

interface RawAssignmentProblemRow {
  problem_id: string;
  order_index: number;
  problems:
  | {
    id: string;
    title: string;
  }
  | Array<{
    id: string;
    title: string;
  }>
  | null;
}

interface RawClassroomAssignmentRow {
  classroom_id: string;
}

interface RawClassroomStudentRow {
  student_id: string;
  student:
  | {
    id: string;
    full_name: string | null;
    email: string | null;
  }
  | Array<{
    id: string;
    full_name: string | null;
    email: string | null;
  }>
  | null;
}

interface RawAssignmentSubmissionRow extends RawProblemSubmissionRow {
  student_id: string;
  problem_id: string;
}

function firstRelationRecord<TRow>(value: TRow | TRow[] | null | undefined): TRow | null {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
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

export async function getAssignmentSubmissionOverview(
  options: GetAssignmentSubmissionOverviewOptions
): Promise<AssignmentSubmissionOverview> {
  const { supabase, assignmentId } = options;

  const { data: assignmentProblems, error: assignmentProblemsError } = await supabase
    .from('assignment_problems')
    .select('problem_id, order_index, problems(id, title)')
    .eq('assignment_id', assignmentId)
    .order('order_index', { ascending: true });

  if (assignmentProblemsError) {
    throw new ExecutionDatabaseError(
      `Failed to fetch assignment problems: ${assignmentProblemsError.message}`,
      assignmentProblemsError
    );
  }

  const problemsById = new Map<string, AssignmentSubmissionProblem>();
  for (const row of ((assignmentProblems as unknown as RawAssignmentProblemRow[] | null) ?? [])) {
    if (!row.problem_id || problemsById.has(row.problem_id)) {
      continue;
    }

    const problemMeta = firstRelationRecord(row.problems);

    problemsById.set(row.problem_id, {
      id: row.problem_id,
      title: problemMeta?.title ?? 'Unknown problem',
      orderIndex: row.order_index,
    });
  }

  const problems = [...problemsById.values()].sort(
    (left, right) => left.orderIndex - right.orderIndex
  );
  if (problems.length === 0) {
    return {
      assignmentId,
      students: [],
      problems: [],
      summaries: [],
    };
  }

  const { data: classroomAssignments, error: classroomAssignmentsError } = await supabase
    .from('classroom_assignments')
    .select('classroom_id')
    .eq('assignment_id', assignmentId);

  if (classroomAssignmentsError) {
    throw new ExecutionDatabaseError(
      `Failed to fetch classroom assignments: ${classroomAssignmentsError.message}`,
      classroomAssignmentsError
    );
  }

  const classroomIds = [...new Set(
    ((classroomAssignments as RawClassroomAssignmentRow[] | null) ?? [])
      .map((row) => row.classroom_id)
      .filter((classroomId): classroomId is string => typeof classroomId === 'string' && classroomId.length > 0)
  )];

  if (classroomIds.length === 0) {
    return {
      assignmentId,
      students: [],
      problems,
      summaries: [],
    };
  }

  const { data: classroomStudents, error: classroomStudentsError } = await supabase
    .from('classroom_students')
    .select(`
      student_id,
      student:users!classroom_students_student_id_fkey (
        id,
        full_name,
        email
      )
    `)
    .in('classroom_id', classroomIds);

  if (classroomStudentsError) {
    throw new ExecutionDatabaseError(
      `Failed to fetch classroom students: ${classroomStudentsError.message}`,
      classroomStudentsError
    );
  }

  const studentsById = new Map<string, AssignmentSubmissionStudent>();
  for (const row of ((classroomStudents as unknown as RawClassroomStudentRow[] | null) ?? [])) {
    if (!row.student_id || studentsById.has(row.student_id)) {
      continue;
    }

    const studentMeta = firstRelationRecord(row.student);

    const fullName = studentMeta?.full_name?.trim() || studentMeta?.email || 'Unknown student';
    studentsById.set(row.student_id, {
      id: row.student_id,
      fullName,
      email: studentMeta?.email ?? '',
    });
  }

  const students = [...studentsById.values()].sort((left, right) =>
    left.fullName.localeCompare(right.fullName)
  );

  if (students.length === 0) {
    return {
      assignmentId,
      students: [],
      problems,
      summaries: [],
    };
  }

  const studentIds = students.map((student) => student.id);
  const problemIds = problems.map((problem) => problem.id);

  const { data: rawSubmissions, error: submissionsError } = await supabase
    .from('problem_submissions')
    .select('id, student_id, problem_id, language, status, score, earned_points, total_points, submitted_at, code, test_results')
    .eq('assignment_id', assignmentId)
    .in('student_id', studentIds)
    .in('problem_id', problemIds)
    .order('submitted_at', { ascending: false });

  if (submissionsError) {
    throw new ExecutionDatabaseError(
      `Failed to fetch assignment submissions: ${submissionsError.message}`,
      submissionsError
    );
  }

  const submissionsByBucket = new Map<string, ProblemSubmissionHistoryItem[]>();
  for (const row of (rawSubmissions as RawAssignmentSubmissionRow[] | null) ?? []) {
    const key = `${row.student_id}:${row.problem_id}`;
    const mappedSubmission = mapRawProblemSubmission(row);
    const existing = submissionsByBucket.get(key);

    if (existing) {
      existing.push(mappedSubmission);
      continue;
    }

    submissionsByBucket.set(key, [mappedSubmission]);
  }

  const summaries = students.flatMap((student) =>
    problems.map((problem) => {
      const key = `${student.id}:${problem.id}`;
      const attempts = submissionsByBucket.get(key) ?? [];

      return {
        studentId: student.id,
        problemId: problem.id,
        attemptsCount: attempts.length,
        selectedSubmission: selectRepresentativeSubmission(attempts),
      };
    })
  );

  return {
    assignmentId,
    students,
    problems,
    summaries,
  };
}