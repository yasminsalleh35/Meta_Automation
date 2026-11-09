// QA-01: imports the real BudgetUtils (used by the campaign budget editors).
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { BudgetUtils, BUDGET_CONSTANTS } from '@/services/metaAds/utils/budgetUtils';

beforeAll(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

describe('BudgetUtils', () => {
  it('converts reais <-> cents without float drift', () => {
    expect(BudgetUtils.convertToCents(30)).toBe(3000);
    expect(BudgetUtils.convertToCents(19.99)).toBe(1999);
    expect(BudgetUtils.convertToCents(0.1 + 0.2)).toBe(30);
    expect(BudgetUtils.convertToReais(3550)).toBe(35.5);
  });

  it('validates the daily budget range', () => {
    const min = BUDGET_CONSTANTS.MIN_DAILY_BRL;
    expect(BudgetUtils.validateDailyBudget(min)).toEqual({ isValid: true, valueInCents: min * 100 });
    expect(BudgetUtils.validateDailyBudget(min - 0.01)).toMatchObject({ isValid: false, errorType: 'min' });
    expect(BudgetUtils.validateDailyBudget(BUDGET_CONSTANTS.MAX_DAILY_BRL + 1)).toMatchObject({ isValid: false, errorType: 'max' });
    expect(BudgetUtils.validateDailyBudget(0)).toMatchObject({ isValid: false, errorType: 'invalid' });
    expect(BudgetUtils.validateDailyBudget(-5)).toMatchObject({ isValid: false, errorType: 'invalid' });
    expect(BudgetUtils.validateDailyBudget(Number.NaN)).toMatchObject({ isValid: false, errorType: 'invalid' });
  });

  it('gives a recommendation level', () => {
    expect(BudgetUtils.getBudgetRecommendation(30).level).toBe('low');
    expect(BudgetUtils.getBudgetRecommendation(100).level).toBe('recommended');
    expect(BudgetUtils.getBudgetRecommendation(500).level).toBe('high');
  });
});
