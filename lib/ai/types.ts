// Types for AI problem generation

import type { SupportedLanguage } from '@/lib/execution/types';
import type { TestCaseInputTemplate } from '@/lib/ai/template-dsl';

export interface ProblemGenerationRequest {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags?: string[];
  constraints?: string;
  numProblems?: number; // For batch generation
  languages?: SupportedLanguage[]; // Supported solve languages for generated problem context
}

export interface GeneratedTestCase {
  input_data: string;
  input_template?: TestCaseInputTemplate;
  expected_output: string;
  is_sample: boolean;
  points: number;
  generated_at?: string;
  generation_model?: string;
  generation_seed?: string;
  is_generated?: boolean;
  input_hash?: string;
}

export interface GeneratedProblem {
  title: string;
  description: string; // Markdown formatted
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  constraints: string;
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  hints: string[];
  time_limit: number; // milliseconds
  memory_limit: number; // MB
  solution_code: string; // Complete reference solution in one supported language
  test_cases: GeneratedTestCase[];
}

export interface ProblemGenerationResponse {
  problems: GeneratedProblem[];
  metadata: {
    generated_at: string;
    model: string;
  };
}

export interface RetryHistoryEntry {
  attempt: number;
  stage: 'ai_generating' | 'validating';
  error: string;
  timestamp: string;
}

export type ProblemGenerationJobStatus =
  | 'queued'
  | 'ai_generating'
  | 'validating'
  | 'retrying'
  | 'completed'
  | 'discarded'
  | 'error';

export interface ProblemGenerationJobStatusResponse {
  jobId: string;
  status: ProblemGenerationJobStatus;
  progressMessage?: string;
  problems?: GeneratedProblem[];
  error?: string;
  retryCount?: number;
  maxRetries?: number;
  retryHistory?: RetryHistoryEntry[];
}
