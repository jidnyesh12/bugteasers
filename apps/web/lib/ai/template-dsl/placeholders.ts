import { AUTO_EXPECTED_OUTPUT_TOKEN } from "./types";

const PLACEHOLDER_PATTERNS = [
  /\{\{\s*PLACEHOLDER(?::|_)[^}]+\}\}/i,
  /\$\{\s*PLACEHOLDER(?::|_)[^}]+\}/i,
  /__PLACEHOLDER_[A-Z0-9_]+__/i,
  /\[PLACEHOLDER:[^\]]+\]/i,
  /__AUTO_EXPECTED_OUTPUT__/i,
];

export function hasUnresolvedPlaceholder(value: string): boolean {
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value));
}

export function isAutoExpectedOutput(value: string): boolean {
  return (
    value.trim() === AUTO_EXPECTED_OUTPUT_TOKEN ||
    hasUnresolvedPlaceholder(value)
  );
}

export function buildTemplateStoragePlaceholder(seed: string): string {
  return `__GENERATED_FROM_TEMPLATE__:${seed}`;
}
