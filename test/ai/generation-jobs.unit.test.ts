import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  fromMock,
  generateProblemsMock,
  generateProblemsWithRetryContextMock,
  repairProblemSolutionCodeMock,
  pistonMapLanguageMock,
  pistonExecuteMock,
  normalizeOutputMock,
} = vi.hoisted(() => ({
  fromMock: vi.fn(),
  generateProblemsMock: vi.fn(),
  generateProblemsWithRetryContextMock: vi.fn(),
  repairProblemSolutionCodeMock: vi.fn(),
  pistonMapLanguageMock: vi.fn(),
  pistonExecuteMock: vi.fn(),
  normalizeOutputMock: vi.fn((value: string) => String(value).trim()),
}));

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: fromMock,
  },
}));

vi.mock('@/lib/ai/problem-generator', () => ({
  generateProblems: generateProblemsMock,
  generateProblemsWithRetryContext: generateProblemsWithRetryContextMock,
  repairProblemSolutionCode: repairProblemSolutionCodeMock,
}));

vi.mock('@/lib/execution/client', () => ({
  PistonClientImpl: class MockPistonClientImpl {
    mapLanguage(language: string) {
      return pistonMapLanguageMock(language);
    }

    execute(payload: unknown) {
      return pistonExecuteMock(payload);
    }
  },
}));

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class MockGoogleGenerativeAI {
    getGenerativeModel() {
      return {
        generateContent: vi.fn().mockResolvedValue({
          response: { text: () => '{"solution_code": "mock"}' },
        }),
      };
    }
  },
}));

vi.mock('@/lib/env', () => ({
  GEMINI_API_KEY: 'test-api-key',
}));

vi.mock('@/lib/execution/evaluator', () => ({
  TestCaseEvaluatorImpl: class MockTestCaseEvaluatorImpl {
    normalizeOutput(value: string) {
      return normalizeOutputMock(value);
    }
  },
}));

import { progressProblemGenerationJob } from '@/lib/ai/generation-jobs';
import type { GeneratedProblem, RetryHistoryEntry } from '@/lib/ai/types';

type QueryResult = {
  data: unknown;
  error: { code?: string; message: string } | null;
};

function buildGeneratedProblem(): GeneratedProblem {
  return {
    title: 'Shortest Path',
    description: 'Find shortest path distance.',
    difficulty: 'medium',
    tags: ['graphs'],
    constraints: '1 <= n <= 2e5',
    examples: [
      {
        input: '2 1\n1 2 42',
        output: '42',
      },
    ],
    hints: ['Use Dijkstra.'],
    time_limit: 2000,
    memory_limit: 256,
    solution_code: 'print(input())',
    test_cases: [
      {
        input_data: '2 1\n1 2 42',
        expected_output: '42',
        is_sample: true,
        points: 1,
      },
    ],
  };
}

function buildJobRow(
  status: 'queued' | 'ai_generating' | 'validating' | 'retrying' | 'completed' | 'discarded' | 'error',
  overrides: Partial<{
    result_payload: { problems?: GeneratedProblem[] } | null;
    progress_message: string | null;
    error_message: string | null;
    processing_token: string | null;
    processing_started_at: string | null;
    completed_at: string | null;
    retry_count: number;
    max_retries: number;
    retry_history: RetryHistoryEntry[];
  }> = {}
) {
  return {
    id: 'job-1',
    created_by: 'instructor-1',
    status,
    request_payload: {
      topic: 'graphs',
      difficulty: 'medium',
      tags: ['graphs'],
      constraints: 'n <= 2e5',
      numProblems: 1,
      languages: ['python'],
    },
    result_payload: overrides.result_payload ?? null,
    progress_message: overrides.progress_message ?? (status === 'queued' ? 'Queued' : 'Progress'),
    error_message: overrides.error_message ?? null,
    processing_token: overrides.processing_token ?? null,
    processing_started_at: overrides.processing_started_at ?? null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    completed_at:
      overrides.completed_at ??
      (status === 'completed' ? '2026-01-01T00:10:00.000Z' : null),
    retry_count: overrides.retry_count ?? 0,
    max_retries: overrides.max_retries ?? 3,
    retry_history: overrides.retry_history ?? [],
  };
}

