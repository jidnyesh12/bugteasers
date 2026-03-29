import type { SupportedLanguage } from './types';

export const SUPPORTED_EXECUTION_LANGUAGES = [
  'python',
  'java',
  'cpp',
  'c',
] as const;

export const DEFAULT_EXECUTION_LANGUAGE: SupportedLanguage = 'cpp';

export const EXECUTION_LANGUAGE_LABELS: Readonly<Record<SupportedLanguage, string>> = {
  python: 'Python',
  java: 'Java',
  cpp: 'C++',
  c: 'C',
};

export const EXECUTION_FILE_EXTENSIONS: Readonly<Record<SupportedLanguage, string>> = {
  python: 'py',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
};

const LANGUAGE_ALIASES: Readonly<Record<string, SupportedLanguage>> = {
  'c++': 'cpp',
};

export function normalizeSupportedLanguage(rawLanguage: string): SupportedLanguage | null {
  const normalized = rawLanguage.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  const supportedLanguage = LANGUAGE_ALIASES[normalized] ?? normalized;
  return SUPPORTED_EXECUTION_LANGUAGES.includes(supportedLanguage as SupportedLanguage)
    ? (supportedLanguage as SupportedLanguage)
    : null;
}

export function dedupeSupportedLanguages(rawLanguages: readonly string[]): SupportedLanguage[] {
  const normalizedLanguages = rawLanguages
    .map(normalizeSupportedLanguage)
    .filter((language): language is SupportedLanguage => language !== null);

  return Array.from(new Set(normalizedLanguages));
}