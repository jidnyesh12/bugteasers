import { ExecutionHttpError } from './execution-client';
import type {
  GeneratedProblem,
  ProblemGenerationJobStatusResponse,
} from '@/lib/ai/types';
import type { SupportedLanguage } from '@/lib/execution/types';

interface ProblemDetailResponse<TProblem> {
  problem: TProblem;
}

interface ErrorPayload {
  error?: string;
}

interface ProblemsListResponse<TProblem> {
  problems: TProblem[];
}

interface GeneratedProblemsResponse {
  problems: GeneratedProblem[];
}

export interface GenerateProblemsInput {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags?: string[];
  constraints?: string;
  numProblems: number;
  languages: SupportedLanguage[];
}

interface GenerateProblemsOptions {
  onStatus?: (status: ProblemGenerationJobStatusResponse) => void;
  pollIntervalMs?: number;
  maxPollAttempts?: number;
}

const DEFAULT_POLL_INTERVAL_MS = 1500;
const DEFAULT_MAX_POLL_ATTEMPTS = 120;
const POLL_BACKOFF_FACTOR = 1.1;
const MAX_POLL_INTERVAL_MS = 5000;
const POLL_JITTER_RATIO = 0.2;
const MAX_CONSECUTIVE_TRANSIENT_POLL_FAILURES = 3;
const TRANSIENT_POLL_HTTP_STATUSES: ReadonlySet<number> = new Set([
  408,
  425,
  429,
  500,
  502,
  503,
  504,
]);

export async function fetchProblemDetail<TProblem>(problemId: string): Promise<TProblem> {
  const response = await fetch(`/api/problems/${problemId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const parsedBody = await parseJson<ErrorPayload | ProblemDetailResponse<TProblem>>(response);

  if (!response.ok) {
    const payloadError = isErrorPayload(parsedBody) ? parsedBody.error : undefined;
    const message = payloadError || response.statusText || 'Request failed';
    throw new ExecutionHttpError(message, response.status);
  }

  if (!isProblemDetailPayload<TProblem>(parsedBody)) {
    throw new Error('Invalid problem detail response');
  }

  return parsedBody.problem;
}

export async function fetchProblems<TProblem>(options?: { mine?: boolean }): Promise<TProblem[]> {
  const params = new URLSearchParams();
  if (options?.mine) {
    params.set('mine', 'true');
  }

  const query = params.toString();
  const url = query ? `/api/problems?${query}` : '/api/problems';
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const parsedBody = await parseJson<ErrorPayload | ProblemsListResponse<TProblem>>(response);

  if (!response.ok) {
    const payloadError = isErrorPayload(parsedBody) ? parsedBody.error : undefined;
    const message = payloadError || response.statusText || 'Request failed';
    throw new ExecutionHttpError(message, response.status);
  }

  if (!isProblemsListPayload<TProblem>(parsedBody)) {
    return [];
  }

  return parsedBody.problems;
}

export async function generateProblems(
  input: GenerateProblemsInput,
  options: GenerateProblemsOptions = {}
): Promise<GeneratedProblem[]> {
  const response = await fetch('/api/problems/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const parsedBody = await parseJson<
    ErrorPayload | GeneratedProblemsResponse | ProblemGenerationJobStatusResponse
  >(response);

  if (!response.ok) {
    const payloadError = isErrorPayload(parsedBody) ? parsedBody.error : undefined;
    const message = payloadError || response.statusText || 'Failed to generate problems';
    throw new ExecutionHttpError(message, response.status);
  }

  if (!isGeneratedProblemsPayload(parsedBody)) {
    if (!isProblemGenerationJobStatusPayload(parsedBody)) {
      throw new Error('Invalid problem generation response');
    }

    return waitForGeneratedProblems(parsedBody, options);
  }

  return parsedBody.problems;
}

export async function saveGeneratedProblems(problems: GeneratedProblem[]): Promise<void> {
  const response = await fetch('/api/problems/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ problems }),
  });

  const parsedBody = await parseJson<ErrorPayload>(response);
  if (!response.ok) {
    const payloadError = isErrorPayload(parsedBody) ? parsedBody.error : undefined;
    const message = payloadError || response.statusText || 'Failed to save problems';
    throw new ExecutionHttpError(message, response.status);
  }
}

export async function stopGenerationJob(jobId: string): Promise<void> {
  const response = await fetch(`/api/problems/generate/${jobId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'cancel' }),
  });

  if (!response.ok) {
    const parsedBody = await parseJson<ErrorPayload>(response);
    const payloadError = isErrorPayload(parsedBody) ? parsedBody.error : undefined;
    const message = payloadError || response.statusText || 'Failed to stop generation';
    throw new ExecutionHttpError(message, response.status);
  }
}

