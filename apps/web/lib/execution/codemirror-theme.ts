import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

const CODEMIRROR_FONT_FAMILY =
  '"Fira Code", "Cascadia Code", "JetBrains Mono", Consolas, monospace';

function createBaseCodeMirrorTheme(options: {
  height?: string;
  maxHeight?: string;
  interactiveHighlights: boolean;
}): Extension {
  const { height, maxHeight, interactiveHighlights } = options;

  const theme: Record<string, Record<string, string>> = {
    "&": {
      fontSize: "14px",
      ...(height ? { height } : {}),
    },
    ".cm-scroller": {
      overflow: "auto",
      fontFamily: CODEMIRROR_FONT_FAMILY,
      ...(maxHeight ? { maxHeight } : {}),
    },
    ".cm-gutters": {
      background: "#1e1e1e",
      border: "none",
      color: "#858585",
    },
  };

  if (interactiveHighlights) {
    theme[".cm-activeLineGutter"] = { background: "#2a2d32" };
    theme[".cm-activeLine"] = { background: "#2a2d3220" };
    theme[".cm-selectionBackground"] = {
      backgroundColor: "#2f5d86 !important",
    };
    theme["&.cm-focused .cm-selectionBackground"] = {
      backgroundColor: "#2f5d86 !important",
    };
    theme[".cm-content ::selection"] = {
      backgroundColor: "#2f5d86",
      color: "#ffffff",
    };
  }

  return EditorView.theme(theme);
}

export function createEditableCodeMirrorTheme(): Extension {
  return createBaseCodeMirrorTheme({
    height: "100%",
    interactiveHighlights: true,
  });
}

export function createReadOnlyCodeMirrorTheme(maxHeight: string): Extension {
  return createBaseCodeMirrorTheme({
    maxHeight,
    interactiveHighlights: false,
  });
}
