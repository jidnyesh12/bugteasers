import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/problems/generate/route';
import {
  ProblemGenerationConcurrencyLimitError,
  enqueueProblemGenerationJob,
} from '@/lib/ai/generation-jobs';

vi.mock('next-auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-auth')>();
  return {
    ...actual,
    default: vi.fn(),
    getServerSession: vi.fn(),
  };
});

vi.mock('@/lib/env', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/env')>();
  return {
    ...actual,
    GEMINI_API_KEY: 'test-gemini-key',
  };
});

vi.mock('@/lib/ai/generation-jobs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/ai/generation-jobs')>();
  return {
    ...actual,
    enqueueProblemGenerationJob: vi.fn(),
  };
});

describe('POST /api/problems/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 429 when user already has too many active generation jobs', async () => {
    const { getServerSession } = await import('next-auth');

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'instructor-1', email: 'inst@example.com', role: 'instructor' },
      expires: '2026-12-31',
    });

    vi.mocked(enqueueProblemGenerationJob).mockRejectedValue(
      new ProblemGenerationConcurrencyLimitError('Too many active generation jobs for this user')
    );

    const request = new NextRequest('http://localhost:3000/api/problems/generate', {
      method: 'POST',
      body: JSON.stringify({
        topic: 'graphs',
        difficulty: 'medium',
        numProblems: 1,
        languages: ['python'],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toContain('active generation jobs');
  });

  it('returns 401 when session exists but user id is missing', async () => {
    const { getServerSession } = await import('next-auth');

    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'inst@example.com', role: 'instructor' },
      expires: '2026-12-31',
    } as unknown as Awaited<ReturnType<typeof getServerSession>>);

    const request = new NextRequest('http://localhost:3000/api/problems/generate', {
      method: 'POST',
      body: JSON.stringify({
        topic: 'graphs',
        difficulty: 'medium',
        numProblems: 1,
        languages: ['python'],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns a full generation status payload when enqueue succeeds', async () => {
    const { getServerSession } = await import('next-auth');

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'instructor-1', email: 'inst@example.com', role: 'instructor' },
      expires: '2026-12-31',
    });

    vi.mocked(enqueueProblemGenerationJob).mockResolvedValue({
      jobId: 'job-1',
      status: 'queued',
      progressMessage: 'Generation job queued. Preparing model draft.',
      errorMessage: null,
      problems: null,
    });

    const request = new NextRequest('http://localhost:3000/api/problems/generate', {
      method: 'POST',
      body: JSON.stringify({
        topic: 'arrays',
        difficulty: 'easy',
        numProblems: 1,
        languages: ['python'],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(202);
    expect(data).toEqual({
      jobId: 'job-1',
      status: 'queued',
      progressMessage: 'Generation job queued. Preparing model draft.',
      problems: null,
      error: null,
    });
  });
});
