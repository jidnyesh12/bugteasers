'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import type { ExecutionPanelResult } from './hooks/use-problem-execution';
import {
  buildInlineOutputDiff,
  getCaseStatusMeta,
  type OutputCaseRow,
  type OutputMeta,
} from './execution-output-utils';
import { SOLVE_EDITOR_LAYOUT_BOUNDS } from '@/lib/state/stores';

const MIN_OUTPUT_PANEL_HEIGHT = SOLVE_EDITOR_LAYOUT_BOUNDS.outputPanel.minHeightPx;
const MAX_OUTPUT_PANEL_HEIGHT = SOLVE_EDITOR_LAYOUT_BOUNDS.outputPanel.maxHeightPx;
const COLLAPSE_SNAP_HEIGHT = SOLVE_EDITOR_LAYOUT_BOUNDS.outputPanel.collapseSnapHeightPx;
const COLLAPSED_DOCK_HEIGHT = SOLVE_EDITOR_LAYOUT_BOUNDS.outputPanel.collapsedDockHeightPx;
const EXPAND_FROM_COLLAPSED_HEIGHT = SOLVE_EDITOR_LAYOUT_BOUNDS.outputPanel.expandFromCollapsedHeightPx;
const KEYBOARD_STEP = SOLVE_EDITOR_LAYOUT_BOUNDS.outputPanel.keyboardStepPx;
const DRAG_INTERVAL = SOLVE_EDITOR_LAYOUT_BOUNDS.outputPanel.dragIntervalPx;
const DEFAULT_OUTPUT_PANEL_HEIGHT = SOLVE_EDITOR_LAYOUT_BOUNDS.outputPanel.defaultHeightPx;

function clampOutputPanelHeight(value: number): number {
  return Math.min(MAX_OUTPUT_PANEL_HEIGHT, Math.max(MIN_OUTPUT_PANEL_HEIGHT, value));
}

function roundToDragInterval(value: number): number {
  return Math.round(value / DRAG_INTERVAL) * DRAG_INTERVAL;
}

interface ExecutionOutputPanelProps {
  showOutput: boolean;
  isCollapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  panelHeight: number;
  onPanelHeightChange: (height: number) => void;
  outputTab: 'testcase' | 'result';
  onOutputTabChange: (tab: 'testcase' | 'result') => void;
  caseRows: OutputCaseRow[];
  selectedCaseIndex: number;
  onSelectCase: (index: number) => void;
  executionResult: ExecutionPanelResult | null;
  outputMeta: OutputMeta;
  scoreLine: string | null;
  runningDetail: string | null;
}

