'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { FullPageLoader } from '@/components/ui/loading';
import type { Assignment } from '@/lib/types';

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
  
  const [classroom, setClassroom] = useState<ClassroomDetails | null>(null);
  const [assignments, setAssignments] = useState<ClassroomAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!initialized || authLoading) return;
    if (!profile) { router.replace('/login'); return; }
    if (profile.role !== 'student') { router.replace('/dashboard/instructor'); return; }
  }, [profile, authLoading, initialized, router]);

  useEffect(() => {
    if (profile?.role === 'student') {
      loadClassroomData();
    }
  }, [profile?.role, params.id]); // eslint-disable-line react-hooks/exhaustive-deps -- loadClassroomData reads params.id

  const loadClassroomData = async () => {
    try {
      setIsLoading(true);
      // We need classroom details to verify access and show name
      // The student can only view if enrolled.
      // Using the students API I created earlier: GET /api/classrooms/[id]/students checks enrollment
      // But that returns students list which student shouldn't see potentially (or maybe they can).
      // Let's rely on assignments endpoint which checks enrollment.
      // And I need a way to get just the classroom name safely.
      // I'll assume the assignments endpoint or a new safe-details endpoint provides it.
      // Actually, I can fetch from /api/classrooms which lists enrolled ones and find it there.
      
      const [classroomsRes, assignmentsRes] = await Promise.all([
        fetch('/api/classrooms'), // Lists enrolled classrooms
        fetch(`/api/classrooms/${params.id}/assignments`)
      ]);

      if (classroomsRes.ok) {
        const data = await classroomsRes.json();
        const enrolled = data.classrooms?.find((c: { classroom: { id: string } }) => c.classroom.id === params.id);
        if (enrolled) {
          setClassroom(enrolled.classroom);
        } else {
          // Not found in enrolled list -> access denied or invalid ID
          router.replace('/dashboard/student/classrooms');
          return;
        }
      }

      if (assignmentsRes.ok) {
        const data = await assignmentsRes.json();
        setAssignments(data.assignments || []);
      }

    } catch (error) {
      console.error('Error loading classroom data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    const now = new Date();
    const isOverdue = date < now;
    const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return { formatted, isOverdue };
  };

  if (!initialized || authLoading || !profile || isLoading) return <FullPageLoader />;
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
            const { formatted, isOverdue } = formatDeadline(assignment.deadline);
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
                      {isOverdue && (
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
                        <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>Due {formatted}</span>
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
