'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { FullPageLoader } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import ProblemSelector from '@/components/problem-selector';

interface Problem {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

interface Classroom {
  id: string;
  name: string;
}

export default function NewAssignmentPage() {
  const router = useRouter();
  const { profile, loading: authLoading, initialized } = useAuth();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedProblemIds, setSelectedProblemIds] = useState<string[]>([]);
  const [selectedClassroomIds, setSelectedClassroomIds] = useState<string[]>([]);
  
  const [problems, setProblems] = useState<Problem[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!initialized || authLoading) return;
    if (!profile) { router.replace('/login'); return; }
    if (profile.role !== 'instructor') { router.replace('/dashboard/student'); return; }
  }, [profile, authLoading, initialized, router]);

  useEffect(() => {
    if (profile?.role === 'instructor') {
      loadData();
    }
  }, [profile?.role]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [problemsRes, classroomsRes] = await Promise.all([
        fetch('/api/problems'),
        fetch('/api/classrooms')
      ]);

      if (problemsRes.ok) {
        const problemsData = await problemsRes.json();
        setProblems(problemsData.problems || []);
      }

      if (classroomsRes.ok) {
        const classroomsData = await classroomsRes.json();
        setClassrooms(classroomsData.classrooms || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast('Failed to load data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast('Title is required', 'warning');
      return;
    }

    if (!deadline) {
      toast('Deadline is required', 'warning');
      return;
    }

    if (selectedProblemIds.length === 0) {
      toast('Select at least one problem', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);

      // Create assignment
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          deadline,
          problem_ids: selectedProblemIds,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create assignment');
      }

      // Assign to classrooms if selected
      if (selectedClassroomIds.length > 0) {
        await fetch(`/api/assignments/${data.assignment.id}/assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ classroom_ids: selectedClassroomIds }),
        });
      }

      toast('Assignment created!', 'success');
      router.push('/dashboard/instructor/assignments');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to create assignment';
      console.error('Error creating assignment:', error);
      toast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleClassroom = (id: string) => {
    setSelectedClassroomIds(prev =>
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  // Get minimum date (tomorrow)
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  if (!initialized || authLoading || !profile || isLoading) return <FullPageLoader />;

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
        <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">Create Assignment</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Build a new coding assignment for your students
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white border border-[var(--border-primary)] rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">
              Title <span className="text-[var(--error)] normal-case tracking-normal">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Week 1 - Arrays and Strings"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">
              Description <span className="normal-case tracking-normal text-[var(--text-muted)] font-normal">optional</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add optional context or instructions for students..."
              className="w-full px-4 py-3 bg-white border border-[var(--border-primary)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] transition-all resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">
              Deadline <span className="text-[var(--error)] normal-case tracking-normal">*</span>
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={minDateStr}
              required
              className="w-full px-4 py-3 bg-white border border-[var(--border-primary)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] transition-all"
            />
          </div>
        </div>

        {/* Problems */}
        <div className="bg-white border border-[var(--border-primary)] rounded-2xl p-6">
          <div className="mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              Problems <span className="text-[var(--error)] normal-case tracking-normal">*</span>
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">Select coding problems for this assignment</p>
          </div>
          <ProblemSelector
            problems={problems}
            selectedIds={selectedProblemIds}
            onSelectionChange={setSelectedProblemIds}
          />
        </div>

        {/* Classrooms */}
        <div className="bg-white border border-[var(--border-primary)] rounded-2xl p-6">
          <div className="mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Assign to Classrooms</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">Optional — assign now or later from the classroom page</p>
          </div>

          {classrooms.length === 0 ? (
            <div className="text-center py-8 text-sm text-[var(--text-muted)]">
              <p>No classrooms available</p>
              <button
                type="button"
                onClick={() => router.push('/dashboard/instructor/classrooms')}
                className="text-[var(--accent-primary)] hover:underline mt-2"
              >
                Create a classroom first
              </button>
            </div>
          ) : (
            <div className="grid gap-2">
              {classrooms.map(classroom => {
                const isSelected = selectedClassroomIds.includes(classroom.id);
                return (
                  <button
                    key={classroom.id}
                    type="button"
                    onClick={() => toggleClassroom(classroom.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left
                      ${isSelected
                        ? 'bg-[var(--accent-primary)]/5 border-[var(--accent-primary)]'
                        : 'bg-white border-[var(--border-primary)] hover:border-[var(--border-secondary)]'
                      }`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors
                      ${isSelected
                        ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)]'
                        : 'border-[var(--border-primary)]'
                      }`}
                    >
                      {isSelected && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{classroom.name}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Assignment'}
          </Button>
        </div>
      </form>
    </div>
  );
}