export function ExecutionOutputPanel({
  showOutput,
  isCollapsed,
  onCollapsedChange,
  panelHeight,
  onPanelHeightChange,
  outputTab,
  onOutputTabChange,
  caseRows,
  selectedCaseIndex,
  onSelectCase,
  executionResult,
  outputMeta,
  scoreLine,
  runningDetail,
}: ExecutionOutputPanelProps) {
  const selectedCase = caseRows[selectedCaseIndex] ?? caseRows[0] ?? null;
  const showDiffForCase = selectedCase?.passed === false;
  const inlineDiffParts = showDiffForCase
    ? buildInlineOutputDiff(selectedCase.expected, selectedCase.actual)
    : [];
  const actualDiffParts = inlineDiffParts.filter((part) => part.kind !== 'removed');
  const expectedDiffParts = inlineDiffParts.filter((part) => part.kind !== 'added');

  const [dragPreviewHeight, setDragPreviewHeight] = useState<number | null>(null);
  const lastExpandedHeightRef = useRef(panelHeight);
  const resizeHandleRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [collapsedFloorHeight, setCollapsedFloorHeight] = useState<number>(COLLAPSED_DOCK_HEIGHT);

  const measureCollapsedFloorHeight = useCallback(() => {
    const handleHeight = resizeHandleRef.current?.offsetHeight ?? 0;
    const headerHeight = headerRef.current?.offsetHeight ?? 0;
    const measured = Math.ceil(handleHeight + headerHeight);

    if (measured > 0) {
      setCollapsedFloorHeight(measured);
      return measured;
    }

    return COLLAPSED_DOCK_HEIGHT;
  }, []);

  useEffect(() => {
    const update = () => {
      measureCollapsedFloorHeight();
    };

    update();
    window.addEventListener('resize', update);

    return () => {
      window.removeEventListener('resize', update);
    };
  }, [measureCollapsedFloorHeight]);

  useEffect(() => {
    if (!isCollapsed) {
      lastExpandedHeightRef.current = panelHeight;
    }
  }, [isCollapsed, panelHeight]);

  const activePanelHeight = dragPreviewHeight ?? panelHeight;

  const expandPanel = useCallback((targetHeight: number) => {
    onCollapsedChange(false);
    onPanelHeightChange(clampOutputPanelHeight(targetHeight));
  }, [onCollapsedChange, onPanelHeightChange]);

  const collapsePanel = useCallback(() => {
    onCollapsedChange(true);
  }, [onCollapsedChange]);

  const handleResizeStart = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();

    const minimumVisibleHeight = measureCollapsedFloorHeight();
    const startY = event.clientY;
    const startHeight = isCollapsed ? minimumVisibleHeight : panelHeight;
    let collapsedDuringDrag = isCollapsed;
    let lastRawHeight = startHeight;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const nextRawHeight = roundToDragInterval(startHeight + (startY - moveEvent.clientY));
      lastRawHeight = nextRawHeight;

      if (collapsedDuringDrag) {
        if (nextRawHeight < EXPAND_FROM_COLLAPSED_HEIGHT) {
          return;
        }

        collapsedDuringDrag = false;
        onCollapsedChange(false);
      }

      const previewHeight = Math.min(
        MAX_OUTPUT_PANEL_HEIGHT,
        Math.max(minimumVisibleHeight, nextRawHeight)
      );
      setDragPreviewHeight(previewHeight);
    };

    const onPointerUp = () => {
      document.body.style.removeProperty('user-select');
      document.body.style.removeProperty('cursor');
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      setDragPreviewHeight(null);

      if (lastRawHeight <= COLLAPSE_SNAP_HEIGHT) {
        collapsePanel();
        return;
      }

      expandPanel(lastRawHeight);
    };

    document.body.style.setProperty('user-select', 'none');
    document.body.style.setProperty('cursor', 'row-resize');
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }, [
    collapsePanel,
    expandPanel,
    isCollapsed,
    measureCollapsedFloorHeight,
    onCollapsedChange,
    panelHeight,
  ]);

  const handleResizeHandleKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case 'ArrowUp': {
        event.preventDefault();
        if (isCollapsed) {
          expandPanel(lastExpandedHeightRef.current);
          return;
        }

        expandPanel(panelHeight + KEYBOARD_STEP);
        return;
      }
      case 'ArrowDown': {
        event.preventDefault();
        if (isCollapsed) {
          return;
        }

        const nextHeight = panelHeight - KEYBOARD_STEP;
        if (nextHeight <= COLLAPSE_SNAP_HEIGHT) {
          collapsePanel();
          return;
        }

        expandPanel(nextHeight);
        return;
      }
      case 'Home': {
        event.preventDefault();
        collapsePanel();
        return;
      }
      case 'End': {
        event.preventDefault();
        expandPanel(MAX_OUTPUT_PANEL_HEIGHT);
        return;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        if (isCollapsed) {
          expandPanel(lastExpandedHeightRef.current);
        } else {
          collapsePanel();
        }
        return;
      }
      default:
        return;
    }
  }, [collapsePanel, expandPanel, isCollapsed, panelHeight]);

  const handleResizeHandleDoubleClick = useCallback(() => {
    expandPanel(DEFAULT_OUTPUT_PANEL_HEIGHT);
  }, [expandPanel]);

  const handleTabClick = useCallback((nextTab: 'testcase' | 'result') => {
    onOutputTabChange(nextTab);
    if (isCollapsed) {
      onCollapsedChange(false);
    }
  }, [isCollapsed, onCollapsedChange, onOutputTabChange]);

  if (!showOutput) {
    return null;
  }

  return (
    <div
      className="leetcode-output-panel border-t border-[#3e3e42] bg-[#1e1e1e] shrink-0 flex flex-col"
      style={isCollapsed ? { height: `${collapsedFloorHeight}px` } : { height: `${activePanelHeight}px` }}
    >
      <div
        ref={resizeHandleRef}
        onPointerDown={handleResizeStart}
        onDoubleClick={handleResizeHandleDoubleClick}
        onKeyDown={handleResizeHandleKeyDown}
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize output panel"
        aria-valuemin={0}
        aria-valuemax={MAX_OUTPUT_PANEL_HEIGHT}
        aria-valuenow={isCollapsed ? 0 : Math.round(activePanelHeight)}
        tabIndex={0}
        className={`shrink-0 cursor-row-resize touch-none transition-colors outline-none ${
          isCollapsed
            ? 'h-1.5 bg-[#2a2a2a] hover:bg-[var(--accent-primary)]/55 focus-visible:bg-[var(--accent-primary)]/55'
            : 'h-1.5 bg-[#252526] hover:bg-[var(--accent-primary)]/40 focus-visible:bg-[var(--accent-primary)]/40'
        }`}
        title={isCollapsed ? 'Drag up to expand output panel' : 'Drag to resize output panel'}
      />

      <div ref={headerRef} className={`flex items-center justify-between px-3 py-1.5 bg-[#252526] shrink-0 ${isCollapsed ? '' : 'border-b border-[#3e3e42]'}`}>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleTabClick('testcase')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors cursor-pointer ${
              outputTab === 'testcase'
                ? 'bg-[#3c3c3c] text-gray-100 border border-[#5a5a5a]'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#2a2d32]'
            }`}
          >
            Testcase
          </button>
          <button
            onClick={() => handleTabClick('result')}
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
          <button
            onClick={() => {
              if (isCollapsed) {
                expandPanel(lastExpandedHeightRef.current);
              } else {
                collapsePanel();
              }
            }}
            className="text-gray-400 hover:text-gray-200 cursor-pointer"
            aria-label={isCollapsed ? 'Expand output panel' : 'Collapse output panel'}
            title={isCollapsed ? 'Expand output panel' : 'Collapse output panel'}
          >
            {isCollapsed ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {isCollapsed ? null : outputTab === 'testcase' ? (
        <div className="flex-1 overflow-auto bg-[#1e1e1e] p-4 space-y-3">
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
        <div className="flex-1 overflow-auto bg-[#1e1e1e] p-4 space-y-3">
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

              {executionResult.status !== 'running' && executionResult.status !== 'error' && caseRows.length === 0 && (
                <p className="text-sm text-gray-400">No public testcase details to display for this submission.</p>
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
