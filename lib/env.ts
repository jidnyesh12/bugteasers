// Centralized environment variable configuration
// All environment variables should be accessed through this file for type safety

const IS_SERVER = typeof window === 'undefined';

// Validates that required environment variables are set
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    if (IS_SERVER) {
      throw new Error(`Missing required environment variable: ${key}`);
    }

    return '';
  }
  return value;
}

function getPositiveIntEnv(key: string, defaultValue: number): number {
  const rawValue = process.env[key];

  if (rawValue === undefined || rawValue === '') {
    return defaultValue;
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    if (IS_SERVER) {
      throw new Error(`Invalid environment variable ${key}: must be a positive integer`);
    }

    return defaultValue;
  }

  return parsed;
}

function getRequiredUrlEnv(key: string): string {
  const value = getRequiredEnv(key);

  if (!value) {
    return '';
  }

  try {
    const parsedUrl = new URL(value);
    if (!parsedUrl.protocol || !parsedUrl.host) {
      throw new Error('Invalid URL format');
    }
  } catch {
    if (IS_SERVER) {
      throw new Error(`Invalid environment variable ${key}: must be a valid URL`);
    }

    return '';
  }

  return value;
}

// Piston API configuration
export const PISTON_API_URL = getRequiredUrlEnv('PISTON_API_URL');
export const PISTON_TIMEOUT_MS = getPositiveIntEnv('PISTON_TIMEOUT_MS', 30000);
export const PISTON_MAX_RETRIES = getPositiveIntEnv('PISTON_MAX_RETRIES', 3);

// Supabase configuration
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// NextAuth configuration
export const NEXTAUTH_URL = process.env.NEXTAUTH_URL || '';
export const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || '';

// Google AI configuration (Gemini)
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Mock mode for testing (skips AI generation, uses sample response)
export const MOCK_AI_GENERATION = process.env.MOCK_AI_GENERATION === 'true';

export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
