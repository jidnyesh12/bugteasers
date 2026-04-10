import { ExecutionHttpError } from "./execution-client";

interface ErrorPayload {
  error?: string;
}

interface AssignmentsResponse<TAssignment> {
  assignments: TAssignment[];
}

interface AssignmentResponse<TAssignment> {
  assignment: TAssignment;
}

interface AssignmentSubmissionsResponse<TOverview> {
  submissions: TOverview;
}

export async function fetchAssignments<TAssignment>(): Promise<TAssignment[]> {
  const response = await fetch("/api/assignments", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const parsedBody = await parseJson<
    ErrorPayload | AssignmentsResponse<TAssignment>
  >(response);

  if (!response.ok) {
    throwHttpError(response, parsedBody, "Failed to load assignments");
  }

  return isAssignmentsPayload<TAssignment>(parsedBody)
    ? parsedBody.assignments
    : [];
}

export async function fetchAssignmentDetail<TAssignment>(
  assignmentId: string,
): Promise<TAssignment> {
  const response = await fetch(`/api/assignments/${assignmentId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const parsedBody = await parseJson<
    ErrorPayload | AssignmentResponse<TAssignment>
  >(response);

  if (!response.ok) {
    throwHttpError(response, parsedBody, "Failed to load assignment");
  }

  if (!isAssignmentPayload<TAssignment>(parsedBody)) {
    throw new Error("Invalid assignment detail response");
  }

  return parsedBody.assignment;
}

export async function fetchAssignmentSubmissionOverview<TOverview>(
  assignmentId: string,
): Promise<TOverview> {
  const response = await fetch(`/api/assignments/${assignmentId}/submissions`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const parsedBody = await parseJson<
    ErrorPayload | AssignmentSubmissionsResponse<TOverview>
  >(response);

  if (!response.ok) {
    throwHttpError(
      response,
      parsedBody,
      "Failed to load assignment submissions",
    );
  }

  if (!isAssignmentSubmissionsPayload<TOverview>(parsedBody)) {
    throw new Error("Invalid assignment submissions response");
  }

  return parsedBody.submissions;
}

export async function createAssignment<TAssignment>(input: {
  title: string;
  description?: string;
  deadline: string;
  problem_ids: string[];
}): Promise<TAssignment> {
  const response = await fetch("/api/assignments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const parsedBody = await parseJson<
    ErrorPayload | AssignmentResponse<TAssignment>
  >(response);

  if (!response.ok) {
    throwHttpError(response, parsedBody, "Failed to create assignment");
  }

  if (!isAssignmentPayload<TAssignment>(parsedBody)) {
    throw new Error("Invalid assignment create response");
  }

  return parsedBody.assignment;
}

export async function deleteAssignment(assignmentId: string): Promise<void> {
  const response = await fetch(`/api/assignments/${assignmentId}`, {
    method: "DELETE",
  });

  const parsedBody = await parseJson<ErrorPayload>(response);
  if (!response.ok) {
    throwHttpError(response, parsedBody, "Failed to delete assignment");
  }
}

export async function reopenAssignment(assignmentId: string): Promise<void> {
  const response = await fetch(`/api/assignments/${assignmentId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      closed_at: null,
    }),
  });

  const parsedBody = await parseJson<ErrorPayload>(response);
  if (!response.ok) {
    throwHttpError(response, parsedBody, "Failed to reopen assignment");
  }
}

export async function assignAssignmentToClassrooms(
  assignmentId: string,
  classroomIds: string[],
): Promise<void> {
  const response = await fetch(`/api/assignments/${assignmentId}/assign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ classroom_ids: classroomIds }),
  });

  const parsedBody = await parseJson<ErrorPayload>(response);
  if (!response.ok) {
    throwHttpError(response, parsedBody, "Failed to assign assignment");
  }
}

export async function unassignAssignmentFromClassroom(
  assignmentId: string,
  classroomId: string,
): Promise<void> {
  const response = await fetch(
    `/api/assignments/${assignmentId}/assign?classroom_id=${classroomId}`,
    {
      method: "DELETE",
    },
  );

  const parsedBody = await parseJson<ErrorPayload>(response);
  if (!response.ok) {
    throwHttpError(response, parsedBody, "Failed to unassign assignment");
  }
}

export async function addProblemToAssignment(
  assignmentId: string,
  problemId: string,
): Promise<void> {
  const response = await fetch(`/api/assignments/${assignmentId}/problems`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ problem_id: problemId }),
  });

  const parsedBody = await parseJson<ErrorPayload>(response);
  if (!response.ok) {
    throwHttpError(response, parsedBody, "Failed to add problem to assignment");
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch (error) {
    console.error("Failed to parse assignments API response", {
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

function isAssignmentsPayload<TAssignment>(
  value: unknown,
): value is AssignmentsResponse<TAssignment> {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return Array.isArray(payload.assignments);
}

function isAssignmentPayload<TAssignment>(
  value: unknown,
): value is AssignmentResponse<TAssignment> {
  if (!value || typeof value !== "object") {
    return false;
  }

  return "assignment" in (value as Record<string, unknown>);
}

function isAssignmentSubmissionsPayload<TOverview>(
  value: unknown,
): value is AssignmentSubmissionsResponse<TOverview> {
  if (!value || typeof value !== "object") {
    return false;
  }

  return "submissions" in (value as Record<string, unknown>);
}
