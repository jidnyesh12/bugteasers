import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  fromMock,
  generateProblemsMock,
  pistonMapLanguageMock,
  pistonExecuteMock,
  normalizeOutputMock,
} = vi.hoisted(() => ({
  fromMock: vi.fn(),
  generateProblemsMock: vi.fn(),
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

vi.mock('@/lib/execution/evaluator', () => ({
  TestCaseEvaluatorImpl: class MockTestCaseEvaluatorImpl {
    normalizeOutput(value: string) {
      return normalizeOutputMock(value);
    }
  },
}));

import { progressProblemGenerationJob } from '@/lib/ai/generation-jobs';
import type { GeneratedProblem } from '@/lib/ai/types';

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
  status: 'queued' | 'ai_generating' | 'validating' | 'completed' | 'discarded' | 'error',
  overrides: Partial<{
    result_payload: { problems?: GeneratedProblem[] } | null;
    progress_message: string | null;
    error_message: string | null;
    processing_token: string | null;
    processing_started_at: string | null;
    completed_at: string | null;
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

  it('returns terminal job summary without attempting a transition', async () => {
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

  it('discards the job when ai generation stage throws', async () => {
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
          data: buildJobRow('discarded', {
            progress_message: 'Generation discarded before validation.',
            error_message: 'AI service timeout',
            completed_at: '2026-01-01T00:00:03.000Z',
          }),
          error: null,
        },
      ],
    });

    generateProblemsMock.mockRejectedValue(new Error('AI service timeout'));

    const result = await progressProblemGenerationJob('job-1');

    expect(result).toEqual({
      jobId: 'job-1',
      status: 'discarded',
      progressMessage: 'Generation discarded before validation.',
      errorMessage: 'AI service timeout',
      problems: null,
    });
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

  it('discards validating jobs that are missing generated payload', async () => {
    installSupabaseQueryMocks({
      singleResults: [{ data: buildJobRow('validating', { result_payload: null }), error: null }],
      maybeSingleResults: [
        {
          data: buildJobRow('validating', {
            processing_token: 'lock-2',
            processing_started_at: '2026-01-01T00:00:01.000Z',
          }),
          error: null,
        },
        {
          data: buildJobRow('discarded', {
            progress_message: 'Generation discarded: missing generated problems payload.',
            error_message: 'Validation could not start because generated problems were missing.',
            completed_at: '2026-01-01T00:00:03.000Z',
          }),
          error: null,
        },
      ],
    });

    const result = await progressProblemGenerationJob('job-1');

    expect(result).toEqual({
      jobId: 'job-1',
      status: 'discarded',
      progressMessage: 'Generation discarded: missing generated problems payload.',
      errorMessage: 'Validation could not start because generated problems were missing.',
      problems: null,
    });
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
        compile: { code: 0, stderr: '' },
        run: { code: 0, stdout: '', stderr: '', output: '' },
      })
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
    });
    expect(pistonExecuteMock).toHaveBeenCalledTimes(2);
  });

  it('auto-derives expected output when testcase expected_output is unresolved', async () => {
    const generatedProblem = buildGeneratedProblem();
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
        compile: { code: 0, stderr: '' },
        run: { code: 0, stdout: '', stderr: '', output: '' },
      })
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
});
