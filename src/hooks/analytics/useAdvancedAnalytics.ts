
import { useState, useEffect, useMemo, useCallback } from 'react';
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

  // Função para gerar dados estáticos (evitar randomização que causa re-renders)
  const generateStaticData = useCallback(() => {
    const staticTimeSeriesData = [
      { date: '1 Jun', spend: 245, impressions: 3200, clicks: 89, conversions: 12 },
      { date: '5 Jun', spend: 312, impressions: 4100, clicks: 124, conversions: 18 },
      { date: '10 Jun', spend: 287, impressions: 3800, clicks: 105, conversions: 15 },
      { date: '15 Jun', spend: 398, impressions: 5200, clicks: 156, conversions: 24 },
      { date: '20 Jun', spend: 445, impressions: 5800, clicks: 178, conversions: 28 },
      { date: '25 Jun', spend: 523, impressions: 6800, clicks: 203, conversions: 35 },
      { date: '28 Jun', spend: 467, impressions: 6100, clicks: 189, conversions: 31 }
    ];

    const staticPlatformDistribution = [
      { name: 'Facebook', value: 1850, color: '#1877F2' },
      { name: 'Instagram', value: 1250, color: '#E4405F' },
      { name: 'Audience Network', value: 680, color: '#42B883' },
      { name: 'Messenger', value: 320, color: '#00BFA5' }
    ];

    return { staticTimeSeriesData, staticPlatformDistribution };
  }, []);

  // Effect separado para buscar insights
  useEffect(() => {
    if (campaignsWithMeta.length > 0) {
      console.log('🔄 Fetching insights for campaigns:', campaignsWithMeta.length);
      fetchInsights(campaignsWithMeta, {
        dateRange: {
          since: filters.dateRange.from.toISOString().split('T')[0],
          until: filters.dateRange.to.toISOString().split('T')[0]
        }
      });
    }
  }, [campaignsWithMeta.length, filters.dateRange.from.toISOString().split('T')[0], filters.dateRange.to.toISOString().split('T')[0]]);

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

    const { staticTimeSeriesData, staticPlatformDistribution } = generateStaticData();

    // Processar dados das campanhas
    const campaignsData = filteredCampaigns.map(campaign => {
      const insight = insights.find(i => i.campaignId === campaign.id);
      const spend = insight?.insights.spend || 0;
      const impressions = insight?.insights.impressions || 0;
      const clicks = insight?.insights.clicks || 0;
      const conversions = Math.floor(clicks * 0.15); // 15% conversion rate simulada
      
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
        roas: spend > 0 ? (conversions * 50) / spend : 0,
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
      trends: {
        spend: 12.5,
        impressions: 18.2,
        clicks: 15.8,
        conversions: 22.1,
        ctr: -2.3,
        cpc: -8.7
      },
      timeSeriesData: staticTimeSeriesData,
      campaignComparison: campaignsData.slice(0, 8).map(campaign => ({
        name: campaign.name.substring(0, 15) + (campaign.name.length > 15 ? '...' : ''),
        spend: campaign.spend,
        ctr: campaign.ctr,
        cpc: campaign.cpc
      })),
      platformDistribution: staticPlatformDistribution,
      campaigns: campaignsData,
      demographics: {
        ageGroups: [
          { age: '18-24', spend: 1200, impressions: 15000, clicks: 320, ctr: 2.13 },
          { age: '25-34', spend: 2800, impressions: 35000, clicks: 890, ctr: 2.54 },
          { age: '35-44', spend: 2100, impressions: 28000, clicks: 670, ctr: 2.39 },
          { age: '45-54', spend: 1600, impressions: 22000, clicks: 450, ctr: 2.05 },
          { age: '55-64', spend: 800, impressions: 12000, clicks: 210, ctr: 1.75 },
          { age: '65+', spend: 400, impressions: 8000, clicks: 120, ctr: 1.50 }
        ],
        genderDistribution: [
          { gender: 'Feminino', spend: 4500, percentage: 52.3, color: '#F97316' },
          { gender: 'Masculino', spend: 3800, percentage: 44.2, color: '#3B82F6' },
          { gender: 'Não informado', spend: 300, percentage: 3.5, color: '#6B7280' }
        ],
        topLocations: [
          { location: 'São Paulo, SP', spend: 2800, clicks: 650, impressions: 28000 },
          { location: 'Rio de Janeiro, RJ', spend: 1900, clicks: 420, impressions: 19000 },
          { location: 'Belo Horizonte, MG', spend: 1200, clicks: 290, impressions: 12500 },
          { location: 'Brasília, DF', spend: 980, clicks: 230, impressions: 9800 },
          { location: 'Salvador, BA', spend: 850, clicks: 195, impressions: 8200 }
        ]
      }
    };

    setData(processedData);
  }, [filteredCampaigns, insights, campaignsLoading, insightsLoading, generateStaticData]);

  const isLoading = campaignsLoading || insightsLoading;

  return {
    data,
    isLoading,
    filters,
    updateFilters
  };
};
