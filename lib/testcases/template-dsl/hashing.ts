import { createHash } from 'node:crypto';
import type { TestCaseInputTemplate } from './types';
import { validateTestCaseInputTemplate } from './validation';

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(',')}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right));

  const body = entries
    .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`)
    .join(',');

  return `{${body}}`;
}

export function hashTemplateSpec(template: TestCaseInputTemplate): string {
  validateTestCaseInputTemplate(template);
  return createHash('sha256').update(stableStringify(template)).digest('hex');
}
