// Centralized environment variable configuration
// All environment variables should be accessed through this file for type safety

const IS_SERVER = typeof window === "undefined";

// Validates that required environment variables are set
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    if (IS_SERVER) {
      throw new Error(`Missing required environment variable: ${key}`);
    }

    return "";
  }
  return value;
}

function getRequiredUrlEnv(key: string): string {
  const value = getRequiredEnv(key);

  if (!value) {
    return "";
  }

  try {
    const parsedUrl = new URL(value);
    if (!parsedUrl.protocol || !parsedUrl.host) {
      throw new Error("Invalid URL format");
    }
  } catch {
    if (IS_SERVER) {
      throw new Error(
        `Invalid environment variable ${key}: must be a valid URL`,
      );
    }

    return "";
  }

  return value;
}

function getPositiveIntEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw.trim() === "") {
    return fallback;
  }

  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(
      `Invalid environment variable ${key}: must be a positive integer`,
    );
  }

  return value;
}

// Piston API configuration
export const PISTON_API_URL = getRequiredUrlEnv("PISTON_API_URL");
export const PISTON_API_KEY = process.env.PISTON_API_KEY || "";
export const PISTON_TIMEOUT_MS = 30000;
export const PISTON_MAX_RETRIES = 3;
export const PISTON_MAX_CONCURRENCY = getPositiveIntEnv(
  "PISTON_MAX_CONCURRENCY",
  4,
);

// Generated test case configuration
export const TESTCASE_FANOUT_CANDIDATES = getPositiveIntEnv(
  "TESTCASE_FANOUT_CANDIDATES",
  8,
);
export const TESTCASE_FANOUT_KEEP = getPositiveIntEnv("TESTCASE_FANOUT_KEEP", 3);
export const TESTCASE_MAX_COLLECTION_LENGTH = getPositiveIntEnv(
  "TESTCASE_MAX_COLLECTION_LENGTH",
  100_000,
);

// Supabase configuration
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "";
// Public anon key for client-side operations (safe to expose)
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// NextAuth configuration
export const NEXTAUTH_URL = process.env.NEXTAUTH_URL || "";
export const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "";

// Google AI configuration (Gemini)
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
export const GEMINI_BASE_URL = process.env.GEMINI_BASE_URL || "";

export const IS_DEVELOPMENT = process.env.NODE_ENV === "development";
