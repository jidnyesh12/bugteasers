import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase/client";
import type { SubmissionStatus } from "@/lib/submissions/types";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

interface ClassroomRow {
  id: string;
}

interface ClassroomStudentRow {
  student_id: string;
}

interface ProblemRow {
  id: string;
}

interface ProblemMetaRow {
  id: string;
  title: string;
}

interface UserRow {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface SubmissionStatsRow {
  problem_id: string;
  status: SubmissionStatus;
  score: number | string | null;
  submitted_at: string;
}

interface RecentSubmissionRow extends SubmissionStatsRow {
  id: string;
  student_id: string;
}

interface InstructorStatsPayload {
  stats: {
    totalProblems: number;
    pendingReviews: number;
    activeStudents: number;
    classrooms: number;
  };
  recentSubmissions: Array<{
    id: string;
    submittedAt: string;
    status: SubmissionStatus;
    score: number | null;
    studentName: string;
    problemTitle: string;
  }>;
}

interface StudentStatsPayload {
  stats: {
    problemsSolved: number;
    dayStreak: number;
    submissions: number;
    accuracy: number | null;
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role === "instructor") {
      const payload = await buildInstructorStats(session.user.id);
      return NextResponse.json({
        role: "instructor",
        ...payload,
      });
    }

    const payload = await buildStudentStats(session.user.id);
    return NextResponse.json({
      role: "student",
      ...payload,
    });
  } catch (error) {
    console.error("Error in dashboard stats API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function buildInstructorStats(
  userId: string,
): Promise<InstructorStatsPayload> {
  const { data: problemRows, error: problemRowsError } = await supabase
    .from("problems")
    .select("id")
    .eq("created_by", userId);

  if (problemRowsError) {
    throw new Error(
      `Failed to fetch instructor problems: ${problemRowsError.message}`,
    );
  }

  const problemIds = ((problemRows as ProblemRow[] | null) ?? [])
    .map((problem) => problem.id)
    .filter(
      (problemId): problemId is string =>
        typeof problemId === "string" && problemId.length > 0,
    );

  const { data: classroomRows, error: classroomRowsError } = await supabase
    .from("classrooms")
    .select("id")
    .eq("instructor_id", userId);

  if (classroomRowsError) {
    throw new Error(
      `Failed to fetch classrooms: ${classroomRowsError.message}`,
    );
  }

  const classroomIds = ((classroomRows as ClassroomRow[] | null) ?? [])
    .map((classroom) => classroom.id)
    .filter(
      (classroomId): classroomId is string =>
        typeof classroomId === "string" && classroomId.length > 0,
    );

  let activeStudents = 0;
  if (classroomIds.length > 0) {
    const { data: classroomStudents, error: classroomStudentsError } =
      await supabase
        .from("classroom_students")
        .select("student_id")
        .in("classroom_id", classroomIds);

    if (classroomStudentsError) {
      throw new Error(
        `Failed to fetch classroom students: ${classroomStudentsError.message}`,
      );
    }

    activeStudents = new Set(
      ((classroomStudents as ClassroomStudentRow[] | null) ?? [])
        .map((student) => student.student_id)
        .filter(
          (studentId): studentId is string =>
            typeof studentId === "string" && studentId.length > 0,
        ),
    ).size;
  }

  let pendingReviews = 0;
  let recentSubmissionRows: RecentSubmissionRow[] = [];

  if (problemIds.length > 0) {
    const { count: pendingCount, error: pendingCountError } = await supabase
      .from("problem_submissions")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .in("problem_id", problemIds);

    if (pendingCountError) {
      throw new Error(
        `Failed to fetch pending submissions: ${pendingCountError.message}`,
      );
    }

    pendingReviews = pendingCount ?? 0;

    const { data: recentSubmissions, error: recentSubmissionsError } =
      await supabase
        .from("problem_submissions")
        .select("id, problem_id, student_id, status, score, submitted_at")
        .in("problem_id", problemIds)
        .order("submitted_at", { ascending: false })
        .limit(5);

    if (recentSubmissionsError) {
      throw new Error(
        `Failed to fetch recent submissions: ${recentSubmissionsError.message}`,
      );
    }

    recentSubmissionRows =
      (recentSubmissions as RecentSubmissionRow[] | null) ?? [];
  }

  const recentStudentIds = [
    ...new Set(
      recentSubmissionRows
        .map((submission) => submission.student_id)
        .filter(
          (studentId): studentId is string =>
            typeof studentId === "string" && studentId.length > 0,
        ),
    ),
  ];

  const recentProblemIds = [
    ...new Set(
      recentSubmissionRows
        .map((submission) => submission.problem_id)
        .filter(
          (problemId): problemId is string =>
            typeof problemId === "string" && problemId.length > 0,
        ),
    ),
  ];

  let studentsById = new Map<string, UserRow>();
  if (recentStudentIds.length > 0) {
    const { data: studentRows, error: studentRowsError } = await supabase
      .from("users")
      .select("id, full_name, email")
      .in("id", recentStudentIds);

    if (studentRowsError) {
      throw new Error(
        `Failed to fetch submission students: ${studentRowsError.message}`,
      );
    }

    studentsById = new Map(
      ((studentRows as UserRow[] | null) ?? []).map((student) => [
        student.id,
        student,
      ]),
    );
  }

  let problemsById = new Map<string, ProblemMetaRow>();
  if (recentProblemIds.length > 0) {
    const { data: problemMetaRows, error: problemMetaRowsError } =
      await supabase
        .from("problems")
        .select("id, title")
        .in("id", recentProblemIds);

    if (problemMetaRowsError) {
      throw new Error(
        `Failed to fetch submission problems: ${problemMetaRowsError.message}`,
      );
    }

    problemsById = new Map(
      ((problemMetaRows as ProblemMetaRow[] | null) ?? []).map((problem) => [
        problem.id,
        problem,
      ]),
    );
  }

  return {
    stats: {
      totalProblems: problemIds.length,
      pendingReviews,
      activeStudents,
      classrooms: classroomIds.length,
    },
    recentSubmissions: recentSubmissionRows.map((submission) => {
      const student = studentsById.get(submission.student_id);
      const problem = problemsById.get(submission.problem_id);

      return {
        id: submission.id,
        submittedAt: submission.submitted_at,
        status: submission.status,
        score: normalizeScore(submission.score),
        studentName:
          student?.full_name?.trim() || student?.email || "Unknown student",
        problemTitle: problem?.title || "Unknown problem",
      };
    }),
  };
}

async function buildStudentStats(userId: string): Promise<StudentStatsPayload> {
  const { data: submissionRows, error: submissionRowsError } = await supabase
    .from("problem_submissions")
    .select("problem_id, status, score, submitted_at")
    .eq("student_id", userId)
    .order("submitted_at", { ascending: false });

  if (submissionRowsError) {
    throw new Error(
      `Failed to fetch student submissions: ${submissionRowsError.message}`,
    );
  }

  const submissions = (submissionRows as SubmissionStatsRow[] | null) ?? [];

  const solvedProblemIds = new Set(
    submissions
      .filter((submission) => submission.status === "passed")
      .map((submission) => submission.problem_id)
      .filter(
        (problemId): problemId is string =>
          typeof problemId === "string" && problemId.length > 0,
      ),
  );

  const scoredSubmissions = submissions
    .map((submission) => normalizeScore(submission.score))
    .filter((score): score is number => score !== null);

  const passedSubmissionCount = submissions.filter(
    (submission) => submission.status === "passed",
  ).length;

  let accuracy: number | null = null;
  if (scoredSubmissions.length > 0) {
    const scoreTotal = scoredSubmissions.reduce((sum, score) => sum + score, 0);
    accuracy = Math.round(scoreTotal / scoredSubmissions.length);
  } else if (submissions.length > 0) {
    accuracy = Math.round((passedSubmissionCount / submissions.length) * 100);
  }

  return {
    stats: {
      problemsSolved: solvedProblemIds.size,
      dayStreak: calculateDayStreak(
        submissions.map((submission) => submission.submitted_at),
      ),
      submissions: submissions.length,
      accuracy,
    },
  };
}

function normalizeScore(value: number | string | null): number | null {
  if (value === null) {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

function toUtcDayKey(value: string): string | null {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
}

function calculateDayStreak(submittedAtValues: string[]): number {
  const sortedUniqueDays = [
    ...new Set(
      submittedAtValues
        .map((value) => toUtcDayKey(value))
        .filter(
          (day): day is string => typeof day === "string" && day.length > 0,
        ),
    ),
  ].sort((left, right) => right.localeCompare(left));

  if (sortedUniqueDays.length === 0) {
    return 0;
  }

  let streak = 1;
  let previousDate = new Date(`${sortedUniqueDays[0]}T00:00:00.000Z`);

  for (let index = 1; index < sortedUniqueDays.length; index += 1) {
    const currentDate = new Date(`${sortedUniqueDays[index]}T00:00:00.000Z`);
    const diffInDays = Math.round(
      (previousDate.getTime() - currentDate.getTime()) / DAY_IN_MS,
    );

    if (diffInDays !== 1) {
      break;
    }

    streak += 1;
    previousDate = currentDate;
  }

  return streak;
}
