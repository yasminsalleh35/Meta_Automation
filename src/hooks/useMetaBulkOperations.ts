
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { metaAdsBulkOperationsService, BulkOperationResult } from '@/services/metaAds/management/MetaAdsBulkOperationsService';

export const useMetaBulkOperations = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [lastResults, setLastResults] = useState<BulkOperationResult[]>([]);

  const executeBulkOperation = async (
    campaigns: Array<{ id: string; meta_campaign_id: string }>,
    action: 'pause' | 'activate' | 'delete',
    onSuccess?: () => void
  ): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const campaignsWithMeta = campaigns.filter(c => c.meta_campaign_id);
      
      if (campaignsWithMeta.length === 0) {
        toast({
          title: "Nenhuma campanha Meta encontrada",
          description: "As campanhas selecionadas não possuem integração com Meta Ads",
          variant: "destructive"
        });
        return false;
      }

      console.log('🔄 Executing bulk operation:', { count: campaignsWithMeta.length, action });
      
      const operations = campaignsWithMeta.map(c => ({
        campaignId: c.id,
        metaCampaignId: c.meta_campaign_id
      }));

      const { results, summary } = await metaAdsBulkOperationsService.bulkUpdateCampaigns(
        operations,
        action
      );

      setLastResults(results);

      const actionLabels = {
        pause: 'pausadas',
        activate: 'ativadas', 
        delete: 'excluídas'
      };

      if (summary.successful > 0) {
        toast({
          title: `Operação em lote concluída`,
          description: `${summary.successful} campanhas ${actionLabels[action]} com sucesso${summary.failed > 0 ? `. ${summary.failed} falharam.` : ''}`,
        });
        onSuccess?.();
      }

      if (summary.failed > 0) {
        const failedCampaigns = results.filter(r => !r.success);
        const errors = failedCampaigns.map(r => r.error).join(', ');
        toast({
          title: "Algumas operações falharam",
          description: errors,
          variant: "destructive"
        });
      }

      return summary.successful > 0;
    } catch (error) {
      console.error('❌ Error in bulk operation:', error);
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

  const triggerAutoSync = async (): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      console.log('🔄 Triggering auto sync');
      
      const result = await metaAdsBulkOperationsService.triggerAutoSync();
      
      toast({
        title: "Sincronização automática executada",
        description: `${result.summary?.totalSynced || 0} campanhas sincronizadas, ${result.summary?.totalOutOfSync || 0} atualizadas`,
      });

      return true;
    } catch (error) {
      console.error('❌ Error in auto sync:', error);
      toast({
        title: "Erro na sincronização automática",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    lastResults,
    executeBulkOperation,
    triggerAutoSync
  };
};
