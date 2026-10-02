import type { SupportedLanguage } from "./types";

export const SUPPORTED_EXECUTION_LANGUAGES = [
  "python",
  "java",
  "cpp",
  "c",
] as const;

export const DEFAULT_EXECUTION_LANGUAGE: SupportedLanguage = "cpp";

export const EXECUTION_LANGUAGE_LABELS: Readonly<
  Record<SupportedLanguage, string>
> = {
  python: "Python",
  java: "Java",
  cpp: "C++",
  c: "C",
};

export const EXECUTION_FILE_EXTENSIONS: Readonly<
  Record<SupportedLanguage, string>
> = {
  python: "py",
  java: "java",
  cpp: "cpp",
  c: "c",
};

export const RUN_TIMEOUT_MULTIPLIER: Readonly<
  Record<SupportedLanguage, number>
> = {
  c: 1,
  cpp: 1,
  java: 2,
  python: 3,
};

export const MIN_RUN_TIMEOUT_MS = 500;
export const MAX_RUN_TIMEOUT_MS = 10_000;

export function resolveRunTimeoutMs(
  language: SupportedLanguage,
  timeLimitMs: number | null | undefined,
): number | undefined {
  if (
    typeof timeLimitMs !== "number" ||
    !Number.isFinite(timeLimitMs) ||
    timeLimitMs <= 0
  ) {
    return undefined;
  }

  const scaled = Math.round(timeLimitMs * RUN_TIMEOUT_MULTIPLIER[language]);
  return Math.min(Math.max(scaled, MIN_RUN_TIMEOUT_MS), MAX_RUN_TIMEOUT_MS);
}

export const RUN_MEMORY_OVERHEAD_MB: Readonly<
  Record<SupportedLanguage, number>
> = {
  c: 0,
  cpp: 0,
  java: 64,
  python: 16,
};

export const MIN_RUN_MEMORY_MB = 16;
export const MAX_RUN_MEMORY_MB = 1024;

export function resolveRunMemoryLimitBytes(
  language: SupportedLanguage,
  memoryLimitMb: number | null | undefined,
): number | undefined {
  if (
    typeof memoryLimitMb !== "number" ||
    !Number.isFinite(memoryLimitMb) ||
    memoryLimitMb <= 0
  ) {
    return undefined;
  }

  const limitMb = Math.min(
    Math.max(
      Math.round(memoryLimitMb + RUN_MEMORY_OVERHEAD_MB[language]),
      MIN_RUN_MEMORY_MB,
    ),
    MAX_RUN_MEMORY_MB,
  );
  return limitMb * 1024 * 1024;
}

const LANGUAGE_ALIASES: Readonly<Record<string, SupportedLanguage>> = {
  "c++": "cpp",
};

export function normalizeSupportedLanguage(
  rawLanguage: string,
): SupportedLanguage | null {
  const normalized = rawLanguage.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  const supportedLanguage = LANGUAGE_ALIASES[normalized] ?? normalized;
  return SUPPORTED_EXECUTION_LANGUAGES.includes(
    supportedLanguage as SupportedLanguage,
  )
    ? (supportedLanguage as SupportedLanguage)
    : null;
}

export function dedupeSupportedLanguages(
  rawLanguages: readonly string[],
): SupportedLanguage[] {
  const normalizedLanguages = rawLanguages
    .map(normalizeSupportedLanguage)
    .filter((language): language is SupportedLanguage => language !== null);

  return Array.from(new Set(normalizedLanguages));
}
