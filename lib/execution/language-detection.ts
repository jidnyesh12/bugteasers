import type { SupportedLanguage } from './types'

// UI-only heuristic for syntax highlighting. Validation paths should keep
// using compile-based language detection for correctness guarantees.
export function detectSupportedLanguageFromCode(code: string): SupportedLanguage {
  if (!code || code.trim().length === 0) {
    return 'cpp'
  }

  const source = code.trim()
  const lower = source.toLowerCase()

  if (
    /\bdef\s+\w+\s*\(/.test(source) ||
    /\bprint\s*\(/.test(source) ||
    /if\s+__name__\s*==\s*['"]__main__['"]/.test(source) ||
    /\bfrom\s+\w+\s+import\b/.test(source)
  ) {
    return 'python'
  }

  if (
    /\bpublic\s+class\s+\w+/.test(source) ||
    /\bpublic\s+static\s+void\s+main\s*\(/.test(source) ||
    /\bSystem\.out\.print/.test(source) ||
    /\bimport\s+java\./.test(source)
  ) {
    return 'java'
  }

  if (
    /#include\s*<iostream>/.test(lower) ||
    /\busing\s+namespace\s+std\b/.test(source) ||
    /\bstd::\w+/.test(source) ||
    /#include\s*<bits\/stdc\+\+\.h>/.test(lower)
  ) {
    return 'cpp'
  }

  if (
    /#include\s*<stdio\.h>/.test(lower) ||
    /\bprintf\s*\(/.test(source) ||
    /\bscanf\s*\(/.test(source)
  ) {
    return 'c'
  }

  return 'cpp'
}