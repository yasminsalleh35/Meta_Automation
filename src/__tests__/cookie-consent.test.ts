// QA-01 / audit LGL-02: imports the real src/lib/cookieConsent.ts; only the Supabase client is mocked.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { insert } = vi.hoisted(() => ({
  insert: vi.fn(async (_row: Record<string, unknown>) => ({ data: null, error: null })),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getSession: vi.fn(async () => ({ data: { session: { user: { id: 'user-1' } } } })) },
    from: vi.fn(() => ({ insert })),
  },
}));

import {
  COOKIE_POLICY_VERSION,
  OPEN_COOKIE_PREFERENCES_EVENT,
  getStoredConsent,
  saveConsent,
  openCookiePreferences,
  loadConsentedScripts,
} from '@/lib/cookieConsent';

const STORAGE_KEY = 'camply_cookie_consent';

beforeEach(() => {
  localStorage.clear();
  insert.mockClear();
});

describe('cookie consent', () => {
  it('has no stored consent initially', () => {
    expect(getStoredConsent()).toBeNull();
  });

  it('saveConsent stores the choice locally (essential always true) and returns it', () => {
    const rec = saveConsent({ analytics: true, marketing: false });
    expect(rec.version).toBe(COOKIE_POLICY_VERSION);
    expect(rec.choices).toEqual({ essential: true, analytics: true, marketing: false });
    expect(getStoredConsent()).toEqual(rec);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).choices.analytics).toBe(true);
  });

  it('records a best-effort copy in cookie_consents with the policy version', async () => {
    saveConsent({ analytics: false, marketing: true });
    await vi.waitFor(() => expect(insert).toHaveBeenCalledTimes(1));
    const row = insert.mock.calls[0][0] as { user_id: string; policy_version: string; consent: object; anon_id: unknown };
    expect(row.user_id).toBe('user-1');
    expect(row.policy_version).toBe(COOKIE_POLICY_VERSION);
    expect(row.consent).toMatchObject({ analytics: false, marketing: true });
    expect(typeof row.anon_id).toBe('string');
  });

  it('a consent recorded under an older policy version is ignored (banner reappears)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: '2000-01-01', choices: { essential: true, analytics: true, marketing: true }, timestamp: 'x',
    }));
    expect(getStoredConsent()).toBeNull();
  });

  it('corrupt storage is treated as no consent', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    expect(getStoredConsent()).toBeNull();
  });

  it('openCookiePreferences dispatches the reopen event', () => {
    const spy = vi.fn();
    window.addEventListener(OPEN_COOKIE_PREFERENCES_EVENT, spy);
    openCookiePreferences();
    expect(spy).toHaveBeenCalledTimes(1);
    window.removeEventListener(OPEN_COOKIE_PREFERENCES_EVENT, spy);
  });

  it('no non-essential script is injected without consent', () => {
    const before = document.head.querySelectorAll('script').length;
    loadConsentedScripts({ essential: true, analytics: false, marketing: false });
    loadConsentedScripts(null);
    expect(document.head.querySelectorAll('script').length).toBe(before);
  });
});
