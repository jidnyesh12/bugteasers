'use client';

import { useEffect } from 'react';

interface UseSolveKeyboardShortcutsOptions {
  onRunShortcut: () => void;
  onSubmitShortcut: () => void;
}

export function useSolveKeyboardShortcuts(options: UseSolveKeyboardShortcutsOptions): void {
  const { onRunShortcut, onSubmitShortcut } = options;

  useEffect(() => {
    const onWindowKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }

      const isRunShortcut =
        event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !event.shiftKey &&
        (event.key === "'" || event.code === 'Quote');

      if (isRunShortcut) {
        event.preventDefault();
        onRunShortcut();
        return;
      }

      const isSubmitShortcut =
        (event.ctrlKey || event.metaKey) &&
        !event.altKey &&
        !event.shiftKey &&
        (event.key === 'Enter' || event.code === 'Enter');

      if (isSubmitShortcut) {
        event.preventDefault();
        onSubmitShortcut();
      }
    };

    // Capture-phase binding ensures shortcuts fire from any focused pane on the solve page.
    window.addEventListener('keydown', onWindowKeyDown, true);

    return () => {
      window.removeEventListener('keydown', onWindowKeyDown, true);
    };
  }, [onRunShortcut, onSubmitShortcut]);
}