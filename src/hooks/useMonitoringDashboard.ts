import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CampaignMetricsSummary {
  campaign_id: string;
  campaign_name: string;
  status: string;
  impressions: number;
  reach: number;
  clicks: number;
  spend: number;
  ctr: number;
  cpa: number;
  conversations: number;
  frequency: number;
  fetched_at: string;
}

export interface PerformanceAlert {
  id: string;
  campaign_id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  metric_name: string;
  metric_value: number;
  threshold_value: number;
  is_read: boolean;
  created_at: string;
}

export interface ApiUsageStats {
  hour: string;
  call_count: number;
  limit: number;
  percentage: number;
}

export const useMonitoringDashboard = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<CampaignMetricsSummary[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [apiUsage, setApiUsage] = useState<ApiUsageStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchCampaignMetrics = async () => {
    if (!user) return;

    // Get cached metrics joined with campaign names
    const { data: cached } = await supabase
      .from('campaign_metrics_cache')
      .select('campaign_id, metrics, date_preset, fetched_at')
      .eq('user_id', user.id)
      .eq('date_preset', 'last_7d')
      .order('fetched_at', { ascending: false });

    if (!cached?.length) {
      setCampaigns([]);
      return;
    }

    // Get campaign names
    const campaignIds = cached.map(c => c.campaign_id);
    const { data: campaignData } = await supabase
      .from('campaigns')
      .select('meta_campaign_id, name, status')
      .eq('user_id', user.id)
      .in('meta_campaign_id', campaignIds);

    const nameMap = new Map(
      (campaignData || []).map(c => [c.meta_campaign_id, { name: c.name, status: c.status }])
    );

    const summaries: CampaignMetricsSummary[] = cached.map(c => {
      const m = c.metrics as any;
      const info = nameMap.get(c.campaign_id);
      return {
        campaign_id: c.campaign_id,
        campaign_name: info?.name || c.campaign_id,
        status: info?.status || 'unknown',
        impressions: m.impressions || 0,
        reach: m.reach || 0,
        clicks: m.clicks || 0,
        spend: m.spend || 0,
        ctr: m.ctr || 0,
        cpa: m.cpa || 0,
        conversations: m.conversations || 0,
        frequency: m.frequency || 0,
        fetched_at: c.fetched_at,
      };
    });

    // Sort by spend descending
    summaries.sort((a, b) => b.spend - a.spend);
    setCampaigns(summaries);
  };

  const fetchAlerts = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('performance_alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    setAlerts((data as PerformanceAlert[]) || []);
  };

  const fetchApiUsage = async () => {
    if (!user) return;

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data } = await supabase
      .from('meta_api_usage')
      .select('hour_bucket, call_count')
      .eq('user_id', user.id)
      .gte('hour_bucket', twentyFourHoursAgo)
      .order('hour_bucket', { ascending: true });

    const usage: ApiUsageStats[] = (data || []).map(d => ({
      hour: new Date(d.hour_bucket).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      call_count: d.call_count,
      limit: 200,
      percentage: Math.round((d.call_count / 200) * 100),
    }));

    setApiUsage(usage);
  };

  const dismissAlert = async (alertId: string) => {
    await supabase
      .from('performance_alerts')
      .update({ is_read: true })
      .eq('id', alertId);

    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_read: true } : a));
  };

  const refreshMetrics = async () => {
    if (!user) return;
    setIsRefreshing(true);

    try {
      await supabase.functions.invoke('metrics-cache-refresh', {
        body: { mode: 'refresh_user', user_id: user.id, date_preset: 'last_7d' },
      });

      // Also check for alerts
      await supabase.functions.invoke('metrics-cache-refresh', {
        body: { mode: 'check_alerts' },
      });

      // Reload data
      await Promise.all([fetchCampaignMetrics(), fetchAlerts(), fetchApiUsage()]);
    } catch (e) {
      console.error('Error refreshing metrics:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([fetchCampaignMetrics(), fetchAlerts(), fetchApiUsage()]);
      setIsLoading(false);
    };

    if (user) load();
  }, [user]);

  // Aggregate totals
  const totals = campaigns.reduce(
    (acc, c) => ({
      impressions: acc.impressions + c.impressions,
      reach: acc.reach + c.reach,
      clicks: acc.clicks + c.clicks,
      spend: acc.spend + c.spend,
      conversations: acc.conversations + c.conversations,
    }),
    { impressions: 0, reach: 0, clicks: 0, spend: 0, conversations: 0 }
  );

  const unreadAlerts = alerts.filter(a => !a.is_read).length;

  return {
    campaigns,
    alerts,
    apiUsage,
    totals,
    unreadAlerts,
    isLoading,
    isRefreshing,
    refreshMetrics,
    dismissAlert,
  };
};
