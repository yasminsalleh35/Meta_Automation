import { describe, it, expect } from 'vitest';
import { csvCell, toCsv } from '@/lib/csv';

// Audit ADM-05
describe('csvCell', () => {
  it('escapes double quotes', () => {
    expect(csvCell('Clínica "Sorriso"')).toBe('"Clínica ""Sorriso"""');
  });

  it('neutralises formula prefixes', () => {
    expect(csvCell('=HYPERLINK("http://x")')).toBe('"\'=HYPERLINK(""http://x"")"');
    expect(csvCell('+5511999999999')).toBe('"\'+5511999999999"');
    expect(csvCell('-1')).toBe('"\'-1"');
    expect(csvCell('@SUM(A1)')).toBe('"\'@SUM(A1)"');
  });

  it('handles null/undefined and plain values', () => {
    expect(csvCell(null)).toBe('""');
    expect(csvCell(undefined)).toBe('""');
    expect(csvCell('Ana')).toBe('"Ana"');
    expect(csvCell(42)).toBe('"42"');
  });
});

describe('toCsv', () => {
  it('joins rows with CRLF', () => {
    expect(toCsv([['a', 'b'], ['c', '=d']])).toBe('"a","b"\r\n"c","\'=d"');
  });
});
