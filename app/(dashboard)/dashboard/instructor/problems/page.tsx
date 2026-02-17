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

const difficultyStyles = {
  easy: 'flat-badge-green',
  medium: 'flat-badge-amber',
  hard: 'flat-badge-red',
};

export default function ProblemsPage() {
  const router = useRouter();
  const { profile, loading: authLoading, initialized } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // CRITICAL: Protect route - only instructors can access
  useEffect(() => {
    if (!initialized || authLoading) return

    if (!profile) {
      router.replace('/login')
      return
    }

    if (profile.role !== 'instructor') {
      router.replace('/dashboard/student')
      return
    }
  }, [profile, authLoading, initialized, router])

  useEffect(() => {
    if (profile?.id && profile.role === 'instructor') {
      loadProblems();
    }
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

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-[var(--text-primary)] mb-1">My Problems</h1>
          <p className="text-[var(--text-secondary)]">
            Manage your coding problems and generate new ones with AI
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/instructor/problems/new')}
          className="px-6 py-3 rounded-xl bg-[var(--accent-primary)] text-white font-bold hover:bg-[var(--accent-primary-hover)] transition-colors"
        >
          + Generate Problem
        </button>
      </div>

      {/* Problems List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-10 w-10 rounded-full border-4 border-[var(--bg-tertiary)] border-t-[var(--accent-primary)] animate-spin" />
        </div>
      ) : problems.length === 0 ? (
        <div className="flat-card flex flex-col items-center justify-center py-16 text-center">
          {/* Animated code SVG */}
          <svg width="90" height="90" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-5 animate-wiggle">
            <circle cx="45" cy="45" r="40" fill="var(--bg-tertiary)"/>
            <g transform="translate(25, 26)">
              <polyline points="8,12 0,20 8,28" fill="none" stroke="var(--accent-primary)" strokeOpacity="0.5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="32,12 40,20 32,28" fill="none" stroke="var(--accent-primary)" strokeOpacity="0.5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="24" y1="8" x2="16" y2="32" stroke="var(--accent-secondary)" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round"/>
            </g>
          </svg>
          <p className="text-[var(--text-secondary)] font-semibold mb-1">
            You haven&apos;t created any problems yet
          </p>
          <p className="text-sm text-[var(--text-muted)] mb-6">Use AI to generate your first coding challenge</p>
          <button
            onClick={() => router.push('/dashboard/instructor/problems/new')}
            className="px-6 py-3 rounded-xl bg-[var(--accent-primary)] text-white font-bold hover:bg-[var(--accent-primary-hover)] transition-colors"
          >
            Generate Your First Problem
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {problems.map((problem) => (
            <div
              key={problem.id}
              className="flat-card p-6 hover:border-[var(--accent-primary)] transition-colors cursor-pointer"
              onClick={() => router.push(`/dashboard/instructor/problems/${problem.id}`)}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">{problem.title}</h3>
                <span className={`flat-badge ${difficultyStyles[problem.difficulty]}`}>
                  {problem.difficulty}
                </span>
              </div>
              <div className="flex gap-2 mb-3 flex-wrap">
                {problem.tags?.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-[var(--bg-tertiary)] text-xs font-semibold text-[var(--text-secondary)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex gap-4 text-sm text-[var(--text-muted)]">
                <span>Used {problem.usage_count} times</span>
                <span>•</span>
                <span>Created {new Date(problem.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
