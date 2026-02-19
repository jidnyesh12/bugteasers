'use client';

import { useState } from 'react';
import { GeneratedProblem } from '@/lib/ai/types';

interface GeneratedProblemPreviewProps {
  problems: GeneratedProblem[];
  onSave: (problems: GeneratedProblem[]) => void;
  onCancel: () => void;
  isSaving: boolean;
}

import { MarkdownRenderer } from '@/components/markdown-renderer';

const difficultyBadge: Record<string, string> = {
  easy: 'flat-badge-green',
  medium: 'flat-badge-amber',
  hard: 'flat-badge-red',
};

const LABEL_CLASS = 'block text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)] mb-1.5';

const EDIT_INPUT_CLASS =
  'w-full px-3.5 py-2.5 rounded-xl border border-[var(--accent-primary)] bg-white text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/15 font-mono';

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

  const updateProblem = (field: keyof GeneratedProblem, value: unknown) => {
    setProblems((prev) =>
      prev.map((p, i) => (i === selectedIndex ? { ...p, [field]: value } : p))
    );
  };

  const updateTestCase = (index: number, field: string, value: unknown) => {
    const updatedTestCases = [...currentProblem.test_cases];
    updatedTestCases[index] = { ...updatedTestCases[index], [field]: value };
    updateProblem('test_cases', updatedTestCases);
  };

  const removeTestCase = (index: number) => {
    updateProblem('test_cases', currentProblem.test_cases.filter((_, i) => i !== index));
  };

  const addTestCase = () => {
    updateProblem('test_cases', [
      ...currentProblem.test_cases,
      { input_data: '', expected_output: '', is_sample: false, points: 1 },
    ]);
  };

  const updateExample = (index: number, field: string, value: string) => {
    const updatedExamples = [...(currentProblem.examples || [])];
    updatedExamples[index] = { ...updatedExamples[index], [field]: value };
    updateProblem('examples', updatedExamples);
  };

  const removeExample = (index: number) => {
    updateProblem('examples', (currentProblem.examples || []).filter((_, i) => i !== index));
  };

  const addExample = () => {
    updateProblem('examples', [
      ...(currentProblem.examples || []),
      { input: '', output: '', explanation: '' },
    ]);
  };

  const updateHint = (index: number, value: string) => {
    const newHints = [...currentProblem.hints];
    newHints[index] = value;
    updateProblem('hints', newHints);
  };

  const removeHint = (index: number) => {
    updateProblem('hints', currentProblem.hints.filter((_, i) => i !== index));
  };

  const addHint = () => {
    updateProblem('hints', [...currentProblem.hints, '']);
  };

  return (
    <div className="space-y-6">

      {/* Problem selector pills */}
      {problems.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {problems.map((_, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors text-sm border cursor-pointer
                ${selectedIndex === index
                  ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white'
                  : 'bg-white border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--border-secondary)]'
                }`}
            >
              Problem {index + 1}
            </button>
          ))}
        </div>
      )}

      {/* Preview / Edit card */}
      <div className="space-y-6 p-6 rounded-xl border border-[var(--border-primary)] bg-white">

        {/* Title */}
        <div>
          <label className={LABEL_CLASS}>Title <span className="normal-case tracking-normal text-[var(--text-muted)] font-normal">click to edit</span></label>
          {editMode === 'title' ? (
            <input
              type="text"
              value={currentProblem.title}
              onChange={(e) => updateProblem('title', e.target.value)}
              onBlur={() => setEditMode(null)}
              autoFocus
              className={EDIT_INPUT_CLASS}
            />
          ) : (
            <div
              onClick={() => setEditMode('title')}
              className="text-lg font-black tracking-tight text-[var(--text-primary)] cursor-pointer hover:text-[var(--accent-primary)] transition-colors"
            >
              {currentProblem.title}
            </div>
          )}
        </div>

        {/* Difficulty & Tags */}
        <div className="flex gap-2 items-center flex-wrap">
          <span className={`flat-badge ${difficultyBadge[currentProblem.difficulty] || 'flat-badge-blue'}`}>
            {currentProblem.difficulty}
          </span>
          {currentProblem.tags.map((tag, i) => (
            <span key={i} className="px-2 py-0.5 rounded-md bg-[var(--bg-secondary)] text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
              {tag}
            </span>
          ))}
        </div>

        {/* Description */}
        <div>
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className={`${LABEL_CLASS} mb-0`}>Description</label>
            {editMode === 'description' ? (
              <button
                onClick={() => setEditMode(null)}
                className="text-xs font-bold text-[var(--accent-primary)] hover:underline cursor-pointer"
              >
                Done
              </button>
            ) : (
              <span className="text-xs text-[var(--text-muted)] font-normal">click to edit</span>
            )}
          </div>
          {editMode === 'description' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[500px]">
              <div className="h-full flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">Markdown Input</label>
                <textarea
                  value={currentProblem.description}
                  onChange={(e) => updateProblem('description', e.target.value)}
                  className={`${EDIT_INPUT_CLASS} flex-1 resize-none p-4`}
                  placeholder="Type description here..."
                />
              </div>
              <div className="h-full flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">Preview</label>
                <div className="flex-1 overflow-y-auto p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                  <MarkdownRenderer content={currentProblem.description} />
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setEditMode('description')}
              className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-transparent hover:border-[var(--accent-primary)] cursor-pointer transition-all min-h-[100px]"
            >
              <MarkdownRenderer content={currentProblem.description} />
            </div>
          )}
        </div>
        </div>

        {/* Examples */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className={`${LABEL_CLASS} mb-0`}>Examples ({(currentProblem.examples || []).length})</label>
            <button
              onClick={addExample}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--border-secondary)] hover:text-[var(--text-primary)] bg-white transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Example
            </button>
          </div>
          <div className="space-y-3">
            {(currentProblem.examples || []).map((ex, i) => (
              <div key={i} className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-black uppercase tracking-wide text-[var(--text-secondary)]">Example {i + 1}</span>
                  <button
                    onClick={() => removeExample(i)}
                    className="text-xs font-semibold text-[var(--error)] hover:opacity-70 transition-opacity cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">Input</p>
                    <textarea
                      value={ex.input}
                      onChange={(e) => updateExample(i, 'input', e.target.value)}
                      placeholder="Example input"
                      rows={2}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border-primary)] bg-white font-mono placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">Output</p>
                    <textarea
                      value={ex.output}
                      onChange={(e) => updateExample(i, 'output', e.target.value)}
                      placeholder="Example output"
                      rows={2}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border-primary)] bg-white font-mono placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">Explanation</p>
                    <textarea
                      value={ex.explanation || ''}
                      onChange={(e) => updateExample(i, 'explanation', e.target.value)}
                      placeholder="Explanation (optional, supports markdown)"
                      rows={2}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border-primary)] bg-white font-sans placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
                    />
                  </div>
                  {ex.explanation && (
                    <div className="mt-2 p-2 rounded-lg bg-white border border-dashed border-[var(--border-primary)]">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">Preview</p>
                      <MarkdownRenderer content={ex.explanation} className="text-xs" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hints */}
        <div>
        {/* Hints */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className={`${LABEL_CLASS} mb-0`}>Hints ({currentProblem.hints.length})</label>
            <button
              onClick={addHint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--border-secondary)] hover:text-[var(--text-primary)] bg-white transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Hint
            </button>
          </div>
          <div className="space-y-3">
            {currentProblem.hints.map((hint, i) => (
              <div key={i} className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-black uppercase tracking-wide text-[var(--text-secondary)]">Hint {i + 1}</span>
                  <button
                    onClick={() => removeHint(i)}
                    className="text-xs font-semibold text-[var(--error)] hover:opacity-70 transition-opacity cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
                <textarea
                  value={hint}
                  onChange={(e) => updateHint(i, e.target.value)}
                  placeholder={`Hint ${i + 1} (supports markdown)`}
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border-primary)] bg-white font-sans placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] resize-none mb-2"
                />
                {hint && (
                  <div className="p-3 rounded-lg bg-white border border-dashed border-[var(--border-primary)]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">Preview</p>
                    <MarkdownRenderer content={hint} className="text-sm" />
                  </div>
                )}
              </div>
            ))}
            {currentProblem.hints.length === 0 && (
              <div className="text-center py-8 border border-dashed border-[var(--border-primary)] rounded-xl text-[var(--text-muted)] text-sm">
                No hints added. Click &quot;Add Hint&quot; to start.
              </div>
            )}
          </div>
        </div>
        </div>

        {/* Test Cases */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className={`${LABEL_CLASS} mb-0`}>Test Cases ({currentProblem.test_cases.length})</label>
            <button
              onClick={addTestCase}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--border-secondary)] hover:text-[var(--text-primary)] bg-white transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Test Case
            </button>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {currentProblem.test_cases.map((tc, i) => (
              <div key={i} className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex gap-3 items-center">
                    <span className="text-xs font-black uppercase tracking-wide text-[var(--text-secondary)]">Case {i + 1}</span>
                    <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={tc.is_sample}
                        onChange={(e) => updateTestCase(i, 'is_sample', e.target.checked)}
                        className="rounded"
                      />
                      Sample
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={tc.points}
                        onChange={(e) => updateTestCase(i, 'points', parseInt(e.target.value) || 1)}
                        min="1"
                        max="10"
                        className="w-12 px-2 py-1 text-xs rounded-lg border border-[var(--border-primary)] bg-white text-center focus:outline-none focus:border-[var(--accent-primary)]"
                      />
                      <span className="text-xs text-[var(--text-muted)]">pts</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeTestCase(i)}
                    className="text-xs font-semibold text-[var(--error)] hover:opacity-70 transition-opacity cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">Input</p>
                    <textarea
                      value={tc.input_data}
                      onChange={(e) => updateTestCase(i, 'input_data', e.target.value)}
                      placeholder="Input data"
                      rows={2}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border-primary)] bg-white font-mono placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">Expected Output</p>
                    <textarea
                      value={tc.expected_output}
                      onChange={(e) => updateTestCase(i, 'expected_output', e.target.value)}
                      placeholder="Expected output"
                      rows={2}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border-primary)] bg-white font-mono placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="flex-1 px-5 py-3 rounded-xl border border-[var(--border-primary)] text-[var(--text-secondary)] text-sm font-semibold hover:bg-[var(--bg-secondary)] hover:border-[var(--border-secondary)] disabled:opacity-50 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(problems)}
          disabled={isSaving}
          className="flex-1 px-5 py-3 rounded-xl bg-[var(--accent-primary)] text-white text-sm font-semibold hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving…
            </>
          ) : (
            `Save ${problems.length > 1 ? `${problems.length} Problems` : 'Problem'}`
          )}
        </button>
      </div>
    </div>
  );
}
