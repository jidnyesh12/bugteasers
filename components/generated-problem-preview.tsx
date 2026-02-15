'use client';

import { useState } from 'react';
import { GeneratedProblem } from '@/lib/ai/types';

interface GeneratedProblemPreviewProps {
  problems: GeneratedProblem[];
  onSave: (problems: GeneratedProblem[]) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export default function GeneratedProblemPreview({
  problems: initialProblems,
  onSave,
  onCancel,
  isSaving,
}: GeneratedProblemPreviewProps) {
  const [problems, setProblems] = useState(initialProblems);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [editMode, setEditMode] = useState<string | null>(null);

  const currentProblem = problems[selectedIndex];

  const updateProblem = (field: keyof GeneratedProblem, value: any) => {
    setProblems((prev) =>
      prev.map((p, i) => (i === selectedIndex ? { ...p, [field]: value } : p))
    );
  };

  const updateTestCase = (index: number, field: string, value: any) => {
    const updatedTestCases = [...currentProblem.test_cases];
    updatedTestCases[index] = { ...updatedTestCases[index], [field]: value };
    updateProblem('test_cases', updatedTestCases);
  };

  const removeTestCase = (index: number) => {
    updateProblem(
      'test_cases',
      currentProblem.test_cases.filter((_, i) => i !== index)
    );
  };

  const addTestCase = () => {
    updateProblem('test_cases', [
      ...currentProblem.test_cases,
      { input_data: '', expected_output: '', is_sample: false, points: 1 },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Problem Selector (for batch generation) */}
      {problems.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {problems.map((_, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedIndex === index
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              Problem {index + 1}
            </button>
          ))}
        </div>
      )}

      {/* Preview/Edit Section */}
      <div className="space-y-6 p-6 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          {editMode === 'title' ? (
            <input
              type="text"
              value={currentProblem.title}
              onChange={(e) => updateProblem('title', e.target.value)}
              onBlur={() => setEditMode(null)}
              autoFocus
              className="w-full px-4 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
            />
          ) : (
            <div
              onClick={() => setEditMode('title')}
              className="text-xl font-bold cursor-pointer hover:text-[var(--accent-primary)] transition-colors"
            >
              {currentProblem.title}
            </div>
          )}
        </div>

        {/* Difficulty & Tags */}
        <div className="flex gap-4 items-center">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              currentProblem.difficulty === 'easy'
                ? 'bg-green-500/20 text-green-500'
                : currentProblem.difficulty === 'medium'
                ? 'bg-yellow-500/20 text-yellow-500'
                : 'bg-red-500/20 text-red-500'
            }`}
          >
            {currentProblem.difficulty}
          </span>
          <div className="flex gap-2 flex-wrap">
            {currentProblem.tags.map((tag, i) => (
              <span
                key={i}
                className="px-2 py-1 rounded bg-[var(--bg-tertiary)] text-xs text-[var(--text-secondary)]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          {editMode === 'description' ? (
            <textarea
              value={currentProblem.description}
              onChange={(e) => updateProblem('description', e.target.value)}
              onBlur={() => setEditMode(null)}
              rows={10}
              className="w-full px-4 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] font-mono text-sm"
            />
          ) : (
            <div
              onClick={() => setEditMode('description')}
              className="prose prose-invert max-w-none p-4 rounded-lg bg-[var(--bg-primary)] cursor-pointer hover:ring-2 hover:ring-[var(--accent-primary)] transition-all"
            >
              <pre className="whitespace-pre-wrap text-sm">{currentProblem.description}</pre>
            </div>
          )}
        </div>

        {/* Hints */}
        <div>
          <label className="block text-sm font-medium mb-2">Hints ({currentProblem.hints.length})</label>
          <div className="space-y-2">
            {currentProblem.hints.map((hint, i) => (
              <div key={i} className="p-3 rounded-lg bg-[var(--bg-primary)] text-sm">
                <span className="font-medium text-[var(--accent-primary)]">Hint {i + 1}:</span> {hint}
              </div>
            ))}
          </div>
        </div>

        {/* Test Cases */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">
              Test Cases ({currentProblem.test_cases.length})
            </label>
            <button
              onClick={addTestCase}
              className="px-3 py-1 text-sm rounded bg-[var(--accent-primary)] text-white hover:opacity-90"
            >
              + Add Test Case
            </button>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {currentProblem.test_cases.map((tc, i) => (
              <div
                key={i}
                className="p-4 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)]"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2 items-center">
                    <span className="text-sm font-medium">Test Case {i + 1}</span>
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={tc.is_sample}
                        onChange={(e) => updateTestCase(i, 'is_sample', e.target.checked)}
                        className="rounded"
                      />
                      Sample
                    </label>
                    <input
                      type="number"
                      value={tc.points}
                      onChange={(e) => updateTestCase(i, 'points', parseInt(e.target.value) || 1)}
                      min="1"
                      max="10"
                      className="w-16 px-2 py-1 text-xs rounded border border-[var(--border-primary)] bg-[var(--bg-secondary)]"
                    />
                    <span className="text-xs text-[var(--text-muted)]">points</span>
                  </div>
                  <button
                    onClick={() => removeTestCase(i)}
                    className="text-red-500 hover:text-red-400 text-sm"
                  >
                    Remove
                  </button>
                </div>
                <div className="space-y-2">
                  <textarea
                    value={tc.input_data}
                    onChange={(e) => updateTestCase(i, 'input_data', e.target.value)}
                    placeholder="Input data"
                    rows={2}
                    className="w-full px-3 py-2 text-sm rounded border border-[var(--border-primary)] bg-[var(--bg-secondary)] font-mono"
                  />
                  <textarea
                    value={tc.expected_output}
                    onChange={(e) => updateTestCase(i, 'expected_output', e.target.value)}
                    placeholder="Expected output"
                    rows={2}
                    className="w-full px-3 py-2 text-sm rounded border border-[var(--border-primary)] bg-[var(--bg-secondary)] font-mono"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="flex-1 px-6 py-3 rounded-lg border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(problems)}
          disabled={isSaving}
          className="flex-1 px-6 py-3 rounded-lg bg-[var(--accent-primary)] text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isSaving ? 'Saving...' : `Save ${problems.length > 1 ? `${problems.length} Problems` : 'Problem'}`}
        </button>
      </div>
    </div>
  );
}
