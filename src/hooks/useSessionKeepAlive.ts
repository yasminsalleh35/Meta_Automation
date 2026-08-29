import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface KeepAliveOptions {
  /** How often to check the token's remaining lifetime. Default 60s. */
  intervalMs?: number;
  /** Refresh when the token has less than this left before expiry. Default 5min. */
  refreshMarginMs?: number;
}

/**
 * Keeps the Supabase auth session fresh while a long-lived flow (the campaign creation
 * wizard) is open.
 *
 * Users routinely spend several minutes on the first step writing the campaign name and ad
 * copy — often tabbing away to another app to compose it. While the tab is backgrounded the
 * browser throttles timers, so Supabase's built-in `autoRefreshToken` can miss its refresh
 * window and the access token expires. Every authenticated call the wizard makes *after* that
 * (WhatsApp numbers, Meta assets, Instagram resolution, media upload) then fails with a 401 —
 * which is exactly the "if she takes too long, the assets and the upload stop working" report.
 *
 * Strategy: on mount, on an interval, and whenever the tab regains focus/visibility, check how
 * long the current token has left and proactively refresh it *before* it expires. Most checks
 * are cheap no-ops (the token still has plenty of life); a refresh only fires inside the margin.
 */
export function useSessionKeepAlive(options?: KeepAliveOptions): void {
  const intervalMs = options?.intervalMs ?? 60 * 1000;
  const refreshMarginMs = options?.refreshMarginMs ?? 5 * 60 * 1000;

  useEffect(() => {
    let cancelled = false;
    let refreshing = false;

    const ensureFresh = async () => {
      if (cancelled || refreshing) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || cancelled) return;

        const expiresAtMs = (session.expires_at ?? 0) * 1000;
        const msLeft = expiresAtMs - Date.now();

        if (msLeft <= refreshMarginMs) {
          refreshing = true;
          const { error } = await supabase.auth.refreshSession();
          if (error) {
            console.warn('[useSessionKeepAlive] refreshSession failed:', error.message);
          }
        }
      } catch (err) {
        // Best-effort: the auth listener and getSession() on the next real call will still
        // recover. We never want the keepalive itself to throw into the wizard.
        console.warn('[useSessionKeepAlive] refresh check failed:', err);
      } finally {
        refreshing = false;
      }
    };

    // Renew immediately so a token that is already near expiry is refreshed before the user
    // even starts typing.
    void ensureFresh();

    const id = window.setInterval(() => void ensureFresh(), intervalMs);

    const onVisible = () => {
      if (document.visibilityState === 'visible') void ensureFresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [intervalMs, refreshMarginMs]);
}
