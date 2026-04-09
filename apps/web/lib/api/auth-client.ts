import { ExecutionHttpError } from "./execution-client";

interface ErrorPayload {
  error?: string;
}

interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  role: "student" | "instructor";
}

export async function registerUser(input: RegisterInput): Promise<void> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const parsedBody = await parseJson<ErrorPayload>(response);
  if (!response.ok) {
    const payloadError = isErrorPayload(parsedBody)
      ? parsedBody.error
      : undefined;
    const message =
      payloadError || response.statusText || "Registration failed";
    throw new ExecutionHttpError(message, response.status);
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch (error) {
    console.error("Failed to parse auth API response", {
      url: response.url,
      status: response.status,
      error,
    });
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
