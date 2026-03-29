import type { SupportedLanguage } from './types';

export const SUPPORTED_EXECUTION_LANGUAGES: readonly SupportedLanguage[] = [
  'python',
  'java',
  'cpp',
  'c',
];

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