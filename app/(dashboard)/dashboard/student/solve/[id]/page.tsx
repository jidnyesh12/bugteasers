'use client';

import {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useShallow } from 'zustand/react/shallow';
import { useAuth } from '@/lib/auth/auth-context';
import { FullPageLoader } from '@/components/ui/loading';
import { useToast } from '@/components/ui/toast';
import type { SupportedLanguage } from '@/lib/execution/types';
import { ProblemDetailsPanel } from './components/problem-details-panel';
import { ProblemLoadErrorView } from './components/problem-load-error-view';
import { SolveEditorToolbar } from './components/solve-editor-toolbar';
import { StableCodeEditor, type StableCodeEditorHandle } from './components/stable-code-editor';
import { ResetCodeDialog } from './components/reset-code-dialog';
import { ExecutionOutputPanel } from './execution-output-panel';
import {
  buildOutputCaseRows,
  formatScoreLine,
  getOutputMeta,
  getRunningDetail,
} from './execution-output-utils';
import { getDefaultStarterCode, normalizeCode } from './utils/editor-code-utils';
import {
  buildSolveEditorDraftKey,
  buildSolveEditorPaneKey,
  DEFAULT_SOLVE_EDITOR_PANE_STATE,
  SOLVE_EDITOR_LAYOUT_BOUNDS,
  useSolveEditorStore,
} from '@/lib/state/stores';
import { normalizeSupportedLanguage } from '@/lib/execution/languages';
import { useCodeMirrorConfig } from './hooks/use-codemirror-config';
import { useProblemLoader } from './hooks/use-problem-loader';
import { useProblemExecution, type ExecutionPanelResult } from './hooks/use-problem-execution';
import {
  useExecutionErrorNotifier,
  useSubmissionResultNotifications,
} from './hooks/use-execution-notifications';
import {
  useProblemSubmissionDisplay,
  type PendingSubmissionMeta,
} from './hooks/use-problem-submission-display';
import { useProblemSubmissions } from './hooks/use-problem-submissions';
import { useSolveKeyboardShortcuts } from './hooks/use-solve-keyboard-shortcuts';
import { useSolveEditorState } from './hooks/use-solve-editor-state';
import type { ProblemSubmissionDisplayItem } from '@/lib/submissions/view-types';

