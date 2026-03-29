import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getProblemSubmissions } from '@/app/api/problems/[id]/submissions/route';
import { ExecutionForbiddenError } from '@/lib/execution/errors';

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

vi.mock('@/lib/execution/access', () => ({
  assertExecutionAccess: vi.fn(),
}));

interface QueryResult {
  data: unknown;
  error: { message: string } | null;
}

function createSubmissionQueryMock(result: QueryResult) {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
  };

  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.limit.mockResolvedValue(result);

  return chain;
}

describe('GET /api/problems/[id]/submissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    const { getServerSession } = await import('next-auth');
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/problems/problem-1/submissions', {
      method: 'GET',
    });

    const response = await getProblemSubmissions(request, {
      params: Promise.resolve({ id: 'problem-1' }),
    });

    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns transformed submission history for authenticated student', async () => {
    const { getServerSession } = await import('next-auth');
    const { supabase } = await import('@/lib/supabase/client');
    const { assertExecutionAccess } = await import('@/lib/execution/access');

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'student-1', email: 'test@example.com', role: 'student' },
      expires: '2099-01-01',
    });
    vi.mocked(assertExecutionAccess).mockResolvedValue(undefined);

    const query = createSubmissionQueryMock({
      data: [
        {
          id: 'submission-1',
          language: 'python',
          status: 'passed',
          score: '87.5',
          earned_points: '7',
          total_points: 8,
          submitted_at: '2026-03-29T12:00:00.000Z',
          code: 'print(1)',
          test_results: [{ passed: true }, { passed: false }, { other: 'x' }],
        },
        {
          id: 'submission-2',
          language: 'cpp',
          status: 'unknown-status',
          score: null,
          earned_points: null,
          total_points: null,
          submitted_at: '2026-03-29T10:00:00.000Z',
          code: 'int main() {}',
          test_results: null,
        },
      ],
      error: null,
    });

    vi.mocked(supabase.from).mockReturnValue(query as unknown as ReturnType<typeof supabase.from>);

    const request = new NextRequest('http://localhost:3000/api/problems/problem-1/submissions', {
      method: 'GET',
    });

    const response = await getProblemSubmissions(request, {
      params: Promise.resolve({ id: 'problem-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.submissions).toHaveLength(2);
    expect(data.submissions[0]).toEqual({
      id: 'submission-1',
      language: 'python',
      status: 'passed',
      score: 87.5,
      earnedPoints: 7,
      totalPoints: 8,
      passedCount: 1,
      totalTestCount: 3,
      submittedAt: '2026-03-29T12:00:00.000Z',
      code: 'print(1)',
    });
    expect(data.submissions[1]?.status).toBe('error');
    expect(data.submissions[1]?.passedCount).toBe(0);
    expect(data.submissions[1]?.totalTestCount).toBe(0);

    expect(assertExecutionAccess).toHaveBeenCalledWith(
      expect.objectContaining({
        problemId: 'problem-1',
        userId: 'student-1',
        assignmentId: undefined,
      })
    );

    expect(query.eq).toHaveBeenCalledWith('problem_id', 'problem-1');
    expect(query.eq).toHaveBeenCalledWith('student_id', 'student-1');
    expect(query.order).toHaveBeenCalledWith('submitted_at', { ascending: false });
    expect(query.limit).toHaveBeenCalledWith(50);
  });

  it('applies assignmentId filter when query param is provided', async () => {
    const { getServerSession } = await import('next-auth');
    const { supabase } = await import('@/lib/supabase/client');
    const { assertExecutionAccess } = await import('@/lib/execution/access');

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'student-1', email: 'test@example.com', role: 'student' },
      expires: '2099-01-01',
    });
    vi.mocked(assertExecutionAccess).mockResolvedValue(undefined);

    const query = createSubmissionQueryMock({ data: [], error: null });
    vi.mocked(supabase.from).mockReturnValue(query as unknown as ReturnType<typeof supabase.from>);

    const request = new NextRequest('http://localhost:3000/api/problems/problem-1/submissions?assignmentId=assignment-1', {
      method: 'GET',
    });

    const response = await getProblemSubmissions(request, {
      params: Promise.resolve({ id: 'problem-1' }),
    });

    expect(response.status).toBe(200);
    expect(query.eq).toHaveBeenCalledWith('assignment_id', 'assignment-1');
    expect(assertExecutionAccess).toHaveBeenCalledWith(
      expect.objectContaining({ assignmentId: 'assignment-1' })
    );
  });

  it('returns 403 when access check fails', async () => {
    const { getServerSession } = await import('next-auth');
    const { assertExecutionAccess } = await import('@/lib/execution/access');

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'student-1', email: 'test@example.com', role: 'student' },
      expires: '2099-01-01',
    });
    vi.mocked(assertExecutionAccess).mockRejectedValue(new ExecutionForbiddenError('Access denied'));

    const request = new NextRequest('http://localhost:3000/api/problems/problem-1/submissions', {
      method: 'GET',
    });

    const response = await getProblemSubmissions(request, {
      params: Promise.resolve({ id: 'problem-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Access denied');
  });

  it('returns 500 when database query fails', async () => {
    const { getServerSession } = await import('next-auth');
    const { supabase } = await import('@/lib/supabase/client');
    const { assertExecutionAccess } = await import('@/lib/execution/access');

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'student-1', email: 'test@example.com', role: 'student' },
      expires: '2099-01-01',
    });
    vi.mocked(assertExecutionAccess).mockResolvedValue(undefined);

    const query = createSubmissionQueryMock({
      data: null,
      error: { message: 'database unavailable' },
    });
    vi.mocked(supabase.from).mockReturnValue(query as unknown as ReturnType<typeof supabase.from>);

    const request = new NextRequest('http://localhost:3000/api/problems/problem-1/submissions', {
      method: 'GET',
    });

    const response = await getProblemSubmissions(request, {
      params: Promise.resolve({ id: 'problem-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Failed to fetch submissions');
  });
});
