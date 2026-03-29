// Types for AI problem generation

import type { SupportedLanguage } from '@/lib/execution/types';

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
  expected_output: string;
  is_sample: boolean;
  points: number;
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
