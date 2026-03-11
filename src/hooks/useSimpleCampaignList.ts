
import { useState, useCallback, useEffect } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useToast } from '@/hooks/use-toast';

export interface SimpleCampaignListItem {
  campaignId: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'REJECTED';
  createdAt: string;
  impressions: number;
  clicks: number;
  costPerResult: number;
  metaCampaignId?: string;
  metaAdsetId?: string;
  metaAdId?: string;
  mediaPreviewUrl?: string;
}

export interface SimpleCampaignListFilters {
  status?: 'ACTIVE' | 'PAUSED' | 'REJECTED' | '';
  dateFrom?: string;
  dateTo?: string;
}

export const useSimpleCampaignList = () => {
  const supabase = useSupabase();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<SimpleCampaignListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SimpleCampaignListFilters>({});

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/simple-campaign-list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao buscar campanhas');
      }

      const result = await response.json();
      setCampaigns(result.campaigns || []);
      
    } catch (error) {
      console.error('❌ Error fetching simple campaigns:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  }, [supabase.auth, filters]);

  const pauseCampaign = useCallback(async (campaignId: string) => {
    console.log('🔄 [FRONTEND] Pausing campaign UUID:', campaignId);
    try {
      const { data, error } = await supabase.functions.invoke('simple-campaign-pause', {
        body: { campaignId }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Atualizar lista local
      setCampaigns(prev => 
        prev.map(campaign => 
          campaign.campaignId === campaignId 
            ? { ...campaign, status: 'PAUSED' as const }
            : campaign
        )
      );

      return { success: true };
    } catch (error) {
      console.error('❌ Error pausing campaign:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }, [supabase]);

  const activateCampaign = useCallback(async (campaignId: string) => {
    console.log('🔄 [FRONTEND] Activating campaign UUID:', campaignId);
    try {
      const { data, error } = await supabase.functions.invoke('simple-campaign-activate', {
        body: { campaignId }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Atualizar lista local
      setCampaigns(prev => 
        prev.map(campaign => 
          campaign.campaignId === campaignId 
            ? { ...campaign, status: 'ACTIVE' as const }
            : campaign
        )
      );

      return { success: true };
    } catch (error) {
      console.error('❌ Error activating campaign:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }, [supabase]);

  const updateFilters = useCallback((newFilters: SimpleCampaignListFilters) => {
    setFilters(newFilters);
  }, []);

  const refreshMetrics = useCallback(async () => {
    setIsLoading(true);
    
    try {
      console.log('🔄 Forçando sincronização de métricas...');
      
      // Trigger meta-campaign-auto-sync to update metrics
      const { data, error } = await supabase.functions.invoke('meta-campaign-auto-sync');
      
      if (error) throw error;
      
      // Wait 2 seconds for sync to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refetch campaigns with updated metrics
      await fetchCampaigns();
      
      toast({
        title: "✅ Métricas atualizadas",
        description: "As métricas das campanhas foram sincronizadas com sucesso.",
      });
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error refreshing metrics:', error);
      toast({
        title: "❌ Erro ao atualizar métricas",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive"
      });
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    } finally {
      setIsLoading(false);
    }
  }, [supabase, fetchCampaigns, toast]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return {
    campaigns,
    isLoading,
    error,
    filters,
    fetchCampaigns,
    pauseCampaign,
    activateCampaign,
    updateFilters,
    refreshMetrics
  };
};
