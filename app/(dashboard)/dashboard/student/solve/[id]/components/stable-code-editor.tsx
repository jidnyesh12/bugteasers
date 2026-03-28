'use client';

import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import CodeMirror, { type ReactCodeMirrorProps, type ReactCodeMirrorRef } from '@uiw/react-codemirror';

export interface StableCodeEditorProps {
  seedValue: string;
  onCodeChange: (value: string) => void;
  extensions: NonNullable<ReactCodeMirrorProps['extensions']>;
  theme: NonNullable<ReactCodeMirrorProps['theme']>;
  basicSetup: NonNullable<ReactCodeMirrorProps['basicSetup']>;
}

export interface StableCodeEditorHandle {
  replaceContent: (value: string) => void;
  focus: () => void;
}

export const StableCodeEditor = forwardRef<StableCodeEditorHandle, StableCodeEditorProps>(function StableCodeEditor({
  seedValue,
  onCodeChange,
  extensions,
  theme,
  basicSetup,
}: StableCodeEditorProps, ref) {
  const [localValue, setLocalValue] = useState(() => seedValue);
  const codeMirrorRef = useRef<ReactCodeMirrorRef | null>(null);

  useImperativeHandle(ref, () => ({
    replaceContent: (value: string) => {
      const view = codeMirrorRef.current?.view;

      if (!view) {
        setLocalValue(value);
        onCodeChange(value);
        return;
      }

      const previous = view.state.doc.toString();
      if (previous === value) {
        view.focus();
        return;
      }

      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: value,
        },
        selection: { anchor: value.length },
      });

      // Keep React state and parent ref in sync with imperative editor updates.
      setLocalValue(value);
      onCodeChange(value);

      view.focus();
    },
    focus: () => {
      codeMirrorRef.current?.view?.focus();
    },
  }), [onCodeChange]);

  const handleLocalChange = useCallback((value: string) => {
    setLocalValue(value);
    onCodeChange(value);
  }, [onCodeChange]);

  return (
    <CodeMirror
      ref={codeMirrorRef}
      value={localValue}
      onChange={handleLocalChange}
      indentWithTab={true}
      autoFocus={true}
      extensions={extensions}
      theme={theme}
      height="100%"
      basicSetup={basicSetup}
    />
  );
});
