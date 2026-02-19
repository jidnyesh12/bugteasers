'use client';

import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import type { MarkdownRendererProps } from '@/types/markdown';

/**
 * Renders a markdown string as styled HTML using react-markdown v10,
 * with support for GFM and Math (KaTeX).
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-sm max-w-none dark:prose-invert prose-code:before:content-none prose-code:after:content-none ${className ?? ''}`.trim()}>
      <Markdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {content}
      </Markdown>
    </div>
  );
}
