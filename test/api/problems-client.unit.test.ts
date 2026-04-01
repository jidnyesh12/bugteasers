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

  it('fails immediately when initial generation status is discarded', async () => {
    const discardedStatus: ProblemGenerationJobStatusResponse = {
      jobId: 'job-discarded',
      status: 'discarded',
      progressMessage: 'Validation failed',
      error: 'Model output mismatch',
    };

    mockFetch.mockResolvedValueOnce(buildResponse(discardedStatus, 200));

    await expect(
      generateProblems(
        {
          topic: 'math',
          difficulty: 'hard',
          numProblems: 1,
          languages: ['python'],
        },
        {
          pollIntervalMs: 250,
          maxPollAttempts: 5,
        }
      )
    ).rejects.toThrow('Model output mismatch');

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('stops retrying after transient network failures exceed retry cap', async () => {
    const queuedStatus: ProblemGenerationJobStatusResponse = {
      jobId: 'job-network-cap',
      status: 'queued',
      progressMessage: 'Queued',
    };

    mockFetch
      .mockResolvedValueOnce(buildResponse(queuedStatus, 202))
      .mockRejectedValueOnce(new TypeError('Temporary network issue #1'))
      .mockRejectedValueOnce(new TypeError('Temporary network issue #2'))
      .mockRejectedValueOnce(new TypeError('Temporary network issue #3'))
      .mockRejectedValueOnce(new TypeError('Temporary network issue #4'));

    await expect(
      generateProblems(
        {
          topic: 'strings',
          difficulty: 'medium',
          numProblems: 1,
          languages: ['python'],
        },
        {
          pollIntervalMs: 250,
          maxPollAttempts: 10,
        }
      )
    ).rejects.toThrow('Temporary network issue #4');

    expect(mockFetch).toHaveBeenCalledTimes(5);
  });

  it('calls onStatus for initial and each successful polled status update', async () => {
    const onStatus = vi.fn();

    mockFetch
      .mockResolvedValueOnce(
        buildResponse(
          {
            jobId: 'job-status-callback',
            status: 'queued',
            progressMessage: 'Queued',
          },
          202
        )
      )
      .mockResolvedValueOnce(
        buildResponse(
          {
            jobId: 'job-status-callback',
            status: 'validating',
            progressMessage: 'Validating testcase outputs',
          },
          200
        )
      )
      .mockResolvedValueOnce(
        buildResponse(
          {
            jobId: 'job-status-callback',
            status: 'completed',
            progressMessage: 'Done',
            problems: [buildGeneratedProblem()],
          },
          200
        )
      );

    const result = await generateProblems(
      {
        topic: 'trees',
        difficulty: 'medium',
        numProblems: 1,
        languages: ['python'],
      },
      {
        onStatus,
        pollIntervalMs: 250,
        maxPollAttempts: 5,
      }
    );

    expect(result).toHaveLength(1);
    expect(onStatus).toHaveBeenCalledTimes(3);
    expect(onStatus).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ status: 'queued', jobId: 'job-status-callback' })
    );
    expect(onStatus).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ status: 'validating', jobId: 'job-status-callback' })
    );
    expect(onStatus).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ status: 'completed', jobId: 'job-status-callback' })
    );
  });

  it('uses bounded increasing poll delays across attempts', async () => {
    const mathRandomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

    mockFetch
      .mockResolvedValueOnce(
        buildResponse(
          {
            jobId: 'job-delay-shape',
            status: 'queued',
            progressMessage: 'Queued',
          },
          202
        )
      )
      .mockResolvedValueOnce(
        buildResponse(
          {
            jobId: 'job-delay-shape',
            status: 'validating',
            progressMessage: 'Validating',
          },
          200
        )
      )
      .mockResolvedValueOnce(
        buildResponse(
          {
            jobId: 'job-delay-shape',
            status: 'completed',
            progressMessage: 'Done',
            problems: [buildGeneratedProblem()],
          },
          200
        )
      );

    await generateProblems(
      {
        topic: 'graphs',
        difficulty: 'easy',
        numProblems: 1,
        languages: ['python'],
      },
      {
        pollIntervalMs: 250,
        maxPollAttempts: 5,
      }
    );

    const sleepDelays = setTimeoutSpy.mock.calls.map((call: Parameters<typeof setTimeout>) =>
      Number(call[1] ?? 0)
    );
    expect(sleepDelays.length).toBeGreaterThanOrEqual(2);
    expect(sleepDelays[0]).toBeGreaterThanOrEqual(250);
    expect(sleepDelays[1]).toBeGreaterThanOrEqual(sleepDelays[0]);
    expect(sleepDelays[1]).toBeLessThanOrEqual(5000);

    mathRandomSpy.mockRestore();
  });
});
