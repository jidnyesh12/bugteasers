'use client';

import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { MarkdownRendererProps } from '@/types/markdown';

/**
 * Renders a markdown string as styled HTML using react-markdown v10.
 *
 * Supports GitHub Flavored Markdown (tables, strikethrough, task lists,
 * autolink literals) via the remark-gfm plugin.
 *
 * Uses Tailwind Typography's `prose` classes for styling.
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-sm max-w-none ${className ?? ''}`.trim()}>
      <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
    </div>
  );
}
