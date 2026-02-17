'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';

interface Problem {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  usage_count: number;
  created_at: string;
}

export default function ProblemsPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      loadProblems();
    }
  }, [profile?.id]);

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
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Problems</h1>
            <p className="text-[var(--text-secondary)]">
              Manage your coding problems and generate new ones with AI
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard/instructor/problems/new')}
            className="px-6 py-3 rounded-lg bg-[var(--accent-primary)] text-white font-medium hover:opacity-90 transition-opacity"
          >
            + Generate Problem
          </button>
        </div>

        {/* Problems List */}
        {isLoading ? (
          <div className="text-center py-12 text-[var(--text-secondary)]">Loading...</div>
        ) : problems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[var(--text-secondary)] mb-4">
              You haven&apos;t created any problems yet
            </p>
            <button
              onClick={() => router.push('/dashboard/instructor/problems/new')}
              className="px-6 py-3 rounded-lg bg-[var(--accent-primary)] text-white font-medium hover:opacity-90 transition-opacity"
            >
              Generate Your First Problem
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {problems.map((problem) => (
              <div
                key={problem.id}
                className="p-6 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)] transition-colors cursor-pointer"
                onClick={() => router.push(`/dashboard/instructor/problems/${problem.id}`)}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold">{problem.title}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      problem.difficulty === 'easy'
                        ? 'bg-green-500/20 text-green-500'
                        : problem.difficulty === 'medium'
                        ? 'bg-yellow-500/20 text-yellow-500'
                        : 'bg-red-500/20 text-red-500'
                    }`}
                  >
                    {problem.difficulty}
                  </span>
                </div>
                <div className="flex gap-2 mb-3 flex-wrap">
                  {problem.tags?.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded bg-[var(--bg-tertiary)] text-xs text-[var(--text-secondary)]"
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
    </div>
  );
}
