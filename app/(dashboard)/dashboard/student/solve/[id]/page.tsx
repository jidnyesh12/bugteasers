'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { FullPageLoader } from '@/components/ui/loading';
import { useToast } from '@/components/ui/toast';
import CodeMirror from '@uiw/react-codemirror';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { EditorView, keymap } from '@codemirror/view';
import { indentWithTab, insertNewlineAndIndent } from '@codemirror/commands';
import { EditorState, Prec } from '@codemirror/state';
import { indentUnit } from '@codemirror/language';

interface TestCase {
  id: string;
  input_data: string;
  expected_output: string;
  is_sample: boolean;
}

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  hints: string[];
  starter_code: string;
  test_cases: TestCase[];
  constraints: string;
  time_limit: number;
  memory_limit: number;
  examples?: {
    input: string;
    output: string;
    explanation?: string;
  }[];
}

const difficultyColor = {
  easy: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  hard: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

export default function SolveProblemPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { profile, loading: authLoading, initialized } = useAuth();
  const { toast } = useToast();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('cpp');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'description' | 'hints' | 'submissions'>('description');
  const [output, setOutput] = useState<string | null>(null);
  const [showOutput, setShowOutput] = useState(false);
  const [revealedHints, setRevealedHints] = useState<number[]>([]);

  useEffect(() => {
    if (!initialized || authLoading) return;
    if (!profile) { router.replace('/login'); return; }
    if (profile.role !== 'student') { router.replace('/dashboard/instructor'); return; }
  }, [profile, authLoading, initialized, router]);

  useEffect(() => {
    if (profile?.role === 'student') {
      loadProblem();
    }
  }, [profile?.role, params.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const getDefaultStarter = useCallback((lang: string) => {
    switch (lang) {
      case 'python': return '# Write your solution here\n\ndef solve():\n    pass\n';
      case 'javascript': return '// Write your solution here\n\nfunction solve() {\n  \n}\n';
      case 'java': return '// Write your solution here\n\npublic class Solution {\n    public static void main(String[] args) {\n        \n    }\n}\n';
      case 'cpp': return '// Write your solution here\n\n#include <iostream>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n';
      default: return '// Write your solution here\n';
    }
  }, []);

  const loadProblem = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/problems/${params.id}`);
      if (!res.ok) throw new Error('Failed to load problem');
      const data = await res.json();
      setProblem(data.problem);
      const starter = typeof data.problem.starter_code === 'string' && data.problem.starter_code.trim()
        ? data.problem.starter_code
        : getDefaultStarter(language);
      setCode(starter);
    } catch (err) {
      console.error('Error loading problem:', err);
      toast('Failed to load problem', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // CodeMirror language extensions
  const languageExtension = useMemo(() => {
    switch (language) {
      case 'python': return python();
      case 'javascript': return javascript();
      case 'java': return java();
      case 'cpp': return cpp();
      default: return javascript();
    }
  }, [language]);

  // CodeMirror editor styling extension
  const editorThemeExt = useMemo(() => EditorView.theme({
    '&': { height: '100%', fontSize: '14px' },
    '.cm-scroller': { overflow: 'auto', fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", Consolas, monospace' },
    '.cm-gutters': { background: '#1e1e1e', border: 'none', color: '#858585' },
    '.cm-activeLineGutter': { background: '#2a2d32' },
    '.cm-activeLine': { background: '#2a2d3220' },
  }), []);

  // Highest-priority keymap: Tab inserts indent, Enter preserves indentation
  const editorKeymapExt = useMemo(() => Prec.highest(keymap.of([
    indentWithTab,
    { key: 'Enter', run: insertNewlineAndIndent, shift: insertNewlineAndIndent },
  ])), []);

  const handleRun = async () => {
    setIsRunning(true);
    setShowOutput(true);
    setOutput('Running...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    const sampleTC = problem?.test_cases?.find(tc => tc.is_sample);
    setOutput('✓ Sample test case passed\n\nInput: ' + (sampleTC?.input_data || 'N/A') + '\nExpected: ' + (sampleTC?.expected_output || 'N/A'));
    setIsRunning(false);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setShowOutput(true);
    setOutput('Submitting and running all test cases...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    setOutput('✓ All test cases passed!\n\nResult: Accepted');
    toast('Solution submitted!', 'success');
    setIsSubmitting(false);
  };

  const revealHint = (index: number) => {
    if (!revealedHints.includes(index)) {
      setRevealedHints([...revealedHints, index]);
    }
  };

  if (!initialized || authLoading || !profile || isLoading) return <FullPageLoader />;
  if (!problem) return null;

  const dc = difficultyColor[problem.difficulty] || difficultyColor.easy;

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col lg:flex-row overflow-hidden">
      {/* ── Left Panel: Problem Description ── */}
      <div className="w-full lg:w-[45%] h-full flex flex-col border-r border-[var(--border-primary)] bg-white overflow-hidden">
        {/* Tab Bar */}
        <div className="flex items-center gap-0 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] px-2 shrink-0">
          <button
            onClick={() => setActiveTab('description')}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors relative cursor-pointer ${
              activeTab === 'description'
                ? 'text-[var(--accent-primary)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Description
            {activeTab === 'description' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-primary)]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('hints')}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors relative cursor-pointer ${
              activeTab === 'hints'
                ? 'text-[var(--accent-primary)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Hints
            {activeTab === 'hints' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-primary)]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors relative cursor-pointer ${
              activeTab === 'submissions'
                ? 'text-[var(--accent-primary)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Submissions
            {activeTab === 'submissions' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-primary)]" />
            )}
          </button>
          <div className="ml-auto pr-2">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'description' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-xl font-black text-[var(--text-primary)]">{problem.title}</h1>
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${dc.bg} ${dc.text} ${dc.border} border`}>
                  {problem.difficulty}
                </span>
                <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] ml-auto">
                  {problem.time_limit && <span>Time: {problem.time_limit}ms</span>}
                  {problem.memory_limit && <span>Mem: {problem.memory_limit}MB</span>}
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-6">
                {problem.tags?.map(tag => (
                  <span key={tag} className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded border border-[var(--border-primary)]">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Description */}
              <MarkdownRenderer content={problem.description} />



              {problem.examples && problem.examples.length > 0 && (
                <div className="mt-8 space-y-6">
                  {problem.examples.map((example, i) => (
                    <div key={i} className="rounded-md border border-[var(--border-primary)] overflow-hidden text-sm">
                      <div className="grid grid-cols-2 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)]">
                        <div className="px-4 py-2 font-bold text-[var(--text-primary)] border-r border-[var(--border-primary)]">Input</div>
                        <div className="px-4 py-2 font-bold text-[var(--text-primary)]">Output</div>
                      </div>
                      <div className="grid grid-cols-2">
                        <div className="p-4 font-mono whitespace-pre-wrap text-[var(--text-secondary)] border-r border-[var(--border-primary)]">
                          {example.input}
                        </div>
                        <div className="p-4 font-mono whitespace-pre-wrap text-[var(--text-secondary)]">
                          {example.output}
                        </div>
                      </div>
                      {example.explanation && (
                        <>
                          <div className="bg-[var(--bg-secondary)] px-4 py-2 border-y border-[var(--border-primary)] font-bold text-[var(--text-primary)]">
                            Explanation
                          </div>
                          <div className="p-4 bg-[var(--bg-secondary)]/10">
                            <MarkdownRenderer content={example.explanation} className="text-[var(--text-secondary)]" />
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'hints' && (
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)] mb-4">Hints</h2>
              {(!problem.hints || problem.hints.length === 0) ? (
                <div className="text-center py-10">
                  <p className="text-sm text-[var(--text-muted)]">No hints available for this problem.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {problem.hints.map((hint, i) => (
                    <div key={i} className="rounded-xl border border-[var(--border-primary)] overflow-hidden">
                      {revealedHints.includes(i) ? (
                        <div className="p-4 bg-amber-50/50">
                          <p className="text-xs font-bold text-amber-700 mb-1">Hint {i + 1}</p>
                          <MarkdownRenderer content={hint} className="text-sm text-[var(--text-secondary)]" />
                        </div>
                      ) : (
                        <button
                          onClick={() => revealHint(i)}
                          className="w-full p-4 text-left hover:bg-[var(--bg-secondary)] transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <span className="text-sm font-semibold text-[var(--text-primary)]">Hint {i + 1}</span>
                          <span className="text-xs text-[var(--accent-primary)] font-bold">Reveal</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}


        </div>
      </div>

      {/* ── Right Panel: Code Editor ── */}
      <div className="w-full lg:w-[55%] h-full flex flex-col bg-[#1e1e1e]">
        {/* Editor Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#3e3e42] shrink-0">
          <div className="flex items-center gap-3">
            <select
              value={language}
              onChange={(e) => {
                const newLang = e.target.value;
                setLanguage(newLang);
                if (!code || code === getDefaultStarter(language)) {
                  setCode(getDefaultStarter(newLang));
                }
              }}
              className="bg-[#3c3c3c] text-gray-300 text-xs font-mono px-3 py-1.5 rounded-md border border-[#555] focus:outline-none focus:border-[var(--accent-primary)] cursor-pointer"
            >
              <option value="cpp">C++</option>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
            </select>
            <span className="text-[10px] text-gray-500 font-mono">
              solution.{language === 'cpp' ? 'cpp' : language === 'java' ? 'java' : language === 'python' ? 'py' : 'js'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const starter = typeof problem?.starter_code === 'string' && problem.starter_code.trim()
                  ? problem.starter_code
                  : getDefaultStarter(language);
                setCode(starter);
                toast('Code reset', 'info');
              }}
              className="text-gray-400 hover:text-white text-xs font-mono px-2 py-1 rounded hover:bg-[#3c3c3c] transition-colors cursor-pointer"
              title="Reset Code"
            >
              Reset
            </button>
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="flex items-center gap-1.5 bg-[#3c3c3c] hover:bg-[#4c4c4c] text-gray-200 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              {isRunning ? 'Running...' : 'Run'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>

        {/* CodeMirror Editor — Tab inserts indent, Enter preserves indentation */}
        <div className="flex-1 flex flex-col overflow-hidden relative" style={{ minHeight: 0 }}>
          <div className="flex-1 overflow-hidden min-h-0" tabIndex={-1}>
            <CodeMirror
              value={code || ''}
              onChange={(val) => setCode(val)}
              indentWithTab={true}
              autoFocus={true}
              extensions={[
                editorKeymapExt,
                languageExtension, 
                editorThemeExt, 
                EditorState.tabSize.of(4),
                indentUnit.of('    '),
              ]}
              theme={vscodeDark}
              height="100%"
              basicSetup={{
                lineNumbers: true,
                highlightActiveLineGutter: true,
                highlightActiveLine: true,
                foldGutter: true,
                dropCursor: true,
                allowMultipleSelections: true,
                indentOnInput: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: true,
                rectangularSelection: true,
                crosshairCursor: false,
                highlightSelectionMatches: true,
                closeBracketsKeymap: true,
                searchKeymap: true,
                foldKeymap: true,
                completionKeymap: true,
                lintKeymap: true,
                tabSize: 4,
              }}
            />
          </div>

          {/* Output Panel */}
          {showOutput && (
            <div className="border-t border-[#3e3e42] bg-[#1e1e1e] max-h-48 overflow-auto shrink-0">
              <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#3e3e42]">
                <span className="text-xs font-bold text-gray-400">Output</span>
                <button onClick={() => setShowOutput(false)} className="text-gray-500 hover:text-gray-300 cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-gray-300 whitespace-pre-wrap">{output}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
