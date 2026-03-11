import { useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useToast } from '@/hooks/use-toast';

interface ExternalSyncParams {
  userId: string;
  metaCampaignId: string;
  metaAdsetId: string;
  metaCreativeId?: string;
  metaAdId: string;
}

export const useExternalCampaignSync = () => {
  const supabase = useSupabase();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const syncExternalCampaign = async (params: ExternalSyncParams) => {
    setIsLoading(true);
    try {
      console.log('🔄 Starting external campaign sync...', params);

      const { data, error } = await supabase.functions.invoke(
        'campaign-external-sync',
        {
          body: {
            user_id: params.userId,
            meta_campaign_id: params.metaCampaignId,
            meta_adset_id: params.metaAdsetId,
            meta_creative_id: params.metaCreativeId,
            meta_ad_id: params.metaAdId
          }
        }
      );

      if (error) throw error;

      console.log('✅ External sync response:', data);

      toast({
        title: 'Sucesso! 🎉',
        description: `Campanha "${data.campaign_name}" sincronizada para o usuário`
      });

      return true;
    } catch (error: any) {
      console.error('❌ External sync error:', error);
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

  return { syncExternalCampaign, isLoading };
};
