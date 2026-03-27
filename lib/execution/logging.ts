// Structured logging utilities for execution workflows.

const SENSITIVE_KEYS = new Set([
  'code',
  'token',
  'password',
  'authorization',
  'pistonApiUrl',
  'apiKey',
  'apikey',
  'secret',
]);

export interface ExecutionLogContext {
  mode?: 'run' | 'submit';
  userId?: string;
  problemId?: string;
  language?: string;
  durationMs?: number;
  status?: string;
  [key: string]: unknown;
}

export interface ExecutionLogger {
  logExecutionStarted(context: ExecutionLogContext): void;
  logExecutionCompleted(context: ExecutionLogContext): void;
  logExecutionFailed(context: ExecutionLogContext, error: unknown): void;
  logExecutionWarning(message: string, context?: ExecutionLogContext): void;
}

function sanitizeContext(context: ExecutionLogContext): Record<string, unknown> {
  return Object.entries(context).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (!SENSITIVE_KEYS.has(key)) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    name: 'UnknownError',
    message: String(error),
  };
}

export function createExecutionLogger(): ExecutionLogger {
  return {
    logExecutionStarted(context: ExecutionLogContext): void {
      console.info('execution.started', sanitizeContext(context));
    },

    logExecutionCompleted(context: ExecutionLogContext): void {
      console.info('execution.completed', sanitizeContext(context));
    },

    logExecutionFailed(context: ExecutionLogContext, error: unknown): void {
      const payload = {
        ...sanitizeContext(context),
        error: serializeError(error),
      };

      console.error('execution.failed', payload);
    },

    logExecutionWarning(message: string, context: ExecutionLogContext = {}): void {
      console.warn(`execution.warning: ${message}`, sanitizeContext(context));
    },
  };
}
