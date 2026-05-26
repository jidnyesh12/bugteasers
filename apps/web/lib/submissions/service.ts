import { ExecutionDatabaseError } from "@/lib/execution/errors";
import {
  mapRawProblemSubmission,
  parseNullableNumber,
  type RawProblemSubmissionRow,
} from "./mapper";
import {
  type AssignmentSubmissionOverview,
  type AssignmentSubmissionProblem,
  type AssignmentSubmissionStudent,
  type ProblemSubmissionHistoryItem,
  type TelemetrySummary,
} from "./types";
import { selectRepresentativeSubmission } from "./selection";

type SupabaseClient = typeof import("@/lib/supabase/client").supabase;

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
  max_plagiarism_score?: unknown;
  top_match_submission_id?: string | null;
  is_ai_match?: unknown;
}

interface RawTelemetryRow {
  student_id: string;
  problem_id: string;
  events: unknown;
}

function firstRelationRecord<TRow>(
  value: TRow | TRow[] | null | undefined,
): TRow | null {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

export async function listProblemSubmissions(
  options: ListProblemSubmissionsOptions,
): Promise<ProblemSubmissionHistoryItem[]> {
  const { supabase, problemId, studentId, assignmentId, limit } = options;

  let query = supabase
    .from("problem_submissions")
    .select(
      "id, language, status, score, earned_points, total_points, submitted_at, code, test_results",
    )
    .eq("problem_id", problemId)
    // Keep this user filter even after access checks as a defense-in-depth boundary.
    .eq("student_id", studentId);

  if (assignmentId) {
    query = query.eq("assignment_id", assignmentId);
  }

  const { data, error } = await query
    .order("submitted_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new ExecutionDatabaseError(
      `Failed to fetch submissions: ${error.message}`,
      error,
    );
  }

  return ((data as RawProblemSubmissionRow[] | null) ?? []).map(
    mapRawProblemSubmission,
  );
}

