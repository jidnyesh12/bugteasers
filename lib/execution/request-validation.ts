import type { NextRequest } from 'next/server';
import type { SupportedLanguage } from './types';
import { ExecutionValidationError } from './errors';

export const MAX_CODE_LENGTH = 10000;
export const SUPPORTED_EXECUTION_LANGUAGES = ['python', 'java', 'cpp', 'c'] as const;

export interface RunPayload {
  code: string;
  language: SupportedLanguage;
}

export interface SubmitPayload extends RunPayload {
  assignmentId?: string;
}

export async function parseJsonBody(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ExecutionValidationError('Invalid request: body must be valid JSON');
  }
}

export function validateRunPayload(body: unknown): RunPayload {
  if (!body || typeof body !== 'object') {
    throw new ExecutionValidationError('Invalid request: body must be an object');
  }

  const payload = body as Record<string, unknown>;
  const code = validateCode(payload.code);
  const language = validateLanguage(payload.language);

  return { code, language };
}

export function validateSubmitPayload(body: unknown): SubmitPayload {
  const runPayload = validateRunPayload(body);
  const payload = body as Record<string, unknown>;

  if (payload.assignmentId !== undefined && typeof payload.assignmentId !== 'string') {
    throw new ExecutionValidationError('Invalid request: assignmentId must be a string');
  }

  return {
    ...runPayload,
    assignmentId: payload.assignmentId as string | undefined,
  };
}

function validateCode(rawCode: unknown): string {
  if (typeof rawCode !== 'string' || rawCode.trim().length === 0) {
    throw new ExecutionValidationError('Invalid request: code is required and must be a non-empty string');
  }

  if (rawCode.length > MAX_CODE_LENGTH) {
    throw new ExecutionValidationError(
      `Invalid request: code must be at most ${MAX_CODE_LENGTH} characters`
    );
  }

  return rawCode;
}

function validateLanguage(rawLanguage: unknown): SupportedLanguage {
  if (typeof rawLanguage !== 'string') {
    throw new ExecutionValidationError('Invalid request: language is required and must be a string');
  }

  if (!SUPPORTED_EXECUTION_LANGUAGES.includes(rawLanguage as SupportedLanguage)) {
    throw new ExecutionValidationError(
      `Invalid request: language must be one of ${SUPPORTED_EXECUTION_LANGUAGES.join(', ')}`
    );
  }

  return rawLanguage as SupportedLanguage;
}
