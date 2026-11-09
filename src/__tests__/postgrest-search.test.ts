import { describe, it, expect } from 'vitest';
import { sanitizeSearchTerm, buildIlikeOrFilter, pageRange, quotePostgrestValue } from '@/lib/postgrestSearch';

// Audit ADM-03
describe('sanitizeSearchTerm', () => {
  it('removes PostgREST operators and wildcards', () => {
    expect(sanitizeSearchTerm('foo,user_id.eq.123')).toBe('foo user_id.eq.123');
    expect(sanitizeSearchTerm('a%b*c')).toBe('a b c');
    expect(sanitizeSearchTerm('x),and(id.neq.0')).toBe('x and id.neq.0');
  });

  it('returns empty string for blank or only-special input', () => {
    expect(sanitizeSearchTerm('')).toBe('');
    expect(sanitizeSearchTerm(undefined)).toBe('');
    expect(sanitizeSearchTerm(' ,%() ')).toBe('');
  });

  it('caps the length', () => {
    expect(sanitizeSearchTerm('a'.repeat(500)).length).toBe(100);
  });
});

describe('buildIlikeOrFilter', () => {
  it('builds one ilike clause per column', () => {
    expect(buildIlikeOrFilter(['slug', 'label'], 'Odonto')).toBe('slug.ilike.%Odonto%,label.ilike.%Odonto%');
  });

  it('cannot add extra conditions', () => {
    const f = buildIlikeOrFilter(['name'], 'x,user_id.eq.1')!;
    expect(f.split(',').length).toBe(1);
  });

  it('returns null when nothing is left to search', () => {
    expect(buildIlikeOrFilter(['name'], '%%')).toBeNull();
  });
});

describe('pageRange', () => {
  it('computes inclusive ranges and caps the page size at 1000', () => {
    expect(pageRange(0, 50)).toEqual([0, 49]);
    expect(pageRange(2, 50)).toEqual([100, 149]);
    expect(pageRange(0, 5000)).toEqual([0, 999]);
    expect(pageRange(-1, 10)).toEqual([0, 9]);
  });
});

describe('quotePostgrestValue', () => {
  it('wraps in double quotes and escapes quotes/backslashes', () => {
    expect(quotePostgrestValue('Dermatologia')).toBe('"Dermatologia"');
    expect(quotePostgrestValue('a, b (c)')).toBe('"a, b (c)"');
    expect(quotePostgrestValue('x"y\\z')).toBe('"x\\"y\\\\z"');
  });
});
