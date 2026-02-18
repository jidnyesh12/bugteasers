'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { FullPageLoader } from '@/components/ui/loading';

interface Problem {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  usage_count: number;
  created_at: string;
}

const difficultyConfig = {
  easy: { label: 'Easy', cls: 'flat-badge-green' },
  medium: { label: 'Medium', cls: 'flat-badge-amber' },
  hard: { label: 'Hard', cls: 'flat-badge-red' },
};

export default function ProblemsPage() {
  const router = useRouter();
  const { profile, loading: authLoading, initialized } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!initialized || authLoading) return
    if (!profile) { router.replace('/login'); return }
    if (profile.role !== 'instructor') { router.replace('/dashboard/student'); return }
  }, [profile, authLoading, initialized, router])

  useEffect(() => {
    if (profile?.id && profile.role === 'instructor') { loadProblems(); }
  }, [profile?.id, profile?.role]);

  const loadProblems = async () => {
    try {
      const res = await fetch('/api/problems?mine=true');
      if (!res.ok) throw new Error('Failed to load problems');
      const data = await res.json();
      setProblems(data.problems || []);
    } catch (error) {
      console.error('Error loading problems:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!initialized || authLoading || !profile) return <FullPageLoader />;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">My Problems</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Manage your coding problems and generate new ones with AI
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/instructor/problems/new')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white text-sm font-bold hover:bg-[var(--accent-primary-hover)] transition-colors cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          Generate Problem
        </button>
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-4 border-[var(--bg-tertiary)] border-t-[var(--accent-primary)] animate-spin" />
        </div>
      ) : problems.length === 0 ? (
        <div className="bg-white border border-[var(--border-primary)] rounded-2xl flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center mb-4 animate-wiggle">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
          <p className="text-sm font-bold text-[var(--text-secondary)] mb-1">No problems yet</p>
          <p className="text-xs text-[var(--text-muted)] mb-6 max-w-xs">Use AI to generate your first coding challenge</p>
          <button
            onClick={() => router.push('/dashboard/instructor/problems/new')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white text-sm font-bold hover:bg-[var(--accent-primary-hover)] transition-colors cursor-pointer"
          >
            Generate Your First Problem
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {problems.map((problem) => (
            <div
              key={problem.id}
              className="bg-white border border-[var(--border-primary)] rounded-xl p-5 hover:border-[var(--border-secondary)] transition-colors cursor-pointer group"
              onClick={() => router.push(`/dashboard/instructor/problems/${problem.id}`)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                      {problem.title}
                    </h3>
                    <span className={`flat-badge ${difficultyConfig[problem.difficulty].cls}`}>
                      {difficultyConfig[problem.difficulty].label}
                    </span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap mb-3">
                    {problem.tags?.map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-[var(--bg-secondary)] text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    Used {problem.usage_count}× · Created {new Date(problem.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
