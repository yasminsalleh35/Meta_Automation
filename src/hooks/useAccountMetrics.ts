import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useRef } from 'react';

type DatePreset = 'today' | 'last_7d' | 'last_30d';

export interface AccountMetrics {
  stale: boolean;
  datePreset: DatePreset;
  impressions: number;
  reach: number;
  clicks: number;
  spend: number;
  conversations: number;
  cpa: number;
  activeCampaigns: number;
  updatedAt: string | null;
}

/**
 * Hook para obter métricas agregadas da conta Meta
 * Lê do cache (account_insights_cache) via edge function
 * Auto-refreshes when cache is empty or stale
 */
export function useAccountMetrics(datePreset: DatePreset = 'last_30d') {
  const queryClient = useQueryClient();
  const autoRefreshTriggered = useRef(false);

  const query = useQuery<AccountMetrics>({
    queryKey: ['account-metrics', datePreset],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await supabase.functions.invoke('account-insights-read', {
        body: { datePreset },
      });

      if (response.error) {
        console.error('[useAccountMetrics] Edge Function error:', response.error);
        throw response.error;
      }

      return response.data as AccountMetrics;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (was 55 min — too long)
    gcTime: 15 * 60 * 1000, // 15 minutes in cache
    refetchOnWindowFocus: true, // refresh when user returns to tab
    retry: 1,
  });

  // Auto-refresh when data is stale or empty (first load)
  useEffect(() => {
    if (
      query.data &&
      query.data.stale &&
      !autoRefreshTriggered.current &&
      !query.isLoading
    ) {
      autoRefreshTriggered.current = true;
      console.log('[useAccountMetrics] Cache is stale, auto-triggering refresh...');

      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;

          const response = await supabase.functions.invoke('account-insights-refresh', {
            body: {},
          });

          if (!response.error) {
            console.log('[useAccountMetrics] Auto-refresh completed, refetching...');
            queryClient.invalidateQueries({ queryKey: ['account-metrics'] });
          } else {
            console.warn('[useAccountMetrics] Auto-refresh failed:', response.error);
          }
        } catch (err) {
          console.warn('[useAccountMetrics] Auto-refresh error:', err);
        }
      })();
    }
  }, [query.data, query.isLoading, queryClient]);

  // Reset auto-refresh flag when datePreset changes
  useEffect(() => {
    autoRefreshTriggered.current = false;
  }, [datePreset]);

  return query;
}

/**
 * Hook para forçar refresh das métricas (chama account-insights-refresh)
 */
export function useRefreshAccountMetrics() {
  return async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    console.log('[useRefreshAccountMetrics] Invoking account-insights-refresh');

    const response = await supabase.functions.invoke('account-insights-refresh', {
      body: {},
    });

    if (response.error) {
      console.error('[useRefreshAccountMetrics] Refresh error:', response.error);
      throw response.error;
    }

    return response.data;
  };
}
