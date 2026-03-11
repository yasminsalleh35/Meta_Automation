
import { supabase } from '@/integrations/supabase/client';

interface CampaignData {
  campaignId: string;
  metaCampaignId: string;
}

interface InsightsOptions {
  dateRange?: { since: string; until: string };
  metrics?: string[];
}

interface CampaignInsight {
  campaignId: string;
  metaCampaignId: string;
  insights: any;
  dateRange: {
    since: string;
    until: string;
  };
  success: boolean;
  error?: string;
}

export interface BulkOperationResult {
  success: boolean;
  campaignId: string;
  metaCampaignId: string;
  action: string;
  message?: string;
  error?: string;
}

export interface BulkOperationSummary {
  total: number;
  successful: number;
  failed: number;
}

export class MetaAdsBulkOperationsService {
  async getCampaignInsights(
    campaigns: CampaignData[],
    options?: InsightsOptions
  ): Promise<CampaignInsight[]> {
    // Early return if no campaigns
    if (campaigns.length === 0) {
      console.log('⚠️ No campaigns to fetch insights for');
      return [];
    }

    try {
      console.log('📊 MetaAdsBulkOperationsService: Fetching insights for campaigns:', campaigns.length);
      
      const payload = {
        campaignIds: campaigns.map(c => c.campaignId),
        metaCampaignIds: campaigns.map(c => c.metaCampaignId),
        dateRange: options?.dateRange || {
          since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          until: new Date().toISOString().split('T')[0]
        },
        metrics: options?.metrics || [
          'impressions',
          'clicks',
          'spend',
          'cpm',
          'cpc',
          'ctr',
          'reach',
          'frequency'
        ]
      };

      console.log('📤 Sending insights request payload:', payload);

      const { data, error } = await supabase.functions.invoke('meta-campaigns-insights', {
        body: payload
      });

      if (error) {
        console.error('❌ Error calling meta-campaigns-insights function:', error);
        throw new Error(`Erro na função: ${error.message}`);
      }

      console.log('📥 Received insights response:', data);
      
      // Handle both old format (array) and new format (object with success/insights)
      if (Array.isArray(data)) {
        console.log('📈 Processing array format (legacy)');
        return data.map((insight, index) => ({
          campaignId: campaigns[index]?.campaignId || insight.campaignId,
          metaCampaignId: campaigns[index]?.metaCampaignId || insight.campaignId,
          insights: insight,
          dateRange: options?.dateRange || {
            since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            until: new Date().toISOString().split('T')[0]
          },
          success: true
        }));
      }
      
      if (!data || data.success === false) {
        // If no active integration, return empty insights (not an error)
        if (data?.error?.includes('No active Meta Ads integration')) {
          console.log('⚠️ No active Meta integration - returning empty insights');
          return campaigns.map(campaign => ({
            campaignId: campaign.campaignId,
            metaCampaignId: campaign.metaCampaignId,
            insights: {},
            dateRange: options?.dateRange || {
              since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              until: new Date().toISOString().split('T')[0]
            },
            success: false,
            error: 'No active integration'
          }));
        }
        console.error('❌ Function returned error:', data?.error);
        throw new Error(data?.error || 'Erro desconhecido na função');
      }

      // Process insights from new format { success: true, insights: [...] }
      const insights = data.insights || data || [];
      console.log('📈 Processing insights data:', insights.length, 'insights');
      
      return insights.map((insight: any, index: number) => ({
        campaignId: campaigns[index]?.campaignId || insight.campaignId,
        metaCampaignId: campaigns[index]?.metaCampaignId || insight.campaignId,
        insights: insight,
        dateRange: options?.dateRange || {
          since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          until: new Date().toISOString().split('T')[0]
        },
        success: true
      }));

    } catch (error) {
      console.error('❌ MetaAdsBulkOperationsService error:', error);
      
      // Return fallback data structure for each campaign
      return campaigns.map(campaign => ({
        campaignId: campaign.campaignId,
        metaCampaignId: campaign.metaCampaignId,
        insights: {},
        dateRange: options?.dateRange || {
          since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          until: new Date().toISOString().split('T')[0]
        },
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
    }
  }

  async bulkUpdateCampaigns(
    operations: Array<{ campaignId: string; metaCampaignId: string }>,
    action: 'pause' | 'activate' | 'delete'
  ): Promise<{
    results: BulkOperationResult[];
    summary: BulkOperationSummary;
  }> {
    try {
      console.log('🔄 Starting bulk operation:', { count: operations.length, action });

      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) {
        throw new Error('User not authenticated');
      }

      const response = await supabase.functions.invoke('meta-campaign-bulk-operations', {
        body: {
          action,
          campaignIds: operations.map(op => op.campaignId),
          metaCampaignIds: operations.map(op => op.metaCampaignId)
        },
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Bulk operation failed');
      }

      console.log('✅ Bulk operation completed:', response.data);
      
      return {
        results: response.data.results || [],
        summary: response.data.summary || { total: 0, successful: 0, failed: 0 }
      };
    } catch (error) {
      console.error('❌ Error in bulk operations service:', error);
      throw error;
    }
  }

  async triggerAutoSync(): Promise<any> {
    try {
      console.log('🔄 Triggering auto sync');

      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) {
        throw new Error('User not authenticated');
      }

      const response = await supabase.functions.invoke('meta-campaign-auto-sync', {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Auto sync failed');
      }

      console.log('✅ Auto sync completed:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error in auto sync:', error);
      throw error;
    }
  }
}

export const metaAdsBulkOperationsService = new MetaAdsBulkOperationsService();
