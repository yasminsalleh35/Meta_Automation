
import { useMetaCampaignManagement } from '@/hooks/useMetaCampaignManagement';
import { RealCampaign } from '@/types/realCampaign';

export const useCampaignMetaOperations = (campaigns: RealCampaign[], updateCampaignStatus: (id: string, status: 'active' | 'paused' | 'finished') => Promise<boolean>, deleteCampaign: (id: string) => Promise<boolean>) => {
  const metaManagement = useMetaCampaignManagement();

  const pauseCampaignWithMeta = async (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign?.meta_campaign_id) {
      await updateCampaignStatus(campaignId, 'paused');
      return;
    }

    // audit CMP-09: só atualiza o DB (via callback) se a Meta confirmou; sem fallback em falha
    await metaManagement.pauseCampaign(
      campaignId,
      campaign.meta_campaign_id,
      () => updateCampaignStatus(campaignId, 'paused')
    );
  };

  const activateCampaignWithMeta = async (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign?.meta_campaign_id) {
      await updateCampaignStatus(campaignId, 'active');
      return;
    }

    // Usar ativação em cascata com todos os IDs se disponíveis
    await metaManagement.activateCampaign(
      campaignId,
      campaign.meta_campaign_id,
      campaign.meta_adset_id || '',
      campaign.meta_ad_id || '',
      () => updateCampaignStatus(campaignId, 'active')
    );
  };

  const deleteCampaignWithMeta = async (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    
    if (campaign?.meta_campaign_id) {
      await metaManagement.deleteCampaign(
        campaignId,
        campaign.meta_campaign_id,
        () => deleteCampaign(campaignId)
      );
    } else {
      await deleteCampaign(campaignId);
    }
  };

  const bulkUpdateCampaigns = async (
    campaignIds: string[],
    action: 'pause' | 'activate'
  ) => {
    const campaignsWithMeta = campaigns
      .filter(c => campaignIds.includes(c.id) && c.meta_campaign_id)
      .map(c => ({ id: c.id, metaCampaignId: c.meta_campaign_id! }));

    if (campaignsWithMeta.length > 0) {
      await metaManagement.bulkUpdateCampaigns(
        campaignsWithMeta,
        action,
        () => {
          const newStatus = action === 'pause' ? 'paused' : 'active';
          campaignIds.forEach(id => updateCampaignStatus(id, newStatus));
        }
      );
    } else {
      const newStatus = action === 'pause' ? 'paused' : 'active';
      for (const id of campaignIds) {
        await updateCampaignStatus(id, newStatus);
      }
    }
  };

  return {
    pauseCampaignWithMeta,
    activateCampaignWithMeta,
    deleteCampaignWithMeta,
    bulkUpdateCampaigns,
    isCampaignLoading: metaManagement.isCampaignLoading,
    isBulkLoading: metaManagement.isLoading
  };
};
