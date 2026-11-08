import { describe, it, expect } from 'vitest';
import { getSafeNextPath, buildLoginPath } from '@/lib/safeRedirect';

describe('safeRedirect', () => {
  it('round-trips a deep link through login', () => {
    const login = buildLoginPath('/dashboard/simple-campaign-insights/123', '?tab=ads');
    expect(getSafeNextPath(login.slice(login.indexOf('?')))).toBe('/dashboard/simple-campaign-insights/123?tab=ads');
  });

  it('rejects open redirects', () => {
    expect(getSafeNextPath('?next=//evil.com')).toBe('/dashboard');
    expect(getSafeNextPath('?next=https://evil.com')).toBe('/dashboard');
    expect(getSafeNextPath('?next=/\\evil.com')).toBe('/dashboard');
    expect(getSafeNextPath('?next=/auth/login')).toBe('/dashboard');
    expect(getSafeNextPath('')).toBe('/dashboard');
  });

  it('does not add next for root or auth paths', () => {
    expect(buildLoginPath('/')).toBe('/auth/login');
    expect(buildLoginPath('/auth/register')).toBe('/auth/login');
  });
});
