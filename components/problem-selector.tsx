'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';

interface Problem {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

interface ProblemSelectorProps {
  problems: Problem[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

const difficultyConfig = {
  easy: { label: 'Easy', cls: 'flat-badge-green' },
  medium: { label: 'Medium', cls: 'flat-badge-amber' },
  hard: { label: 'Hard', cls: 'flat-badge-red' },
};

export default function ProblemSelector({ problems, selectedIds, onSelectionChange }: ProblemSelectorProps) {
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  const filteredProblems = problems.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    const matchesDifficulty = difficultyFilter === 'all' || p.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  const toggleProblem = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(sid => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const selectedProblems = problems.filter(p => selectedIds.includes(p.id));

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search problems..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            }
          />
        </div>
        <div className="flex gap-2">
          {['all', 'easy', 'medium', 'hard'].map(level => (
            <button
              key={level}
              onClick={() => setDifficultyFilter(level)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors capitalize
                ${difficultyFilter === level
                  ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white'
                  : 'bg-white border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--border-secondary)]'
                }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Problems */}
      {selectedProblems.length > 0 && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Selected ({selectedProblems.length})
            </p>
            <button
              onClick={() => onSelectionChange([])}
              className="text-xs font-semibold text-[var(--text-muted)] hover:text-red-600 transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {selectedProblems.map((problem, index) => (
              <div key={problem.id} className="flex items-center gap-3 bg-white border border-[var(--border-primary)] rounded-lg p-3">
                <span className="text-xs font-bold text-[var(--text-muted)]">{index + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{problem.title}</p>
                </div>
                <span className={`flat-badge ${difficultyConfig[problem.difficulty].cls}`}>
                  {difficultyConfig[problem.difficulty].label}
                </span>
                <button
                  onClick={() => toggleProblem(problem.id)}
                  className="w-6 h-6 rounded-md hover:bg-red-50 flex items-center justify-center transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hover:stroke-red-600">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Problems */}
      <div className="border border-[var(--border-primary)] rounded-xl p-4 max-h-96 overflow-y-auto">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-3">
          Available Problems
        </p>
        {filteredProblems.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-8">
            No problems found
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredProblems.map(problem => {
              const isSelected = selectedIds.includes(problem.id);
              return (
                <button
                  key={problem.id}
                  onClick={() => toggleProblem(problem.id)}
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
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{problem.title}</p>
                    {problem.tags.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {problem.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] text-[9px] font-semibold text-[var(--text-secondary)] uppercase">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className={`flat-badge ${difficultyConfig[problem.difficulty].cls}`}>
                    {difficultyConfig[problem.difficulty].label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
