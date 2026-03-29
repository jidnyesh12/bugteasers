import { ExecutionHttpError } from './execution-client';
import type { GeneratedProblem } from '@/lib/ai/types';
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

export async function generateProblems(input: {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags?: string[];
  constraints?: string;
  numProblems: number;
  languages: SupportedLanguage[];
}): Promise<GeneratedProblem[]> {
  const response = await fetch('/api/problems/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const parsedBody = await parseJson<ErrorPayload | GeneratedProblemsResponse>(response);

  if (!response.ok) {
    const payloadError = isErrorPayload(parsedBody) ? parsedBody.error : undefined;
    const message = payloadError || response.statusText || 'Failed to generate problems';
    throw new ExecutionHttpError(message, response.status);
  }

  if (!isGeneratedProblemsPayload(parsedBody)) {
    return [];
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