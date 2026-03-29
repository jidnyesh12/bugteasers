'use client';

import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import type { SupportedLanguage } from '@/lib/execution/types';

const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

interface SolveEditorDraftScope {
  userId: string | null;
  problemId: string;
  language: SupportedLanguage;
}

interface SolveEditorPaneScope {
  userId: string | null;
  problemId: string;
}

export interface SolveEditorPaneState {
  leftPaneWidth: number;
  outputPanelHeight: number;
  isOutputCollapsed: boolean;
}

export const SOLVE_EDITOR_LAYOUT_BOUNDS = {
  leftPane: {
    minWidthPercent: 30,
    maxWidthPercent: 70,
    defaultWidthPercent: 45,
  },
  outputPanel: {
    minHeightPx: 96,
    maxHeightPx: 560,
    defaultHeightPx: 240,
    collapseSnapHeightPx: 58,
    collapsedDockHeightPx: 52,
    expandFromCollapsedHeightPx: 64,
    keyboardStepPx: 24,
    dragIntervalPx: 2,
  },
} as const;

export const DEFAULT_SOLVE_EDITOR_PANE_STATE: SolveEditorPaneState = {
  leftPaneWidth: SOLVE_EDITOR_LAYOUT_BOUNDS.leftPane.defaultWidthPercent,
  outputPanelHeight: SOLVE_EDITOR_LAYOUT_BOUNDS.outputPanel.defaultHeightPx,
  isOutputCollapsed: true,
};

interface SolveEditorStoreState {
  drafts: Record<string, string>;
  paneState: Record<string, SolveEditorPaneState>;
  setDraft: (draftKey: string, code: string) => void;
  removeDraft: (draftKey: string) => void;
  setPaneState: (paneKey: string, patch: Partial<SolveEditorPaneState>) => void;
}

function getUserScope(userId: string | null): string {
  return userId ?? 'anonymous';
}

export function buildSolveEditorDraftKey(scope: SolveEditorDraftScope): string {
  const userScope = getUserScope(scope.userId);
  return `solve-editor:draft:v1:${userScope}:${scope.problemId}:${scope.language}`;
}

export function buildSolveEditorPaneKey(scope: SolveEditorPaneScope): string {
  const userScope = getUserScope(scope.userId);
  return `solve-editor:pane:v1:${userScope}:${scope.problemId}`;
}

export const useSolveEditorStore = create<SolveEditorStoreState>()(
  devtools(
    persist(
      (set) => ({
        drafts: {},
        paneState: {},
        setDraft: (draftKey, code) => {
          set((state) => ({
            drafts: {
              ...state.drafts,
              [draftKey]: code,
            },
          }));
        },
        removeDraft: (draftKey) => {
          set((state) => {
            if (!(draftKey in state.drafts)) {
              return state;
            }

            const nextDrafts = { ...state.drafts };
            delete nextDrafts[draftKey];

            return {
              drafts: nextDrafts,
            };
          });
        },
        setPaneState: (paneKey, patch) => {
          set((state) => {
            const current = state.paneState[paneKey] ?? DEFAULT_SOLVE_EDITOR_PANE_STATE;

            return {
              paneState: {
                ...state.paneState,
                [paneKey]: {
                  ...current,
                  ...patch,
                },
              },
            };
          });
        },
      }),
      {
        name: 'solve-editor-store-v1',
        version: 1,
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          drafts: state.drafts,
          paneState: state.paneState,
        }),
      }
    ),
    {
      name: 'solve-editor-store',
      enabled: IS_DEVELOPMENT,
    }
  )
);
