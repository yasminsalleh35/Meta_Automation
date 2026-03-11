
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMetaAdsIntegration } from '@/hooks/useMetaAdsIntegration';
import { useSupabase } from '@/hooks/useSupabase';
import { metaAdsCampaignSyncService, CampaignSyncResult } from '@/services/metaAds/MetaAdsCampaignSyncService';

export const useMetaCampaignSync = () => {
  const { toast } = useToast();
  const { existingIntegration } = useMetaAdsIntegration();
  const supabase = useSupabase();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<CampaignSyncResult[]>([]);

  const syncCampaigns = async (localCampaigns: any[]): Promise<CampaignSyncResult[]> => {
    if (!existingIntegration || !existingIntegration.access_token || !existingIntegration.ad_account_id) {
      throw new Error('Meta Ads integration not configured');
    }

    setIsSyncing(true);
    
    try {
      console.log('🚀 Starting Meta Ads campaign synchronization...');
      
      // Fetch Meta campaigns
      const metaCampaigns = await metaAdsCampaignSyncService.getMetaCampaigns(
        existingIntegration.ad_account_id,
        existingIntegration.access_token
      );

      // Sync campaigns
      const results = await metaAdsCampaignSyncService.syncCampaigns(
        localCampaigns,
        metaCampaigns
      );

      // Update local database with matched IDs
      await metaAdsCampaignSyncService.updateLocalCampaignIds(
        results,
        async (campaignId, metaIds) => {
          const { error } = await supabase
            .from('campaigns')
            .update({
              meta_campaign_id: metaIds.meta_campaign_id,
              meta_adset_id: metaIds.meta_adset_id,
              meta_ad_id: metaIds.meta_ad_id,
              updated_at: new Date().toISOString()
            })
            .eq('id', campaignId);

          if (error) {
            throw new Error(`Failed to update campaign ${campaignId}: ${error.message}`);
          }
        }
      );

      setSyncResults(results);

      const matchedCount = results.filter(r => r.matched).length;
      const totalCount = results.length;

      if (matchedCount > 0) {
        toast({
          title: "Sincronização concluída",
          description: `${matchedCount} de ${totalCount} campanhas foram sincronizadas com o Meta Ads.`,
        });
      } else if (totalCount > 0) {
        toast({
          title: "Nenhuma campanha sincronizada",
          description: "Não foi possível encontrar campanhas correspondentes no Meta Ads.",
          variant: "destructive"
        });
      }

      return results;
    } catch (error) {
      console.error('❌ Sync error:', error);
      
      toast({
        title: "Erro na sincronização",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
      
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const hasMetaIntegration = !!existingIntegration && existingIntegration.status === 'active';

  return {
    syncCampaigns,
    isSyncing,
    syncResults,
    hasMetaIntegration
  };
};
