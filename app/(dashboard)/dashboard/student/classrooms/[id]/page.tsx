'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/auth-context';
import { FullPageLoader } from '@/components/ui/loading';
import type { Assignment } from '@/lib/types';
import { fetchClassroomAssignments, fetchClassrooms } from '@/lib/api/classrooms-client';
import { queryKeys } from '@/lib/state/query';

interface ClassroomAssignment extends Assignment {
  assigned_at: string;
  problem_count: number;
}

interface ClassroomDetails {
  id: string;
  name: string;
}

export default function StudentClassroomDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { profile, loading: authLoading, initialized } = useAuth();
  
  const {
    data: enrolledClassrooms = [],
    isFetching: isClassroomsLoading,
  } = useQuery<{ id: string; classroom: ClassroomDetails }[]>({
    queryKey: queryKeys.classrooms.studentMine,
    queryFn: () => fetchClassrooms<{ id: string; classroom: ClassroomDetails }>(),
    enabled: profile?.role === 'student',
  });

  const {
    data: assignments = [],
    isFetching: isAssignmentsLoading,
  } = useQuery<ClassroomAssignment[]>({
    queryKey: queryKeys.classrooms.assignments(params.id),
    queryFn: () => fetchClassroomAssignments<ClassroomAssignment>(params.id),
    enabled: profile?.role === 'student',
  });

  useEffect(() => {
    if (!initialized || authLoading) return;
    if (!profile) { router.replace('/login'); return; }
    if (profile.role !== 'student') { router.replace('/dashboard/instructor'); return; }
  }, [profile, authLoading, initialized, router]);

  const classroom = enrolledClassrooms.find((item) => item.classroom?.id === params.id)?.classroom ?? null;

  useEffect(() => {
    if (profile?.role !== 'student') {
      return;
    }

    if (!isClassroomsLoading && !classroom) {
      router.replace('/dashboard/student/classrooms');
    }
  }, [classroom, isClassroomsLoading, profile?.role, router]);

  const formatDeadline = (deadline: string, closedAt?: string | null) => {
    const date = new Date(deadline);
    const now = new Date();
    const closedTimestamp = typeof closedAt === 'string' ? Date.parse(closedAt) : Number.NaN;
    const isClosed = Number.isFinite(closedTimestamp) && closedTimestamp <= now.getTime();
    const isOverdue = !isClosed && date < now;
    const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const closedFormatted = isClosed
      ? new Date(closedTimestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : null;

    return { formatted, isOverdue, isClosed, closedFormatted };
  };

  if (!initialized || authLoading || !profile || isClassroomsLoading || isAssignmentsLoading) return <FullPageLoader />;
  if (!classroom) return null;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => router.push('/dashboard/student/classrooms')}
          className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors mb-4 group cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Classrooms
        </button>

        <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)] mb-2">
          {classroom.name}
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">Classroom Assignments</p>
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white border border-[var(--border-primary)] rounded-2xl flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">No assignments</h3>
          <p className="text-sm text-[var(--text-muted)] max-w-xs">
            There are no active assignments for this classroom yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {assignments.map((assignment) => {
            const { formatted, isOverdue, isClosed, closedFormatted } = formatDeadline(
              assignment.deadline,
              assignment.closed_at
            );
            return (
              <div
                key={assignment.id}
                onClick={() => router.push(`/dashboard/student/assignments/${assignment.id}`)}
                className="bg-white border border-[var(--border-primary)] rounded-xl p-5 hover:border-[var(--accent-primary)] transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                        {assignment.title}
                      </h3>
                      {isClosed ? (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wide">
                          Closed
                        </span>
                      ) : isOverdue && (
                        <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wide">
                          Overdue
                        </span>
                      )}
                    </div>
                    {assignment.description && (
                      <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">
                        {assignment.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                      <div className="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="16 18 22 12 16 6" />
                          <polyline points="8 6 2 12 8 18" />
                        </svg>
                        <span>{assignment.problem_count || 0} problem{(assignment.problem_count || 0) !== 1 ? 's' : ''}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {isClosed ? (
                          <span className="text-slate-700 font-semibold">
                            Closed {closedFormatted}
                          </span>
                        ) : (
                          <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>Due {formatted}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
