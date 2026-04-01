'use client'

import { useMemo } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import type { SupportedLanguage } from '@/lib/execution/types'
import { getCodeMirrorLanguageExtension } from '@/lib/execution/codemirror-language-extension'
import { createReadOnlyCodeMirrorTheme } from '@/lib/execution/codemirror-theme'

interface ReadOnlyCodeViewerProps {
  code: string
  language: SupportedLanguage
  maxHeight?: string
}

export function ReadOnlyCodeViewer({
  code,
  language,
  maxHeight = '420px',
}: ReadOnlyCodeViewerProps) {
  const languageExtension = useMemo(
    () => getCodeMirrorLanguageExtension(language),
    [language]
  )

  const editorThemeExtension = useMemo(
    () => createReadOnlyCodeMirrorTheme(maxHeight),
    [maxHeight]
  )

  return (
    <div className="overflow-hidden rounded-xl border border-amber-200 bg-[#1e1e1e]">
      <CodeMirror
        value={code}
        editable={false}
        theme={vscodeDark}
        extensions={[languageExtension, editorThemeExtension]}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: false,
          highlightActiveLineGutter: false,
          dropCursor: false,
          allowMultipleSelections: false,
          indentOnInput: false,
          bracketMatching: true,
          closeBrackets: false,
          autocompletion: false,
          rectangularSelection: false,
          crosshairCursor: false,
          highlightSelectionMatches: false,
          searchKeymap: false,
          foldKeymap: false,
          lintKeymap: false,
          tabSize: 4,
        }}
      />
    </div>
  )
}