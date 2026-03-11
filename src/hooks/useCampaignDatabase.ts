
import { useCampaignSaver } from '@/hooks/campaign/useCampaignSaver';
import { useCampaignLoader } from '@/hooks/campaign/useCampaignLoader';

export const useCampaignDatabase = () => {
  const { saveCampaign, isSaving } = useCampaignSaver();
  const { loadCampaign } = useCampaignLoader();

  return {
    saveCampaign,
    loadCampaign,
    isSaving
  };
};
