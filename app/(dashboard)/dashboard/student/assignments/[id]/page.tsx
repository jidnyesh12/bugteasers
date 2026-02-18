'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { FullPageLoader } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import type { Assignment } from '@/lib/types';

interface Problem {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  order_index: number;
}

interface AssignmentDetails extends Assignment {
  problems: Problem[];
}

const difficultyStyles = {
  easy: 'flat-badge-green',
  medium: 'flat-badge-amber',
  hard: 'flat-badge-red',
};

export default function StudentAssignmentDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { profile, loading: authLoading, initialized } = useAuth();
  const { toast } = useToast();
  
  const [assignment, setAssignment] = useState<AssignmentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!initialized || authLoading) return;
    if (!profile) { router.replace('/login'); return; }
    if (profile.role !== 'student') { router.replace('/dashboard/instructor'); return; }
  }, [profile, authLoading, initialized, router]);

  useEffect(() => {
    if (profile?.role === 'student') {
      loadAssignment();
    }
  }, [profile?.role, params.id]);

  const loadAssignment = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/assignments/${params.id}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load assignment');
      }
      
      setAssignment(data.assignment);
    } catch (error) {
      console.error('Error loading assignment:', error);
      toast('Failed to load assignment', 'error');
      router.push('/dashboard/student/classrooms');
    } finally {
      setIsLoading(false);
    }
  };

  if (!initialized || authLoading || !profile || isLoading) return <FullPageLoader />;
  if (!assignment) return null;

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors mb-4 group cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Classroom
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)] mb-2">
              {assignment.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
              <span className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Due {new Date(assignment.deadline).toLocaleDateString()}
              </span>
              <span>•</span>
              <span>{assignment.problems.length} problems</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Description */}
        {assignment.description && (
          <div className="bg-white border border-[var(--border-primary)] rounded-2xl p-6">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">Instructions</h3>
            <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
              {assignment.description}
            </p>
          </div>
        )}

        {/* Problems List */}
        <div className="bg-white border border-[var(--border-primary)] rounded-2xl p-6">
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">Problems</h3>
          <div className="space-y-3">
            {assignment.problems.map((problem, index) => (
              <div
                key={problem.id}
                onClick={() => router.push(`/dashboard/student/solve/${problem.id}`)}
                className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)] hover:bg-white transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-[var(--border-primary)] font-bold text-sm text-[var(--text-muted)] shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors truncate">
                    {problem.title}
                  </h4>
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    {problem.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] bg-white px-1.5 py-0.5 rounded border border-[var(--border-primary)]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <span className={`flat-badge ${difficultyStyles[problem.difficulty]} shrink-0`}>
                  {problem.difficulty}
                </span>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-primary)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  Solve
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
