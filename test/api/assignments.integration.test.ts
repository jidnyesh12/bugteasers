import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as listAssignmentsGet } from '@/app/api/assignments/route';

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

describe('Assignments API listing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when requester is unauthenticated', async () => {
    const { getServerSession } = await import('next-auth');

    vi.mocked(getServerSession).mockResolvedValue(null);

    const response = await listAssignmentsGet();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 403 when requester is not an instructor', async () => {
    const { getServerSession } = await import('next-auth');

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'student-1', role: 'student', email: 'student@example.com' },
      expires: '2099-01-01',
    });

    const response = await listAssignmentsGet();
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('Only instructors');
  });

  it('returns transformed assignment list for owning instructor', async () => {
    const { getServerSession } = await import('next-auth');
    const { supabase } = await import('@/lib/supabase/client');

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'instructor-1', role: 'instructor', email: 'inst@example.com' },
      expires: '2099-01-01',
    });

    const orderMock = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'assignment-1',
          title: 'Arrays 101',
          created_by: 'instructor-1',
          assignment_problems: [{ count: 3 }],
          classroom_assignments: [{ count: 2 }],
        },
      ],
      error: null,
    });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'assignments') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: orderMock,
            }),
          }),
        } as unknown as ReturnType<typeof supabase.from>;
      }

      return {} as ReturnType<typeof supabase.from>;
    });

    const response = await listAssignmentsGet();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.assignments).toHaveLength(1);
    expect(data.assignments[0]).toMatchObject({
      id: 'assignment-1',
      problem_count: 3,
      classroom_count: 2,
    });
  });
});
