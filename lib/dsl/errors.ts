/**
 * Template DSL — Structured Error Taxonomy
 *
 * Every error carries a machine-readable `kind` so that the repair loop can
 * apply the appropriate recovery strategy without pattern-matching on messages.
 */

import { FailureKind } from "./types";

export class DslError extends Error {
  constructor(
    public readonly kind: FailureKind,
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "DslError";
  }
}

export class SchemaError extends DslError {
  constructor(message: string, context?: Record<string, unknown>) {
    super("schema_error", message, context);
    this.name = "SchemaError";
  }
}

export class UnsatConstraintsError extends DslError {
  constructor(
    message: string,
    public readonly unsatConstraints: string[],
    context?: Record<string, unknown>
  ) {
    super("unsat_constraints", message, context);
    this.name = "UnsatConstraintsError";
  }
}

export class GeneratorError extends DslError {
  constructor(message: string, context?: Record<string, unknown>) {
    super("generator_error", message, context);
    this.name = "GeneratorError";
  }
}

export class OracleError extends DslError {
  constructor(message: string, context?: Record<string, unknown>) {
    super("oracle_error", message, context);
    this.name = "OracleError";
  }
}

export class NondeterminismError extends DslError {
  constructor(message: string, context?: Record<string, unknown>) {
    super("nondeterminism_error", message, context);
    this.name = "NondeterminismError";
  }
}

export class FormatError extends DslError {
  constructor(message: string, context?: Record<string, unknown>) {
    super("format_error", message, context);
    this.name = "FormatError";
  }
}
