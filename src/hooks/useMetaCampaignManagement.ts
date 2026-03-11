import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMetaAdsIntegration } from '@/hooks/useMetaAdsIntegration';
import { metaAdsCampaignManagementService } from '@/services/metaAds/management/MetaAdsCampaignManagementService';
import { CampaignManagementResponse } from '@/types/campaignManagement';

export const useMetaCampaignManagement = () => {
  const { toast } = useToast();
  const { existingIntegration } = useMetaAdsIntegration();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState<Set<string>>(new Set());

  const accessToken = existingIntegration?.access_token;

  const setLoadingForCampaign = (campaignId: string, loading: boolean) => {
    setLoadingCampaigns(prev => {
      const newSet = new Set(prev);
      if (loading) {
        newSet.add(campaignId);
      } else {
        newSet.delete(campaignId);
      }
      return newSet;
    });
  };

  const pauseCampaign = async (
    campaignId: string,
    metaCampaignId: string,
    onSuccess?: () => void
  ): Promise<boolean> => {
    if (!accessToken || !metaCampaignId) {
      toast({
        title: "Erro de integração",
        description: "Meta Ads não está conectado ou campanha não possui ID do Meta",
        variant: "destructive"
      });
      return false;
    }

    setLoadingForCampaign(campaignId, true);
    
    try {
      console.log('🔄 Pausing campaign:', { campaignId, metaCampaignId });
      
      const result = await metaAdsCampaignManagementService.pauseCampaign(
        metaCampaignId,
        accessToken
      );

      if (result.success) {
        toast({
          title: "Campanha pausada",
          description: result.message || "Campanha pausada com sucesso no Meta Ads",
        });
        onSuccess?.();
        return true;
      } else {
        throw new Error(result.error || 'Erro ao pausar campanha');
      }
    } catch (error) {
      console.error('❌ Error pausing campaign:', error);
      toast({
        title: "Erro ao pausar campanha",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoadingForCampaign(campaignId, false);
    }
  };

  const activateCampaign = async (
    campaignId: string,
    metaCampaignId: string,
    metaAdsetId: string,
    metaAdId: string,
    onSuccess?: () => void
  ): Promise<boolean> => {
    if (!accessToken || !metaCampaignId) {
      toast({
        title: "Erro de integração",
        description: "Meta Ads não está conectado ou campanha não possui ID do Meta",
        variant: "destructive"
      });
      return false;
    }

    setLoadingForCampaign(campaignId, true);
    
    try {
      console.log('🚀 Activating campaign cascade:', { 
        campaignId, 
        metaCampaignId, 
        metaAdsetId, 
        metaAdId 
      });

      // Usar ativação em cascata se temos todos os IDs necessários
      if (metaAdsetId && metaAdId) {
        const result = await metaAdsCampaignManagementService.activateCampaignCascade(
          metaCampaignId,
          metaAdsetId,
          metaAdId,
          accessToken
        );

        if (result.success) {
          toast({
            title: "Campanha ativada",
            description: result.message || "Campanha, conjunto e anúncio ativados com sucesso!",
          });
          onSuccess?.();
          return true;
        } else {
          throw new Error(result.error || 'Erro ao ativar campanha em cascata');
        }
      } else {
        // Fallback para ativação simples se não temos todos os IDs
        console.log('⚠️ Missing adset or ad IDs, using simple campaign activation');
        const result = await metaAdsCampaignManagementService.activateCampaign(
          metaCampaignId,
          accessToken
        );

        if (result.success) {
          toast({
            title: "Campanha ativada",
            description: "Campanha ativada (apenas nível de campanha)",
            variant: "default"
          });
          onSuccess?.();
          return true;
        } else {
          throw new Error(result.error || 'Erro ao ativar campanha');
        }
      }
    } catch (error) {
      console.error('❌ Error activating campaign:', error);
      toast({
        title: "Erro ao ativar campanha",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoadingForCampaign(campaignId, false);
    }
  };

  const deleteCampaign = async (
    campaignId: string,
    metaCampaignId: string,
    onSuccess?: () => void
  ): Promise<boolean> => {
    if (!accessToken || !metaCampaignId) {
      toast({
        title: "Erro de integração",
        description: "Meta Ads não está conectado ou campanha não possui ID do Meta",
        variant: "destructive"
      });
      return false;
    }

    setLoadingForCampaign(campaignId, true);
    
    try {
      console.log('🗑️ Deleting campaign:', { campaignId, metaCampaignId });
      
      const result = await metaAdsCampaignManagementService.deleteCampaign(
        metaCampaignId,
        accessToken
      );

      if (result.success) {
        toast({
          title: "Campanha excluída",
          description: result.message || "Campanha excluída com sucesso no Meta Ads",
        });
        onSuccess?.();
        return true;
      } else {
        throw new Error(result.error || 'Erro ao excluir campanha');
      }
    } catch (error) {
      console.error('❌ Error deleting campaign:', error);
      toast({
        title: "Erro ao excluir campanha",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoadingForCampaign(campaignId, false);
    }
  };

  const bulkUpdateCampaigns = async (
    campaigns: Array<{ id: string; metaCampaignId: string }>,
    action: 'pause' | 'activate',
    onSuccess?: () => void
  ): Promise<boolean> => {
    if (!accessToken) {
      toast({
        title: "Erro de integração",
        description: "Meta Ads não está conectado",
        variant: "destructive"
      });
      return false;
    }

    setIsLoading(true);
    
    try {
      console.log('🔄 Bulk updating campaigns:', { campaigns: campaigns.length, action });
      
      const metaCampaignIds = campaigns.map(c => c.metaCampaignId).filter(Boolean);
      
      if (metaCampaignIds.length === 0) {
        throw new Error('Nenhuma campanha possui ID do Meta Ads');
      }

      const results = await metaAdsCampaignManagementService.bulkUpdateCampaigns(
        metaCampaignIds,
        action === 'pause' ? 'PAUSED' : 'ACTIVE',
        accessToken
      );

      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        toast({
          title: `${action === 'pause' ? 'Campanhas pausadas' : 'Campanhas ativadas'}`,
          description: `${successCount} campanhas atualizadas com sucesso${failCount > 0 ? `. ${failCount} falharam.` : ''}`,
        });
        onSuccess?.();
      }

      if (failCount > 0) {
        const errors = results.filter(r => !r.success).map(r => r.error).join(', ');
        toast({
          title: "Algumas operações falharam",
          description: errors,
          variant: "destructive"
        });
      }

      return successCount > 0;
    } catch (error) {
      console.error('❌ Error in bulk update:', error);
      toast({
        title: "Erro na operação em lote",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const isCampaignLoading = (campaignId: string): boolean => {
    return loadingCampaigns.has(campaignId);
  };

  return {
    pauseCampaign,
    activateCampaign,
    deleteCampaign,
    bulkUpdateCampaigns,
    isLoading,
    isCampaignLoading,
    hasMetaIntegration: !!accessToken
  };
};
