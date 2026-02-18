'use client';

import { useState } from 'react';
import { GeneratedProblem } from '@/lib/ai/types';

interface ProblemGeneratorFormProps {
  onGenerate: (problems: GeneratedProblem[]) => void;
  isLoading: boolean;
}

const INPUT_CLASS =
  'w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-primary)] bg-white text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/15 focus:border-[var(--accent-primary)] hover:border-[var(--border-secondary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const LABEL_CLASS = 'block text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)] mb-1.5';

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
    if (!topic.trim()) { setError('Please enter a topic'); return; }

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

  const difficultyOptions: { value: 'easy' | 'medium' | 'hard'; label: string; color: string }[] = [
    { value: 'easy', label: 'Easy', color: '#1DB97A' },
    { value: 'medium', label: 'Medium', color: '#F39C12' },
    { value: 'hard', label: 'Hard', color: '#E74C3C' },
  ];

  const allLanguages = ['python', 'javascript', 'typescript', 'java', 'cpp', 'c'];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Topic */}
      <div>
        <label htmlFor="topic" className={LABEL_CLASS}>
          Topic / Concept <span className="text-[var(--error)] normal-case tracking-normal">*</span>
        </label>
        <input
          id="topic"
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Binary Search, Dynamic Programming, Arrays"
          className={INPUT_CLASS}
          disabled={isLoading}
          required
        />
      </div>

      {/* Difficulty */}
      <div>
        <label className={LABEL_CLASS}>Difficulty</label>
        <div className="flex gap-2">
          {difficultyOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDifficulty(opt.value)}
              disabled={isLoading}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                ${difficulty === opt.value
                  ? 'text-white border-transparent'
                  : 'bg-white border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--border-secondary)]'
                }`}
              style={difficulty === opt.value ? { backgroundColor: opt.color, borderColor: opt.color } : undefined}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label htmlFor="tags" className={LABEL_CLASS}>Tags <span className="normal-case tracking-normal text-[var(--text-muted)] font-normal">comma-separated</span></label>
        <input
          id="tags"
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="arrays, sorting, two-pointers"
          className={INPUT_CLASS}
          disabled={isLoading}
        />
      </div>

      {/* Languages */}
      <div>
        <label className={LABEL_CLASS}>Languages</label>
        <div className="flex flex-wrap gap-2">
          {allLanguages.map((lang) => {
            const active = languages.includes(lang);
            return (
              <button
                key={lang}
                type="button"
                onClick={() => toggleLanguage(lang)}
                disabled={isLoading}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer disabled:opacity-50
                  ${active
                    ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white'
                    : 'bg-white border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--border-secondary)]'
                  }`}
              >
                {lang === 'cpp' ? 'C++' : lang.charAt(0).toUpperCase() + lang.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Number of Problems */}
      <div>
        <label htmlFor="numProblems" className={LABEL_CLASS}>
          Number of Problems <span className="normal-case tracking-normal text-[var(--text-muted)] font-normal">1–5</span>
        </label>
        <input
          id="numProblems"
          type="number"
          min="1"
          max="5"
          value={numProblems}
          onChange={(e) => setNumProblems(parseInt(e.target.value) || 1)}
          className={INPUT_CLASS}
          disabled={isLoading}
        />
      </div>

      {/* Constraints */}
      <div>
        <label htmlFor="constraints" className={LABEL_CLASS}>
          Constraints <span className="normal-case tracking-normal text-[var(--text-muted)] font-normal">optional</span>
        </label>
        <textarea
          id="constraints"
          value={constraints}
          onChange={(e) => setConstraints(e.target.value)}
          placeholder="e.g. Must use recursion, No built-in sort"
          rows={3}
          className={`${INPUT_CLASS} resize-none`}
          disabled={isLoading}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 border border-red-100 text-[var(--error)] text-sm font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading || languages.length === 0}
        className="w-full px-6 py-3 rounded-xl bg-[var(--accent-primary)] text-white font-semibold text-sm hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Generating…
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Generate {numProblems > 1 ? `${numProblems} Problems` : 'Problem'}
          </>
        )}
      </button>
    </form>
  );
}
