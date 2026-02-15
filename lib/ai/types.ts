// Types for AI problem generation

export interface ProblemGenerationRequest {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags?: string[];
  constraints?: string;
  numProblems?: number; // For batch generation
  languages?: string[]; // Programming languages to generate starter code for
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
  starter_code: {
    [language: string]: string; // e.g., { python: "def solution():", javascript: "function solution() {" }
  };
  solution_code: string; // Reference solution in one language
  test_cases: GeneratedTestCase[];
}

export interface ProblemGenerationResponse {
  problems: GeneratedProblem[];
  metadata: {
    generated_at: string;
    model: string;
  };
}
