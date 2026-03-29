import { useCallback, useRef, useState, type MutableRefObject } from 'react';
import type { SupportedLanguage } from '@/lib/execution/types';
import { DEFAULT_EXECUTION_LANGUAGE } from '@/lib/execution/languages';
import type { StableCodeEditorHandle } from '../components/stable-code-editor';

interface EditorSeed {
  value: string;
  version: number;
}

export function useSolveEditorState(
  editorHandleRef: MutableRefObject<StableCodeEditorHandle | null>
) {
  const codeRef = useRef('');
  const [editorSeed, setEditorSeed] = useState<EditorSeed>({ value: '', version: 0 });
  const [language, setLanguage] = useState<SupportedLanguage>(DEFAULT_EXECUTION_LANGUAGE);

  const handleCodeChange = useCallback((value: string) => {
    codeRef.current = value;
  }, []);

  const setInitialEditorContent = useCallback((value: string) => {
    codeRef.current = value;
    setEditorSeed((previousSeed) => ({
      value,
      version: previousSeed.version + 1,
    }));
  }, []);

  const setEditorContent = useCallback((nextCode: string, strategy: 'replace' | 'remount' = 'replace') => {
    codeRef.current = nextCode;

    if (strategy === 'replace' && editorHandleRef.current) {
      editorHandleRef.current.replaceContent(nextCode);
      return;
    }

    setEditorSeed((previousSeed) => ({
      value: nextCode,
      version: previousSeed.version + 1,
    }));
  }, [editorHandleRef]);

  return {
    codeRef,
    editorSeed,
    language,
    setLanguage,
    handleCodeChange,
    setEditorContent,
    setInitialEditorContent,
  };
}
