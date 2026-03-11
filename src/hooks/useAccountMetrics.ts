import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
 */
export function useAccountMetrics(datePreset: DatePreset = 'last_30d') {
  return useQuery<AccountMetrics>({
    queryKey: ['account-metrics', datePreset],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }
      
      console.log('[Hook] Session user:', session.user.id);
      console.log('[Hook] Requesting datePreset:', datePreset);
      console.log('[Hook] ⏱️ Invoking account-insights-read with:', { 
        userId: session.user.id, 
        datePreset,
        timestamp: new Date().toISOString()
      });

      const response = await supabase.functions.invoke('account-insights-read', {
        body: { datePreset },
      });

      console.log('[Hook] ✅ Response received:', {
        hasData: !!response.data,
        hasError: !!response.error,
        data: response.data,
        error: response.error
      });

      if (response.error) {
        console.error('[Hook] ❌ Edge Function error:', response.error);
        throw response.error;
      }

      return response.data as AccountMetrics;
    },
    staleTime: 55 * 60 * 1000, // 55 minutos (cache válido antes de refetch)
    gcTime: 60 * 60 * 1000, // 1 hora no cache
    refetchOnWindowFocus: false,
    retry: 1,
  });
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

    console.log('[Hook] 🔄 Invoking account-insights-refresh for user:', session.user.id);
    
    const response = await supabase.functions.invoke('account-insights-refresh', {
      body: {},
    });

    console.log('[Hook] 🔄 Refresh response:', {
      hasData: !!response.data,
      hasError: !!response.error,
      data: response.data
    });

    if (response.error) {
      console.error('[Hook] ❌ Refresh error:', response.error);
      throw response.error;
    }

    return response.data;
  };
}
