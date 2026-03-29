import { completeFromList, snippetCompletion, type Completion } from '@codemirror/autocomplete';
import { cppLanguage } from '@codemirror/lang-cpp';
import { javaLanguage } from '@codemirror/lang-java';
import { pythonLanguage } from '@codemirror/lang-python';
import type { Extension } from '@codemirror/state';
import type { SupportedLanguage } from '@/lib/execution/types';

const PYTHON_COMPLETIONS: Completion[] = [
  { label: 'def', type: 'keyword' },
  { label: 'class', type: 'keyword' },
  { label: 'import', type: 'keyword' },
  { label: 'print', type: 'function' },
  { label: 'input', type: 'function' },
  { label: 'len', type: 'function' },
  { label: 'range', type: 'function' },
  snippetCompletion('for ${1:item} in ${2:items}:\n    ${3:pass}', {
    label: 'forin',
    detail: 'for-in loop',
    type: 'snippet',
  }),
  snippetCompletion('if ${1:condition}:\n    ${2:pass}', {
    label: 'if',
    detail: 'if block',
    type: 'snippet',
  }),
  snippetCompletion('if __name__ == "__main__":\n    ${1:solve()}', {
    label: 'ifmain',
    detail: 'entrypoint',
    type: 'snippet',
  }),
];

const JAVA_COMPLETIONS: Completion[] = [
  { label: 'public', type: 'keyword' },
  { label: 'private', type: 'keyword' },
  { label: 'static', type: 'keyword' },
  { label: 'class', type: 'keyword' },
  { label: 'void', type: 'keyword' },
  { label: 'int', type: 'keyword' },
  { label: 'long', type: 'keyword' },
  { label: 'String', type: 'class' },
  { label: 'System.out.println', type: 'function' },
  snippetCompletion('for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3:// TODO}\n}', {
    label: 'fori',
    detail: 'indexed for loop',
    type: 'snippet',
  }),
  snippetCompletion('while (${1:condition}) {\n    ${2:// TODO}\n}', {
    label: 'while',
    detail: 'while loop',
    type: 'snippet',
  }),
  snippetCompletion('BufferedReader ${1:br} = new BufferedReader(new InputStreamReader(System.in));', {
    label: 'br',
    detail: 'buffered reader',
    type: 'snippet',
  }),
];

const CPP_COMPLETIONS: Completion[] = [
  { label: 'int', type: 'keyword' },
  { label: 'long long', type: 'keyword' },
  { label: 'vector', type: 'class' },
  { label: 'string', type: 'class' },
  { label: 'if', type: 'keyword' },
  { label: 'else', type: 'keyword' },
  { label: 'while', type: 'keyword' },
  { label: 'cin', type: 'variable' },
  { label: 'cout', type: 'variable' },
  snippetCompletion('for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3:// TODO}\n}', {
    label: 'fori',
    detail: 'indexed for loop',
    type: 'snippet',
  }),
  snippetCompletion('ios::sync_with_stdio(false);\ncin.tie(nullptr);', {
    label: 'fastio',
    detail: 'fast input/output',
    type: 'snippet',
  }),
];

const C_COMPLETIONS: Completion[] = [
  { label: 'int', type: 'keyword' },
  { label: 'long', type: 'keyword' },
  { label: 'char', type: 'keyword' },
  { label: 'if', type: 'keyword' },
  { label: 'else', type: 'keyword' },
  { label: 'while', type: 'keyword' },
  { label: 'printf', type: 'function' },
  { label: 'scanf', type: 'function' },
  snippetCompletion('for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3:// TODO}\n}', {
    label: 'fori',
    detail: 'indexed for loop',
    type: 'snippet',
  }),
  snippetCompletion('while (${1:condition}) {\n    ${2:// TODO}\n}', {
    label: 'while',
    detail: 'while loop',
    type: 'snippet',
  }),
];

const LANGUAGE_COMPLETION_SOURCES = {
  python: completeFromList(PYTHON_COMPLETIONS),
  java: completeFromList(JAVA_COMPLETIONS),
  cpp: completeFromList(CPP_COMPLETIONS),
  c: completeFromList(C_COMPLETIONS),
} as const;

export function getLanguageAutocompleteData(language: SupportedLanguage): Extension {
  const source = LANGUAGE_COMPLETION_SOURCES[language];

  switch (language) {
    case 'python':
      return pythonLanguage.data.of({ autocomplete: source });
    case 'java':
      return javaLanguage.data.of({ autocomplete: source });
    case 'cpp':
    case 'c':
      return cppLanguage.data.of({ autocomplete: source });
    default:
      return cppLanguage.data.of({ autocomplete: source });
  }
}