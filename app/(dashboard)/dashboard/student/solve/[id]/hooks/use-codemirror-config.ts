import { useMemo } from "react";
import type { SupportedLanguage } from "@/lib/execution/types";
import { getCodeMirrorLanguageExtension } from "@/lib/execution/codemirror-language-extension";
import { createEditableCodeMirrorTheme } from "@/lib/execution/codemirror-theme";
import { acceptCompletion, autocompletion } from "@codemirror/autocomplete";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { EditorView, keymap } from "@codemirror/view";
import { indentWithTab, insertNewlineAndIndent } from "@codemirror/commands";
import { EditorState, Prec } from "@codemirror/state";
import { indentUnit } from "@codemirror/language";
import { getLanguageAutocompleteData } from "../utils/editor-autocomplete";

interface UseCodeMirrorConfigOptions {
  language: SupportedLanguage;
}

export function useCodeMirrorConfig(options: UseCodeMirrorConfigOptions) {
  const { language } = options;

  const acceptCompletionOrIndent = useMemo(
    () => (view: EditorView) =>
      acceptCompletion(view) || (indentWithTab.run?.(view) ?? false),
    [],
  );

  const acceptCompletionOrNewline = useMemo(
    () => (view: EditorView) =>
      acceptCompletion(view) || insertNewlineAndIndent(view),
    [],
  );

  const languageExtension = useMemo(
    () => getCodeMirrorLanguageExtension(language),
    [language],
  );

  const editorThemeExt = useMemo(() => createEditableCodeMirrorTheme(), []);

  const editorKeymapExt = useMemo(
    () =>
      Prec.highest(
        keymap.of([
          { key: "Tab", run: acceptCompletionOrIndent },
          indentWithTab,
          {
            key: "Enter",
            run: acceptCompletionOrNewline,
            shift: insertNewlineAndIndent,
          },
        ]),
      ),
    [acceptCompletionOrIndent, acceptCompletionOrNewline],
  );

  const editorTabSizeExt = useMemo(() => EditorState.tabSize.of(4), []);
  const editorIndentUnitExt = useMemo(() => indentUnit.of("    "), []);
  const languageAutocompleteDataExt = useMemo(
    () => getLanguageAutocompleteData(language),
    [language],
  );
  const editorAutocompleteExt = useMemo(
    () => autocompletion({ activateOnTyping: true }),
    [],
  );

  const editorExtensions = useMemo(
    () => [
      editorKeymapExt,
      languageExtension,
      languageAutocompleteDataExt,
      editorAutocompleteExt,
      editorThemeExt,
      editorTabSizeExt,
      editorIndentUnitExt,
    ],
    [
      editorAutocompleteExt,
      editorIndentUnitExt,
      editorKeymapExt,
      editorTabSizeExt,
      editorThemeExt,
      languageAutocompleteDataExt,
      languageExtension,
    ],
  );

  const editorBasicSetup = useMemo(
    () => ({
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
    }),
    [],
  );

  return {
    editorExtensions,
    editorBasicSetup,
    editorTheme: vscodeDark,
  };
}
