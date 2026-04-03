/**
 * Code Executor: Deterministic execution of model answer code
 *
 * Supports:
 * - Multiple languages (Python, C++, Java, JavaScript, etc.)
 * - Timeout protection
 * - Output capture (stdout + stderr)
 * - Deterministic execution with seeded RNG
 */

import { execSync } from 'node:child_process';
import { writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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

  // Create temporary file for code
  const tmpDir = tmpdir();
  const ext = LANGUAGE_EXTENSIONS[language];
  const codeFile = join(tmpDir, `code_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`);
  const inputFile = join(tmpDir, `input_${Date.now()}_${Math.random().toString(36).substring(7)}.txt`);

  try {
    // Write code and input to temp files
    writeFileSync(codeFile, preparedCode);
    writeFileSync(inputFile, testInput);

    let output = '';
    let stderr = '';
    let exitCode = 0;
    let status: 'success' | 'timeout' | 'error' = 'success';

    try {
      switch (language) {
        case 'python':
          output = executeCommand(
            `python "${codeFile}"`,
            testInput,
            config.timeout
          );
          break;

        case 'javascript':
          output = executeCommand(
            `node "${codeFile}"`,
            testInput,
            config.timeout
          );
          break;

        case 'cpp': {
          const exePath = codeFile.replace(/.cpp$/, '.exe');
          executeCommand(
            `g++ -O2 -o "${exePath}" "${codeFile}"`,
            '',
            config.timeout
          );
          output = executeCommand(
            `"${exePath}"`,
            testInput,
            config.timeout
          );
          break;
        }

        case 'java': {
          const className = 'Solution';
          const javaFile = codeFile.replace(/.java$/, `.java`);
          writeFileSync(javaFile, `public class ${className} { ${preparedCode} }`);
          executeCommand(
            `javac "${javaFile}"`,
            '',
            config.timeout
          );
          output = executeCommand(
            `java -cp "${tmpDir}" ${className}`,
            testInput,
            config.timeout
          );
          break;
        }

        case 'csharp': {
          const exePath = codeFile.replace(/.cs$/, '.exe');
          executeCommand(
            `csc /out:"${exePath}" "${codeFile}"`,
            '',
            config.timeout
          );
          output = executeCommand(
            `"${exePath}"`,
            testInput,
            config.timeout
          );
          break;
        }

        case 'go': {
          const exePath = codeFile.replace(/.go$/, '.exe');
          executeCommand(
            `go build -o "${exePath}" "${codeFile}"`,
            '',
            config.timeout
          );
          output = executeCommand(
            `"${exePath}"`,
            testInput,
            config.timeout
          );
          break;
        }

        case 'rust': {
          const exePath = codeFile.replace(/.rs$/, '.exe');
          executeCommand(
            `rustc -O -o "${exePath}" "${codeFile}"`,
            '',
            config.timeout
          );
          output = executeCommand(
            `"${exePath}"`,
            testInput,
            config.timeout
          );
          break;
        }

        case 'typescript': {
          // Compile to JS first
          const jsFile = codeFile.replace(/.ts$/, '.js');
          executeCommand(
            `tsc "${codeFile}" --outFile "${jsFile}"`,
            '',
            config.timeout
          );
          output = executeCommand(
            `node "${jsFile}"`,
            testInput,
            config.timeout
          );
          break;
        }

        default:
          throw new TemplateDslError(`Unsupported language: ${language}`);
      }

      // Limit output length
      if (output.length > config.maxOutputLength) {
        output = output.substring(0, config.maxOutputLength);
      }
    } catch (error) {
      status = 'error';
      stderr = error instanceof Error ? error.message : String(error);
      exitCode = 1;

      // Check if timeout
      if (stderr.includes('timeout') || stderr.includes('timed out')) {
        status = 'timeout';
      }
    }

    const duration = Date.now() - startTime;

    return {
      output: output.trim(),
      exitCode,
      stderr: config.captureStderr ? stderr : undefined,
      duration,
      status,
    };
  } finally {
    // Cleanup temp files
    if (existsSync(codeFile)) {
      try {
        unlinkSync(codeFile);
      } catch {}
    }
    if (existsSync(inputFile)) {
      try {
        unlinkSync(inputFile);
      } catch {}
    }
  }
}

/**
 * Helper: Execute a command with timeout
 */
function executeCommand(cmd: string, stdin: string, timeout: number): string {
  try {
    const result = execSync(cmd, {
      timeout,
      encoding: 'utf-8',
      input: stdin || undefined,
      maxBuffer: 1024 * 1024 * 10, // 10MB
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return result;
  } catch (error) {
    if (error instanceof Error && 'killed' in error && (error as { killed?: boolean }).killed) {
      throw new TemplateDslError(`Execution timeout after ${timeout}ms`);
    }
    throw error;
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