export default function SolveProblemPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { profile, loading: authLoading, initialized } = useAuth();
  const { toast } = useToast();

  const layoutRef = useRef<HTMLDivElement | null>(null);
  const editorHandleRef = useRef<StableCodeEditorHandle | null>(null);
  const editorPanelRef = useRef<HTMLDivElement | null>(null);
  const [dialogContainer, setDialogContainer] = useState<HTMLElement | null>(null);

  const handleEditorPanelRef = useCallback((node: HTMLDivElement | null) => {
    editorPanelRef.current = node;
    setDialogContainer(node);
  }, []);
  const {
    codeRef,
    editorSeed,
    language,
    setLanguage,
    handleCodeChange,
    setEditorContent,
    setInitialEditorContent,
  } = useSolveEditorState(editorHandleRef);

  const {
    problem,
    isLoading,
    loadError,
    loadProblem,
  } = useProblemLoader({
    problemId: params.id,
    setInitialEditorContent,
    toast,
  });

  const [outputTab, setOutputTab] = useState<'testcase' | 'result'>('result');
  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [pendingSubmissionMeta, setPendingSubmissionMeta] = useState<PendingSubmissionMeta | null>(null);
  const [pendingSubmissionLoad, setPendingSubmissionLoad] = useState<{
    language: SupportedLanguage;
    code: string;
  } | null>(null);
  const pendingSubmissionNeedsBaseRemountRef = useRef(false);

  const assignmentId = searchParams.get('assignmentId') || undefined;
  const paneStorageKey = useMemo(() => buildSolveEditorPaneKey({
    userId: profile?.id ?? null,
    problemId: params.id,
  }), [params.id, profile?.id]);

  const draftStorageKey = useMemo(() => buildSolveEditorDraftKey({
    userId: profile?.id ?? null,
    problemId: params.id,
    language,
  }), [language, params.id, profile?.id]);

  const {
    paneState,
    draftCode,
    setDraft,
    setPaneState,
  } = useSolveEditorStore(
    useShallow((state) => ({
      paneState: state.paneState[paneStorageKey] ?? DEFAULT_SOLVE_EDITOR_PANE_STATE,
      draftCode: state.drafts[draftStorageKey],
      setDraft: state.setDraft,
      setPaneState: state.setPaneState,
    }))
  );

  const handlePaneResizeStart = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const layoutElement = layoutRef.current;
    if (!layoutElement) {
      return;
    }

    const startX = event.clientX;
    const startWidth = paneState.leftPaneWidth;
    const layoutWidth = layoutElement.getBoundingClientRect().width;

    if (layoutWidth <= 0) {
      return;
    }

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaPercent = ((moveEvent.clientX - startX) / layoutWidth) * 100;
      const nextWidth = Math.min(
        SOLVE_EDITOR_LAYOUT_BOUNDS.leftPane.maxWidthPercent,
        Math.max(SOLVE_EDITOR_LAYOUT_BOUNDS.leftPane.minWidthPercent, startWidth + deltaPercent)
      );
      setPaneState(paneStorageKey, { leftPaneWidth: nextWidth });
    };

    const onPointerUp = () => {
      document.body.style.removeProperty('user-select');
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    document.body.style.setProperty('user-select', 'none');
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }, [paneState.leftPaneWidth, paneStorageKey, setPaneState]);

  const layoutStyle = useMemo(() => ({
    '--solve-left-pane-width': `${paneState.leftPaneWidth}%`,
  } as CSSProperties), [paneState.leftPaneWidth]);

  const getCurrentCode = useCallback(() => codeRef.current, [codeRef]);
  const handleExecutionError = useExecutionErrorNotifier(toast);
  const handleExecutionResult = useCallback((nextResult: ExecutionPanelResult) => {
    if (nextResult.status === 'passed') {
      setSelectedCaseIndex(Math.max(nextResult.results.length - 1, 0));
      return;
    }

    setSelectedCaseIndex(0);
  }, []);

  const {
    isRunning,
    isSubmitting,
    executionResult,
    showOutput,
    runCode,
    submitCode,
  } = useProblemExecution({
    problemId: params.id,
    getCode: getCurrentCode,
    language,
    assignmentId,
    onExecutionError: handleExecutionError,
    onResultReady: handleExecutionResult,
  });

  useSubmissionResultNotifications({ executionResult, toast });

  const {
    submissions,
    isLoading: isSubmissionsLoading,
    loadError: submissionsError,
    loadSubmissions,
  } = useProblemSubmissions({
    problemId: params.id,
    assignmentId,
    enabled: Boolean(profile?.id) && Boolean(problem),
    refreshToken: executionResult?.mode === 'submit' ? executionResult.submissionId ?? null : null,
  });

  useEffect(() => {
    if (!initialized || authLoading) return;
    if (!profile) { router.replace('/login'); return; }
    if (profile.role !== 'student') { router.replace('/dashboard/instructor'); return; }
  }, [profile, authLoading, initialized, router]);

  useEffect(() => {
    if (profile?.role === 'student') {
      void loadProblem();
    }
  }, [profile?.role, loadProblem]);

  const handleRunClick = useCallback(() => {
    setOutputTab('result');
    setPaneState(paneStorageKey, { isOutputCollapsed: false });
    void runCode();
  }, [paneStorageKey, runCode, setPaneState]);

  const handleSubmitClick = useCallback(() => {
    setPendingSubmissionMeta({
      code: codeRef.current,
      language,
      submittedAt: new Date().toISOString(),
    });
    setOutputTab('result');
    setPaneState(paneStorageKey, { isOutputCollapsed: false });
    void submitCode();
  }, [codeRef, language, paneStorageKey, setPaneState, submitCode]);

  useSolveKeyboardShortcuts({
    onRunShortcut: handleRunClick,
    onSubmitShortcut: handleSubmitClick,
  });

  const handleLanguageChange = useCallback((newLanguage: SupportedLanguage) => {
    if (newLanguage === language) {
      return;
    }

    setDraft(draftStorageKey, codeRef.current);
    setLanguage(newLanguage);
  }, [codeRef, draftStorageKey, language, setDraft, setLanguage]);

  const handleEditorCodeChange = useCallback((nextCode: string) => {
    handleCodeChange(nextCode);
    setDraft(draftStorageKey, nextCode);
  }, [draftStorageKey, handleCodeChange, setDraft]);

  const {
    editorExtensions,
    editorBasicSetup,
    editorTheme,
  } = useCodeMirrorConfig({
    language,
  });

  const getStarterCode = useCallback((targetLanguage: SupportedLanguage) => {
    const hasProblemStarter = typeof problem?.starter_code === 'string' && problem.starter_code.trim();

    if (targetLanguage === 'cpp' && hasProblemStarter) {
      return problem.starter_code;
    }

    return getDefaultStarterCode(targetLanguage);
  }, [problem]);

  useEffect(() => {
    if (!problem) {
      return;
    }

    const nextCode = draftCode ?? getStarterCode(language);
    const shouldRemountBaseForPendingSubmission = pendingSubmissionNeedsBaseRemountRef.current;

    if (!shouldRemountBaseForPendingSubmission && codeRef.current === nextCode) {
      return;
    }

    setEditorContent(nextCode, 'remount');

    if (shouldRemountBaseForPendingSubmission) {
      pendingSubmissionNeedsBaseRemountRef.current = false;
    }
  }, [codeRef, draftCode, getStarterCode, language, problem, setEditorContent]);

  const handleEditorReady = useCallback(() => {
    if (
      !pendingSubmissionLoad ||
      pendingSubmissionLoad.language !== language ||
      pendingSubmissionNeedsBaseRemountRef.current
    ) {
      return;
    }

    setEditorContent(pendingSubmissionLoad.code, 'replace');
    setPendingSubmissionLoad(null);
  }, [language, pendingSubmissionLoad, setEditorContent]);

  const resetToStarterCode = useCallback(() => {
    const starter = getStarterCode(language);
    setEditorContent(starter, 'replace');
    setDraft(draftStorageKey, starter);
  }, [draftStorageKey, getStarterCode, language, setDraft, setEditorContent]);

  const handleCancelReset = useCallback(() => {
    setIsResetModalOpen(false);
    editorHandleRef.current?.focus();
  }, []);

  const handleResetModalOpenChange = useCallback((open: boolean) => {
    setIsResetModalOpen(open);

    if (!open) {
      editorHandleRef.current?.focus();
    }
  }, []);

  const handleConfirmReset = useCallback(() => {
    setIsResetModalOpen(false);
    resetToStarterCode();
  }, [resetToStarterCode]);

  const handleResetClick = useCallback(() => {
    const starter = getStarterCode(language);

    const currentCode = codeRef.current;
    const hasUserEdits = normalizeCode(currentCode) !== normalizeCode(starter);

    if (hasUserEdits) {
      setIsResetModalOpen(true);
      return;
    }

    resetToStarterCode();
  }, [codeRef, getStarterCode, language, resetToStarterCode]);

  const handleLoadSubmissionCode = useCallback((submission: ProblemSubmissionDisplayItem) => {
    const targetLanguage = normalizeSupportedLanguage(submission.language);
    if (!targetLanguage) {
      toast(`Cannot load submission: unsupported language \"${submission.language}\".`, 'warning');
      return;
    }

    // Preserve current editor work before switching to another language submission.
    if (targetLanguage !== language) {
      setDraft(draftStorageKey, codeRef.current);
      pendingSubmissionNeedsBaseRemountRef.current = true;
      setPendingSubmissionLoad({
        language: targetLanguage,
        code: submission.code,
      });
      setLanguage(targetLanguage);
      return;
    }

    pendingSubmissionNeedsBaseRemountRef.current = false;
    setPendingSubmissionLoad(null);
    setEditorContent(submission.code, 'replace');
  }, [
    codeRef,
    draftStorageKey,
    language,
    setPendingSubmissionLoad,
    setDraft,
    setEditorContent,
    setLanguage,
    toast,
  ]);

  const submissionsForDisplay = useProblemSubmissionDisplay({
    submissions,
    executionResult,
    isSubmitting,
    pendingSubmissionMeta,
  });

  const caseRows = useMemo(
    () => buildOutputCaseRows(problem?.test_cases, executionResult),
    [executionResult, problem?.test_cases]
  );
  const displayedCaseIndex = caseRows.length === 0
    ? 0
    : Math.min(selectedCaseIndex, caseRows.length - 1);

  const outputMeta = useMemo(() => getOutputMeta(executionResult), [executionResult]);
  const scoreLine = useMemo(() => formatScoreLine(executionResult?.score), [executionResult?.score]);
  const runningDetail = useMemo(
    () => getRunningDetail(executionResult, outputMeta),
    [executionResult, outputMeta]
  );

  if (!initialized || authLoading || !profile || isLoading) return <FullPageLoader />;
  if (loadError) {
    return (
      <ProblemLoadErrorView
        message={loadError}
        onRetry={() => {
          void loadProblem();
        }}
        onBack={() => router.back()}
      />
    );
  }
  if (!problem) return null;

  return (
    <div
      ref={layoutRef}
      className="h-[calc(100vh-3.5rem)] flex flex-col lg:flex-row overflow-hidden"
      style={layoutStyle}
    >
      <ProblemDetailsPanel
        problem={problem}
        onBack={() => router.back()}
        submissions={submissionsForDisplay}
        isSubmissionsLoading={isSubmissionsLoading}
        submissionsError={submissionsError}
        onRetrySubmissions={() => {
          void loadSubmissions();
        }}
        onLoadSubmissionCode={handleLoadSubmissionCode}
      />

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize problem and editor panes"
        onPointerDown={handlePaneResizeStart}
        className="hidden lg:block lg:w-1.5 lg:shrink-0 cursor-col-resize bg-[var(--border-primary)]/90 hover:bg-[var(--accent-primary)]/50 transition-colors"
      />

      {/* ── Right Panel: Code Editor ── */}
      <div className="w-full lg:flex-1 h-full flex flex-col bg-[#1e1e1e]">
        <SolveEditorToolbar
          language={language}
          onLanguageChange={handleLanguageChange}
          onReset={handleResetClick}
          onRun={handleRunClick}
          onSubmit={handleSubmitClick}
          isRunning={isRunning}
          isSubmitting={isSubmitting}
        />

        {/* CodeMirror Editor — Tab inserts indent, Enter preserves indentation */}
        <div ref={handleEditorPanelRef} className="flex-1 flex flex-col overflow-hidden relative" style={{ minHeight: 0 }}>
          <div className="flex-1 overflow-auto min-h-0" tabIndex={-1}>
            <StableCodeEditor
              key={`editor-${editorSeed.version}`}
              ref={editorHandleRef}
              seedValue={editorSeed.value}
              onCodeChange={handleEditorCodeChange}
              onReady={handleEditorReady}
              extensions={editorExtensions}
              theme={editorTheme}
              basicSetup={editorBasicSetup}
            />
          </div>

          <ExecutionOutputPanel
            showOutput={showOutput}
            isCollapsed={paneState.isOutputCollapsed}
            onCollapsedChange={(collapsed) => {
              setPaneState(paneStorageKey, { isOutputCollapsed: collapsed });
            }}
            panelHeight={paneState.outputPanelHeight}
            onPanelHeightChange={(height) => {
              setPaneState(paneStorageKey, { outputPanelHeight: height });
            }}
            outputTab={outputTab}
            onOutputTabChange={setOutputTab}
            caseRows={caseRows}
            selectedCaseIndex={displayedCaseIndex}
            onSelectCase={setSelectedCaseIndex}
            executionResult={executionResult}
            outputMeta={outputMeta}
            scoreLine={scoreLine}
            runningDetail={runningDetail}
          />

          <ResetCodeDialog
            open={isResetModalOpen}
            container={dialogContainer}
            onOpenChange={handleResetModalOpenChange}
            onCancel={handleCancelReset}
            onConfirm={handleConfirmReset}
            onRestoreFocus={() => editorHandleRef.current?.focus()}
          />
        </div>
      </div>
    </div>
  );
}
