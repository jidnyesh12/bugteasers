import { ExecutionHttpError } from "./execution-client";

interface ErrorPayload {
  error?: string;
}

interface ClassroomsResponse<TClassroom> {
  classrooms: TClassroom[];
}

interface ClassroomResponse<TClassroom> {
  classroom: TClassroom;
}

interface StudentsResponse<TStudent> {
  students: TStudent[];
}

interface AssignmentsResponse<TAssignment> {
  assignments: TAssignment[];
}

export async function fetchClassrooms<TClassroom>(): Promise<TClassroom[]> {
  const response = await fetch("/api/classrooms", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const parsedBody = await parseJson<
    ErrorPayload | ClassroomsResponse<TClassroom>
  >(response);

  if (!response.ok) {
    throwHttpError(response, parsedBody, "Failed to load classrooms");
  }

  return isClassroomsPayload<TClassroom>(parsedBody)
    ? parsedBody.classrooms
    : [];
}

export async function createClassroom<TClassroom>(input: {
  name: string;
  join_code?: string;
}): Promise<TClassroom> {
  const response = await fetch("/api/classrooms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const parsedBody = await parseJson<
    ErrorPayload | ClassroomResponse<TClassroom>
  >(response);

  if (!response.ok) {
    throwHttpError(response, parsedBody, "Failed to create classroom");
  }

  if (!isClassroomPayload<TClassroom>(parsedBody)) {
    throw new Error("Invalid classroom response");
  }

  return parsedBody.classroom;
}

export async function joinClassroom(input: {
  join_code: string;
}): Promise<void> {
  const response = await fetch("/api/classrooms/join", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const parsedBody = await parseJson<ErrorPayload>(response);
  if (!response.ok) {
    throwHttpError(response, parsedBody, "Failed to join classroom");
  }
}

export async function fetchClassroomDetail<TClassroom>(
  classroomId: string,
): Promise<TClassroom> {
  const response = await fetch(`/api/classrooms/${classroomId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const parsedBody = await parseJson<
    ErrorPayload | ClassroomResponse<TClassroom>
  >(response);

  if (!response.ok) {
    throwHttpError(response, parsedBody, "Failed to load classroom details");
  }

  if (!isClassroomPayload<TClassroom>(parsedBody)) {
    throw new Error("Invalid classroom detail response");
  }

  return parsedBody.classroom;
}

export async function fetchClassroomStudents<TStudent>(
  classroomId: string,
): Promise<TStudent[]> {
  const response = await fetch(`/api/classrooms/${classroomId}/students`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const parsedBody = await parseJson<ErrorPayload | StudentsResponse<TStudent>>(
    response,
  );

  if (!response.ok) {
    throwHttpError(response, parsedBody, "Failed to load classroom students");
  }

  return isStudentsPayload<TStudent>(parsedBody) ? parsedBody.students : [];
}

export async function removeClassroomStudent(
  classroomId: string,
  studentId: string,
): Promise<void> {
  const response = await fetch(
    `/api/classrooms/${classroomId}/students?student_id=${studentId}`,
    {
      method: "DELETE",
    },
  );

  const parsedBody = await parseJson<ErrorPayload>(response);
  if (!response.ok) {
    throwHttpError(response, parsedBody, "Failed to remove student");
  }
}

export async function fetchClassroomAssignments<TAssignment>(
  classroomId: string,
): Promise<TAssignment[]> {
  const response = await fetch(`/api/classrooms/${classroomId}/assignments`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const parsedBody = await parseJson<
    ErrorPayload | AssignmentsResponse<TAssignment>
  >(response);

  if (!response.ok) {
    throwHttpError(
      response,
      parsedBody,
      "Failed to load classroom assignments",
    );
  }

  return isAssignmentsPayload<TAssignment>(parsedBody)
    ? parsedBody.assignments
    : [];
}

async function parseJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch (error) {
    console.error("Failed to parse classrooms API response", {
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

function isClassroomsPayload<TClassroom>(
  value: unknown,
): value is ClassroomsResponse<TClassroom> {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return Array.isArray(payload.classrooms);
}

function isClassroomPayload<TClassroom>(
  value: unknown,
): value is ClassroomResponse<TClassroom> {
  if (!value || typeof value !== "object") {
    return false;
  }

  return "classroom" in (value as Record<string, unknown>);
}

function isStudentsPayload<TStudent>(
  value: unknown,
): value is StudentsResponse<TStudent> {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return Array.isArray(payload.students);
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
