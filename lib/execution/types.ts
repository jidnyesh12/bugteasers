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
