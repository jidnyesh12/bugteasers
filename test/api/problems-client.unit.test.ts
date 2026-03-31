import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExecutionHttpError } from '@/lib/api/execution-client';
import { generateProblems } from '@/lib/api/problems-client';
import type { GeneratedProblem, ProblemGenerationJobStatusResponse } from '@/lib/ai/types';

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

function buildResponse(payload: unknown, status: number) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
    headers: {
      get: () => null,
    },
    json: async () => payload,
  };
}

function buildGeneratedProblem(): GeneratedProblem {
  return {
    title: 'Two Sum',
    description: 'Find indices that sum to target.',
    difficulty: 'easy',
    tags: ['arrays'],
    constraints: 'n >= 2',
    examples: [
      {
        input: 'nums=[2,7,11,15], target=9',
        output: '[0,1]',
      },
    ],
    hints: ['Use a hash map'],
    time_limit: 2000,
    memory_limit: 256,
    solution_code: 'print(1)',
    test_cases: [
      {
        input_data: '4\n2 7 11 15\n9\n',
        expected_output: '0 1\n',
        is_sample: true,
        points: 1,
      },
    ],
  };
}

describe('Problems API Client - Generation Polling', () => {
  let setTimeoutSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    setTimeoutSpy = vi.spyOn(global, 'setTimeout').mockImplementation(((handler: TimerHandler) => {
      if (typeof handler === 'function') {
        handler();
      }

      return 0 as unknown as ReturnType<typeof setTimeout>;
    }) as unknown as typeof setTimeout);
  });

  afterEach(() => {
    setTimeoutSpy.mockRestore();
  });

  it('retries transient poll HTTP errors and completes when status succeeds', async () => {
    const queuedStatus: ProblemGenerationJobStatusResponse = {
      jobId: 'job-1',
      status: 'queued',
      progressMessage: 'Queued',
    };

    mockFetch
      .mockResolvedValueOnce(buildResponse(queuedStatus, 202))
      .mockResolvedValueOnce(buildResponse({ error: 'Service unavailable' }, 503))
      .mockResolvedValueOnce(
        buildResponse(
          {
            jobId: 'job-1',
            status: 'completed',
            problems: [buildGeneratedProblem()],
          },
          200
        )
      );

    const problems = await generateProblems(
      {
        topic: 'arrays',
        difficulty: 'easy',
        numProblems: 1,
        languages: ['python'],
      },
      {
        pollIntervalMs: 250,
        maxPollAttempts: 5,
      }
    );

    expect(problems).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('does not retry non-transient poll HTTP errors', async () => {
    const queuedStatus: ProblemGenerationJobStatusResponse = {
      jobId: 'job-2',
      status: 'queued',
      progressMessage: 'Queued',
    };

    mockFetch
      .mockResolvedValueOnce(buildResponse(queuedStatus, 202))
      .mockResolvedValueOnce(buildResponse({ error: 'Job not found' }, 404));

    await expect(
      generateProblems(
        {
          topic: 'graphs',
          difficulty: 'medium',
          numProblems: 1,
          languages: ['python'],
        },
        {
          pollIntervalMs: 250,
          maxPollAttempts: 5,
        }
      )
    ).rejects.toMatchObject({
      name: 'ExecutionHttpError',
      status: 404,
      message: 'Job not found',
    } satisfies Partial<ExecutionHttpError>);

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('retries transient network failures during polling', async () => {
    const queuedStatus: ProblemGenerationJobStatusResponse = {
      jobId: 'job-3',
      status: 'queued',
      progressMessage: 'Queued',
    };

    mockFetch
      .mockResolvedValueOnce(buildResponse(queuedStatus, 202))
      .mockRejectedValueOnce(new TypeError('Temporary network error'))
      .mockResolvedValueOnce(
        buildResponse(
          {
            jobId: 'job-3',
            status: 'completed',
            problems: [buildGeneratedProblem()],
          },
          200
        )
      );

    const problems = await generateProblems(
      {
        topic: 'dp',
        difficulty: 'medium',
        numProblems: 1,
        languages: ['python'],
      },
      {
        pollIntervalMs: 250,
        maxPollAttempts: 5,
      }
    );

    expect(problems).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('includes actionable guidance when polling times out', async () => {
    const queuedStatus: ProblemGenerationJobStatusResponse = {
      jobId: 'job-4',
      status: 'queued',
      progressMessage: 'Queued',
    };

    mockFetch
      .mockResolvedValueOnce(buildResponse(queuedStatus, 202))
      .mockResolvedValueOnce(
        buildResponse(
          {
            jobId: 'job-4',
            status: 'validating',
            progressMessage: 'Validating',
          },
          200
        )
      );

    await expect(
      generateProblems(
        {
          topic: 'sorting',
          difficulty: 'easy',
          numProblems: 1,
          languages: ['python'],
        },
        {
          pollIntervalMs: 250,
          maxPollAttempts: 1,
        }
      )
    ).rejects.toThrow(/timed out after around \d+ seconds\. It may still be running;/);
  });
});
