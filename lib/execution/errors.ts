// Shared execution-domain error types.

export class ExecutionValidationError extends Error {
  readonly statusCode = 400;

  constructor(
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ExecutionValidationError";
  }
}

export class ExecutionDatabaseError extends Error {
  readonly statusCode = 500;

  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ExecutionDatabaseError";
  }
}

export class ExecutionAuthorizationError extends Error {
  readonly statusCode = 401;

  constructor(message = "Unauthorized") {
    super(message);
    this.name = "ExecutionAuthorizationError";
  }
}

export class ExecutionForbiddenError extends Error {
  readonly statusCode = 403;

  constructor(message = "Access denied") {
    super(message);
    this.name = "ExecutionForbiddenError";
  }
}

export class ExecutionNotFoundError extends Error {
  readonly statusCode = 404;

  constructor(message: string) {
    super(message);
    this.name = "ExecutionNotFoundError";
  }
}
