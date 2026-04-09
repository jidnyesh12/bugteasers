import {
  snippetCompletion,
  type Completion,
  type CompletionContext,
  type CompletionResult,
} from "@codemirror/autocomplete";
import { cppLanguage } from "@codemirror/lang-cpp";
import { javaLanguage } from "@codemirror/lang-java";
import { pythonLanguage } from "@codemirror/lang-python";
import type { Extension } from "@codemirror/state";
import type { SupportedLanguage } from "@/lib/execution/types";

const IDENTIFIER_MATCH_REGEX = /[A-Za-z_][A-Za-z0-9_]*/g;
const IDENTIFIER_PREFIX_REGEX = /[A-Za-z_][A-Za-z0-9_]*$/;
const IDENTIFIER_VALID_FOR_REGEX = /^(?:[A-Za-z_][A-Za-z0-9_]*)?$/;
const PYTHON_NON_CODE_SEGMENTS_REGEX =
  /"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#.*$/gm;
const C_LIKE_NON_CODE_SEGMENTS_REGEX =
  /\/\*[\s\S]*?\*\/|\/\/.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/gm;

const LANGUAGE_KEYWORDS: Readonly<Record<SupportedLanguage, ReadonlySet<string>>> =
  {
    python: new Set([
      "False",
      "None",
      "True",
      "and",
      "as",
      "assert",
      "async",
      "await",
      "break",
      "case",
      "class",
      "continue",
      "def",
      "del",
      "elif",
      "else",
      "except",
      "finally",
      "for",
      "from",
      "global",
      "if",
      "import",
      "in",
      "is",
      "lambda",
      "match",
      "nonlocal",
      "not",
      "or",
      "pass",
      "raise",
      "return",
      "try",
      "while",
      "with",
      "yield",
    ]),
    java: new Set([
      "abstract",
      "assert",
      "boolean",
      "break",
      "byte",
      "case",
      "catch",
      "char",
      "class",
      "continue",
      "default",
      "do",
      "double",
      "else",
      "enum",
      "extends",
      "final",
      "finally",
      "float",
      "for",
      "if",
      "implements",
      "import",
      "instanceof",
      "int",
      "interface",
      "long",
      "native",
      "new",
      "package",
      "private",
      "protected",
      "public",
      "return",
      "short",
      "static",
      "strictfp",
      "super",
      "switch",
      "synchronized",
      "this",
      "throw",
      "throws",
      "transient",
      "try",
      "void",
      "volatile",
      "while",
    ]),
    cpp: new Set([
      "alignas",
      "alignof",
      "asm",
      "auto",
      "bool",
      "break",
      "case",
      "catch",
      "char",
      "class",
      "const",
      "constexpr",
      "continue",
      "default",
      "delete",
      "do",
      "double",
      "else",
      "enum",
      "explicit",
      "extern",
      "false",
      "float",
      "for",
      "friend",
      "goto",
      "if",
      "inline",
      "int",
      "long",
      "namespace",
      "new",
      "nullptr",
      "operator",
      "private",
      "protected",
      "public",
      "register",
      "return",
      "short",
      "signed",
      "sizeof",
      "static",
      "struct",
      "switch",
      "template",
      "this",
      "throw",
      "true",
      "try",
      "typedef",
      "typename",
      "union",
      "unsigned",
      "using",
      "virtual",
      "void",
      "volatile",
      "while",
    ]),
    c: new Set([
      "auto",
      "break",
      "case",
      "char",
      "const",
      "continue",
      "default",
      "do",
      "double",
      "else",
      "enum",
      "extern",
      "float",
      "for",
      "goto",
      "if",
      "inline",
      "int",
      "long",
      "register",
      "restrict",
      "return",
      "short",
      "signed",
      "sizeof",
      "static",
      "struct",
      "switch",
      "typedef",
      "union",
      "unsigned",
      "void",
      "volatile",
      "while",
    ]),
  };

