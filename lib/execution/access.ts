import type { SupabaseClient } from '@supabase/supabase-js';
import {
  ExecutionDatabaseError,
  ExecutionForbiddenError,
  ExecutionNotFoundError,
} from './errors';

interface ExecutionAccessOptions {
  supabase: SupabaseClient;
  problemId: string;
  userId: string;
  userRole?: string;
  assignmentId?: string;
}

export async function assertProblemExists(
  supabase: SupabaseClient,
  problemId: string
): Promise<void> {
  const { data, error } = await supabase
    .from('problems')
    .select('id')
    .eq('id', problemId)
    .single();

  if (error) {
    const errorCode = (error as { code?: string }).code;
    if (errorCode === 'PGRST116') {
      throw new ExecutionNotFoundError('Problem not found');
    }

    throw new ExecutionDatabaseError(`Failed to validate problem: ${error.message}`, error);
  }

  if (!data) {
    throw new ExecutionNotFoundError('Problem not found');
  }
}

export async function assertExecutionAccess(options: ExecutionAccessOptions): Promise<void> {
  const {
    supabase,
    problemId,
    userId,
    userRole,
    assignmentId,
  } = options;

  await assertProblemExists(supabase, problemId);

  // Assignment-scoped submission checks apply to students only.
  if (!assignmentId || userRole !== 'student') {
    return;
  }

  const { data: assignmentProblems, error: assignmentProblemsError } = await supabase
    .from('assignment_problems')
    .select('id')
    .eq('assignment_id', assignmentId)
    .eq('problem_id', problemId)
    .limit(1);

  if (assignmentProblemsError) {
    throw new ExecutionDatabaseError(
      `Failed to validate assignment problem mapping: ${assignmentProblemsError.message}`,
      assignmentProblemsError
    );
  }

  if (!assignmentProblems || assignmentProblems.length === 0) {
    throw new ExecutionForbiddenError('Access denied');
  }

  const { data: classroomAssignments, error: classroomAssignmentsError } = await supabase
    .from('classroom_assignments')
    .select('classroom_id')
    .eq('assignment_id', assignmentId)
    .limit(1);

  if (classroomAssignmentsError) {
    throw new ExecutionDatabaseError(
      `Failed to validate classroom assignment mapping: ${classroomAssignmentsError.message}`,
      classroomAssignmentsError
    );
  }

  if (!classroomAssignments || classroomAssignments.length === 0) {
    throw new ExecutionForbiddenError('Access denied');
  }

  const classroomId = classroomAssignments[0]?.classroom_id;

  const { data: enrollment, error: enrollmentError } = await supabase
    .from('classroom_students')
    .select('id')
    .eq('classroom_id', classroomId)
    .eq('student_id', userId)
    .limit(1);

  if (enrollmentError) {
    throw new ExecutionDatabaseError(
      `Failed to validate classroom enrollment: ${enrollmentError.message}`,
      enrollmentError
    );
  }

  if (!enrollment || enrollment.length === 0) {
    throw new ExecutionForbiddenError('Access denied');
  }
}
