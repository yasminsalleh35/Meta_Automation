import { useEffect, useRef } from 'react';
import { useCampaignSyncActions } from '@/hooks/useCampaignSyncActions';
import { useMetaSelection } from '@/hooks/useMetaSelection';

const LAST_RUN_KEY = 'camply_auto_discover_at';
const MIN_INTERVAL_MS = 3 * 60 * 1000; // don't auto-run more than once every 3 minutes

/**
 * Runs "Descobrir Novas Campanhas" (meta-campaigns-discover) automatically when the user enters the
 * dashboard (i.e. accesses the platform / logs in / reloads), as soon as an ad account is available —
 * so users see their latest Meta campaigns without clicking the button. Silent: refreshes the list in
 * the background and only toasts when NEW campaigns are found. Throttled to once per 3 min to avoid
 * spamming the Meta API on rapid reloads. Mounted once in the dashboard layout.
 */
export const useAutoDiscoverCampaigns = () => {
  const { discoverNewCampaigns } = useCampaignSyncActions();
  const { data: selection } = useMetaSelection();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    if (!selection?.ad_account_id) return;

    let last = 0;
    try { last = Number(localStorage.getItem(LAST_RUN_KEY) || 0); } catch { /* ignore */ }
    if (Date.now() - last < MIN_INTERVAL_MS) {
      ranRef.current = true; // recently ran — skip this access
      return;
    }

    ranRef.current = true;
    try { localStorage.setItem(LAST_RUN_KEY, String(Date.now())); } catch { /* ignore */ }
    void discoverNewCampaigns({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection?.ad_account_id]);
};
