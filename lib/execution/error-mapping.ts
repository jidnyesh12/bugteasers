import {
  ExecutionAuthorizationError,
  ExecutionDatabaseError,
  ExecutionForbiddenError,
  ExecutionNotFoundError,
  ExecutionValidationError,
} from './errors';

interface ErrorHttpMapping {
  status: number;
  message: string;
}

export function mapExecutionErrorToHttp(error: unknown): ErrorHttpMapping {
  if (error instanceof ExecutionValidationError) {
    return { status: 400, message: error.message };
  }

  if (error instanceof ExecutionAuthorizationError) {
    return { status: 401, message: error.message };
  }

  if (error instanceof ExecutionForbiddenError) {
    return { status: 403, message: error.message };
  }

  if (error instanceof ExecutionNotFoundError) {
    return { status: 404, message: error.message };
  }

  if (error instanceof ExecutionDatabaseError) {
    return { status: 500, message: error.message };
  }

  if (error instanceof Error) {
    return { status: 500, message: error.message };
  }

  return { status: 500, message: 'Internal server error' };
}
