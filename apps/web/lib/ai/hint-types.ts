// Types for AI hint generation system

import type { SupportedLanguage } from "@/lib/execution/types";

/**
 * Request payload for generating a hint
 */
export interface HintGenerationRequest {
  code: string;
  language: SupportedLanguage;
  executionResults?: ExecutionContext;
  previousHints?: string[];
  hintLevel: number; // 1, 2, or 3
  assignmentId?: string;
}

/**
 * Execution context from student's last code run
 */
export interface ExecutionContext {
  status: "passed" | "failed" | "error" | "timeout";
  score?: number;
  failedTestCases?: number;
  totalTestCases?: number;
  error?: string;
  stderr?: string;
}

/**
 * Response from hint generation API
 */
export interface HintGenerationResponse {
  hint: string;
  hintLevel: number;
  hintsRemaining: number;
  resetAt?: string; // ISO timestamp when hints will reset
}

/**
 * Hint usage tracking record
 */
export interface HintUsage {
  id: string;
  studentId: string;
  problemId: string;
  assignmentId?: string;
  hintsUsed: number;
  lastHintAt?: string;
  resetAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Configuration for hint generation
 */
export interface HintConfig {
  initialHints: number; // 3
  maxHintsAfterReset: number; // 2
  lifetimeMaxHints: number; // 5
  resetAfterHours: number; // 24
  requiresCodeChange: boolean; // true
  minCodeChangePercent: number; // 30
}

/**
 * Hint generation context passed to AI
 */
export interface HintGenerationContext {
  problem: {
    title: string;
    description: string;
    difficulty: "easy" | "medium" | "hard";
    constraints?: string;
    examples?: Array<{
      input: string;
      output: string;
      explanation?: string;
    }>;
  };
  studentCode: string;
  language: SupportedLanguage;
  executionResults?: ExecutionContext;
  previousHints: string[];
  hintLevel: number;
}

/**
 * Hint generation rules for AI
 */
export interface HintGenerationRules {
  // CRITICAL: Always analyze student's code first before providing hints
  analyzeCodeFirst: true;
  
  // NEVER provide pseudocode or code snippets
  noPseudocode: true;
  
  // Focus on conceptual guidance and algorithmic thinking
  conceptualGuidance: true;
  
  // Use Socratic method - ask guiding questions
  socraticMethod: true;
  
  // Reference specific parts of student's code
  referenceStudentCode: true;
  
  // Be encouraging and supportive
  encouragingTone: true;
}

/**
 * Error types for hint generation
 */
export type HintErrorType =
  | "rate_limit_exceeded"
  | "no_hints_remaining"
  | "invalid_request"
  | "ai_service_error"
  | "database_error"
  | "unauthorized";

/**
 * Hint generation error
 */
export class HintGenerationError extends Error {
  constructor(
    public type: HintErrorType,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "HintGenerationError";
  }
}
