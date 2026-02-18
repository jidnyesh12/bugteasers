'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { FullPageLoader } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import type { Assignment, Classroom } from '@/lib/types';

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

export default function AssignmentDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { profile, loading: authLoading, initialized } = useAuth();
  const { toast } = useToast();
  const [assignment, setAssignment] = useState<AssignmentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Assign Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassrooms, setSelectedClassrooms] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);

  useEffect(() => {
    if (!initialized || authLoading) return;
    if (!profile) { router.replace('/login'); return; }
    if (profile.role !== 'instructor') { router.replace('/dashboard/student'); return; }
  }, [profile, authLoading, initialized, router]);

  useEffect(() => {
    if (profile?.role === 'instructor') {
      loadAssignment();
    }
  }, [profile?.role, params.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
      router.push('/dashboard/instructor/assignments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this assignment? This cannot be undone.')) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/assignments/${params.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete assignment');
      }

      toast('Assignment deleted', 'success');
      router.push('/dashboard/instructor/assignments');
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast('Failed to delete assignment', 'error');
      setIsDeleting(false);
    }
  };

  const loadClassrooms = async () => {
    try {
      setLoadingClassrooms(true);
      const res = await fetch('/api/classrooms');
      const data = await res.json();
      if (res.ok) {
        setClassrooms(data.classrooms || []);
      } else {
        toast('Failed to load classrooms', 'error');
      }
    } catch {
      toast('Network error', 'error');
    } finally {
      setLoadingClassrooms(false);
    }
  };

  const handleAssign = async () => {
    if (selectedClassrooms.length === 0) {
      toast('Select at least one classroom', 'warning');
      return;
    }

    try {
      setIsAssigning(true);
      const res = await fetch(`/api/assignments/${params.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classroom_ids: selectedClassrooms }),
      });
      
      if (res.ok) {
        toast('Assignment assigned successfully!', 'success');
        setShowAssignModal(false);
        setSelectedClassrooms([]);
      } else {
        const data = await res.json();
        toast(data.error || 'Failed to assign', 'error');
      }
    } catch {
      toast('Network error', 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  const toggleClassroom = (id: string) => {
    setSelectedClassrooms(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  if (!initialized || authLoading || !profile || isLoading) return <FullPageLoader />;
  if (!assignment) return null;

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => router.push('/dashboard/instructor/assignments')}
          className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors mb-4 group cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Assignments
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
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setShowAssignModal(true);
                loadClassrooms();
              }}
            >
              Assign to Class
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Description */}
        {assignment.description && (
          <div className="bg-white border border-[var(--border-primary)] rounded-2xl p-6">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">Description</h3>
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
                className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)]"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-[var(--border-primary)] font-bold text-sm text-[var(--text-muted)]">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[var(--text-primary)] truncate">{problem.title}</h4>
                  <div className="flex gap-2 mt-1">
                    {problem.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] bg-white px-1.5 py-0.5 rounded border border-[var(--border-primary)]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <span className={`flat-badge ${difficultyStyles[problem.difficulty]}`}>
                  {problem.difficulty}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={() => setShowAssignModal(false)} />
          <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl border-2 border-[var(--border-primary)] animate-slide-up p-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Assign to Classroom</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-4">Select classrooms to assign this to.</p>
            
            <div className="max-h-60 overflow-y-auto space-y-2 mb-6 pr-2">
              {loadingClassrooms ? (
                <div className="text-center py-4 text-sm text-[var(--text-muted)]">Loading classrooms...</div>
              ) : classrooms.length === 0 ? (
                <div className="text-center py-4 text-sm text-[var(--text-muted)]">No classrooms found.</div>
              ) : (
                classrooms.map(c => (
                  <label key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border-primary)] hover:bg-[var(--bg-secondary)] cursor-pointer transition-colors">
                    <input 
                      type="checkbox"
                      checked={selectedClassrooms.includes(c.id)}
                      onChange={() => toggleClassroom(c.id)}
                      className="w-5 h-5 rounded border-gray-300 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-sm text-[var(--text-primary)]">{c.name}</div>
                      <div className="text-xs text-[var(--text-muted)]">{c.classroom_students?.[0]?.count || 0} students</div>
                    </div>
                  </label>
                ))
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowAssignModal(false)}>Cancel</Button>
              <Button onClick={handleAssign} loading={isAssigning} disabled={selectedClassrooms.length === 0}>
                Assign
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