function installSupabaseQueryMocks(params: {
  singleResults: QueryResult[];
  maybeSingleResults?: QueryResult[];
}) {
  const singleQueue = [...params.singleResults];
  const maybeSingleQueue = [...(params.maybeSingleResults ?? [])];

  const query = {
    select: vi.fn(() => query),
    update: vi.fn(() => query),
    insert: vi.fn(() => query),
    eq: vi.fn(() => query),
    in: vi.fn(() => query),
    is: vi.fn(() => query),
    not: vi.fn(() => query),
    lt: vi.fn(() => query),
    single: vi.fn(async () => {
      const next = singleQueue.shift();
      if (!next) {
        return { data: null, error: { message: 'No single() result queued' } };
      }
      return next;
    }),
    maybeSingle: vi.fn(async () => {
      const next = maybeSingleQueue.shift();
      if (!next) {
        return { data: null, error: null };
      }
      return next;
    }),
  };

  fromMock.mockImplementation(() => query);
  return query;
}

describe('generation-jobs orchestration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Date, 'now').mockReturnValue(0);
    pistonMapLanguageMock.mockReturnValue('python');
    normalizeOutputMock.mockImplementation((value: string) => String(value).trim());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null when the job does not exist', async () => {
    installSupabaseQueryMocks({
      singleResults: [
        {
          data: null,
          error: {
            code: 'PGRST116',
            message: 'No rows found',
          },
        },
      ],
    });

    const result = await progressProblemGenerationJob('missing-job');
    expect(result).toBeNull();
  });

  it('returns terminal job summary with retry fields', async () => {
    const query = installSupabaseQueryMocks({
      singleResults: [{ data: buildJobRow('completed'), error: null }],
    });

    const result = await progressProblemGenerationJob('job-1');

    expect(result).toEqual({
      jobId: 'job-1',
      status: 'completed',
      progressMessage: 'Progress',
      errorMessage: null,
      problems: null,
      retryCount: 0,
      maxRetries: 3,
      retryHistory: [],
    });
    expect(query.update).not.toHaveBeenCalled();
    expect(query.maybeSingle).not.toHaveBeenCalled();
  });

  it('transitions queued jobs to ai_generating', async () => {
    const query = installSupabaseQueryMocks({
      singleResults: [{ data: buildJobRow('queued'), error: null }],
      maybeSingleResults: [{ data: buildJobRow('ai_generating'), error: null }],
    });

    const result = await progressProblemGenerationJob('job-1');

    expect(result).toEqual({
      jobId: 'job-1',
      status: 'ai_generating',
      progressMessage: 'Progress',
      errorMessage: null,
      problems: null,
      retryCount: 0,
      maxRetries: 3,
      retryHistory: [],
    });
    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'ai_generating',
        progress_message: 'Drafting problem statement, model code, and base testcases...',
      })
    );
    expect(query.maybeSingle).toHaveBeenCalledTimes(1);
  });

  it('falls back to latest job snapshot when queued transition races', async () => {
    const query = installSupabaseQueryMocks({
      singleResults: [
        { data: buildJobRow('queued'), error: null },
        { data: buildJobRow('validating'), error: null },
      ],
      maybeSingleResults: [{ data: null, error: null }],
    });

    const result = await progressProblemGenerationJob('job-1');

    expect(result).toEqual({
      jobId: 'job-1',
      status: 'validating',
      progressMessage: 'Progress',
      errorMessage: null,
      problems: null,
      retryCount: 0,
      maxRetries: 3,
      retryHistory: [],
    });
    expect(query.single).toHaveBeenCalledTimes(2);
    expect(query.maybeSingle).toHaveBeenCalledTimes(1);
  });

  it('falls back to latest snapshot when ai_generating lock cannot be claimed', async () => {
    installSupabaseQueryMocks({
      singleResults: [
        { data: buildJobRow('ai_generating'), error: null },
        { data: buildJobRow('validating'), error: null },
      ],
      maybeSingleResults: [{ data: null, error: null }],
    });

    const result = await progressProblemGenerationJob('job-1');

    expect(result).toEqual({
      jobId: 'job-1',
      status: 'validating',
      progressMessage: 'Progress',
      errorMessage: null,
      problems: null,
      retryCount: 0,
      maxRetries: 3,
      retryHistory: [],
    });
    expect(generateProblemsMock).not.toHaveBeenCalled();
  });

  it('runs ai generation stage and transitions to validating', async () => {
    const generatedProblem = buildGeneratedProblem();

    installSupabaseQueryMocks({
      singleResults: [{ data: buildJobRow('ai_generating'), error: null }],
      maybeSingleResults: [
        {
          data: buildJobRow('ai_generating', {
            processing_token: 'lock-1',
            processing_started_at: '2026-01-01T00:00:01.000Z',
          }),
          error: null,
        },
        {
          data: buildJobRow('validating', {
            progress_message: 'Model code is ready. Now testing model answer on generated testcases.',
            result_payload: { problems: [generatedProblem] },
          }),
          error: null,
        },
      ],
    });

    generateProblemsMock.mockResolvedValue({
      problems: [generatedProblem],
      metadata: {
        generated_at: '2026-01-01T00:00:02.000Z',
        model: 'gemini-test',
      },
    });

    const result = await progressProblemGenerationJob('job-1');

    expect(result?.status).toBe('validating');
    expect(generateProblemsMock).toHaveBeenCalledTimes(1);
  });

  it('transitions to retrying when ai generation fails with retries remaining', async () => {
    installSupabaseQueryMocks({
      singleResults: [{ data: buildJobRow('ai_generating', { retry_count: 0, max_retries: 3 }), error: null }],
      maybeSingleResults: [
        {
          data: buildJobRow('ai_generating', {
            processing_token: 'lock-1',
            processing_started_at: '2026-01-01T00:00:01.000Z',
            retry_count: 0,
            max_retries: 3,
          }),
          error: null,
        },
        {
          data: buildJobRow('retrying', {
            progress_message: 'Generation failed: AI service timeout. Retrying... (Attempt 2/4)',
            error_message: 'AI service timeout',
            retry_count: 1,
            max_retries: 3,
            retry_history: [
              { attempt: 1, stage: 'ai_generating', error: 'AI service timeout', timestamp: '2026-01-01T00:00:01.000Z' },
            ],
          }),
          error: null,
        },
      ],
    });

    generateProblemsMock.mockRejectedValue(new Error('AI service timeout'));

    const result = await progressProblemGenerationJob('job-1');

    expect(result?.status).toBe('retrying');
    expect(result?.retryCount).toBe(1);
    expect(result?.retryHistory).toHaveLength(1);
  });

  it('transitions to error when ai generation fails with all retries exhausted', async () => {
    installSupabaseQueryMocks({
      singleResults: [{ data: buildJobRow('ai_generating', { retry_count: 3, max_retries: 3 }), error: null }],
      maybeSingleResults: [
        {
          data: buildJobRow('ai_generating', {
            processing_token: 'lock-1',
            processing_started_at: '2026-01-01T00:00:01.000Z',
            retry_count: 3,
            max_retries: 3,
          }),
          error: null,
        },
        {
          data: buildJobRow('error', {
            progress_message: 'Generation failed after 4 attempts.',
            error_message: 'Still failing',
            retry_count: 3,
            max_retries: 3,
          }),
          error: null,
        },
      ],
    });

    generateProblemsMock.mockRejectedValue(new Error('Still failing'));

    const result = await progressProblemGenerationJob('job-1');

    expect(result?.status).toBe('error');
    expect(result?.retryCount).toBe(3);
  });

  it('transitions retrying jobs back to ai_generating', async () => {
    const retryHistory: RetryHistoryEntry[] = [
      { attempt: 1, stage: 'ai_generating', error: 'Syntax error', timestamp: '2026-01-01T00:00:01.000Z' },
    ];

    const query = installSupabaseQueryMocks({
      singleResults: [
        {
          data: buildJobRow('retrying', {
            retry_count: 1,
            max_retries: 3,
            retry_history: retryHistory,
          }),
          error: null,
        },
      ],
      maybeSingleResults: [
        {
          data: buildJobRow('ai_generating', {
            retry_count: 1,
            max_retries: 3,
            retry_history: retryHistory,
            progress_message: 'Retrying generation... (Attempt 2/4)',
          }),
          error: null,
        },
      ],
    });

    const result = await progressProblemGenerationJob('job-1');

    expect(result?.status).toBe('ai_generating');
    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'ai_generating',
      })
    );
  });

  it('uses error-context-aware generation when retry history exists', async () => {
    const generatedProblem = buildGeneratedProblem();
    const retryHistory: RetryHistoryEntry[] = [
      { attempt: 1, stage: 'ai_generating', error: 'JSON parse error', timestamp: '2026-01-01T00:00:01.000Z' },
    ];

    installSupabaseQueryMocks({
      singleResults: [
        {
          data: buildJobRow('ai_generating', {
            retry_count: 1,
            max_retries: 3,
            retry_history: retryHistory,
          }),
          error: null,
        },
      ],
      maybeSingleResults: [
        {
          data: buildJobRow('ai_generating', {
            processing_token: 'lock-1',
            processing_started_at: '2026-01-01T00:00:01.000Z',
            retry_count: 1,
            max_retries: 3,
            retry_history: retryHistory,
          }),
          error: null,
        },
        {
          data: buildJobRow('validating', {
            progress_message: 'Model code is ready. Now testing model answer on generated testcases.',
            result_payload: { problems: [generatedProblem] },
          }),
          error: null,
        },
      ],
    });

    generateProblemsWithRetryContextMock.mockResolvedValue({
      problems: [generatedProblem],
      metadata: {
        generated_at: '2026-01-01T00:00:02.000Z',
        model: 'gemini-test',
      },
    });

    const result = await progressProblemGenerationJob('job-1');

    expect(result?.status).toBe('validating');
    expect(generateProblemsWithRetryContextMock).toHaveBeenCalledTimes(1);
    expect(generateProblemsWithRetryContextMock).toHaveBeenCalledWith(
      expect.objectContaining({ topic: 'graphs' }),
      retryHistory
    );
    // Should NOT call the basic generator
    expect(generateProblemsMock).not.toHaveBeenCalled();
  });

  it('falls back to latest snapshot when validating lock cannot be claimed', async () => {
    installSupabaseQueryMocks({
      singleResults: [
        {
          data: buildJobRow('validating', {
            result_payload: { problems: [buildGeneratedProblem()] },
          }),
          error: null,
        },
        {
          data: buildJobRow('completed', {
            result_payload: { problems: [buildGeneratedProblem()] },
          }),
          error: null,
        },
      ],
      maybeSingleResults: [{ data: null, error: null }],
    });

    const result = await progressProblemGenerationJob('job-1');

    expect(result?.status).toBe('completed');
    expect(pistonExecuteMock).not.toHaveBeenCalled();
  });

  it('retries validation failures when retries remain', async () => {
    installSupabaseQueryMocks({
      singleResults: [
        {
          data: buildJobRow('validating', {
            result_payload: { problems: [] },
            retry_count: 0,
            max_retries: 3,
          }),
          error: null,
        },
      ],
      maybeSingleResults: [
        {
          data: buildJobRow('validating', {
            processing_token: 'lock-2',
            processing_started_at: '2026-01-01T00:00:01.000Z',
            result_payload: { problems: [] },
            retry_count: 0,
            max_retries: 3,
          }),
          error: null,
        },
        {
          data: buildJobRow('retrying', {
            progress_message: 'Validation failed. Retrying...',
            error_message: 'Validation could not start because generated problems were missing.',
            retry_count: 1,
            max_retries: 3,
          }),
          error: null,
        },
      ],
    });

    const result = await progressProblemGenerationJob('job-1');

    expect(result?.status).toBe('retrying');
    expect(result?.retryCount).toBe(1);
  });

  it('completes validating jobs when model outputs match testcase expectations', async () => {
    const generatedProblem = buildGeneratedProblem();

    installSupabaseQueryMocks({
      singleResults: [
        {
          data: buildJobRow('validating', {
            result_payload: { problems: [generatedProblem] },
          }),
          error: null,
        },
      ],
      maybeSingleResults: [
        {
          data: buildJobRow('validating', {
            processing_token: 'lock-3',
            processing_started_at: '2026-01-01T00:00:01.000Z',
            result_payload: { problems: [generatedProblem] },
          }),
          error: null,
        },
        {
          data: buildJobRow('completed', {
            progress_message: 'Validation complete. Problems are ready for preview.',
            result_payload: { problems: [generatedProblem] },
            completed_at: '2026-01-01T00:00:03.000Z',
          }),
          error: null,
        },
      ],
    });

    pistonExecuteMock
      .mockResolvedValueOnce({
        compile: null,
        run: { code: 0, stdout: '42\n', stderr: '', output: '42\n' },
      });

    const result = await progressProblemGenerationJob('job-1');

    expect(result).toEqual({
      jobId: 'job-1',
      status: 'completed',
      progressMessage: 'Validation complete. Problems are ready for preview.',
      errorMessage: null,
      problems: [generatedProblem],
      retryCount: 0,
      maxRetries: 3,
      retryHistory: [],
    });
    expect(pistonExecuteMock).toHaveBeenCalledTimes(1);
  });

  it('auto-derives expected output when hidden testcase expected_output is unresolved', async () => {
    const generatedProblem = buildGeneratedProblem();
    // Auto-derivation is Pass 2 behavior — test case must be is_sample: false
    generatedProblem.test_cases[0].is_sample = false;
    generatedProblem.test_cases[0].expected_output = '__AUTO_EXPECTED_OUTPUT__';

    const query = installSupabaseQueryMocks({
      singleResults: [
        {
          data: buildJobRow('validating', {
            result_payload: { problems: [generatedProblem] },
          }),
          error: null,
        },
      ],
      maybeSingleResults: [
        {
          data: buildJobRow('validating', {
            processing_token: 'lock-4',
            processing_started_at: '2026-01-01T00:00:01.000Z',
            result_payload: { problems: [generatedProblem] },
          }),
          error: null,
        },
        {
          data: buildJobRow('completed', {
            progress_message: 'Validation complete. Problems are ready for preview.',
            result_payload: { problems: [generatedProblem] },
            completed_at: '2026-01-01T00:00:03.000Z',
          }),
          error: null,
        },
      ],
    });

    pistonExecuteMock
      .mockResolvedValueOnce({
        compile: null,
        run: { code: 0, stdout: '42\n', stderr: '', output: '42\n' },
      });

    await progressProblemGenerationJob('job-1');

    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
        result_payload: expect.objectContaining({
          problems: expect.arrayContaining([
            expect.objectContaining({
              test_cases: expect.arrayContaining([
                expect.objectContaining({ expected_output: '42' }),
              ]),
            }),
          ]),
        }),
      })
    );
  });

  it('uses full regen with error context for structural (ai_generating stage) retry failures', async () => {
    const generatedProblem = buildGeneratedProblem();
    const retryHistory: RetryHistoryEntry[] = [
      { attempt: 1, stage: 'ai_generating', error: 'JSON parse error', timestamp: '2026-01-01T00:00:01.000Z' },
    ];

    installSupabaseQueryMocks({
      singleResults: [
        {
          data: buildJobRow('ai_generating', {
            retry_count: 1,
            max_retries: 3,
            retry_history: retryHistory,
          }),
          error: null,
        },
      ],
      maybeSingleResults: [
        {
          data: buildJobRow('ai_generating', {
            processing_token: 'lock-1',
            processing_started_at: '2026-01-01T00:00:01.000Z',
            retry_count: 1,
            max_retries: 3,
            retry_history: retryHistory,
          }),
          error: null,
        },
        {
          data: buildJobRow('validating', {
            result_payload: { problems: [generatedProblem] },
          }),
          error: null,
        },
      ],
    });

    generateProblemsWithRetryContextMock.mockResolvedValue({
      problems: [generatedProblem],
      metadata: { generated_at: '2026-01-01T00:00:02.000Z', model: 'gemini-test' },
    });

    const result = await progressProblemGenerationJob('job-1');

    expect(result?.status).toBe('validating');
    // Structural failure => full regen with context, NOT repair
    expect(generateProblemsWithRetryContextMock).toHaveBeenCalledTimes(1);
    expect(repairProblemSolutionCodeMock).not.toHaveBeenCalled();
    expect(generateProblemsMock).not.toHaveBeenCalled();
  });

  it('dispatches targeted solution repair when last retry was a validation failure', async () => {
    const originalProblem = buildGeneratedProblem();
    const repairedProblem = { ...originalProblem, solution_code: 'fixed cpp code' };
    const retryHistory: RetryHistoryEntry[] = [
      {
        attempt: 1,
        stage: 'validating',
        error: 'Model solution failed validation: Problem 1, test case 1: runtime error - SyntaxError',
        timestamp: '2026-01-01T00:00:01.000Z',
      },
    ];

    installSupabaseQueryMocks({
      singleResults: [
        {
          data: buildJobRow('ai_generating', {
            result_payload: { problems: [originalProblem] },
            retry_count: 1,
            max_retries: 3,
            retry_history: retryHistory,
          }),
          error: null,
        },
      ],
      maybeSingleResults: [
        {
          data: buildJobRow('ai_generating', {
            processing_token: 'lock-1',
            processing_started_at: '2026-01-01T00:00:01.000Z',
            result_payload: { problems: [originalProblem] },
            retry_count: 1,
            max_retries: 3,
            retry_history: retryHistory,
          }),
          error: null,
        },
        {
          data: buildJobRow('validating', {
            result_payload: { problems: [repairedProblem] },
          }),
          error: null,
        },
      ],
    });

    repairProblemSolutionCodeMock.mockResolvedValue({
      problems: [repairedProblem],
      metadata: { generated_at: '2026-01-01T00:00:02.000Z', model: 'gemini-test' },
    });

    const result = await progressProblemGenerationJob('job-1');

    expect(result?.status).toBe('validating');
    // Solution failure => targeted repair, NOT full regen
    expect(repairProblemSolutionCodeMock).toHaveBeenCalledTimes(1);
    expect(repairProblemSolutionCodeMock).toHaveBeenCalledWith(
      [originalProblem],
      0,
      retryHistory
    );
    expect(generateProblemsWithRetryContextMock).not.toHaveBeenCalled();
    expect(generateProblemsMock).not.toHaveBeenCalled();
  });

  it('preserves result_payload in db when transitioning to retrying from a validation failure', async () => {
    const originalProblem = buildGeneratedProblem();

    const query = installSupabaseQueryMocks({
      singleResults: [
        {
          data: buildJobRow('validating', {
            result_payload: { problems: [originalProblem] },
            retry_count: 0,
            max_retries: 3,
          }),
          error: null,
        },
      ],
      maybeSingleResults: [
        {
          data: buildJobRow('validating', {
            processing_token: 'lock-2',
            processing_started_at: '2026-01-01T00:00:01.000Z',
            result_payload: { problems: [originalProblem] },
            retry_count: 0,
            max_retries: 3,
          }),
          error: null,
        },
        {
          data: buildJobRow('retrying', {
            error_message: 'runtime error',
            retry_count: 1,
            max_retries: 3,
          }),
          error: null,
        },
      ],
    });

    // Trigger a runtime error during model validation
    pistonExecuteMock.mockResolvedValue({
      compile: { code: 0, stderr: '' },
      run: { code: 1, stdout: '', stderr: 'Error: segmentation fault', output: '' },
    });

    await progressProblemGenerationJob('job-1');

    // Find the update call that sets status to 'retrying'
    const retryingUpdateCall = query.update.mock.calls.find((call: unknown[]) => {
      const payload = call[0] as Record<string, unknown>;
      return payload.status === 'retrying';
    });
    expect(retryingUpdateCall).toBeDefined();
    const updatePayload = (retryingUpdateCall as unknown[])[0] as Record<string, unknown>;
    // result_payload must NOT be wiped — repair path needs the existing problems
    expect(updatePayload).not.toHaveProperty('result_payload');
  });
});
