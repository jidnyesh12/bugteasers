import { TemplateDslError } from './errors';
import { isTemplateRef } from './guards';
import type { NumericRange, TemplateGeneratedValue, TemplateNumericRef } from './types';

export function toPositiveInteger(value: number, label: string, allowZero = false): number {
  if (!Number.isInteger(value) || (!allowZero && value <= 0) || (allowZero && value < 0)) {
    const requirement = allowZero ? 'a non-negative integer' : 'a positive integer';
    throw new TemplateDslError(`${label} must be ${requirement}`);
  }

  return value;
}

export function resolveNumericRef(
  source: TemplateNumericRef,
  context: Readonly<Record<string, TemplateGeneratedValue>>,
  label: string
): number {
  if (typeof source === 'number') {
    if (!Number.isFinite(source)) {
      throw new TemplateDslError(`${label} must be a finite number`);
    }

    if (!Number.isInteger(source)) {
      throw new TemplateDslError(`${label} must be an integer`);
    }

    return source;
  }

  if (!isTemplateRef(source)) {
    throw new TemplateDslError(`${label} must be an integer or { ref: string }`);
  }

  const referencedValue = context[source.ref];
  if (referencedValue === undefined) {
    throw new TemplateDslError(
      `${label} references unknown variable "${source.ref}". Define variables in dependency order.`
    );
  }

  if (typeof referencedValue === 'number') {
    if (!Number.isInteger(referencedValue)) {
      throw new TemplateDslError(`${label} reference "${source.ref}" must resolve to an integer`);
    }
    return referencedValue;
  }

  if (Array.isArray(referencedValue)) {
    return referencedValue.length;
  }

  throw new TemplateDslError(`${label} reference "${source.ref}" must resolve to a number`);
}

export function resolveRange(
  range: NumericRange,
  context: Readonly<Record<string, TemplateGeneratedValue>>,
  label: string
): { min: number; max: number } {
  const min = resolveNumericRef(range.min, context, `${label}.min`);
  const max = resolveNumericRef(range.max, context, `${label}.max`);

  if (max < min) {
    throw new TemplateDslError(`${label} has max < min`);
  }

  return { min, max };
}
