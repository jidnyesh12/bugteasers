// Execution service orchestration for Run and Submit modes

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  PistonClient,
  TestCaseEvaluator,
  SupportedLanguage,
  ExecutionRequest,
  TestCase,
  TestResult,
  ScoreResult,
  RunRequest,
  SubmitRequest,
  RunResponse,
  SubmitResponse,
  ExecutionService,
} from './types';
import { ExecutionDatabaseError, ExecutionValidationError } from './errors';
import { createExecutionLogger, type ExecutionLogger } from './logging';

interface ExecutionServiceConfig {
  pistonClient: PistonClient;
  evaluator: TestCaseEvaluator;
  supabase: SupabaseClient;
  logger?: ExecutionLogger;
}

export class ExecutionServiceImpl implements ExecutionService {
  private readonly pistonClient: PistonClient;
  private readonly evaluator: TestCaseEvaluator;
  private readonly supabase: SupabaseClient;
  private readonly logger: ExecutionLogger;

  constructor(config: ExecutionServiceConfig) {
    this.pistonClient = config.pistonClient;
    this.evaluator = config.evaluator;
    this.supabase = config.supabase;
    this.logger = config.logger ?? createExecutionLogger();
  }

  // Run mode: execute code against sample test cases only, no database records
  async runCode(request: RunRequest): Promise<RunResponse> {
    const startedAt = Date.now();
    this.logger.logExecutionStarted({
      mode: 'run',
      problemId: request.problemId,
      language: request.language,
    });

    try {
      // Fetch sample test cases only
      const testCases = await this.fetchTestCases(request.problemId, true);

      // Execute code against each test case
      const results = await this.executeTestCases(request.code, request.language, testCases);

      // Calculate score
      const score = this.evaluator.calculateScore(results);

      this.logger.logExecutionCompleted({
        mode: 'run',
        problemId: request.problemId,
        language: request.language,
        durationMs: Date.now() - startedAt,
        status: score.status,
      });

      return { results, score };
    } catch (error) {
      this.logger.logExecutionFailed(
        {
          mode: 'run',
          problemId: request.problemId,
          language: request.language,
          durationMs: Date.now() - startedAt,
        },
        error
      );
      throw error;
    }
  }

  // Submit mode: execute code against all test cases and save submission
  async submitCode(request: SubmitRequest, userId: string): Promise<SubmitResponse> {
    const startedAt = Date.now();
    this.logger.logExecutionStarted({
      mode: 'submit',
      userId,
      problemId: request.problemId,
      language: request.language,
    });

    try {
      // Fetch all test cases (sample and hidden)
      const testCases = await this.fetchTestCases(request.problemId, false);

      // Execute code against each test case
      const results = await this.executeTestCases(request.code, request.language, testCases);

      // Calculate score
      const score = this.evaluator.calculateScore(results);

      // Save submission to database
      const submissionId = await this.saveSubmission({
        userId,
        problemId: request.problemId,
        assignmentId: request.assignmentId,
        code: request.code,
        language: request.language,
        results,
        score,
      });

      this.logger.logExecutionCompleted({
        mode: 'submit',
        userId,
        problemId: request.problemId,
        language: request.language,
        durationMs: Date.now() - startedAt,
        status: score.status,
      });

      return { submissionId, results, score };
    } catch (error) {
      this.logger.logExecutionFailed(
        {
          mode: 'submit',
          userId,
          problemId: request.problemId,
          language: request.language,
          durationMs: Date.now() - startedAt,
        },
        error
      );
      throw error;
    }
  }

  // Fetch test cases from database
  private async fetchTestCases(problemId: string, sampleOnly: boolean): Promise<TestCase[]> {
    let data: Array<{
      id: string;
      input_data: string;
      expected_output: string;
      is_sample: boolean;
      points: number;
    }> | null = null;
    let error: { message: string } | null = null;

    try {
      let query = this.supabase
        .from('test_cases')
        .select('id, input_data, expected_output, is_sample, points')
        .eq('problem_id', problemId);

      if (sampleOnly) {
        query = query.eq('is_sample', true);
      }

      const result = await query;
      data = result.data;
      error = result.error;
    } catch (caught) {
      throw new ExecutionDatabaseError(
        `Failed to fetch test cases: ${caught instanceof Error ? caught.message : 'Unknown database error'}`,
        caught
      );
    }

    if (error) {
      throw new ExecutionDatabaseError(`Failed to fetch test cases: ${error.message}`, error);
    }

    if (!data || data.length === 0) {
      throw new Error('No test cases found for problem');
    }

    this.validateRawTestCases(data);

    return data.map(tc => ({
      id: tc.id,
      input: tc.input_data,
      expectedOutput: tc.expected_output,
      points: tc.points,
      isSample: tc.is_sample,
    }));
  }

