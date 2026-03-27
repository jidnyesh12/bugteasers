// Centralized environment variable configuration
// All environment variables should be accessed through this file for type safety

// Validates that required environment variables are set
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

// Piston API configuration
export const PISTON_API_URL = getRequiredEnv('PISTON_API_URL');

// Supabase configuration
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// NextAuth configuration
export const NEXTAUTH_URL = process.env.NEXTAUTH_URL || '';
export const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || '';

// Google AI configuration (Gemini)
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
