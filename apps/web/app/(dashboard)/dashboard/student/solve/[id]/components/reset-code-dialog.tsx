"use client";

import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { Dialog as DialogPrimitive } from "radix-ui";

interface ResetCodeDialogProps {
  open: boolean;
  container: HTMLElement | null;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onConfirm: () => void;
  onRestoreFocus: () => void;
}

export function ResetCodeDialog({
  open,
  container,
  onOpenChange,
  onCancel,
  onConfirm,
  onRestoreFocus,
}: ResetCodeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal container={container ?? undefined}>
        <DialogOverlay className="absolute inset-0 z-30 bg-black/55" />
        <DialogPrimitive.Content
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            onRestoreFocus();
          }}
          className="absolute left-1/2 top-1/2 z-40 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border border-[#3e3e42] bg-[#252526] p-5 text-gray-100 shadow-2xl outline-none duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle className="text-sm font-bold tracking-wide text-gray-100">
              Reset code to starter template?
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-gray-300">
              This replaces your current editor content. You can use Ctrl + Z
              inside the editor to undo after reset.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-[#4f4f53] bg-[#2f2f34] px-3 py-1.5 text-xs font-semibold text-gray-100 transition-colors hover:bg-[#3b3b42]"
            >
              Keep Coding
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-md border border-amber-400/40 bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-500/30"
            >
              Reset Code
            </button>
          </DialogFooter>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
