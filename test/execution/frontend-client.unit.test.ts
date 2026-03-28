import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  runProblemCode,
  submitProblemCode,
} from '@/lib/api/execution-client';

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe('Execution Frontend Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts run requests and returns parsed response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [],
        score: {
          totalPoints: 10,
          earnedPoints: 10,
          percentage: 100,
          status: 'passed',
        },
      }),
    });

    const response = await runProblemCode({
      problemId: 'problem-1',
      code: 'print(1)',
      language: 'python',
    });

    expect(response.score.status).toBe('passed');
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/problems/problem-1/run',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('posts submit requests and includes assignmentId when provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        submissionId: 'submission-1',
        results: [],
        score: {
          totalPoints: 10,
          earnedPoints: 5,
          percentage: 50,
          status: 'partial',
        },
      }),
    });

    const response = await submitProblemCode({
      problemId: 'problem-1',
      code: 'print(1)',
      language: 'python',
      assignmentId: 'assignment-1',
    });

    expect(response.submissionId).toBe('submission-1');
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/problems/problem-1/submit',
      expect.objectContaining({
        body: JSON.stringify({
          code: 'print(1)',
          language: 'python',
          assignmentId: 'assignment-1',
        }),
      })
    );
  });

  it('throws typed ExecutionHttpError for non-OK responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      headers: {
        get: () => null,
      },
      json: async () => ({
        error: 'Access denied',
      }),
    });

    await expect(
      runProblemCode({
        problemId: 'problem-1',
        code: 'print(1)',
        language: 'python',
      })
    ).rejects.toMatchObject({
      name: 'ExecutionHttpError',
      status: 403,
      message: 'Access denied',
    });
  });

  it('captures Retry-After on rate-limited responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      headers: {
        get: (key: string) => (key === 'Retry-After' ? '12' : null),
      },
      json: async () => ({ error: 'Too Many Requests' }),
    });

    await expect(
      submitProblemCode({
        problemId: 'problem-1',
        code: 'print(1)',
        language: 'python',
      })
    ).rejects.toMatchObject({
      name: 'ExecutionHttpError',
      status: 429,
      retryAfterSeconds: 12,
    });
  });
});
