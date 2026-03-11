import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { metaAdsService } from '@/services/metaAdsService';
import { CampaignCreationData } from '@/services/metaAds/types';

export const useMetaAdsCampaignCreation = (connection: any) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const createCampaign = async (campaignData: CampaignCreationData) => {
    if (!connection.isConnected || !connection.adAccountId || !connection.pageId || !connection.accessToken) {
      throw new Error('Meta Ads não está conectado ou configurado corretamente');
    }

    // Validação obrigatória do daily_budget antes do envio
    if (!campaignData.daily_budget || campaignData.daily_budget <= 0) {
      throw new Error('Daily budget é obrigatório e deve ser maior que zero');
    }

    setIsLoading(true);
    try {
      console.log('Creating campaign with real Meta Ads integration:', {
        adAccountId: connection.adAccountId,
        pageId: connection.pageId,
        hasAccessToken: !!connection.accessToken,
        daily_budget: campaignData.daily_budget
      });

      const result = await metaAdsService.createAdvantageLeadCampaign(
        connection.adAccountId,
        connection.pageId,
        campaignData,
        connection.accessToken
      );

      if (result.status === 'success') {
        toast({
          title: "Campanha criada com sucesso!",
          description: "Sua campanha foi criada no Meta Ads e está pausada para revisão.",
        });
        return result;
      } else {
        throw new Error(result.message || 'Erro ao criar campanha');
      }
    } catch (error) {
      console.error('Error creating Meta campaign:', error);
      toast({
        title: "Erro ao criar campanha",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createCampaign,
    isLoading
  };
};
