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

interface ExecutionServiceConfig {
  pistonClient: PistonClient;
  evaluator: TestCaseEvaluator;
  supabase: SupabaseClient;
}

export class ExecutionServiceImpl implements ExecutionService {
  private readonly pistonClient: PistonClient;
  private readonly evaluator: TestCaseEvaluator;
  private readonly supabase: SupabaseClient;

  constructor(config: ExecutionServiceConfig) {
    this.pistonClient = config.pistonClient;
    this.evaluator = config.evaluator;
    this.supabase = config.supabase;
  }

  // Run mode: execute code against sample test cases only, no database records
  async runCode(request: RunRequest): Promise<RunResponse> {
    // Fetch sample test cases only
    const testCases = await this.fetchTestCases(request.problemId, true);

    // Execute code against each test case
    const results = await this.executeTestCases(request.code, request.language, testCases);

    // Calculate score
    const score = this.evaluator.calculateScore(results);

    return { results, score };
  }

  // Submit mode: execute code against all test cases and save submission
  async submitCode(request: SubmitRequest, userId: string): Promise<SubmitResponse> {
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

    return { submissionId, results, score };
  }

  // Fetch test cases from database
  private async fetchTestCases(problemId: string, sampleOnly: boolean): Promise<TestCase[]> {
    let query = this.supabase
      .from('test_cases')
      .select('id, input_data, expected_output, is_sample, points')
      .eq('problem_id', problemId);

    if (sampleOnly) {
      query = query.eq('is_sample', true);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch test cases: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('No test cases found for problem');
    }

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
    const pistonLanguage = this.pistonClient.mapLanguage(language);
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

    const { data, error } = await this.supabase
      .from('problem_submissions')
      .insert(submissionData)
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to save submission: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to save submission: No data returned');
    }

    return data.id;
  }
}

// Factory function to create execution service with dependencies
export function createExecutionService(config: ExecutionServiceConfig): ExecutionService {
  return new ExecutionServiceImpl(config);
}
