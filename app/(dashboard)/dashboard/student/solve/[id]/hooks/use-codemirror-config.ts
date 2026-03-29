import { useMemo } from 'react';
import type { SupportedLanguage } from '@/lib/execution/types';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { acceptCompletion, autocompletion } from '@codemirror/autocomplete';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { EditorView, keymap } from '@codemirror/view';
import { indentWithTab, insertNewlineAndIndent } from '@codemirror/commands';
import { EditorState, Prec } from '@codemirror/state';
import { indentUnit } from '@codemirror/language';
import { getLanguageAutocompleteData } from '../utils/editor-autocomplete';

interface UseCodeMirrorConfigOptions {
  language: SupportedLanguage;
}

export function useCodeMirrorConfig(options: UseCodeMirrorConfigOptions) {
  const { language } = options;

  const acceptCompletionOrIndent = useMemo(
    () => (view: EditorView) =>
      acceptCompletion(view) || (indentWithTab.run?.(view) ?? false),
    []
  );

  const acceptCompletionOrNewline = useMemo(
    () => (view: EditorView) =>
      acceptCompletion(view) || insertNewlineAndIndent(view),
    []
  );

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
    { key: 'Tab', run: acceptCompletionOrIndent },
    indentWithTab,
    { key: 'Enter', run: acceptCompletionOrNewline, shift: insertNewlineAndIndent },
  ])), [acceptCompletionOrIndent, acceptCompletionOrNewline]);

  const editorTabSizeExt = useMemo(() => EditorState.tabSize.of(4), []);
  const editorIndentUnitExt = useMemo(() => indentUnit.of('    '), []);
  const languageAutocompleteDataExt = useMemo(
    () => getLanguageAutocompleteData(language),
    [language]
  );
  const editorAutocompleteExt = useMemo(
    () => autocompletion({ activateOnTyping: true }),
    []
  );

  const editorExtensions = useMemo(() => [
    editorKeymapExt,
    languageExtension,
    languageAutocompleteDataExt,
    editorAutocompleteExt,
    editorThemeExt,
    editorTabSizeExt,
    editorIndentUnitExt,
  ], [editorAutocompleteExt, editorIndentUnitExt, editorKeymapExt, editorTabSizeExt, editorThemeExt, languageAutocompleteDataExt, languageExtension]);

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
    autocompletion: false,
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
