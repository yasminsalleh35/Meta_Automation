
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { metaAdsBulkOperationsService } from '@/services/metaAds/management/MetaAdsBulkOperationsService';

interface CampaignInsight {
  campaignId: string;
  metaCampaignId: string;
  insights: {
    impressions?: number;
    clicks?: number;
    spend?: number;
    cpm?: number;
    cpc?: number;
    ctr?: number;
    reach?: number;
    frequency?: number;
  };
  dateRange: {
    since: string;
    until: string;
  };
  success: boolean;
  error?: string;
}

export const useMetaCampaignInsights = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<CampaignInsight[]>([]);

  const fetchInsights = async (
    campaigns: Array<{ id: string; meta_campaign_id: string }>,
    options?: {
      dateRange?: { since: string; until: string };
      metrics?: string[];
    }
  ): Promise<CampaignInsight[]> => {
    setIsLoading(true);
    
    try {
      const campaignsWithMeta = campaigns.filter(c => c.meta_campaign_id);
      
      if (campaignsWithMeta.length === 0) {
        console.log('⚠️ No campaigns with Meta integration found');
        return [];
      }

      console.log('📊 Fetching insights for campaigns:', campaignsWithMeta.length);
      
      const campaignData = campaignsWithMeta.map(c => ({
        campaignId: c.id,
        metaCampaignId: c.meta_campaign_id
      }));

      const result = await metaAdsBulkOperationsService.getCampaignInsights(
        campaignData,
        options
      );

      console.log('📈 Raw insights result:', result);

      // Process and normalize the insights data
      const processedInsights = result.map(insight => {
        if (!insight.success) {
          console.error(`❌ Failed to get insights for campaign ${insight.campaignId}:`, insight.error);
          return insight;
        }

        // Extract metrics from nested structure if needed
        const rawInsights = insight.insights?.insights || insight.insights || {};
        console.log(`📊 Processing insights for campaign ${insight.campaignId}:`, rawInsights);

        // Normalize the insights data
        const normalizedInsights = {
          impressions: parseInt(String(rawInsights.impressions || 0)),
          clicks: parseInt(String(rawInsights.clicks || 0)),
          spend: parseFloat(String(rawInsights.spend || 0)),
          cpm: parseFloat(String(rawInsights.cpm || 0)),
          cpc: parseFloat(String(rawInsights.cpc || 0)),
          ctr: parseFloat(String(rawInsights.ctr || 0)),
          reach: parseInt(String(rawInsights.reach || 0)),
          frequency: parseFloat(String(rawInsights.frequency || 0))
        };

        console.log(`✅ Normalized insights for campaign ${insight.campaignId}:`, normalizedInsights);

        return {
          ...insight,
          insights: normalizedInsights
        };
      });

      setInsights(processedInsights);

      // Only show toast for significant errors (removed success toast to avoid confusion)
      const failureCount = processedInsights.filter(r => !r.success).length;
      const successCount = processedInsights.filter(r => r.success).length;
      
      console.log(`📊 Insights summary: ${successCount} successful, ${failureCount} failed`);
      
      // Only show toast if there are significant failures (>50% failure rate) and we have campaigns
      if (campaignsWithMeta.length > 0 && failureCount > 0 && failureCount / processedInsights.length > 0.5) {
        toast({
          title: "Problemas ao carregar métricas",
          description: `${failureCount}/${processedInsights.length} campanhas falharam ao carregar métricas`,
          variant: "destructive"
        });
      }

      return processedInsights;
    } catch (error) {
      console.error('❌ Error fetching insights:', error);
      // Only show error toast if there were campaigns with Meta integration
      const campaignsWithMeta = campaigns.filter(c => c.meta_campaign_id);
      if (campaignsWithMeta.length > 0) {
        toast({
          title: "Erro ao buscar métricas",
          description: error instanceof Error ? error.message : "Tente novamente mais tarde",
          variant: "destructive"
        });
      }
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const refreshInsights = async (
    campaigns: Array<{ id: string; meta_campaign_id: string }>
  ): Promise<void> => {
    await fetchInsights(campaigns);
  };

  const getInsightForCampaign = (campaignId: string): CampaignInsight | null => {
    const insight = insights.find(insight => insight.campaignId === campaignId);
    console.log(`🔍 Getting insight for campaign ${campaignId}:`, insight);
    return insight || null;
  };

  return {
    insights,
    isLoading,
    fetchInsights,
    refreshInsights,
    getInsightForCampaign
  };
};