const PYTHON_COMPLETIONS: Completion[] = [
  { label: "def", type: "keyword" },
  { label: "class", type: "keyword" },
  { label: "import", type: "keyword" },
  { label: "print", type: "function" },
  { label: "input", type: "function" },
  { label: "len", type: "function" },
  { label: "range", type: "function" },
  snippetCompletion("for ${1:item} in ${2:items}:\n    ${3:pass}", {
    label: "forin",
    detail: "for-in loop",
    type: "snippet",
  }),
  snippetCompletion("if ${1:condition}:\n    ${2:pass}", {
    label: "if",
    detail: "if block",
    type: "snippet",
  }),
  snippetCompletion('if __name__ == "__main__":\n    ${1:solve()}', {
    label: "ifmain",
    detail: "entrypoint",
    type: "snippet",
  }),
];

const JAVA_COMPLETIONS: Completion[] = [
  { label: "public", type: "keyword" },
  { label: "private", type: "keyword" },
  { label: "static", type: "keyword" },
  { label: "class", type: "keyword" },
  { label: "void", type: "keyword" },
  { label: "int", type: "keyword" },
  { label: "long", type: "keyword" },
  { label: "String", type: "class" },
  { label: "System.out.println", type: "function" },
  snippetCompletion(
    "for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3:// TODO}\n}",
    {
      label: "fori",
      detail: "indexed for loop",
      type: "snippet",
    },
  ),
  snippetCompletion("while (${1:condition}) {\n    ${2:// TODO}\n}", {
    label: "while",
    detail: "while loop",
    type: "snippet",
  }),
  snippetCompletion(
    "BufferedReader ${1:br} = new BufferedReader(new InputStreamReader(System.in));",
    {
      label: "br",
      detail: "buffered reader",
      type: "snippet",
    },
  ),
];

const CPP_COMPLETIONS: Completion[] = [
  { label: "int", type: "keyword" },
  { label: "long long", type: "keyword" },
  { label: "vector", type: "class" },
  { label: "string", type: "class" },
  { label: "if", type: "keyword" },
  { label: "else", type: "keyword" },
  { label: "while", type: "keyword" },
  { label: "cin", type: "variable" },
  { label: "cout", type: "variable" },
  snippetCompletion(
    "for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3:// TODO}\n}",
    {
      label: "fori",
      detail: "indexed for loop",
      type: "snippet",
    },
  ),
  snippetCompletion("ios::sync_with_stdio(false);\ncin.tie(nullptr);", {
    label: "fastio",
    detail: "fast input/output",
    type: "snippet",
  }),
];

const C_COMPLETIONS: Completion[] = [
  { label: "int", type: "keyword" },
  { label: "long", type: "keyword" },
  { label: "char", type: "keyword" },
  { label: "if", type: "keyword" },
  { label: "else", type: "keyword" },
  { label: "while", type: "keyword" },
  { label: "printf", type: "function" },
  { label: "scanf", type: "function" },
  snippetCompletion(
    "for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3:// TODO}\n}",
    {
      label: "fori",
      detail: "indexed for loop",
      type: "snippet",
    },
  ),
  snippetCompletion("while (${1:condition}) {\n    ${2:// TODO}\n}", {
    label: "while",
    detail: "while loop",
    type: "snippet",
  }),
];

const LANGUAGE_COMPLETION_OPTIONS = {
  python: PYTHON_COMPLETIONS,
  java: JAVA_COMPLETIONS,
  cpp: CPP_COMPLETIONS,
  c: C_COMPLETIONS,
} as const;

function stripNonCodeSegments(
  source: string,
  language: SupportedLanguage,
): string {
  const pattern =
    language === "python"
      ? PYTHON_NON_CODE_SEGMENTS_REGEX
      : C_LIKE_NON_CODE_SEGMENTS_REGEX;

  return source.replace(pattern, " ");
}

function getNextNonWhitespaceCharacter(
  source: string,
  startIndex: number,
): string | null {
  for (let index = startIndex; index < source.length; index += 1) {
    const char = source[index];
    if (char && !/\s/.test(char)) {
      return char;
    }
  }

  return null;
}