export async function getAssignmentSubmissionOverview(
  options: GetAssignmentSubmissionOverviewOptions,
): Promise<AssignmentSubmissionOverview> {
  const { supabase, assignmentId } = options;

  const { data: assignmentProblems, error: assignmentProblemsError } =
    await supabase
      .from("assignment_problems")
      .select("problem_id, order_index, problems(id, title)")
      .eq("assignment_id", assignmentId)
      .order("order_index", { ascending: true });

  if (assignmentProblemsError) {
    throw new ExecutionDatabaseError(
      `Failed to fetch assignment problems: ${assignmentProblemsError.message}`,
      assignmentProblemsError,
    );
  }

  const problemsById = new Map<string, AssignmentSubmissionProblem>();
  for (const row of (assignmentProblems as unknown as
    | RawAssignmentProblemRow[]
    | null) ?? []) {
    if (!row.problem_id || problemsById.has(row.problem_id)) {
      continue;
    }

    const problemMeta = firstRelationRecord(row.problems);

    problemsById.set(row.problem_id, {
      id: row.problem_id,
      title: problemMeta?.title ?? "Unknown problem",
      orderIndex: row.order_index,
    });
  }

  const problems = [...problemsById.values()].sort(
    (left, right) => left.orderIndex - right.orderIndex,
  );
  if (problems.length === 0) {
    return {
      assignmentId,
      students: [],
      problems: [],
      summaries: [],
    };
  }

  const { data: classroomAssignments, error: classroomAssignmentsError } =
    await supabase
      .from("classroom_assignments")
      .select("classroom_id")
      .eq("assignment_id", assignmentId);

  if (classroomAssignmentsError) {
    throw new ExecutionDatabaseError(
      `Failed to fetch classroom assignments: ${classroomAssignmentsError.message}`,
      classroomAssignmentsError,
    );
  }

  const classroomIds = [
    ...new Set(
      ((classroomAssignments as RawClassroomAssignmentRow[] | null) ?? [])
        .map((row) => row.classroom_id)
        .filter(
          (classroomId): classroomId is string =>
            typeof classroomId === "string" && classroomId.length > 0,
        ),
    ),
  ];

  if (classroomIds.length === 0) {
    return {
      assignmentId,
      students: [],
      problems,
      summaries: [],
    };
  }

  const { data: classroomStudents, error: classroomStudentsError } =
    await supabase
      .from("classroom_students")
      .select(
        `
      student_id,
      student:users!classroom_students_student_id_fkey (
        id,
        full_name,
        email
      )
    `,
      )
      .in("classroom_id", classroomIds);

  if (classroomStudentsError) {
    throw new ExecutionDatabaseError(
      `Failed to fetch classroom students: ${classroomStudentsError.message}`,
      classroomStudentsError,
    );
  }

  const studentsById = new Map<string, AssignmentSubmissionStudent>();
  for (const row of (classroomStudents as unknown as
    | RawClassroomStudentRow[]
    | null) ?? []) {
    if (!row.student_id || studentsById.has(row.student_id)) {
      continue;
    }

    const studentMeta = firstRelationRecord(row.student);

    const fullName =
      studentMeta?.full_name?.trim() || studentMeta?.email || "Unknown student";
    studentsById.set(row.student_id, {
      id: row.student_id,
      fullName,
      email: studentMeta?.email ?? "",
    });
  }

  const students = [...studentsById.values()].sort((left, right) =>
    left.fullName.localeCompare(right.fullName),
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
    .from("problem_submissions")
    .select(
      "id, student_id, problem_id, language, status, score, earned_points, total_points, submitted_at, code, test_results, max_plagiarism_score, top_match_submission_id, is_ai_match",
    )
    .eq("assignment_id", assignmentId)
    .in("student_id", studentIds)
    .in("problem_id", problemIds)
    .order("submitted_at", { ascending: false });

  if (submissionsError) {
    throw new ExecutionDatabaseError(
      `Failed to fetch assignment submissions: ${submissionsError.message}`,
      submissionsError,
    );
  }

  const submissionsByBucket = new Map<string, ProblemSubmissionHistoryItem[]>();
  const topMatchSubmissionIds = new Set<string>();

  for (const row of (rawSubmissions as RawAssignmentSubmissionRow[] | null) ?? []) {
    const key = `${row.student_id}:${row.problem_id}`;
    const mappedSubmission = mapRawProblemSubmission(row);
    const existing = submissionsByBucket.get(key);

    if (existing) {
      existing.push(mappedSubmission);
    } else {
      submissionsByBucket.set(key, [mappedSubmission]);
    }

    if (row.top_match_submission_id) {
      topMatchSubmissionIds.add(row.top_match_submission_id);
    }
  }

  const topMatchStudentNames = new Map<string, string>();
  if (topMatchSubmissionIds.size > 0) {
    const { data: topMatchSubmissions, error: topMatchSubmissionsError } =
      await supabase
        .from("problem_submissions")
        .select("id, student_id")
        .in("id", Array.from(topMatchSubmissionIds));

    if (topMatchSubmissionsError) {
      throw new ExecutionDatabaseError(
        `Failed to fetch plagiarism match submissions: ${topMatchSubmissionsError.message}`,
        topMatchSubmissionsError,
      );
    }

    const topMatchStudentIds = [
      ...new Set(
        ((topMatchSubmissions as Array<{ student_id: string }> | null) ?? [])
          .map((row) => row.student_id)
          .filter((value): value is string => typeof value === "string"),
      ),
    ];

    if (topMatchStudentIds.length > 0) {
      const { data: topMatchUsers, error: topMatchUsersError } = await supabase
        .from("users")
        .select("id, full_name, email")
        .in("id", topMatchStudentIds);

      if (topMatchUsersError) {
        throw new ExecutionDatabaseError(
          `Failed to fetch plagiarism match users: ${topMatchUsersError.message}`,
          topMatchUsersError,
        );
      }

      const userNameById = new Map<string, string>();
      for (const user of (topMatchUsers as Array<{
        id: string;
        full_name: string | null;
        email: string | null;
      }> | null) ?? []) {
        userNameById.set(
          user.id,
          user.full_name?.trim() || user.email?.trim() || user.id,
        );
      }

      for (const row of (topMatchSubmissions as Array<{
        id: string;
        student_id: string;
      }> | null) ?? []) {
        const studentName = userNameById.get(row.student_id) ?? row.student_id;
        topMatchStudentNames.set(row.id, studentName);
      }
    }
  }

  const { data: telemetryRows, error: telemetryError } = await supabase
    .from("telemetry")
    .select("student_id, problem_id, events")
    .eq("assignment_id", assignmentId)
    .in("student_id", studentIds)
    .in("problem_id", problemIds);

  if (telemetryError) {
    throw new ExecutionDatabaseError(
      `Failed to fetch telemetry data: ${telemetryError.message}`,
      telemetryError,
    );
  }

  const telemetryByKey = new Map<string, TelemetrySummary>();
  for (const row of (telemetryRows as RawTelemetryRow[] | null) ?? []) {
    const events =
      row.events && typeof row.events === "object"
        ? (row.events as Record<string, unknown>)
        : undefined;
    const summary =
      events && typeof events.summary === "object"
        ? (events.summary as Record<string, unknown>)
        : undefined;

    telemetryByKey.set(`${row.student_id}:${row.problem_id}`, {
      pasteCount: parseNullableNumber(summary?.paste_count, { min: 0 }),
      pastedChars: parseNullableNumber(summary?.total_pasted_chars, { min: 0 }),
      tabSwitchCount: parseNullableNumber(summary?.tab_switch_count, {
        min: 0,
      }),
      backspaceCount: parseNullableNumber(summary?.backspace_count, {
        min: 0,
      }),
    });
  }

  const summaries = students.flatMap((student) =>
    problems.map((problem) => {
      const key = `${student.id}:${problem.id}`;
      const attempts = submissionsByBucket.get(key) ?? [];
      const selectedSubmission = selectRepresentativeSubmission(attempts);
      const topMatchStudentName = selectedSubmission?.topMatchSubmissionId
        ? topMatchStudentNames.get(selectedSubmission.topMatchSubmissionId) ??
          "Unknown student"
        : null;

      return {
        studentId: student.id,
        problemId: problem.id,
        attemptsCount: attempts.length,
        selectedSubmission,
        topMatchStudentName,
        telemetrySummary: telemetryByKey.get(key) ?? null,
      };
    }),
  );

  return {
    assignmentId,
    students,
    problems,
    summaries,
  };
}
