import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  POST as assignPost,
  DELETE as unassignDelete,
} from '@/app/api/assignments/[id]/assign/route';

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

describe('Assignment classroom mapping API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 for unauthenticated assignment->classroom mapping request', async () => {
    const { getServerSession } = await import('next-auth');
    vi.mocked(getServerSession).mockResolvedValue(null);

    const response = await assignPost(
      new NextRequest('http://localhost:3000/api/assignments/a-1/assign', {
        method: 'POST',
        body: JSON.stringify({ classroom_ids: ['c-1'] }),
      }),
      { params: Promise.resolve({ id: 'a-1' }) }
    );

    expect(response.status).toBe(401);
  });

  it('assigns assignment to classrooms for owning instructor', async () => {
    const { getServerSession } = await import('next-auth');
    const { supabase } = await import('@/lib/supabase/client');

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'instructor-1', role: 'instructor', email: 'inst@example.com' },
      expires: '2099-01-01',
    });

    const assignmentSingle = vi.fn().mockResolvedValue({
      data: { created_by: 'instructor-1' },
      error: null,
    });

    const classroomsEq = vi.fn().mockResolvedValue({
      data: [{ id: 'c-1' }, { id: 'c-2' }],
      error: null,
    });

    const upsertMock = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'assignments') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: assignmentSingle,
            }),
          }),
        } as unknown as ReturnType<typeof supabase.from>;
      }

      if (table === 'classrooms') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              eq: classroomsEq,
            }),
          }),
        } as unknown as ReturnType<typeof supabase.from>;
      }

      if (table === 'classroom_assignments') {
        return {
          upsert: upsertMock,
        } as unknown as ReturnType<typeof supabase.from>;
      }

      return {} as ReturnType<typeof supabase.from>;
    });

    const response = await assignPost(
      new NextRequest('http://localhost:3000/api/assignments/a-1/assign', {
        method: 'POST',
        body: JSON.stringify({ classroom_ids: ['c-1', 'c-2'] }),
      }),
      { params: Promise.resolve({ id: 'a-1' }) }
    );

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(upsertMock).toHaveBeenCalledTimes(1);
  });

  it('unassigns assignment from classroom for owning instructor', async () => {
    const { getServerSession } = await import('next-auth');
    const { supabase } = await import('@/lib/supabase/client');

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'instructor-1', role: 'instructor', email: 'inst@example.com' },
      expires: '2099-01-01',
    });

    const assignmentSingle = vi.fn().mockResolvedValue({
      data: { created_by: 'instructor-1' },
      error: null,
    });

    const classroomSingle = vi.fn().mockResolvedValue({
      data: { instructor_id: 'instructor-1' },
      error: null,
    });

    const deleteEq2 = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'assignments') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: assignmentSingle,
            }),
          }),
        } as unknown as ReturnType<typeof supabase.from>;
      }

      if (table === 'classroom_assignments') {
        return {
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: deleteEq2,
            }),
          }),
        } as unknown as ReturnType<typeof supabase.from>;
      }

      if (table === 'classrooms') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: classroomSingle,
            }),
          }),
        } as unknown as ReturnType<typeof supabase.from>;
      }

      return {} as ReturnType<typeof supabase.from>;
    });

    const response = await unassignDelete(
      new NextRequest('http://localhost:3000/api/assignments/a-1/assign?classroom_id=c-1', {
        method: 'DELETE',
      }),
      { params: Promise.resolve({ id: 'a-1' }) }
    );

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('returns 404 when instructor does not own classroom during unassign', async () => {
    const { getServerSession } = await import('next-auth');
    const { supabase } = await import('@/lib/supabase/client');

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'instructor-1', role: 'instructor', email: 'inst@example.com' },
      expires: '2099-01-01',
    });

    const assignmentSingle = vi.fn().mockResolvedValue({
      data: { created_by: 'instructor-1' },
      error: null,
    });

    const classroomSingle = vi.fn().mockResolvedValue({
      data: { instructor_id: 'instructor-2' },
      error: null,
    });

    const deleteEq2 = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'assignments') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: assignmentSingle,
            }),
          }),
        } as unknown as ReturnType<typeof supabase.from>;
      }

      if (table === 'classrooms') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: classroomSingle,
            }),
          }),
        } as unknown as ReturnType<typeof supabase.from>;
      }

      if (table === 'classroom_assignments') {
        return {
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: deleteEq2,
            }),
          }),
        } as unknown as ReturnType<typeof supabase.from>;
      }

      return {} as ReturnType<typeof supabase.from>;
    });

    const response = await unassignDelete(
      new NextRequest('http://localhost:3000/api/assignments/a-1/assign?classroom_id=c-1', {
        method: 'DELETE',
      }),
      { params: Promise.resolve({ id: 'a-1' }) }
    );

    const data = await response.json();
    expect(response.status).toBe(404);
    expect(data.error).toBe('Classroom not found');
    expect(deleteEq2).not.toHaveBeenCalled();
  });
});
