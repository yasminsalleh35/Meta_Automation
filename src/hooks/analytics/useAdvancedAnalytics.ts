
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useMetaCampaignInsights } from '@/hooks/useMetaCampaignInsights';
import { useRealCampaigns } from '@/hooks/useRealCampaigns';

interface AnalyticsFilters {
  dateRange: {
    from: Date;
    to: Date;
  };
  campaigns: string[];
  status: string;
  objective: string;
  period: string;
}

interface AnalyticsData {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  averageCTR: number;
  averageCPC: number;
  trends: {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cpc: number;
  };
  timeSeriesData: Array<{
    date: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
  }>;
  campaignComparison: Array<{
    name: string;
    spend: number;
    ctr: number;
    cpc: number;
  }>;
  platformDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  campaigns: Array<{
    id: string;
    name: string;
    status: 'active' | 'paused' | 'finished';
    objective: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cpc: number;
    roas: number;
    createdAt: string;
  }>;
  demographics?: {
    ageGroups: Array<{
      age: string;
      spend: number;
      impressions: number;
      clicks: number;
      ctr: number;
    }>;
    genderDistribution: Array<{
      gender: string;
      spend: number;
      percentage: number;
      color: string;
    }>;
    topLocations: Array<{
      location: string;
      spend: number;
      clicks: number;
      impressions: number;
    }>;
  };
}

export const useAdvancedAnalytics = () => {
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to: new Date()
    },
    campaigns: [],
    status: 'all',
    objective: 'all',
    period: '30d'
  });

  const { campaigns, isLoading: campaignsLoading } = useRealCampaigns();
  const { insights, isLoading: insightsLoading, fetchInsights } = useMetaCampaignInsights();

  const [data, setData] = useState<AnalyticsData | null>(null);

  // Memoizar função updateFilters para evitar recriação desnecessária
  const updateFilters = useCallback((newFilters: Partial<AnalyticsFilters>) => {
    setFilters(prev => {
      const updated = { ...prev, ...newFilters };
      
      // Atualizar dateRange baseado no período apenas se necessário
      if (newFilters.period && newFilters.period !== 'custom' && newFilters.period !== prev.period) {
        const days = parseInt(newFilters.period.replace('d', ''));
        updated.dateRange = {
          from: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
          to: new Date()
        };
      }
      
      return updated;
    });
  }, []);

  // Memoizar campanhas filtradas
  const filteredCampaigns = useMemo(() => {
    if (!campaigns) return [];
    
    return campaigns.filter(campaign => {
      if (filters.status !== 'all' && campaign.status !== filters.status) {
        return false;
      }
      
      if (filters.objective !== 'all' && campaign.objective !== filters.objective) {
        return false;
      }
      
      if (filters.campaigns.length > 0 && !filters.campaigns.includes(campaign.id)) {
        return false;
      }
      
      return true;
    });
  }, [campaigns, filters.status, filters.objective, filters.campaigns]);

  // Memoizar campanhas com meta_campaign_id
  const campaignsWithMeta = useMemo(() => {
    return filteredCampaigns
      .filter(c => c.meta_campaign_id)
      .map(c => ({
        id: c.id,
        meta_campaign_id: c.meta_campaign_id!
      }));
  }, [filteredCampaigns]);

  // audit DATA-01: the static June series, platform split and demographics were
  // fabricated. They are no longer produced; the page stays hidden behind
  // FEATURE_ADVANCED_ANALYTICS until it is rebuilt on real Meta breakdowns.

  // audit DATA-01: the old dependency array only tracked `campaignsWithMeta.length`,
  // so changing the campaign filter to a same-sized set never refetched. Key the
  // effect on the actual ids + date window, and read the (non-memoised)
  // fetchInsights through a ref so it doesn't retrigger the effect every render.
  const fetchInsightsRef = useRef(fetchInsights);
  fetchInsightsRef.current = fetchInsights;
  const campaignsKey = campaignsWithMeta.map(c => `${c.id}:${c.meta_campaign_id}`).join(',');
  const sinceKey = filters.dateRange.from.toISOString().split('T')[0];
  const untilKey = filters.dateRange.to.toISOString().split('T')[0];

  // Effect separado para buscar insights
  useEffect(() => {
    if (campaignsWithMeta.length > 0) {
      console.log('🔄 Fetching insights for campaigns:', campaignsWithMeta.length);
      fetchInsightsRef.current(campaignsWithMeta, {
        dateRange: {
          since: sinceKey,
          until: untilKey
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- campaignsKey captures campaignsWithMeta
  }, [campaignsKey, sinceKey, untilKey]);

  // Effect separado para processar dados
  useEffect(() => {
    if (campaignsLoading || insightsLoading) {
      return;
    }

    if (!filteredCampaigns.length) {
      setData(null);
      return;
    }

    console.log('📊 Processing analytics data for', filteredCampaigns.length, 'campaigns');

    // Processar dados das campanhas
    const campaignsData = filteredCampaigns.map(campaign => {
      const insight = insights.find(i => i.campaignId === campaign.id);
      const spend = insight?.insights.spend || 0;
      const impressions = insight?.insights.impressions || 0;
      const clicks = insight?.insights.clicks || 0;
      // audit DATA-01: conversions used to be simulated as a fixed share of clicks
      // and ROAS from an invented ticket. This source has no conversion data, so
      // both are reported as 0 instead of made-up values.
      const conversions = 0;

      return {
        id: campaign.id,
        name: campaign.name || 'Campanha sem nome',
        status: campaign.status as 'active' | 'paused' | 'finished',
        objective: campaign.objective || 'LEAD_GENERATION',
        spend,
        impressions,
        clicks,
        conversions,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        cpc: clicks > 0 ? spend / clicks : 0,
        roas: 0,
        createdAt: campaign.created_at || new Date().toISOString()
      };
    });

    // Calcular totais
    const totals = campaignsData.reduce((acc, campaign) => ({
      spend: acc.spend + campaign.spend,
      impressions: acc.impressions + campaign.impressions,
      clicks: acc.clicks + campaign.clicks,
      conversions: acc.conversions + campaign.conversions
    }), { spend: 0, impressions: 0, clicks: 0, conversions: 0 });

    const processedData: AnalyticsData = {
      totalSpend: totals.spend,
      totalImpressions: totals.impressions,
      totalClicks: totals.clicks,
      totalConversions: totals.conversions,
      averageCTR: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
      averageCPC: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
      // audit DATA-01: no period-over-period window is fetched yet, so no trend is shown.
      trends: {
        spend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        ctr: 0,
        cpc: 0
      },
      timeSeriesData: [],
      campaignComparison: campaignsData.slice(0, 8).map(campaign => ({
        name: campaign.name.substring(0, 15) + (campaign.name.length > 15 ? '...' : ''),
        spend: campaign.spend,
        ctr: campaign.ctr,
        cpc: campaign.cpc
      })),
      platformDistribution: [],
      campaigns: campaignsData,
      demographics: undefined
    };

    setData(processedData);
  }, [filteredCampaigns, insights, campaignsLoading, insightsLoading]);

  const isLoading = campaignsLoading || insightsLoading;

  return {
    data,
    isLoading,
    filters,
    updateFilters
  };
};
