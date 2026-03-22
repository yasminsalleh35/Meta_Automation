
import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/contexts/AuthContext';

interface Campaign {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'REJECTED';
  createdAt: string;
  metaCampaignId?: string;
  metaAdId?: string;
  lastMetricsSyncAt?: string;
}

export interface Insights {
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
  reach: number;
  conversations: number;
  costPerConversation: number;
  cpm: number;
  cpc: number;
}

export interface DailyInsight {
  date: string;
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
  reach: number;
  conversations: number;
}

export const useSimpleCampaignInsights = (campaignId: string) => {
  const supabase = useSupabase();
  const { session } = useAuth();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [dailyInsights, setDailyInsights] = useState<DailyInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  const fetchCampaignData = useCallback(async (forceRefresh = false) => {
    if (!session?.user?.id) {
      setError('Usuário não autenticado');
      setIsLoading(false);
      return;
    }

    try {
      if (forceRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Step 1: Fetch campaign from DB
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('user_id', session.user.id)
        .single();

      if (campaignError || !campaignData) {
        throw new Error('Campanha não encontrada ou você não tem acesso a ela');
      }

      const mappedCampaign: Campaign = {
        id: campaignData.id,
        name: campaignData.name || 'Campanha sem nome',
        status: mapStatus(campaignData.status),
        createdAt: campaignData.created_at,
        metaCampaignId: campaignData.meta_campaign_id,
        metaAdId: campaignData.meta_ad_id,
        lastMetricsSyncAt: campaignData.last_metrics_sync_at,
      };

      setCampaign(mappedCampaign);
      setLastSyncAt(campaignData.last_metrics_sync_at);

      // Step 2: If force refresh or metrics are stale (>5 min), fetch fresh from Meta
      const metricsAge = campaignData.last_metrics_sync_at
        ? Date.now() - new Date(campaignData.last_metrics_sync_at).getTime()
        : Infinity;
      const isStale = metricsAge > 5 * 60 * 1000; // 5 minutes

      if (campaignData.meta_campaign_id && (forceRefresh || isStale)) {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meta-campaign-refresh-one`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
              },
              body: JSON.stringify({
                meta_campaign_id: campaignData.meta_campaign_id
              })
            }
          );

          if (response.ok) {
            const result = await response.json();
            if (result.metrics) {
              const m = result.metrics;
              setInsights({
                impressions: m.impressions || 0,
                clicks: m.clicks || 0,
                ctr: Number(m.ctr) || 0,
                spend: Number(m.spend) || 0,
                reach: m.reach || 0,
                conversations: m.conversations || 0,
                costPerConversation: Number(m.cost_per_messaging_conversation_started_7d) || 0,
                cpm: Number(m.cpm) || 0,
                cpc: Number(m.cpc) || 0,
              });
              setLastSyncAt(new Date().toISOString());
            }
          } else {
            console.warn('Fresh metrics fetch failed, using cached data');
            loadCachedMetrics(campaignData);
          }
        } catch (fetchErr) {
          console.warn('Error fetching fresh metrics:', fetchErr);
          loadCachedMetrics(campaignData);
        }
      } else {
        // Use cached metrics from DB
        loadCachedMetrics(campaignData);
      }

      // Step 3: Fetch daily historical insights (only if stale or force refresh)
      // Daily data changes slowly — cache for 15 minutes to avoid burning API calls
      const dailyAge = campaignData.last_daily_insights_at
        ? Date.now() - new Date(campaignData.last_daily_insights_at).getTime()
        : Infinity;
      const dailyIsStale = dailyAge > 15 * 60 * 1000; // 15 minutes

      if (campaignData.meta_campaign_id && (forceRefresh || dailyIsStale)) {
        await fetchDailyInsights(campaignData.meta_campaign_id, campaignData.id);
      } else if (campaignData.daily_insights && Array.isArray(campaignData.daily_insights)) {
        // Use cached daily insights from DB
        setDailyInsights(campaignData.daily_insights);
      }

    } catch (err) {
      console.error('Erro ao carregar dados da campanha:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [campaignId, session?.user?.id, session?.access_token, supabase]);

  const loadCachedMetrics = (campaignData: any) => {
    const m = campaignData.metrics;
    if (m) {
      setInsights({
        impressions: Number(m.impressions) || 0,
        clicks: Number(m.clicks) || 0,
        ctr: Number(m.ctr) || 0,
        spend: Number(m.spend) || 0,
        reach: Number(m.reach) || 0,
        conversations: Number(m.conversations) || 0,
        costPerConversation: Number(m.cost_per_messaging_conversation_started_7d) || 0,
        cpm: Number(m.cpm) || 0,
        cpc: Number(m.cpc) || 0,
      });
    } else {
      setInsights(null);
    }
  };

  const fetchDailyInsights = async (metaCampaignId: string, campaignDbId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meta-campaign-daily-insights`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session!.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            meta_campaign_id: metaCampaignId,
            date_preset: 'last_7d'
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.daily_data && Array.isArray(result.daily_data)) {
          setDailyInsights(result.daily_data);

          // Cache daily insights in DB to avoid redundant API calls
          supabase
            .from('campaigns')
            .update({
              daily_insights: result.daily_data,
              last_daily_insights_at: new Date().toISOString()
            })
            .eq('id', campaignDbId)
            .then(() => {
              console.log('Daily insights cached to DB');
            });
        }
      } else {
        console.warn('Daily insights fetch failed');
      }
    } catch (err) {
      console.warn('Error fetching daily insights:', err);
    }
  };

  const mapStatus = (status: string): 'ACTIVE' | 'PAUSED' | 'REJECTED' => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'ACTIVE';
      case 'paused':
        return 'PAUSED';
      case 'finished':
      case 'rejected':
        return 'REJECTED';
      default:
        return 'PAUSED';
    }
  };

  useEffect(() => {
    fetchCampaignData();
  }, [fetchCampaignData]);

  return {
    campaign,
    insights,
    dailyInsights,
    isLoading,
    isRefreshing,
    error,
    lastSyncAt,
    refetch: () => fetchCampaignData(true)
  };
};
