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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Topic */}
      <div>
        <label htmlFor="topic" className="block text-sm font-medium mb-2">
          Topic / Concept <span className="text-red-500">*</span>
        </label>
        <input
          id="topic"
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., Binary Search, Dynamic Programming, Arrays"
          className="w-full px-4 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
          disabled={isLoading}
          required
        />
      </div>

      {/* Difficulty */}
      <div>
        <label htmlFor="difficulty" className="block text-sm font-medium mb-2">
          Difficulty Level <span className="text-red-500">*</span>
        </label>
        <select
          id="difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
          className="w-full px-4 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
          disabled={isLoading}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {/* Tags */}
      <div>
        <label htmlFor="tags" className="block text-sm font-medium mb-2">
          Tags (comma-separated)
        </label>
        <input
          id="tags"
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="e.g., arrays, sorting, two-pointers"
          className="w-full px-4 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
          disabled={isLoading}
        />
      </div>

      {/* Languages */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Programming Languages (select at least one)
        </label>
        <div className="flex flex-wrap gap-3">
          {['python', 'javascript', 'typescript', 'java', 'cpp', 'c'].map((lang) => (
            <label key={lang} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={languages.includes(lang)}
                onChange={() => toggleLanguage(lang)}
                disabled={isLoading}
                className="w-4 h-4 rounded border-[var(--border-primary)] text-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]"
              />
              <span className="text-sm capitalize">{lang === 'cpp' ? 'C++' : lang}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Number of Problems */}
      <div>
        <label htmlFor="numProblems" className="block text-sm font-medium mb-2">
          Number of Problems to Generate
        </label>
        <input
          id="numProblems"
          type="number"
          min="1"
          max="5"
          value={numProblems}
          onChange={(e) => setNumProblems(parseInt(e.target.value) || 1)}
          className="w-full px-4 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
          disabled={isLoading}
        />
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Generate 1-5 problems at once (batch generation)
        </p>
      </div>

      {/* Additional Constraints */}
      <div>
        <label htmlFor="constraints" className="block text-sm font-medium mb-2">
          Additional Constraints (optional)
        </label>
        <textarea
          id="constraints"
          value={constraints}
          onChange={(e) => setConstraints(e.target.value)}
          placeholder="e.g., Must use recursion, No built-in sorting functions, Focus on space optimization"
          rows={3}
          className="w-full px-4 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] resize-none"
          disabled={isLoading}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || languages.length === 0}
        className="w-full px-6 py-3 rounded-lg bg-[var(--accent-primary)] text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        {isLoading ? 'Generating...' : `Generate ${numProblems > 1 ? `${numProblems} Problems` : 'Problem'}`}
      </button>
    </form>
  );
}
