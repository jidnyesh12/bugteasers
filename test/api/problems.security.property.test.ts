import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as fc from 'fast-check';
import { NextRequest } from 'next/server';
import { POST as runPost } from '@/app/api/problems/[id]/run/route';
import { POST as submitPost } from '@/app/api/problems/[id]/submit/route';

vi.mock('next-auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-auth')>();
  return {
    ...actual,
    default: vi.fn(),
    getServerSession: vi.fn(),
  };
});

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('@/lib/execution', () => ({
  createExecutionService: vi.fn(),
}));

describe('Execution API Security and Validation Properties', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Property 16: authentication is required for execution endpoints', async () => {
    const { getServerSession } = await import('next-auth');
    vi.mocked(getServerSession).mockResolvedValue(null);

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 300 }),
        fc.constantFrom('python', 'java', 'cpp', 'c'),
        async (code, language) => {
          const runRequest = new NextRequest('http://localhost:3000/api/problems/problem-1/run', {
            method: 'POST',
            body: JSON.stringify({ code, language }),
          });

          const submitRequest = new NextRequest('http://localhost:3000/api/problems/problem-1/submit', {
            method: 'POST',
            body: JSON.stringify({ code, language }),
          });

          const runResponse = await runPost(runRequest, { params: Promise.resolve({ id: 'problem-1' }) });
          const submitResponse = await submitPost(submitRequest, { params: Promise.resolve({ id: 'problem-1' }) });

          expect(runResponse.status).toBe(401);
          expect(submitResponse.status).toBe(401);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('Property 17: submit uses authenticated user id, not caller-controlled payload', async () => {
    const { getServerSession } = await import('next-auth');
    const { createExecutionService } = await import('@/lib/execution');
    const { supabase } = await import('@/lib/supabase/client');

    const mockFrom = vi.fn((table: string) => {
      if (table === 'problems') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: 'problem-1' }, error: null }),
            }),
          }),
        };
      }

      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      };
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom as unknown as typeof supabase.from);

    await fc.assert(
      fc.asyncProperty(fc.uuid(), fc.uuid(), async (sessionUserId, spoofedUserId) => {
        vi.mocked(getServerSession).mockResolvedValue({
          user: { id: sessionUserId, email: 'test@example.com', role: 'student' },
          expires: '2099-01-01',
        });

        const mockSubmitCode = vi.fn().mockResolvedValue({
          submissionId: 'submission-1',
          results: [],
          score: {
            totalPoints: 0,
            earnedPoints: 0,
            percentage: 0,
            status: 'failed',
          },
        });

        vi.mocked(createExecutionService).mockReturnValue({
          runCode: vi.fn(),
          submitCode: mockSubmitCode,
        });

        const request = new NextRequest('http://localhost:3000/api/problems/problem-1/submit', {
          method: 'POST',
          body: JSON.stringify({
            code: 'print(1)',
            language: 'python',
            userId: spoofedUserId,
          }),
        });

        const response = await submitPost(request, { params: Promise.resolve({ id: 'problem-1' }) });
        expect(response.status).toBe(200);
        expect(mockSubmitCode).toHaveBeenCalledWith(
          expect.any(Object),
          sessionUserId
        );
      }),
      { numRuns: 15 }
    );
  });

  it('Property 18: input validation rejects code larger than 10,000 characters', async () => {
    const { getServerSession } = await import('next-auth');
    const { createExecutionService } = await import('@/lib/execution');
    const { supabase } = await import('@/lib/supabase/client');

    const mockFrom = vi.fn((table: string) => {
      if (table === 'problems') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: 'problem-1' }, error: null }),
            }),
          }),
        };
      }

      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      };
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom as unknown as typeof supabase.from);

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com', role: 'student' },
      expires: '2099-01-01',
    });

    vi.mocked(createExecutionService).mockReturnValue({
      runCode: vi.fn().mockResolvedValue({
        results: [],
        score: {
          totalPoints: 0,
          earnedPoints: 0,
          percentage: 0,
          status: 'failed',
        },
      }),
      submitCode: vi.fn().mockResolvedValue({
        submissionId: 'submission-1',
        results: [],
        score: {
          totalPoints: 0,
          earnedPoints: 0,
          percentage: 0,
          status: 'failed',
        },
      }),
    });

    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 10001, maxLength: 10020 }), async largeCode => {
        const runRequest = new NextRequest('http://localhost:3000/api/problems/problem-1/run', {
          method: 'POST',
          body: JSON.stringify({ code: largeCode, language: 'python' }),
        });

        const submitRequest = new NextRequest('http://localhost:3000/api/problems/problem-1/submit', {
          method: 'POST',
          body: JSON.stringify({ code: largeCode, language: 'python' }),
        });

        const runResponse = await runPost(runRequest, { params: Promise.resolve({ id: 'problem-1' }) });
        const submitResponse = await submitPost(submitRequest, { params: Promise.resolve({ id: 'problem-1' }) });

        expect(runResponse.status).toBe(400);
        expect(submitResponse.status).toBe(400);
      }),
      { numRuns: 5 }
    );
  });

  it('should return 429 with Retry-After header when submit rate limit is exceeded', async () => {
    const { getServerSession } = await import('next-auth');
    const { createExecutionService } = await import('@/lib/execution');
    const { supabase } = await import('@/lib/supabase/client');

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'rate-limit-student', email: 'test@example.com', role: 'student' },
      expires: '2099-01-01',
    });

    const mockFrom = vi.fn((table: string) => {
      if (table === 'problems') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: 'problem-1' }, error: null }),
            }),
          }),
        };
      }

      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [{ id: 'ok' }], error: null }),
          }),
        }),
      };
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom as unknown as typeof supabase.from);

    vi.mocked(createExecutionService).mockReturnValue({
      runCode: vi.fn(),
      submitCode: vi.fn().mockResolvedValue({
        submissionId: 'submission-1',
        results: [],
        score: { totalPoints: 0, earnedPoints: 0, percentage: 0, status: 'failed' },
      }),
    });

    let finalResponse = await submitPost(
      new NextRequest('http://localhost:3000/api/problems/problem-1/submit', {
        method: 'POST',
        body: JSON.stringify({ code: 'print(1)', language: 'python' }),
      }),
      { params: Promise.resolve({ id: 'problem-1' }) }
    );

    for (let i = 0; i < 5; i++) {
      finalResponse = await submitPost(
        new NextRequest('http://localhost:3000/api/problems/problem-1/submit', {
          method: 'POST',
          body: JSON.stringify({ code: 'print(1)', language: 'python' }),
        }),
        { params: Promise.resolve({ id: 'problem-1' }) }
      );
    }

    expect(finalResponse.status).toBe(429);
    expect(finalResponse.headers.get('Retry-After')).toBeTruthy();
  });

  it('should return 403 when assignment-scoped submit is not accessible by the student', async () => {
    const { getServerSession } = await import('next-auth');
    const { createExecutionService } = await import('@/lib/execution');
    const { supabase } = await import('@/lib/supabase/client');

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'student-1', email: 'test@example.com', role: 'student' },
      expires: '2099-01-01',
    });

    const mockFrom = vi.fn((table: string) => {
      if (table === 'problems') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: 'problem-1' }, error: null }),
            }),
          }),
        };
      }

      if (table === 'assignment_problems') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        };
      }

      if (table === 'classroom_assignments') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        };
      }

      if (table === 'classroom_students') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        };
      }

      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      };
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom as unknown as typeof supabase.from);

    const mockSubmitCode = vi.fn().mockResolvedValue({
      submissionId: 'submission-1',
      results: [],
      score: { totalPoints: 0, earnedPoints: 0, percentage: 0, status: 'failed' },
    });

    vi.mocked(createExecutionService).mockReturnValue({
      runCode: vi.fn(),
      submitCode: mockSubmitCode,
    });

    const request = new NextRequest('http://localhost:3000/api/problems/problem-1/submit', {
      method: 'POST',
      body: JSON.stringify({
        code: 'print(1)',
        language: 'python',
        assignmentId: 'assignment-1',
      }),
    });

    const response = await submitPost(request, { params: Promise.resolve({ id: 'problem-1' }) });
    expect(response.status).toBe(403);
  });
});
