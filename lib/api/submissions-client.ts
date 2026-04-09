import { ExecutionHttpError } from "./execution-client";
import type { ProblemSubmissionHistoryItem } from "@/lib/submissions/types";

interface SubmissionsHistoryInput {
  problemId: string;
  assignmentId?: string;
}

interface SubmissionsHistoryResponse {
  submissions: ProblemSubmissionHistoryItem[];
}

interface ErrorPayload {
  error?: string;
}

export async function fetchProblemSubmissions(
  input: SubmissionsHistoryInput,
): Promise<ProblemSubmissionHistoryItem[]> {
  const params = new URLSearchParams();
  if (input.assignmentId) {
    params.set("assignmentId", input.assignmentId);
  }

  const query = params.toString();
  const url = query
    ? `/api/problems/${input.problemId}/submissions?${query}`
    : `/api/problems/${input.problemId}/submissions`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const parsedBody = await parseJson<ErrorPayload | SubmissionsHistoryResponse>(
    response,
  );

  if (!response.ok) {
    const payloadError = isErrorPayload(parsedBody)
      ? parsedBody.error
      : undefined;
    const message = payloadError || response.statusText || "Request failed";
    throw new ExecutionHttpError(message, response.status);
  }

  return isSubmissionsHistoryPayload(parsedBody) ? parsedBody.submissions : [];
}

async function parseJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

function isErrorPayload(value: unknown): value is ErrorPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return typeof payload.error === "string";
}

function isSubmissionsHistoryPayload(
  value: unknown,
): value is SubmissionsHistoryResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return Array.isArray(payload.submissions);
}
