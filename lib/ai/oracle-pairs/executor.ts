/**
 * Code Executor: Deterministic execution of model answer code
 *
 * Supports:
 * - Multiple languages (Python, C++, Java, JavaScript, etc.)
 * - Timeout protection
 * - Output capture (stdout + stderr)
 * - Deterministic execution with seeded RNG
 */


import { PistonClientImpl } from '../../execution/client';
import type { ExecutionResult, SupportedLanguage, ModelAnswer } from './types';
import { TemplateDslError } from '../template-dsl/errors';

/**
 * Code executor configuration
 */
export interface ExecutorConfig {
  timeout: number; // ms
  maxOutputLength: number; // max chars to capture
  sandboxed: boolean; // run in isolated environment
  captureStderr: boolean;
  seedRNG: boolean; // use seed for deterministic RNG
}

export const DEFAULT_EXECUTOR_CONFIG: ExecutorConfig = {
  timeout: 5000,
  maxOutputLength: 1_000_000,
  sandboxed: true,
  captureStderr: true,
  seedRNG: true,
};

/**
 * File extensions by language
 */
const LANGUAGE_EXTENSIONS: Record<SupportedLanguage, string> = {
  python: 'py',
  cpp: 'cpp',
  java: 'java',
  javascript: 'js',
  typescript: 'ts',
  csharp: 'cs',
  go: 'go',
  rust: 'rs',
};

/**
 * Prepare code for execution
 *
 * Wraps code with seed initialization if needed
 */
function prepareCodeForExecution(
  code: string,
  language: SupportedLanguage,
  seed: string,
  useSeeding: boolean
): string {
  if (!useSeeding) {
    return code;
  }

  // Seed value for deterministic RNG (convert hex seed to integer)
  const seedValue = parseInt(seed.substring(0, 8), 16);

  switch (language) {
    case 'python':
      return `import random\nrandom.seed(${seedValue})\n${code}`;

    case 'javascript':
    case 'typescript':
      // Manual seeded RNG helper for JS
      return `
const seededRandom = (() => {
  let m = ${seedValue};
  return () => {
    m = (m * 1103515245 + 12345) & 0x7fffffff;
    return m / 0x7fffffff;
  };
})();
Math.random = seededRandom;
${code}`;

    case 'java':
      return `import java.util.Random;\nRandom random = new Random(${seedValue}L);\n${code}`;

    case 'cpp':
      return `#include <cstdlib>\nsrand(${seedValue});\n${code}`;

    case 'csharp':
      return `using System;\nvar random = new Random(${seedValue});\n${code}`;

    case 'go':
      return `rand.Seed(int64(${seedValue}))\n${code}`;

    case 'rust':
      // Rust doesn't have built-in seeded RNG easily accessible
      return code;

    default:
      return code;
  }
}

/**
 * Execute code and capture output
 *
 * Handles multiple languages with proper environment setup
 */
export async function executeCode(
  modelAnswer: ModelAnswer,
  testInput: string,
  config: ExecutorConfig = DEFAULT_EXECUTOR_CONFIG
): Promise<ExecutionResult> {
  const startTime = Date.now();
  const language = modelAnswer.language;
  const seed = modelAnswer.generationSeed;

  // Prepare code with seed injection
  const preparedCode = prepareCodeForExecution(
    modelAnswer.code,
    language,
    seed,
    config.seedRNG
  );

  try {
    const pistonClient = new PistonClientImpl();
    // Map oracle-pair SupportedLanguage to Piston language strings.
    // Languages not in PistonLanguage union are included for future expansion.
    const languageMap: Partial<Record<SupportedLanguage, string>> = {
      python: 'python',
      java: 'java',
      cpp: 'c++',
      javascript: 'javascript',
      typescript: 'typescript',
      csharp: 'csharp',
      go: 'go',
      rust: 'rust',
    };

    const pistonLang = languageMap[language];
    if (!pistonLang) {
      throw new TemplateDslError(`Unsupported language for Piston execution: ${language}`);
    }

    const response = await pistonClient.execute({
      language: pistonLang,
      version: '*',
      files: [{ content: preparedCode }],
      stdin: testInput,
      // Compile timeout must be generous — g++ can be slow even with explicit includes.
      // Run timeout is tight to catch infinite loops quickly.
      compile_timeout: 10_000,
      run_timeout: Math.min(config.timeout, 5_000),
      run_memory_limit: 256 * 1024 * 1024,
    });

    const duration = Date.now() - startTime;
    let status: 'success' | 'timeout' | 'error' = 'success';

    // ── Compile-phase timeout detection ──────────────────────
    // When g++ is SIGKILL'd during compilation (e.g., bits/stdc++.h),
    // Piston returns compile.signal === 'SIGKILL' and/or
    // compile.output containing "Time limit exceeded".
    // We must distinguish this from a normal syntax error.
    if (response.compile && response.compile.signal === 'SIGKILL') {
      const compileOutput = response.compile.output || response.compile.stderr || '';
      const isTimeLimitExceeded = compileOutput.toLowerCase().includes('time limit exceeded');
      console.error(
        `[EXECUTOR] Compile-phase SIGKILL detected.`,
        isTimeLimitExceeded ? 'Cause: compilation timeout (TLE).' : 'Cause: unknown SIGKILL.',
        'stderr:', (response.compile.stderr || '').substring(0, 200)
      );
      return {
        output: '',
        exitCode: response.compile.code ?? 137,
        stderr:
          isTimeLimitExceeded
            ? 'Compilation timed out (SIGKILL). This usually means #include <bits/stdc++.h> was used. Use explicit includes instead.'
            : `Compilation killed by signal SIGKILL: ${compileOutput.substring(0, 500)}`,
        duration,
        status: 'timeout',
      };
    }
    
    if (response.compile && response.compile.code !== 0) {
      return {
        output: '',
        exitCode: response.compile.code ?? 1,
        stderr: response.compile.stderr || 'Compilation failed',
        duration,
        status: 'error',
      };
    }

    const runCode = typeof response.run.code === 'number' ? response.run.code : 1;
    if (runCode !== 0) {
      status = 'error';
    }

    let output = response.run.stdout || response.run.output || '';
    if (output.length > config.maxOutputLength) {
      output = output.substring(0, config.maxOutputLength);
    }

    return {
      output: output.trim(),
      exitCode: runCode,
      stderr: config.captureStderr ? (response.run.stderr || undefined) : undefined,
      duration,
      status,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    let status: 'success' | 'timeout' | 'error' = 'error';
    const stderr = error instanceof Error ? error.message : String(error);

    if (stderr.includes('timeout') || stderr.includes('timed out')) {
      status = 'timeout';
    }

    return {
      output: '',
      exitCode: 1,
      stderr: config.captureStderr ? stderr : undefined,
      duration,
      status,
    };
  }
}




/**
 * Execute and compare outputs (with tolerance for whitespace)
 */
export async function executeAndCompare(
  modelAnswer: ModelAnswer,
  testInput: string,
  expectedOutput: string,
  config: ExecutorConfig = DEFAULT_EXECUTOR_CONFIG
): Promise<{
  matches: boolean;
  actual: string;
  executionStatus: ExecutionResult;
}> {
  const result = await executeCode(modelAnswer, testInput, config);

  // Normalize outputs for comparison
  const normalizeOutput = (out: string) =>
    out
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join('\n');

  const expectedNorm = normalizeOutput(expectedOutput);
  const actualNorm = normalizeOutput(result.output);

  return {
    matches: expectedNorm === actualNorm,
    actual: result.output,
    executionStatus: result,
  };
}
