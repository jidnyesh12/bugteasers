'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { FullPageLoader } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

import { MarkdownRenderer } from '@/components/markdown-renderer';

interface TestCase {
  id: string;
  input_data: string;
  expected_output: string;
  is_sample: boolean;
  points: number;
}

interface ProblemDetail {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  constraints: string | null;
  hints: string[] | null;
  examples: unknown | null;
  test_cases: TestCase[];
  starter_code: Record<string, string> | null;
  solution_code: string | null;
  time_limit: number;
  memory_limit: number;
  created_at: string;
  usage_count: number;
}

const difficultyStyles = {
  easy: 'flat-badge-green',
  medium: 'flat-badge-amber',
  hard: 'flat-badge-red',
};

export default function ProblemDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { profile, loading: authLoading, initialized } = useAuth();
  const [problem, setProblem] = useState<ProblemDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Add to Assignment State
  const { toast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [assignments, setAssignments] = useState<{id: string, title: string}[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  // CRITICAL: Protect route - only instructors can access
  useEffect(() => {
    if (!initialized || authLoading) return;

    if (!profile) {
      router.replace('/login');
      return;
    }

    if (profile.role !== 'instructor') {
      router.replace('/dashboard/student');
      return;
    }
  }, [profile, authLoading, initialized, router]);

  useEffect(() => {
    if (params.id && profile?.role === 'instructor') {
      loadProblem();
    }
  }, [params.id, profile?.role]); // eslint-disable-line react-hooks/exhaustive-deps -- loadProblem depends on params.id

  const loadProblem = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const res = await fetch(`/api/problems/${params.id}`);
      
      if (!res.ok) {
        if (res.status === 404) {
          setError('Problem not found');
        } else {
          setError('Failed to load problem');
        }
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      setProblem(data.problem);
    } catch (err) {
      console.error('Error loading problem:', err);
      setError('Failed to load problem');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAssignments = async () => {
    try {
      setLoadingAssignments(true);
      const res = await fetch('/api/assignments');
      const data = await res.json();
      if (res.ok) {
        setAssignments(data.assignments || []);
      } else {
        toast('Failed to load assignments', 'error');
      }
    } catch {
      toast('Network error', 'error');
    } finally {
      setLoadingAssignments(false);
    }
  };

  const handleAddToAssignment = async () => {
    if (!selectedAssignmentId) {
      toast('Select an assignment', 'warning');
      return;
    }
    try {
      setIsAdding(true);
      const res = await fetch(`/api/assignments/${selectedAssignmentId}/problems`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem_id: params.id }),
      });
      
      if (res.ok) {
        toast('Problem added to assignment', 'success');
        setShowAddModal(false);
      } else {
        const data = await res.json();
        toast(data.error || 'Failed to add', 'error');
      }
    } catch {
      toast('Network error', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  if (!initialized || authLoading || !profile || profile.role !== 'instructor') {
    return <FullPageLoader />;
  }

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (error || !problem) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="bg-white border border-[var(--border-primary)] rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">{error || 'Problem not found'}</h2>
          <p className="text-[var(--text-muted)] mb-6">This problem may have been deleted or you don&apos;t have access to it.</p>
          <Button onClick={() => router.push('/dashboard/instructor/problems')}>
            Back to Problems
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard/instructor/problems')}
          className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors mb-4 group cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Problems
        </button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{problem.title}</h1>
            <div className="flex items-center gap-3">
              <span className={`flat-badge ${difficultyStyles[problem.difficulty]}`}>
                {problem.difficulty}
              </span>
              <span className="text-sm text-[var(--text-muted)]">
                Used {problem.usage_count} times
              </span>
              <span className="text-sm text-[var(--text-muted)]">
                Created {new Date(problem.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <Button 
            onClick={() => {
              setShowAddModal(true);
              loadAssignments();
            }}
          >
            Add to Assignment
          </Button>
        </div>
      </div>

      {/* Tags */}
      {problem.tags && problem.tags.length > 0 && (
        <div className="flex gap-1.5 mb-6 flex-wrap">
          {problem.tags.map((tag, i) => (
            <span key={i} className="px-2 py-0.5 rounded-md bg-[var(--bg-secondary)] text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Description */}
      <div className="bg-white border border-[var(--border-primary)] rounded-2xl p-6 mb-6">
        <h2 className="text-base font-black tracking-tight text-[var(--text-primary)] mb-4">Description</h2>
        <MarkdownRenderer content={problem.description} />
      </div>

      {/* Hints */}
      {problem.hints && problem.hints.length > 0 && (
        <div className="bg-white border border-[var(--border-primary)] rounded-2xl p-6 mb-6">
          <h2 className="text-base font-black tracking-tight text-[var(--text-primary)] mb-4">Hints ({problem.hints.length})</h2>
          <div className="space-y-2">
            {problem.hints.map((hint, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-[rgba(253,183,20,0.07)] border border-[rgba(253,183,20,0.2)]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-[var(--text-primary)] text-sm">Hint {i + 1}</span>
                </div>
                <MarkdownRenderer content={hint} className="text-sm text-[var(--text-secondary)]" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Starter Code */}
      {problem.starter_code && Object.keys(problem.starter_code).length > 0 && (
        <div className="bg-white border border-[var(--border-primary)] rounded-2xl p-6 mb-6">
          <h2 className="text-base font-black tracking-tight text-[var(--text-primary)] mb-4">Starter Code</h2>
          <div className="space-y-4">
            {Object.entries(problem.starter_code).map(([language, code]) => (
              <div key={language}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-[var(--text-secondary)] uppercase">{language}</span>
                </div>
                <pre className="bg-[var(--bg-tertiary)] p-4 rounded-xl overflow-x-auto">
                  <code className="text-sm text-[var(--text-primary)]">{code}</code>
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Cases */}
      {problem.test_cases && problem.test_cases.length > 0 && (
        <div className="bg-white border border-[var(--border-primary)] rounded-2xl p-6 mb-6">
          <h2 className="text-base font-black tracking-tight text-[var(--text-primary)] mb-4">
            Test Cases ({problem.test_cases.length})
          </h2>
          <div className="space-y-3">
            {problem.test_cases.map((tc, i) => (
              <div key={tc.id || i} className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-black uppercase tracking-wide text-[var(--text-secondary)]">
                    Case {i + 1}
                  </span>
                  {tc.is_sample && (
                    <span className="flat-badge-blue flat-badge">Sample</span>
                  )}
                  <span className="text-xs text-[var(--text-muted)]">{tc.points} pt{tc.points !== 1 ? 's' : ''}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">Input</p>
                    <pre className="text-xs font-mono text-[var(--text-primary)] bg-white p-2.5 rounded-lg border border-[var(--border-primary)] whitespace-pre overflow-x-auto">{tc.input_data}</pre>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">Expected Output</p>
                    <pre className="text-xs font-mono text-[var(--text-primary)] bg-white p-2.5 rounded-lg border border-[var(--border-primary)] whitespace-pre overflow-x-auto">{tc.expected_output}</pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Solution (Instructor Only) */}
      {problem.solution_code && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <h2 className="text-base font-black tracking-tight text-amber-900">Solution (Instructor Only)</h2>
          </div>
          <pre className="bg-white p-4 rounded-xl overflow-x-auto border border-amber-200">
            <code className="text-sm text-gray-800 whitespace-pre">{problem.solution_code}</code>
          </pre>
        </div>
      )}

      {/* Add to Assignment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl border-2 border-[var(--border-primary)] animate-slide-up p-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Add to Assignment</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-4">Select an assignment to add this problem to.</p>
            
            <div className="max-h-60 overflow-y-auto space-y-2 mb-6">
              {loadingAssignments ? (
                <div className="text-center py-4 text-sm text-[var(--text-muted)]">Loading assignments...</div>
              ) : assignments.length === 0 ? (
                <div className="text-center py-4 text-sm text-[var(--text-muted)]">No active assignments found.</div>
              ) : (
                assignments.map(a => (
                  <label key={a.id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border-primary)] hover:bg-[var(--bg-secondary)] cursor-pointer transition-colors">
                    <input 
                      type="radio" 
                      name="assignment"
                      checked={selectedAssignmentId === a.id}
                      onChange={() => setSelectedAssignmentId(a.id)}
                      className="w-4 h-4 text-[var(--accent-primary)] border-gray-300 focus:ring-[var(--accent-primary)]"
                    />
                    <div className="font-bold text-sm text-[var(--text-primary)]">{a.title}</div>
                  </label>
                ))
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button onClick={handleAddToAssignment} loading={isAdding} disabled={!selectedAssignmentId}>
                Add
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
