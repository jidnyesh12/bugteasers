// Configuration for hint generation system

import type { HintConfig } from "./hint-types";

/**
 * Hint system configuration
 * Defines limits, reset policies, and behavior
 */
export const HINT_CONFIG: HintConfig = {
  // Initial hints available
  initialHints: 3,

  // Additional hints after 24-hour reset
  maxHintsAfterReset: 2,

  // Absolute maximum hints per problem (lifetime)
  lifetimeMaxHints: 5,

  // Reset after this many hours
  resetAfterHours: 24,

  // Require code change for reset
  requiresCodeChange: true,

  // Minimum code change percentage to qualify for reset
  minCodeChangePercent: 30,
};

/**
 * Hint level descriptions for prompt engineering
 */
export const HINT_LEVEL_GUIDELINES = {
  1: {
    name: "Conceptual",
    description: "High-level approach and problem understanding",
    guidance:
      "FIRST: Analyze the student's code carefully. THEN: Guide student to think about the problem structure. Focus on what approach they should consider. Do NOT mention specific algorithms, data structures, or provide any code/pseudocode.",
  },
  2: {
    name: "Algorithmic",
    description: "Specific algorithm or data structure suggestion",
    guidance:
      "FIRST: Analyze what the student has tried in their code. THEN: Suggest a specific algorithm or data structure that would help. Reference their current approach and explain why a different approach might work better. Do NOT provide any code or pseudocode.",
  },
  3: {
    name: "Implementation",
    description: "Specific implementation guidance without code",
    guidance:
      "FIRST: Carefully review the student's code to identify the issue. THEN: Provide specific guidance about what needs to change in their logic or approach. Explain the concept clearly but do NOT write any code or pseudocode. Guide them to the solution through explanation only.",
  },
} as const;

/**
 * Get hint level guideline
 */
export function getHintLevelGuideline(level: number) {
  return HINT_LEVEL_GUIDELINES[level as keyof typeof HINT_LEVEL_GUIDELINES];
}

/**
 * Calculate hints remaining based on usage
 */
export function calculateHintsRemaining(
  hintsUsed: number,
  hasReset: boolean,
): number {
  if (!hasReset) {
    // Initial allocation
    return Math.max(0, HINT_CONFIG.initialHints - hintsUsed);
  } else {
    // After reset
    return Math.max(0, HINT_CONFIG.lifetimeMaxHints - hintsUsed);
  }
}

/**
 * Check if student can get more hints
 */
export function canGetMoreHints(
  hintsUsed: number,
  hasReset: boolean,
): boolean {
  if (!hasReset) {
    return hintsUsed < HINT_CONFIG.initialHints;
  } else {
    return hintsUsed < HINT_CONFIG.lifetimeMaxHints;
  }
}

/**
 * Calculate reset timestamp (24 hours from now)
 */
export function calculateResetTimestamp(): Date {
  const now = new Date();
  now.setHours(now.getHours() + HINT_CONFIG.resetAfterHours);
  return now;
}

/**
 * Check if reset is due
 */
export function isResetDue(resetAt: string | null | undefined): boolean {
  if (!resetAt) return false;
  return new Date() >= new Date(resetAt);
}

/**
 * Critical rules for AI hint generation
 * These MUST be enforced in the prompt
 */
export const HINT_GENERATION_RULES = {
  // CRITICAL: Always analyze student's code first
  ANALYZE_CODE_FIRST:
    "You MUST carefully read and analyze the student's code before providing any hint.",

  // NEVER provide code or pseudocode
  NO_CODE_OR_PSEUDOCODE:
    "You are FORBIDDEN from providing any code snippets, pseudocode, or code-like syntax. Use plain English explanations only.",

  // Focus on conceptual understanding
  CONCEPTUAL_GUIDANCE:
    "Focus on helping the student understand the concept and approach, not on writing code for them.",

  // Use Socratic method
  SOCRATIC_METHOD:
    "Ask guiding questions that lead the student to discover the solution themselves.",

  // Reference student's code
  REFERENCE_STUDENT_CODE:
    "Reference specific parts of the student's code when explaining what needs improvement.",

  // Be encouraging
  ENCOURAGING_TONE:
    "Be supportive and encouraging. Acknowledge what the student has done well.",

  // Keep hints concise
  CONCISE:
    "Keep hints concise (2-4 sentences). Don't overwhelm the student with information.",
} as const;
