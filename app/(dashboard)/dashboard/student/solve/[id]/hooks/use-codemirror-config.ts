import { useMemo } from 'react';
import type { SupportedLanguage } from '@/lib/execution/types';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { EditorView, keymap } from '@codemirror/view';
import { indentWithTab, insertNewlineAndIndent } from '@codemirror/commands';
import { EditorState, Prec } from '@codemirror/state';
import { indentUnit } from '@codemirror/language';

interface UseCodeMirrorConfigOptions {
  language: SupportedLanguage;
  onRunShortcut: () => void;
  onSubmitShortcut: () => void;
}

export function useCodeMirrorConfig(options: UseCodeMirrorConfigOptions) {
  const { language, onRunShortcut, onSubmitShortcut } = options;

  const languageExtension = useMemo(() => {
    switch (language) {
      case 'python': return python();
      case 'java': return java();
      case 'cpp': return cpp();
      case 'c': return cpp();
      default: return cpp();
    }
  }, [language]);

  const editorThemeExt = useMemo(() => EditorView.theme({
    '&': { height: '100%', fontSize: '14px' },
    '.cm-scroller': { overflow: 'auto', fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", Consolas, monospace' },
    '.cm-gutters': { background: '#1e1e1e', border: 'none', color: '#858585' },
    '.cm-activeLineGutter': { background: '#2a2d32' },
    '.cm-activeLine': { background: '#2a2d3220' },
    '.cm-selectionBackground': { backgroundColor: '#2f5d86 !important' },
    '&.cm-focused .cm-selectionBackground': { backgroundColor: '#2f5d86 !important' },
    '.cm-content ::selection': { backgroundColor: '#2f5d86', color: '#ffffff' },
  }), []);

  const editorKeymapExt = useMemo(() => Prec.highest(keymap.of([
    indentWithTab,
    { key: 'Enter', run: insertNewlineAndIndent, shift: insertNewlineAndIndent },
  ])), []);

  const editorTabSizeExt = useMemo(() => EditorState.tabSize.of(4), []);
  const editorIndentUnitExt = useMemo(() => indentUnit.of('    '), []);

  const editorShortcutExt = useMemo(() => EditorView.domEventHandlers({
    keydown: (event) => {
      if (
        event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !event.shiftKey &&
        event.key === "'"
      ) {
        event.preventDefault();
        onRunShortcut();
        return true;
      }

      if (
        (event.ctrlKey || event.metaKey) &&
        !event.altKey &&
        event.key === 'Enter'
      ) {
        event.preventDefault();
        onSubmitShortcut();
        return true;
      }

      return false;
    },
  }), [onRunShortcut, onSubmitShortcut]);

  const editorExtensions = useMemo(() => [
    editorKeymapExt,
    languageExtension,
    editorThemeExt,
    editorTabSizeExt,
    editorIndentUnitExt,
    editorShortcutExt,
  ], [editorIndentUnitExt, editorKeymapExt, editorShortcutExt, editorTabSizeExt, editorThemeExt, languageExtension]);

  const editorBasicSetup = useMemo(() => ({
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
  }), []);

  return {
    editorExtensions,
    editorBasicSetup,
    editorTheme: vscodeDark,
  };
}
