import { python } from '@codemirror/lang-python'
import { java } from '@codemirror/lang-java'
import { cpp } from '@codemirror/lang-cpp'
import type { Extension } from '@codemirror/state'
import type { SupportedLanguage } from './types'

export function getCodeMirrorLanguageExtension(
  language: SupportedLanguage
): Extension {
  switch (language) {
    case 'python':
      return python()
    case 'java':
      return java()
    case 'c':
      return cpp()
    case 'cpp':
    default:
      return cpp()
  }
}