  // Execute code against multiple test cases
  private async executeTestCases(
    code: string,
    language: SupportedLanguage,
    testCases: TestCase[]
  ): Promise<TestResult[]> {
    let pistonLanguage;
    try {
      pistonLanguage = this.pistonClient.mapLanguage(language);
    } catch (error) {
      throw new ExecutionValidationError(
        `Unsupported language: ${language}`,
        error
      );
    }

    const results: TestResult[] = [];

    // Check for compilation error on first execution
    let compilationError: string | null = null;

    for (const testCase of testCases) {
      // If we already have a compilation error, mark remaining tests as failed
      if (compilationError) {
        results.push({
          testCaseId: testCase.id,
          passed: false,
          actualOutput: '',
          expectedOutput: testCase.expectedOutput,
          pointsEarned: 0,
          pointsAvailable: testCase.points,
          error: compilationError,
        });
        continue;
      }

      // Execute code with test case input
      const executionRequest: ExecutionRequest = {
        language: pistonLanguage,
        version: '*',
        files: [{ content: code }],
        stdin: testCase.input,
      };

      const executionResponse = await this.pistonClient.execute(executionRequest);

      // Check for compilation error
      if (executionResponse.compile && executionResponse.compile.code !== 0) {
        compilationError = executionResponse.compile.stderr || 'Compilation failed';
      }

      // Evaluate test case
      const result = this.evaluator.evaluateTestCase(executionResponse, testCase);
      results.push(result);
    }

    return results;
  }

  // Save submission to database
  private async saveSubmission(params: {
    userId: string;
    problemId: string;
    assignmentId?: string;
    code: string;
    language: string;
    results: TestResult[];
    score: ScoreResult;
  }): Promise<string> {
    const submissionData = {
      student_id: params.userId,
      problem_id: params.problemId,
      assignment_id: params.assignmentId || null,
      code: params.code,
      language: params.language,
      status: params.score.status,
      test_results: params.results,
      score: params.score.percentage,
      total_points: params.score.totalPoints,
      earned_points: params.score.earnedPoints,
    };

    let data: { id: string } | null = null;
    let error: { message: string } | null = null;

    try {
      const result = await this.supabase
        .from('problem_submissions')
        .insert(submissionData)
        .select('id')
        .single();

      data = result.data;
      error = result.error;
    } catch (caught) {
      throw new ExecutionDatabaseError(
        `Failed to save submission: ${caught instanceof Error ? caught.message : 'Unknown database error'}`,
        caught
      );
    }

    if (error) {
      throw new ExecutionDatabaseError(`Failed to save submission: ${error.message}`, error);
    }

    if (!data) {
      throw new ExecutionDatabaseError('Failed to save submission: No data returned');
    }

    return data.id;
  }

  private validateRawTestCases(testCases: Array<Record<string, unknown>>): void {
    for (const testCase of testCases) {
      if (typeof testCase.id !== 'string' || testCase.id.length === 0) {
        throw new ExecutionValidationError('Invalid test case data: missing id');
      }

      if (typeof testCase.input_data !== 'string') {
        throw new ExecutionValidationError(`Invalid test case data: input_data must be a string for test case ${testCase.id}`);
      }

      if (typeof testCase.expected_output !== 'string') {
        throw new ExecutionValidationError(`Invalid test case data: expected_output must be a string for test case ${testCase.id}`);
      }

      if (typeof testCase.points !== 'number' || !Number.isFinite(testCase.points) || testCase.points < 0) {
        throw new ExecutionValidationError(`Invalid test case data: points must be a non-negative number for test case ${testCase.id}`);
      }
    }
  }
}

// Factory function to create execution service with dependencies
export function createExecutionService(config: ExecutionServiceConfig): ExecutionService {
  return new ExecutionServiceImpl(config);
}
