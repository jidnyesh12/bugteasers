'use client';

import { useState } from 'react';
import { GeneratedProblem } from '@/lib/ai/types';

interface ProblemGeneratorFormProps {
  onGenerate: (problems: GeneratedProblem[]) => void;
  isLoading: boolean;
}

export default function ProblemGeneratorForm({
  onGenerate,
  isLoading,
}: ProblemGeneratorFormProps) {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [tags, setTags] = useState('');
  const [constraints, setConstraints] = useState('');
  const [numProblems, setNumProblems] = useState(1);
  const [languages, setLanguages] = useState<string[]>(['python', 'javascript']);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    try {
      const response = await fetch('/api/problems/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          difficulty,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
          constraints: constraints.trim() || undefined,
          numProblems,
          languages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate problems');
      }

      const data = await response.json();
      onGenerate(data.problems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const toggleLanguage = (lang: string) => {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const difficultyOptions = [
    { value: 'easy' as const, label: 'Easy', color: 'bg-[#27AE60]' },
    { value: 'medium' as const, label: 'Medium', color: 'bg-[var(--warning)]' },
    { value: 'hard' as const, label: 'Hard', color: 'bg-[var(--accent-primary)]' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Topic */}
      <div>
        <label htmlFor="topic" className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
          Topic / Concept <span className="text-[var(--accent-primary)]">*</span>
        </label>
        <input
          id="topic"
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., Binary Search, Dynamic Programming, Arrays"
          className="w-full px-4 py-3 rounded-xl border-2 border-[var(--border-primary)] bg-white text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] transition-colors text-sm"
          disabled={isLoading}
          required
        />
      </div>

      {/* Difficulty — flat colored buttons */}
      <div>
        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
          Difficulty Level <span className="text-[var(--accent-primary)]">*</span>
        </label>
        <div className="flex gap-3">
          {difficultyOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDifficulty(opt.value)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer
                ${difficulty === opt.value
                  ? `${opt.color} text-white`
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                }
              `}
              disabled={isLoading}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label htmlFor="tags" className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
          Tags (comma-separated)
        </label>
        <input
          id="tags"
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="e.g., arrays, sorting, two-pointers"
          className="w-full px-4 py-3 rounded-xl border-2 border-[var(--border-primary)] bg-white text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] transition-colors text-sm"
          disabled={isLoading}
        />
      </div>

      {/* Languages — flat pill toggles */}
      <div>
        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
          Programming Languages
        </label>
        <div className="flex flex-wrap gap-2">
          {['python', 'javascript', 'typescript', 'java', 'cpp', 'c'].map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => toggleLanguage(lang)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all cursor-pointer
                ${languages.includes(lang)
                  ? 'border-[var(--accent-secondary)] bg-[var(--accent-secondary)] text-white'
                  : 'border-[var(--border-primary)] bg-white text-[var(--text-secondary)] hover:border-[var(--border-secondary)]'
                }
              `}
              disabled={isLoading}
            >
              {lang === 'cpp' ? 'C++' : lang.charAt(0).toUpperCase() + lang.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Number of Problems */}
      <div>
        <label htmlFor="numProblems" className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
          Number of Problems
        </label>
        <input
          id="numProblems"
          type="number"
          min="1"
          max="5"
          value={numProblems}
          onChange={(e) => setNumProblems(parseInt(e.target.value) || 1)}
          className="w-full px-4 py-3 rounded-xl border-2 border-[var(--border-primary)] bg-white text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] transition-colors text-sm"
          disabled={isLoading}
        />
        <p className="text-xs text-[var(--text-muted)] mt-1.5">
          Generate 1-5 problems at once
        </p>
      </div>

      {/* Additional Constraints */}
      <div>
        <label htmlFor="constraints" className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
          Additional Constraints (optional)
        </label>
        <textarea
          id="constraints"
          value={constraints}
          onChange={(e) => setConstraints(e.target.value)}
          placeholder="e.g., Must use recursion, No built-in sorting functions"
          rows={3}
          className="w-full px-4 py-3 rounded-xl border-2 border-[var(--border-primary)] bg-white text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] transition-colors text-sm resize-none"
          disabled={isLoading}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-[var(--error)]/10 border-2 border-[var(--error)]/20 text-[var(--error)] text-sm font-medium">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || languages.length === 0}
        className="w-full px-6 py-3.5 rounded-xl bg-[var(--accent-primary)] text-white font-bold hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base"
      >
        {isLoading ? 'Generating...' : `Generate ${numProblems > 1 ? `${numProblems} Problems` : 'Problem'}`}
      </button>
    </form>
  );
}
