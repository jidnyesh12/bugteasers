import { ExecutionHttpError } from "./execution-client";
import type { SubmissionStatus } from "@/lib/submissions/types";

interface ErrorPayload {
  error?: string;
}

export interface InstructorDashboardStats {
  totalProblems: number;
  pendingReviews: number;
  activeStudents: number;
  classrooms: number;
}

export interface InstructorRecentSubmission {
  id: string;
  submittedAt: string;
  status: SubmissionStatus;
  score: number | null;
  studentName: string;
  problemTitle: string;
}

export interface InstructorDashboardStatsResponse {
  role: "instructor";
  stats: InstructorDashboardStats;
  recentSubmissions: InstructorRecentSubmission[];
}

export interface StudentDashboardStats {
  problemsSolved: number;
  dayStreak: number;
  submissions: number;
  accuracy: number | null;
}

export interface StudentDashboardStatsResponse {
  role: "student";
  stats: StudentDashboardStats;
}

export type DashboardStatsResponse =
  | InstructorDashboardStatsResponse
  | StudentDashboardStatsResponse;

export async function fetchDashboardStats(): Promise<DashboardStatsResponse> {
  const response = await fetch("/api/dashboard/stats", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const parsedBody = await parseJson<ErrorPayload | DashboardStatsResponse>(
    response,
  );

  if (!response.ok) {
    throwHttpError(response, parsedBody, "Failed to load dashboard stats");
  }

  if (!isDashboardStatsPayload(parsedBody)) {
    throw new Error("Invalid dashboard stats response");
  }

  return parsedBody;
}

export async function fetchInstructorDashboardStats(): Promise<InstructorDashboardStatsResponse> {
  const payload = await fetchDashboardStats();

  if (payload.role !== "instructor") {
    throw new Error("Dashboard stats are only available for instructors.");
  }

  return payload;
}

export async function fetchStudentDashboardStats(): Promise<StudentDashboardStatsResponse> {
  const payload = await fetchDashboardStats();

  if (payload.role !== "student") {
    throw new Error("Dashboard stats are only available for students.");
  }

  return payload;
}

async function parseJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch (error) {
    console.error("Failed to parse dashboard stats API response", {
      url: response.url,
      status: response.status,
      error,
    });
    return {} as T;
  }
}

function throwHttpError(
  response: Response,
  body: unknown,
  fallbackMessage: string,
): never {
  const payloadError = isErrorPayload(body) ? body.error : undefined;
  throw new ExecutionHttpError(
    payloadError || response.statusText || fallbackMessage,
    response.status,
  );
}

function isErrorPayload(value: unknown): value is ErrorPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return typeof payload.error === "string";
}

function isDashboardStatsPayload(
  value: unknown,
): value is DashboardStatsResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Record<string, unknown>;
  if (payload.role !== "instructor" && payload.role !== "student") {
    return false;
  }

  return typeof payload.stats === "object" && payload.stats !== null;
}
