
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMetaCampaignSync } from '@/hooks/useMetaCampaignSync';
import { RealCampaign } from '@/types/realCampaign';
import { CampaignSyncResult } from '@/types/campaignManagement';

export const useCampaignSync = (campaigns: RealCampaign[]) => {
  const { toast } = useToast();
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const metaSync = useMetaCampaignSync();

  // Calculate out-of-sync campaigns
  const outOfSyncCampaigns = campaigns
    .filter(campaign => !campaign.meta_campaign_id)
    .map(campaign => campaign.id);

  const getCampaignSyncStatus = (campaignId: string): CampaignSyncResult | null => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return null;

    const isConnected = !!campaign.meta_campaign_id;
    
    return {
      success: isConnected,
      localStatus: campaign.status,
      metaStatus: isConnected ? 'ACTIVE' : 'NOT_FOUND',
      synced: isConnected
    };
  };

  const refreshCampaignSync = async (fetchCampaigns: () => Promise<void>) => {
    setLastSyncTime(new Date());
    await fetchCampaigns();
  };

  // Sync campaigns with Meta Ads
  const syncWithMetaAds = async (fetchCampaigns: () => Promise<void>) => {
    if (!metaSync.hasMetaIntegration) {
      toast({
        title: "Integração não encontrada",
        description: "Configure a integração com Meta Ads primeiro.",
        variant: "destructive"
      });
      return;
    }

    try {
      const results = await metaSync.syncCampaigns(campaigns);
      
      // Refresh campaigns after sync to get updated meta_campaign_ids
      await fetchCampaigns();
      setLastSyncTime(new Date());
      
      return results;
    } catch (error) {
      console.error('Error syncing campaigns:', error);
    }
  };

  return {
    lastSyncTime,
    outOfSyncCampaigns,
    getCampaignSyncStatus,
    refreshCampaignSync,
    syncWithMetaAds,
    hasMetaIntegration: metaSync.hasMetaIntegration,
    syncResults: metaSync.syncResults,
    isSyncing: metaSync.isSyncing
  };
};
