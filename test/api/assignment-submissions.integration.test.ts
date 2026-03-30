import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getAssignmentSubmissions } from '@/app/api/assignments/[id]/submissions/route';

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

vi.mock('@/lib/submissions/service', () => ({
  getAssignmentSubmissionOverview: vi.fn(),
}));

function createAssignmentLookupResult(result: {
  data: { id: string; created_by: string; closed_at: string | null } | null;
  error: { message: string } | null;
}) {
  const single = vi.fn().mockResolvedValue(result);
  const eq = vi.fn().mockReturnValue({ single });
  const select = vi.fn().mockReturnValue({ eq });

  return { select, eq, single };
}

describe('GET /api/assignments/[id]/submissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when the requester is not authenticated', async () => {
    const { getServerSession } = await import('next-auth');
    vi.mocked(getServerSession).mockResolvedValue(null);

    const response = await getAssignmentSubmissions(
      new NextRequest('http://localhost:3000/api/assignments/a-1/submissions', { method: 'GET' }),
      { params: Promise.resolve({ id: 'a-1' }) }
    );

    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 403 when a student requests assignment submissions', async () => {
    const { getServerSession } = await import('next-auth');
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'student-1', email: 'student@example.com', role: 'student' },
      expires: '2099-01-01',
    });

    const response = await getAssignmentSubmissions(
      new NextRequest('http://localhost:3000/api/assignments/a-1/submissions', { method: 'GET' }),
      { params: Promise.resolve({ id: 'a-1' }) }
    );

    const data = await response.json();
    expect(response.status).toBe(403);
    expect(data.error).toContain('Only instructors');
  });

  it('returns 403 when instructor does not own the assignment', async () => {
    const { getServerSession } = await import('next-auth');
    const { supabase } = await import('@/lib/supabase/client');
    const { getAssignmentSubmissionOverview } = await import('@/lib/submissions/service');

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'instructor-1', email: 'inst@example.com', role: 'instructor' },
      expires: '2099-01-01',
    });

    const lookupChain = createAssignmentLookupResult({
      data: { id: 'a-1', created_by: 'instructor-2', closed_at: null },
      error: null,
    });

    vi.mocked(supabase.from).mockReturnValue(lookupChain as unknown as ReturnType<typeof supabase.from>);

    const response = await getAssignmentSubmissions(
      new NextRequest('http://localhost:3000/api/assignments/a-1/submissions', { method: 'GET' }),
      { params: Promise.resolve({ id: 'a-1' }) }
    );

    const data = await response.json();
    expect(response.status).toBe(403);
    expect(data.error).toBe('Access denied');
    expect(getAssignmentSubmissionOverview).not.toHaveBeenCalled();
  });

  it('returns assignment submission overview for the assignment owner', async () => {
    const { getServerSession } = await import('next-auth');
    const { supabase } = await import('@/lib/supabase/client');
    const { getAssignmentSubmissionOverview } = await import('@/lib/submissions/service');

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'instructor-1', email: 'inst@example.com', role: 'instructor' },
      expires: '2099-01-01',
    });

    const lookupChain = createAssignmentLookupResult({
      data: { id: 'a-1', created_by: 'instructor-1', closed_at: null },
      error: null,
    });

    vi.mocked(supabase.from).mockReturnValue(lookupChain as unknown as ReturnType<typeof supabase.from>);

    vi.mocked(getAssignmentSubmissionOverview).mockResolvedValue({
      assignmentId: 'a-1',
      students: [
        { id: 'student-1', fullName: 'Student One', email: 'student-1@example.com' },
      ],
      problems: [
        { id: 'problem-1', title: 'Two Sum', orderIndex: 0 },
      ],
      summaries: [
        {
          studentId: 'student-1',
          problemId: 'problem-1',
          attemptsCount: 2,
          selectedSubmission: {
            id: 'submission-1',
            language: 'python',
            status: 'passed',
            score: 100,
            earnedPoints: 10,
            totalPoints: 10,
            passedCount: 3,
            totalTestCount: 3,
            submittedAt: '2026-03-29T12:00:00.000Z',
            code: 'print(1)',
          },
        },
      ],
    });

    const response = await getAssignmentSubmissions(
      new NextRequest('http://localhost:3000/api/assignments/a-1/submissions', { method: 'GET' }),
      { params: Promise.resolve({ id: 'a-1' }) }
    );

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.submissions.assignmentId).toBe('a-1');
    expect(data.submissions.summaries[0].selectedSubmission.status).toBe('passed');
    expect(getAssignmentSubmissionOverview).toHaveBeenCalledWith(
      expect.objectContaining({ assignmentId: 'a-1' })
    );
  });
});
