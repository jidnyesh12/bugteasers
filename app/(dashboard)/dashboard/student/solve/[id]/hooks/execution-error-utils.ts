import { ExecutionHttpError } from '@/lib/api/execution-client';

export function formatExecutionErrorOutput(error: unknown): string {
  if (error instanceof ExecutionHttpError) {
    if (error.status === 429 && error.retryAfterSeconds) {
      return `Rate limit exceeded. Try again in ${error.retryAfterSeconds} seconds.`;
    }

    return `Request failed (${error.status}): ${error.message}`;
  }

  if (error instanceof Error) {
    return `Request failed: ${error.message}`;
  }

  return 'Request failed due to an unknown error.';
}

export function getExecutionErrorToastMessage(error: unknown): string {
  if (error instanceof ExecutionHttpError) {
    if (error.status === 401) {
      return 'Please sign in to continue.';
    }

    if (error.status === 403) {
      return 'You do not have access to this problem.';
    }

    if (error.status === 404) {
      return 'Problem not found.';
    }

    if (error.status === 429) {
      return error.retryAfterSeconds
        ? `Too many requests. Retry in ${error.retryAfterSeconds}s.`
        : 'Too many requests. Please try again shortly.';
    }

    if (error.status >= 500) {
      return 'Execution service is temporarily unavailable.';
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong.';
}
