'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
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
import { useCodeMirrorConfig } from './hooks/use-codemirror-config';
import { useProblemLoader } from './hooks/use-problem-loader';
import { useProblemExecution, type ExecutionPanelResult } from './hooks/use-problem-execution';
import { useSolveEditorState } from './hooks/use-solve-editor-state';

export default function SolveProblemPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { profile, loading: authLoading, initialized } = useAuth();
  const { toast } = useToast();

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

  const assignmentId = searchParams.get('assignmentId') || undefined;
  const getCurrentCode = useCallback(() => codeRef.current, [codeRef]);
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
    closeOutput,
  } = useProblemExecution({
    problemId: params.id,
    getCode: getCurrentCode,
    language,
    assignmentId,
    toast,
    onResultReady: handleExecutionResult,
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
    void runCode();
  }, [runCode]);

  const handleSubmitClick = useCallback(() => {
    setOutputTab('result');
    void submitCode();
  }, [submitCode]);

  const handleLanguageChange = useCallback((newLanguage: SupportedLanguage) => {
    const currentCode = codeRef.current;
    setLanguage(newLanguage);

    if (!currentCode || normalizeCode(currentCode) === normalizeCode(getDefaultStarterCode(language))) {
      const nextStarter = getDefaultStarterCode(newLanguage);
      setEditorContent(nextStarter, 'remount');
    }
  }, [codeRef, language, setEditorContent, setLanguage]);

  const {
    editorExtensions,
    editorBasicSetup,
    editorTheme,
  } = useCodeMirrorConfig({
    language,
    onRunShortcut: handleRunClick,
    onSubmitShortcut: handleSubmitClick,
  });

  const getStarterCode = useCallback((targetLanguage: SupportedLanguage) => {
    return typeof problem?.starter_code === 'string' && problem.starter_code.trim()
      ? problem.starter_code
      : getDefaultStarterCode(targetLanguage);
  }, [problem]);

  const resetToStarterCode = useCallback(() => {
    const starter = getStarterCode(language);
    setEditorContent(starter, 'replace');
  }, [getStarterCode, language, setEditorContent]);

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
    <div className="h-[calc(100vh-3.5rem)] flex flex-col lg:flex-row overflow-hidden">
      <ProblemDetailsPanel problem={problem} onBack={() => router.back()} />

      {/* ── Right Panel: Code Editor ── */}
      <div className="w-full lg:w-[55%] h-full flex flex-col bg-[#1e1e1e]">
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
          <div className="flex-1 overflow-hidden min-h-0" tabIndex={-1}>
            <StableCodeEditor
              key={`editor-${editorSeed.version}`}
              ref={editorHandleRef}
              seedValue={editorSeed.value}
              onCodeChange={handleCodeChange}
              extensions={editorExtensions}
              theme={editorTheme}
              basicSetup={editorBasicSetup}
            />
          </div>

          <ExecutionOutputPanel
            showOutput={showOutput}
            outputTab={outputTab}
            onOutputTabChange={setOutputTab}
            caseRows={caseRows}
            selectedCaseIndex={displayedCaseIndex}
            onSelectCase={setSelectedCaseIndex}
            executionResult={executionResult}
            outputMeta={outputMeta}
            scoreLine={scoreLine}
            runningDetail={runningDetail}
            onClose={closeOutput}
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
