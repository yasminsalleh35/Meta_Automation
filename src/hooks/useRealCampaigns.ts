
import { useCampaignData } from '@/hooks/campaign/useCampaignData';
import { useCampaignStatus } from '@/hooks/campaign/useCampaignStatus';
import { useCampaignSync } from '@/hooks/campaign/useCampaignSync';
import { useCampaignMetaOperations } from '@/hooks/campaign/useCampaignMetaOperations';

export const useRealCampaigns = () => {
  const {
    campaigns,
    setCampaigns,
    updateCampaigns,
    isLoading,
    error,
    fetchCampaigns
  } = useCampaignData();

  const {
    updateCampaignStatus,
    deleteCampaign
  } = useCampaignStatus();

  const {
    lastSyncTime,
    outOfSyncCampaigns,
    getCampaignSyncStatus,
    refreshCampaignSync,
    syncWithMetaAds,
    hasMetaIntegration,
    syncResults,
    isSyncing
  } = useCampaignSync(campaigns);

  const {
    pauseCampaignWithMeta,
    activateCampaignWithMeta,
    deleteCampaignWithMeta,
    bulkUpdateCampaigns,
    isCampaignLoading,
    isBulkLoading
  } = useCampaignMetaOperations(campaigns, updateCampaignStatus, deleteCampaign);

  // Enhanced methods that update local state
  const enhancedUpdateCampaignStatus = async (campaignId: string, newStatus: 'active' | 'paused' | 'finished') => {
    const success = await updateCampaignStatus(campaignId, newStatus);
    if (success) {
      updateCampaigns(prev => 
        prev.map(campaign => 
          campaign.id === campaignId 
            ? { ...campaign, status: newStatus }
            : campaign
        )
      );
    }
    return success;
  };

  const enhancedDeleteCampaign = async (campaignId: string) => {
    const success = await deleteCampaign(campaignId);
    if (success) {
      updateCampaigns(prev => prev.filter(campaign => campaign.id !== campaignId));
    }
    return success;
  };

  return {
    campaigns,
    isLoading: isLoading || isSyncing,
    error,
    refetch: fetchCampaigns,
    
    // Local-only methods (deprecated)
    updateCampaignStatus: enhancedUpdateCampaignStatus,
    deleteCampaign: enhancedDeleteCampaign,
    
    // Meta Ads integrated methods (recommended)
    pauseCampaign: pauseCampaignWithMeta,
    activateCampaign: activateCampaignWithMeta,
    deleteCampaignWithMeta,
    bulkUpdateCampaigns,
    
    // Sync functionality
    syncWithMetaAds: () => syncWithMetaAds(fetchCampaigns),
    hasMetaIntegration,
    syncResults,
    lastSyncTime,
    outOfSyncCampaigns,
    refreshCampaignSync: () => refreshCampaignSync(fetchCampaigns),
    getCampaignSyncStatus,
    
    // Loading states
    isCampaignLoading,
    isBulkLoading,
    isSyncing
  };
};