function inferUserDefinedCompletionType(params: {
  source: string;
  matchIndex: number;
  labelLength: number;
}): "function" | "variable" {
  const { source, matchIndex, labelLength } = params;
  const nextChar = getNextNonWhitespaceCharacter(source, matchIndex + labelLength);

  return nextChar === "(" ? "function" : "variable";
}

type UserDefinedCompletionCache = {
  doc: CompletionContext["state"]["doc"] | null;
  completions: Completion[];
};

function shouldRefreshUserDefinedCompletions(params: {
  context: CompletionContext;
  cache: UserDefinedCompletionCache;
}): boolean {
  const { context, cache } = params;

  if (context.state.doc !== cache.doc) {
    return true;
  }

  if (cache.completions.length === 0) {
    return true;
  }

  if (context.explicit) {
    return true;
  }

  return false;
}

function collectUserDefinedCompletions(params: {
  source: string;
  language: SupportedLanguage;
  staticLabels: ReadonlySet<string>;
}): Completion[] {
  const { source, language, staticLabels } = params;

  const keywords = LANGUAGE_KEYWORDS[language];
  const sanitizedSource = stripNonCodeSegments(source, language);
  const seen = new Set<string>();
  const options: Completion[] = [];

  for (const match of sanitizedSource.matchAll(IDENTIFIER_MATCH_REGEX)) {
    const label = match[0];
    if (!label) {
      continue;
    }

    if (match.index === undefined) {
      continue;
    }

    if (seen.has(label) || staticLabels.has(label) || keywords.has(label)) {
      continue;
    }

    seen.add(label);

    options.push({
      label,
      type: inferUserDefinedCompletionType({
        source: sanitizedSource,
        matchIndex: match.index,
        labelLength: label.length,
      }),
      detail: "user-defined",
      boost: 90,
    });
  }

  options.sort((left, right) => left.label.localeCompare(right.label));
  return options;
}

function filterUserDefinedCompletions(
  completions: readonly Completion[],
  currentPrefix: string,
): Completion[] {
  if (currentPrefix.length === 0) {
    return [...completions];
  }

  const filtered: Completion[] = [];
  for (const completion of completions) {
    if (!completion.label.startsWith(currentPrefix)) {
      continue;
    }

    filtered.push(completion);
  }

  return filtered;
}

function buildCompletionSource(
  language: SupportedLanguage,
): (context: CompletionContext) => CompletionResult | null {
  const staticOptions = LANGUAGE_COMPLETION_OPTIONS[language];
  const staticLabels = new Set(staticOptions.map((option) => option.label));
  const cache: UserDefinedCompletionCache = {
    doc: null,
    completions: [],
  };

  return (context: CompletionContext) => {
    const currentWord = context.matchBefore(IDENTIFIER_PREFIX_REGEX);

    if (!context.explicit && !currentWord) {
      return null;
    }

    const from = currentWord?.from ?? context.pos;
    const currentPrefix = currentWord?.text ?? "";

    if (
      shouldRefreshUserDefinedCompletions({
        context,
        cache,
      })
    ) {
      cache.doc = context.state.doc;
      cache.completions = collectUserDefinedCompletions({
        source: context.state.doc.toString(),
        language,
        staticLabels,
      });
    }

    const userDefinedOptions = filterUserDefinedCompletions(
      cache.completions,
      currentPrefix,
    );

    return {
      from,
      options: [...userDefinedOptions, ...staticOptions],
      validFor: IDENTIFIER_VALID_FOR_REGEX,
    };
  };
}

export function getLanguageAutocompleteData(
  language: SupportedLanguage,
): Extension {
  const source = buildCompletionSource(language);

  switch (language) {
    case "python":
      return pythonLanguage.data.of({ autocomplete: source });
    case "java":
      return javaLanguage.data.of({ autocomplete: source });
    case "cpp":
    case "c":
      return cppLanguage.data.of({ autocomplete: source });
    default:
      return cppLanguage.data.of({ autocomplete: source });
  }
}