export async function clearStuckGenerationJobs(): Promise<void> {
  const response = await fetch('/api/problems/generate/clear', {
    method: 'POST',
  });

  if (!response.ok) {
    const parsedBody = await parseJson<ErrorPayload>(response);
    const payloadError = isErrorPayload(parsedBody) ? parsedBody.error : undefined;
    const message = payloadError || response.statusText || 'Failed to clear stuck jobs';
    throw new ExecutionHttpError(message, response.status);
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  try {
    return await response.json() as T;
  } catch (error) {
    console.error('Failed to parse problems API response', {
      url: response.url,
      status: response.status,
      error,
    });
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

function isProblemDetailPayload<TProblem>(value: unknown): value is ProblemDetailResponse<TProblem> {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return 'problem' in (value as Record<string, unknown>);
}

function isProblemsListPayload<TProblem>(value: unknown): value is ProblemsListResponse<TProblem> {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return Array.isArray(payload.problems);
}

function isGeneratedProblemsPayload(value: unknown): value is GeneratedProblemsResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return Array.isArray(payload.problems);
}

async function waitForGeneratedProblems(
  initialStatus: ProblemGenerationJobStatusResponse,
  options: GenerateProblemsOptions
): Promise<GeneratedProblem[]> {
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const maxPollAttempts = options.maxPollAttempts ?? DEFAULT_MAX_POLL_ATTEMPTS;

  let status = initialStatus;
  let consecutiveTransientFailures = 0;
  options.onStatus?.(status);

  for (let attempt = 0; attempt < maxPollAttempts; attempt += 1) {
    if (status.status === 'completed') {
      return status.problems ?? [];
    }

    if (status.status === 'discarded' || status.status === 'error') {
      throw new Error(
        status.error ||
        status.progressMessage ||
        'Problem generation was discarded during validation.'
      );
    }

    // 'retrying' is active — keep polling
    if (status.status === 'retrying') {
      await sleep(calculatePollDelayMs(pollIntervalMs, attempt));
    } else {
      await sleep(calculatePollDelayMs(pollIntervalMs, attempt));
    }

    let response: Response;
    try {
      response = await fetch(`/api/problems/generate/${status.jobId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      if (shouldRetryTransientPollFailure({
        statusCode: null,
        error,
        consecutiveFailures: consecutiveTransientFailures,
      })) {
        consecutiveTransientFailures += 1;
        continue;
      }

      throw error;
    }

    const parsedBody = await parseJson<
      ErrorPayload | ProblemGenerationJobStatusResponse
    >(response);

    if (!response.ok) {
      const payloadError = isErrorPayload(parsedBody) ? parsedBody.error : undefined;
      const message = payloadError || response.statusText || 'Failed to poll generation status';

      if (shouldRetryTransientPollFailure({
        statusCode: response.status,
        error: null,
        consecutiveFailures: consecutiveTransientFailures,
      })) {
        consecutiveTransientFailures += 1;
        continue;
      }

      throw new ExecutionHttpError(message, response.status);
    }

    if (!isProblemGenerationJobStatusPayload(parsedBody)) {
      throw new Error('Invalid generation status payload');
    }

    consecutiveTransientFailures = 0;
    status = parsedBody;
    options.onStatus?.(status);
  }

  throw new Error(
    `Problem generation timed out after around ${estimatePollingWindowSeconds(
      pollIntervalMs,
      maxPollAttempts
    )} seconds. It may still be running; please retry shortly.`
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function shouldRetryTransientPollFailure(params: {
  statusCode: number | null;
  error: unknown;
  consecutiveFailures: number;
}): boolean {
  if (params.consecutiveFailures >= MAX_CONSECUTIVE_TRANSIENT_POLL_FAILURES) {
    return false;
  }

  if (params.statusCode !== null && TRANSIENT_POLL_HTTP_STATUSES.has(params.statusCode)) {
    return true;
  }

  return params.error instanceof TypeError;
}

function estimatePollingWindowSeconds(basePollIntervalMs: number, maxPollAttempts: number): number {
  let totalDelayMs = 0;

  for (let attempt = 0; attempt < maxPollAttempts; attempt += 1) {
    totalDelayMs += calculateBasePollDelayMs(basePollIntervalMs, attempt);
  }

  return Math.max(1, Math.round(totalDelayMs / 1000));
}

function calculateBasePollDelayMs(basePollIntervalMs: number, attempt: number): number {
  const normalizedBaseInterval = Math.max(250, basePollIntervalMs);
  return Math.min(
    Math.round(normalizedBaseInterval * Math.pow(POLL_BACKOFF_FACTOR, attempt)),
    MAX_POLL_INTERVAL_MS
  );
}

function calculatePollDelayMs(basePollIntervalMs: number, attempt: number): number {
  const exponentiatedDelay = calculateBasePollDelayMs(basePollIntervalMs, attempt);
  const jitterWindow = Math.max(50, Math.round(exponentiatedDelay * POLL_JITTER_RATIO));
  const jitter = Math.floor(Math.random() * (2 * jitterWindow + 1)) - jitterWindow;

  return Math.max(250, exponentiatedDelay + jitter);
}

function isProblemGenerationJobStatusPayload(
  value: unknown
): value is ProblemGenerationJobStatusResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const payload = value as Record<string, unknown>;
  if (typeof payload.jobId !== 'string' || payload.jobId.length === 0) {
    return false;
  }

  if (typeof payload.status !== 'string') {
    return false;
  }

  return [
    'queued',
    'ai_generating',
    'validating',
    'retrying',
    'completed',
    'discarded',
    'error',
  ].includes(payload.status);
}