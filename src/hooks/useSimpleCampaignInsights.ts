
import { useState, useEffect } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/contexts/AuthContext';

interface Campaign {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'REJECTED';
  createdAt: string;
  metaCampaignId?: string;
  metaAdId?: string;
}

interface Insights {
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
  reach: number;
  leads: number;
  cpl: number;
}

export const useSimpleCampaignInsights = (campaignId: string) => {
  const supabase = useSupabase();
  const { session } = useAuth();
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaignData = async () => {
    if (!session?.user?.id) {
      setError('Usuário não autenticado');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Buscar dados da campanha
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('user_id', session.user.id)
        .single();

      if (campaignError || !campaignData) {
        throw new Error('Campanha não encontrada ou você não tem acesso a ela');
      }

      // Mapear dados da campanha
      const mappedCampaign: Campaign = {
        id: campaignData.id,
        name: campaignData.name || 'Campanha sem nome',
        status: mapStatus(campaignData.status),
        createdAt: campaignData.created_at,
        metaCampaignId: campaignData.meta_campaign_id,
        metaAdId: campaignData.meta_ad_id
      };

      setCampaign(mappedCampaign);

      // Buscar insights se tiver Meta Ad ID (token é buscado server-side)
      if (campaignData.meta_ad_id) {
        await fetchInsights(campaignData.meta_ad_id);
      } else {
        console.warn('Meta Ad ID não disponível para insights');
        setInsights(null);
      }

    } catch (err) {
      console.error('Erro ao carregar dados da campanha:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInsights = async (adId: string) => {
    try {
      console.log('Buscando insights para Ad ID:', adId);

      const { data, error } = await supabase.functions.invoke('meta-campaigns-insights', {
        body: {
          campaignId: campaignId,
          adId: adId
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao buscar insights');
      }

      if (data?.success && data?.metrics) {
        setInsights(data.metrics);
        console.log('Insights carregados com sucesso:', data.metrics);
      } else if (data?.impressions !== undefined) {
        // Direct response format from single campaign mode
        setInsights({
          impressions: data.impressions || 0,
          clicks: data.clicks || 0,
          ctr: data.ctr || 0,
          spend: data.spend || 0,
          reach: data.reach || 0,
          leads: 0,
          cpl: data.cpa || 0,
        });
      } else {
        throw new Error(data?.error || 'Dados de insights não disponíveis');
      }

    } catch (err) {
      console.error('Erro ao buscar insights:', err);
      setInsights(null);
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
  }, [campaignId, session?.user?.id]);

  return {
    campaign,
    insights,
    isLoading,
    error,
    refetch: fetchCampaignData
  };
};
