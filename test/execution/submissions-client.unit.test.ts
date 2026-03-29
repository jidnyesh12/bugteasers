import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchProblemSubmissions } from '@/lib/api/submissions-client';

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe('Submissions Frontend Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches submission history and returns parsed submissions', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        submissions: [
          {
            id: 'submission-1',
            language: 'python',
            status: 'passed',
            score: 100,
            earnedPoints: 10,
            totalPoints: 10,
            passedCount: 2,
            totalTestCount: 2,
            submittedAt: '2026-03-29T10:00:00.000Z',
            code: 'print(1)',
          },
        ],
      }),
    });

    const response = await fetchProblemSubmissions({
      problemId: 'problem-1',
      assignmentId: 'assignment-1',
    });

    expect(response).toHaveLength(1);
    expect(response[0]?.id).toBe('submission-1');
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/problems/problem-1/submissions?assignmentId=assignment-1',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('returns an empty list when submission payload shape is malformed', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ foo: 'bar' }),
    });

    const response = await fetchProblemSubmissions({ problemId: 'problem-1' });
    expect(response).toEqual([]);
  });

  it('throws typed ExecutionHttpError when submission history request fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      headers: {
        get: () => null,
      },
      json: async () => ({
        error: 'Failed to fetch submissions',
      }),
    });

    await expect(
      fetchProblemSubmissions({ problemId: 'problem-1' })
    ).rejects.toMatchObject({
      name: 'ExecutionHttpError',
      status: 500,
      message: 'Failed to fetch submissions',
    });
  });
});