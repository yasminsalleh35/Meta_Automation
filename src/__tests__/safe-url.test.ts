// QA-01 / audit SEC-16: imports the real src/lib/safeUrl.ts.
import { describe, it, expect } from 'vitest';
import { safeUrl, isSafeUrl, escapeHtml } from '@/lib/safeUrl';

describe('safeUrl', () => {
  it.each([
    'https://iacamply.com/x?y=1',
    'http://example.com/',
    'mailto:contato@iacamply.com',
    'tel:+5511999999999',
  ])('keeps %s', (u) => {
    expect(safeUrl(u)).toBe(new URL(u).href);
    expect(isSafeUrl(u)).toBe(true);
  });

  it.each([
    'javascript:alert(1)',
    ' JaVaScRiPt:alert(1)',
    'java\tscript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
  ])('blocks %s', (u) => {
    expect(safeUrl(u)).toBe('#');
    expect(isSafeUrl(u)).toBe(false);
  });

  it('returns # for empty input', () => {
    expect(safeUrl(null)).toBe('#');
    expect(safeUrl(undefined)).toBe('#');
    expect(safeUrl('')).toBe('#');
  });

  it('resolves relative paths against the current origin', () => {
    expect(safeUrl('/dashboard')).toBe(`${window.location.origin}/dashboard`);
  });
});

describe('escapeHtml', () => {
  it('escapes all HTML-significant characters', () => {
    expect(escapeHtml(`<img src=x onerror="a('b')">&`)).toBe(
      '&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;&amp;',
    );
  });

  it('handles null/undefined/non-strings', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml(42)).toBe('42');
  });
});
