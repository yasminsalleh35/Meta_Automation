import { useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useToast } from '@/hooks/use-toast';

interface ManualSyncParams {
  contingencyId: string;
  metaCampaignId: string;
  metaAdsetId: string;
  metaCreativeId?: string;
  metaAdId: string;
}

export const useContingencyManualSync = () => {
  const supabase = useSupabase();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const syncManually = async (params: ManualSyncParams) => {
    setIsLoading(true);
    try {
      console.log('🔄 Starting manual sync...', params);

      const { data, error } = await supabase.functions.invoke(
        'contingency-manual-sync',
        {
          body: {
            contingency_id: params.contingencyId,
            meta_campaign_id: params.metaCampaignId,
            meta_adset_id: params.metaAdsetId,
            meta_creative_id: params.metaCreativeId,
            meta_ad_id: params.metaAdId
          }
        }
      );

      if (error) throw error;

      console.log('✅ Manual sync response:', data);

      toast({
        title: 'Sucesso! 🎉',
        description: 'Campanha sincronizada e criada no Camply para o usuário'
      });

      return true;
    } catch (error: any) {
      console.error('❌ Manual sync error:', error);
      toast({
        title: 'Erro na sincronização',
        description: error.message || 'Erro desconhecido ao sincronizar campanha',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { syncManually, isLoading };
};
