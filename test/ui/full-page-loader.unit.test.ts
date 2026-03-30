import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FullPageLoader } from '@/components/ui/loading';

describe('FullPageLoader', () => {
  it('renders with the dashboard radial gradient backdrop', () => {
    const html = renderToStaticMarkup(React.createElement(FullPageLoader));

    expect(html).toContain('radial-gradient(circle at top center');
    expect(html).toContain('Loading...');
  });
});
