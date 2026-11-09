// QA-01: metric definitions/formatters used by the campaign cards (imports src/utils/metricsFormat.ts).
import { describe, it, expect } from 'vitest';
import { asCount, asMoneyBRL, asPercent, asCompactNumber, formatSyncDate, PH } from '@/utils/metricsFormat';

const nbsp = (s: string) => s.split(String.fromCharCode(160)).join(' ');

describe('metricsFormat', () => {
  it('asCount coerces to a finite number', () => {
    expect(asCount('12')).toBe(12);
    expect(asCount(undefined)).toBe(0);
    expect(asCount('abc')).toBe(0);
    expect(asCount(Infinity)).toBe(0);
  });

  it('asMoneyBRL formats pt-BR currency, 0 for invalid', () => {
    expect(nbsp(asMoneyBRL(1234.5))).toBe('R$ 1.234,50');
    expect(nbsp(asMoneyBRL('x'))).toBe('R$ 0,00');
    expect(PH.MONEY).toBe(asMoneyBRL(0));
  });

  it('asPercent rounds and guards against a zero/invalid denominator', () => {
    expect(asPercent(1, 3)).toBe('33%');
    expect(asPercent(5, 0)).toBe('0%');
    expect(asPercent('a', 10)).toBe('0%');
  });

  it('asCompactNumber abbreviates K/M', () => {
    expect(asCompactNumber(1500)).toBe('1.5K');
    expect(asCompactNumber(2_500_000)).toBe('2.5M');
    expect(asCompactNumber(999)).toBe('999');
  });

  it('formatSyncDate returns the placeholder for missing/invalid dates', () => {
    expect(formatSyncDate()).toBe(PH.NONE);
    expect(formatSyncDate('not a date')).toBe(PH.NONE);
    expect(formatSyncDate('2026-03-05T12:20:00Z')).toMatch(/05\/03/);
  });
});
