import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/hooks/useSupabase';
import { useToast } from '@/hooks/use-toast';

export const useIndividualCampaignRefresh = () => {
  const [refreshingCampaigns, setRefreshingCampaigns] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();
  const supabase = useSupabase();
  const { toast } = useToast();

  const refreshCampaign = useCallback(async (metaCampaignId: string, campaignId: string, campaignName?: string) => {
    if (!metaCampaignId) {
      toast({
        title: "Erro",
        description: "Campanha não possui ID do Meta Ads",
        variant: "destructive"
      });
      return;
    }

    // Prevent duplicate refresh
    if (refreshingCampaigns.has(campaignId)) {
      return;
    }

    setRefreshingCampaigns(prev => new Set(prev).add(campaignId));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      console.log(`🔄 Refreshing campaign ${campaignName || campaignId} (${metaCampaignId})`);

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
            meta_campaign_id: metaCampaignId
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to refresh campaign');
      }

      const result = await response.json();

      // Invalidate all relevant queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['campaigns-cache'] }),
        queryClient.invalidateQueries({ queryKey: ['meta-campaigns'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-campaigns'] })
      ]);

      toast({
        title: "Métricas atualizadas",
        description: campaignName 
          ? `"${campaignName}" atualizada com sucesso` 
          : "Campanha atualizada com sucesso",
      });

      console.log(`✅ Campaign ${campaignId} refreshed successfully`, result);

      return result;
    } catch (error) {
      console.error('Error refreshing campaign:', error);
      toast({
        title: "Erro ao atualizar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setRefreshingCampaigns(prev => {
        const newSet = new Set(prev);
        newSet.delete(campaignId);
        return newSet;
      });
    }
  }, [refreshingCampaigns, queryClient, supabase, toast]);

  const isRefreshing = useCallback((campaignId: string) => {
    return refreshingCampaigns.has(campaignId);
  }, [refreshingCampaigns]);

  return {
    refreshCampaign,
    isRefreshing,
    refreshingCampaigns
  };
};
