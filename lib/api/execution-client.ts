import type {
  RunResponse,
  SubmitResponse,
  SupportedLanguage,
} from '@/lib/execution/types';

interface RunExecutionInput {
  problemId: string;
  code: string;
  language: SupportedLanguage;
}

interface SubmitExecutionInput extends RunExecutionInput {
  assignmentId?: string;
}

interface ErrorPayload {
  error?: string;
}

export class ExecutionHttpError extends Error {
  readonly status: number;
  readonly retryAfterSeconds?: number;

  constructor(message: string, status: number, retryAfterSeconds?: number) {
    super(message);
    this.name = 'ExecutionHttpError';
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export async function runProblemCode(input: RunExecutionInput): Promise<RunResponse> {
  return postExecution<RunResponse>(`/api/problems/${input.problemId}/run`, {
    code: input.code,
    language: input.language,
  });
}

export async function submitProblemCode(input: SubmitExecutionInput): Promise<SubmitResponse> {
  return postExecution<SubmitResponse>(`/api/problems/${input.problemId}/submit`, {
    code: input.code,
    language: input.language,
    assignmentId: input.assignmentId,
  });
}

async function postExecution<T>(url: string, payload: Record<string, unknown>): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const parsedBody = await parseJson<ErrorPayload | T>(response);

  if (!response.ok) {
    const retryAfterHeader = response.headers.get('Retry-After');
    const retryAfterSeconds = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) : undefined;
    const payloadError = isErrorPayload(parsedBody) ? parsedBody.error : undefined;
    const message = payloadError || response.statusText || 'Request failed';

    throw new ExecutionHttpError(
      message,
      response.status,
      Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : undefined
    );
  }

  return parsedBody as T;
}

async function parseJson<T>(response: Response): Promise<T> {
  try {
    return await response.json() as T;
  } catch {
    return {} as T;
  }
}

function isErrorPayload(value: unknown): value is ErrorPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return typeof payload.error === 'string';
}
