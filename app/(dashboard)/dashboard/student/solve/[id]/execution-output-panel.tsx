'use client';

import type { ExecutionPanelResult } from './hooks/use-problem-execution';
import {
  buildInlineOutputDiff,
  getCaseStatusMeta,
  type OutputCaseRow,
  type OutputMeta,
} from './execution-output-utils';

interface ExecutionOutputPanelProps {
  showOutput: boolean;
  outputTab: 'testcase' | 'result';
  onOutputTabChange: (tab: 'testcase' | 'result') => void;
  caseRows: OutputCaseRow[];
  selectedCaseIndex: number;
  onSelectCase: (index: number) => void;
  executionResult: ExecutionPanelResult | null;
  outputMeta: OutputMeta;
  scoreLine: string | null;
  runningDetail: string | null;
  onClose: () => void;
}

export function ExecutionOutputPanel({
  showOutput,
  outputTab,
  onOutputTabChange,
  caseRows,
  selectedCaseIndex,
  onSelectCase,
  executionResult,
  outputMeta,
  scoreLine,
  runningDetail,
  onClose,
}: ExecutionOutputPanelProps) {
  if (!showOutput) {
    return null;
  }

  const selectedCase = caseRows[selectedCaseIndex] ?? caseRows[0] ?? null;
  const showDiffForCase = selectedCase?.passed === false;
  const inlineDiffParts = showDiffForCase
    ? buildInlineOutputDiff(selectedCase.expected, selectedCase.actual)
    : [];
  const actualDiffParts = inlineDiffParts.filter((part) => part.kind !== 'removed');
  const expectedDiffParts = inlineDiffParts.filter((part) => part.kind !== 'added');

  return (
    <div className="leetcode-output-panel border-t border-[#3e3e42] bg-[#1e1e1e] shrink-0">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#252526] border-b border-[#3e3e42]">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onOutputTabChange('testcase')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors cursor-pointer ${
              outputTab === 'testcase'
                ? 'bg-[#3c3c3c] text-gray-100 border border-[#5a5a5a]'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#2a2d32]'
            }`}
          >
            Testcase
          </button>
          <button
            onClick={() => onOutputTabChange('result')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors cursor-pointer ${
              outputTab === 'result'
                ? 'bg-[#3c3c3c] text-gray-100 border border-[#5a5a5a]'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#2a2d32]'
            }`}
          >
            Test Result
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 cursor-pointer" aria-label="Close output panel">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {outputTab === 'testcase' ? (
        <div className="max-h-64 overflow-auto bg-[#1e1e1e] p-4 space-y-3">
          {caseRows.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-2">
                {caseRows.map((caseRow, index) => (
                  <button
                    key={caseRow.key}
                    onClick={() => onSelectCase(index)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                      selectedCaseIndex === index
                        ? 'bg-[#3c3c3c] border-[#5a5a5a] text-gray-100'
                        : 'bg-[#252526] border-[#3e3e42] text-gray-300 hover:bg-[#2d2d2d]'
                    }`}
                  >
                    {caseRow.label}
                  </button>
                ))}
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">Input</p>
                <pre className="rounded border border-[#3e3e42] bg-[#252526] p-3 text-[12px] leading-5 font-mono text-gray-100 whitespace-pre-wrap">
                  {selectedCase?.input || 'No testcase input available.'}
                </pre>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">Expected Output</p>
                <pre className="rounded border border-[#3e3e42] bg-[#252526] p-3 text-[12px] leading-5 font-mono text-gray-100 whitespace-pre-wrap">
                  {selectedCase?.expected || 'No expected output available.'}
                </pre>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400">No testcase data available.</p>
          )}
        </div>
      ) : (
        <div className="max-h-64 overflow-auto bg-[#1e1e1e] p-4 space-y-3">
          {!executionResult ? (
            <p className="text-sm text-gray-400">Run or Submit to view test results.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`text-xl font-bold ${outputMeta.tone === 'passed' ? 'text-emerald-300' : outputMeta.tone === 'failed' ? 'text-rose-300' : outputMeta.tone === 'partial' ? 'text-amber-300' : outputMeta.tone === 'error' ? 'text-red-300' : 'text-slate-300'}`}>
                  {outputMeta.title}
                </span>
                {scoreLine && (
                  <span className="text-xs text-gray-400">{scoreLine}</span>
                )}
              </div>

              {executionResult.mode === 'submit' && executionResult.submissionId && (
                <p className="text-xs text-gray-400">Submission ID: {executionResult.submissionId}</p>
              )}

              {executionResult.message && executionResult.status === 'error' && (
                <pre className="rounded border border-red-500/40 bg-red-500/10 p-3 text-[12px] leading-5 font-mono text-red-200 whitespace-pre-wrap">
                  {executionResult.message}
                </pre>
              )}

              {executionResult.status !== 'running' && executionResult.status !== 'error' && caseRows.length > 0 && (
                <>
                  <div className="flex flex-wrap gap-2">
                    {caseRows.map((caseRow, index) => {
                      const statusMeta = getCaseStatusMeta(caseRow.passed);

                      return (
                        <button
                          key={caseRow.key}
                          onClick={() => onSelectCase(index)}
                          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                            selectedCaseIndex === index
                              ? 'bg-[#3c3c3c] border-[#5a5a5a] text-gray-100'
                              : 'bg-[#252526] border-[#3e3e42] text-gray-300 hover:bg-[#2d2d2d]'
                          } ${caseRow.passed === false && selectedCaseIndex !== index ? 'border-rose-500/40' : ''}`}
                        >
                          <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-black ${statusMeta.iconClass}`}>
                            {statusMeta.icon}
                          </span>
                          <span>{caseRow.label}</span>
                          <span className="sr-only">{statusMeta.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {selectedCase && (
                    <div className="space-y-2">
                      {selectedCase.error && (
                        <pre className="rounded border border-red-500/40 bg-red-500/10 p-3 text-[12px] leading-5 font-mono text-red-200 whitespace-pre-wrap">
                          {selectedCase.error}
                        </pre>
                      )}
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">Input</p>
                        <pre className="rounded border border-[#3e3e42] bg-[#252526] p-3 text-[12px] leading-5 font-mono text-gray-100 whitespace-pre-wrap">
                          {selectedCase.input || '(empty)'}
                        </pre>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">Your Output</p>
                        {showDiffForCase && inlineDiffParts.length > 0 ? (
                          <pre className="rounded border border-[#3e3e42] bg-[#252526] p-3 text-[12px] leading-5 font-mono text-gray-100 whitespace-pre-wrap">
                            {actualDiffParts.length > 0 ? (
                              actualDiffParts.map((part, index) => (
                                <span
                                  key={`actual-${part.kind}-${index}`}
                                  className={part.kind === 'added' ? 'text-rose-300 font-semibold' : 'text-gray-100'}
                                >
                                  {part.value}
                                </span>
                              ))
                            ) : (
                              '(empty)'
                            )}
                          </pre>
                        ) : (
                          <pre className="rounded border border-[#3e3e42] bg-[#252526] p-3 text-[12px] leading-5 font-mono text-gray-100 whitespace-pre-wrap">
                            {selectedCase.actual || '(empty)'}
                          </pre>
                        )}
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">Expected Output</p>
                        {showDiffForCase && inlineDiffParts.length > 0 ? (
                          <pre className="rounded border border-[#3e3e42] bg-[#252526] p-3 text-[12px] leading-5 font-mono text-gray-100 whitespace-pre-wrap">
                            {expectedDiffParts.length > 0 ? (
                              expectedDiffParts.map((part, index) => (
                                <span
                                  key={`expected-${part.kind}-${index}`}
                                  className={part.kind === 'removed' ? 'text-emerald-300 font-semibold' : 'text-gray-100'}
                                >
                                  {part.value}
                                </span>
                              ))
                            ) : (
                              '(empty)'
                            )}
                          </pre>
                        ) : (
                          <pre className="rounded border border-[#3e3e42] bg-[#252526] p-3 text-[12px] leading-5 font-mono text-gray-100 whitespace-pre-wrap">
                            {selectedCase.expected || '(empty)'}
                          </pre>
                        )}
                      </div>
                      {selectedCase.pointsText && (
                        <p className="text-xs text-gray-400">Points: {selectedCase.pointsText}</p>
                      )}
                    </div>
                  )}
                </>
              )}

              {runningDetail && (
                <p className="text-sm text-gray-300">{runningDetail}</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
