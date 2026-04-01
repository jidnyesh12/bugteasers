import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/problems/generate/route';
import { GET } from '@/app/api/problems/generate/[jobId]/route';
import {
  ProblemGenerationConcurrencyLimitError,
  enqueueProblemGenerationJob,
  getProblemGenerationJobForUser,
  progressProblemGenerationJob,
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
    getProblemGenerationJobForUser: vi.fn(),
    progressProblemGenerationJob: vi.fn(),
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

describe('GET /api/problems/generate/[jobId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when session exists but user id is missing', async () => {
    const { getServerSession } = await import('next-auth');

    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'inst@example.com', role: 'instructor' },
      expires: '2026-12-31',
    } as unknown as Awaited<ReturnType<typeof getServerSession>>);

    const request = new NextRequest('http://localhost:3000/api/problems/generate/job-1', {
      method: 'GET',
    });

    const response = await GET(request, { params: Promise.resolve({ jobId: 'job-1' }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 404 when the job does not belong to the current user', async () => {
    const { getServerSession } = await import('next-auth');

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'instructor-1', email: 'inst@example.com', role: 'instructor' },
      expires: '2026-12-31',
    });

    vi.mocked(getProblemGenerationJobForUser).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/problems/generate/job-1', {
      method: 'GET',
    });

    const response = await GET(request, { params: Promise.resolve({ jobId: 'job-1' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Generation job not found');
    expect(getProblemGenerationJobForUser).toHaveBeenCalledWith('job-1', 'instructor-1');
  });

  it('returns progressed job status when progress step updates the job', async () => {
    const { getServerSession } = await import('next-auth');

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'instructor-1', email: 'inst@example.com', role: 'instructor' },
      expires: '2026-12-31',
    });

    vi.mocked(getProblemGenerationJobForUser).mockResolvedValue({
      jobId: 'job-1',
      status: 'queued',
      progressMessage: 'Queued',
      errorMessage: null,
      problems: null,
    });

    vi.mocked(progressProblemGenerationJob).mockResolvedValue({
      jobId: 'job-1',
      status: 'completed',
      progressMessage: 'Completed',
      errorMessage: null,
      problems: [],
    });

    const request = new NextRequest('http://localhost:3000/api/problems/generate/job-1', {
      method: 'GET',
    });

    const response = await GET(request, { params: Promise.resolve({ jobId: 'job-1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      jobId: 'job-1',
      status: 'completed',
      progressMessage: 'Completed',
      problems: [],
      error: null,
    });
    expect(progressProblemGenerationJob).toHaveBeenCalledWith('job-1');
  });

  it('falls back to owned job when progression returns null', async () => {
    const { getServerSession } = await import('next-auth');

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'instructor-1', email: 'inst@example.com', role: 'instructor' },
      expires: '2026-12-31',
    });

    vi.mocked(getProblemGenerationJobForUser).mockResolvedValue({
      jobId: 'job-1',
      status: 'ai_generating',
      progressMessage: 'Generating drafts',
      errorMessage: null,
      problems: null,
    });

    vi.mocked(progressProblemGenerationJob).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/problems/generate/job-1', {
      method: 'GET',
    });

    const response = await GET(request, { params: Promise.resolve({ jobId: 'job-1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      jobId: 'job-1',
      status: 'ai_generating',
      progressMessage: 'Generating drafts',
      problems: null,
      error: null,
    });
  });

  it('returns 500 when progress retrieval fails unexpectedly', async () => {
    const { getServerSession } = await import('next-auth');
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'instructor-1', email: 'inst@example.com', role: 'instructor' },
      expires: '2026-12-31',
    });

    vi.mocked(getProblemGenerationJobForUser).mockResolvedValue({
      jobId: 'job-1',
      status: 'queued',
      progressMessage: 'Queued',
      errorMessage: null,
      problems: null,
    });

    vi.mocked(progressProblemGenerationJob).mockRejectedValue(new Error('database unavailable'));

    const request = new NextRequest('http://localhost:3000/api/problems/generate/job-1', {
      method: 'GET',
    });

    const response = await GET(request, { params: Promise.resolve({ jobId: 'job-1' }) });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch generation job status');
    expect(data.details).toContain('database unavailable');

    consoleErrorSpy.mockRestore();
  });
});
