import type { ScoreResult } from '@/lib/execution/types';
import type { ExecutionPanelResult } from './hooks/use-problem-execution';
import { buildInlineOutputDiff } from './utils/output-inline-diff';
import type { OutputInlineDiffPart } from './utils/output-inline-diff';

export interface ProblemTestCaseSource {
  id: string;
  input_data: string;
  expected_output: string;
  is_sample: boolean;
}

export interface OutputCaseRow {
  key: string;
  label: string;
  input: string;
  expected: string;
  actual: string;
  passed?: boolean;
  error?: string;
  pointsText?: string;
}

export interface OutputMeta {
  label: string;
  title: string;
  subtitle: string | null;
  tone: 'idle' | 'running' | 'passed' | 'partial' | 'failed' | 'error';
}

export interface CaseStatusMeta {
  icon: string;
  label: string;
  iconClass: string;
  labelClass: string;
}

export function buildOutputCaseRows(
  testCases: ProblemTestCaseSource[] | undefined,
  executionResult: ExecutionPanelResult | null
): OutputCaseRow[] {
  const allCases = testCases ?? [];
  const sampleCases = allCases.filter((testCase) => testCase.is_sample);
  const baseCases = executionResult
    ? executionResult.mode === 'run'
      ? (sampleCases.length > 0 ? sampleCases : allCases)
      : allCases
    : (sampleCases.length > 0 ? sampleCases : allCases);

  const results = executionResult?.results ?? [];
  const itemCount = Math.max(baseCases.length, results.length);

  return Array.from({ length: itemCount }, (_, index) => {
    const baseCase = baseCases[index];
    const result = results[index];

    return {
      key: baseCase?.id ?? result?.testCaseId ?? `case-${index + 1}`,
      label: `Case ${index + 1}`,
      input: baseCase?.input_data ?? '',
      expected: result?.expectedOutput ?? baseCase?.expected_output ?? '',
      actual: result?.actualOutput ?? '',
      passed: result?.passed,
      error: result?.error,
      pointsText: result ? `${result.pointsEarned}/${result.pointsAvailable}` : undefined,
    };
  });
}

export function getOutputMeta(executionResult: ExecutionPanelResult | null): OutputMeta {
  if (!executionResult) {
    return {
      label: 'No Result',
      title: 'Run your code to view results',
      subtitle: null,
      tone: 'idle',
    };
  }

  if (executionResult.status === 'running') {
    return {
      label: 'Running',
      title: 'Running...',
      subtitle: executionResult.message || null,
      tone: 'running',
    };
  }

  if (executionResult.status === 'passed') {
    return {
      label: 'Accepted',
      title: 'Accepted',
      subtitle: null,
      tone: 'passed',
    };
  }

  if (executionResult.status === 'partial') {
    return {
      label: 'Partial',
      title: 'Partially Accepted',
      subtitle: null,
      tone: 'partial',
    };
  }

  if (executionResult.status === 'failed') {
    return {
      label: 'Failed',
      title: 'Wrong Answer',
      subtitle: null,
      tone: 'failed',
    };
  }

  return {
    label: 'Error',
    title: 'Execution Error',
    subtitle: null,
    tone: 'error',
  };
}

export function getCaseStatusMeta(passed?: boolean): CaseStatusMeta {
  if (passed === true) {
    return {
      icon: '✓',
      label: 'Passed',
      iconClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40',
      labelClass: 'text-emerald-300',
    };
  }

  if (passed === false) {
    return {
      icon: '✕',
      label: 'Failed',
      iconClass: 'bg-rose-500/20 text-rose-300 border border-rose-400/40',
      labelClass: 'text-rose-300',
    };
  }

  return {
    icon: '•',
    label: 'Pending',
    iconClass: 'bg-slate-500/20 text-slate-300 border border-slate-400/40',
    labelClass: 'text-slate-300',
  };
}

export function formatScoreLine(score?: ScoreResult): string | null {
  if (!score) {
    return null;
  }

  return `Score: ${score.earnedPoints}/${score.totalPoints} (${score.percentage.toFixed(2)}%) - ${score.status.toUpperCase()}`;
}

export function getRunningDetail(
  executionResult: ExecutionPanelResult | null,
  outputMeta: OutputMeta
): string | null {
  if (
    executionResult?.status === 'running' &&
    outputMeta.subtitle &&
    outputMeta.subtitle !== outputMeta.title
  ) {
    return outputMeta.subtitle;
  }

  return null;
}

export { buildInlineOutputDiff };
export type { OutputInlineDiffPart };
