// Types and interfaces for code execution via Piston API

export type SupportedLanguage = 'python' | 'java' | 'cpp' | 'c';
export type PistonLanguage = 'python' | 'java' | 'c++' | 'c';

export interface ExecutionRequest {
  language: string;
  version: string;
  files: Array<{
    name?: string;
    content: string;
  }>;
  stdin: string;
  args?: string[];
  compile_timeout?: number;
  run_timeout?: number;
  compile_memory_limit?: number;
  run_memory_limit?: number;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  code: number;
  signal: string | null;
  output: string;
}

export interface ExecutionResponse {
  language: string;
  version: string;
  run: ExecutionResult;
  compile?: ExecutionResult;
}

export interface Runtime {
  language: string;
  version: string;
  aliases: string[];
}

export interface PistonClient {
  execute(request: ExecutionRequest): Promise<ExecutionResponse>;
  getRuntimes(): Promise<Runtime[]>;
  mapLanguage(language: SupportedLanguage): PistonLanguage;
  validateResponse(response: unknown): ExecutionResponse;
}

export interface PistonClientConfig {
  apiUrl: string;
  timeout: number;
  maxRetries: number;
}

export class UnsupportedLanguageError extends Error {
  constructor(language: string) {
    super(`Unsupported language: ${language}. Supported languages: python, java, cpp, c`);
    this.name = 'UnsupportedLanguageError';
  }
}

export class InvalidResponseError extends Error {
  constructor(message: string, public readonly response?: unknown) {
    super(message);
    this.name = 'InvalidResponseError';
  }
}

export class ExecutionTimeoutError extends Error {
  constructor(timeout: number) {
    super(`Execution timed out after ${timeout}ms`);
    this.name = 'ExecutionTimeoutError';
  }
}

// Test case evaluation types

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  points: number;
  isSample?: boolean;
}

export interface TestResult {
  testCaseId: string;
  passed: boolean;
  actualOutput: string;
  expectedOutput: string;
  executionTime?: number;
  memoryUsed?: number;
  pointsEarned: number;
  pointsAvailable: number;
  error?: string;
}

export interface ScoreResult {
  totalPoints: number;
  earnedPoints: number;
  percentage: number;
  status: 'passed' | 'failed' | 'partial';
}

export interface TestCaseEvaluator {
  normalizeOutput(output: string): string;
  evaluateTestCase(
    executionResponse: ExecutionResponse,
    testCase: TestCase
  ): TestResult;
  calculateScore(results: TestResult[]): ScoreResult;
}

// Execution service types

export interface RunRequest {
  code: string;
  language: SupportedLanguage;
  problemId: string;
}

export interface SubmitRequest {
  code: string;
  language: SupportedLanguage;
  problemId: string;
  assignmentId?: string;
}

export interface RunResponse {
  results: TestResult[];
  score: ScoreResult;
}

export interface SubmitResponse {
  submissionId: string;
  results: TestResult[];
  score: ScoreResult;
}

export interface ExecutionService {
  runCode(request: RunRequest): Promise<RunResponse>;
  submitCode(request: SubmitRequest, userId: string): Promise<SubmitResponse>;
}
