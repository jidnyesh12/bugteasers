import { TemplateDslError } from "./errors";
import type {
  TemplateGeneratedValue,
  TemplateMatrix,
  TemplateNumericRef,
  TemplateRef,
  TemplateScalar,
  TemplateVector,
} from "./types";

export function isScalar(value: unknown): value is TemplateScalar {
  return typeof value === "string" || typeof value === "number";
}

export function isScalarVector(value: unknown): value is TemplateVector {
  return Array.isArray(value) && value.every((entry) => isScalar(entry));
}

export function isScalarMatrix(value: unknown): value is TemplateMatrix {
  return (
    Array.isArray(value) &&
    value.every(
      (row) => Array.isArray(row) && row.every((entry) => isScalar(entry)),
    )
  );
}

export function cloneGeneratedValue(
  value: TemplateGeneratedValue,
): TemplateGeneratedValue {
  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  if (isScalarMatrix(value)) {
    return value.map((row) => [...row]);
  }

  return [...value];
}

export function isTemplateRef(value: unknown): value is TemplateRef {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.ref === "string" && candidate.ref.trim().length > 0;
}

export function isTemplateNumericRef(
  value: unknown,
): value is TemplateNumericRef {
  if (typeof value === "number") {
    return Number.isFinite(value) && Number.isInteger(value);
  }

  return isTemplateRef(value);
}

export function assertValidConstValue(
  value: unknown,
): asserts value is TemplateGeneratedValue {
  if (isScalar(value) || isScalarVector(value) || isScalarMatrix(value)) {
    return;
  }

  throw new TemplateDslError(
    "const variable value must be a string, number, array of scalars, or matrix of scalars",
  );
}
