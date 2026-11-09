import { useCampaignData } from '@/hooks/campaign/useCampaignData';

// audit PLT-01: read-only view of the user's campaigns. The old Meta "sync"/"pause"/"delete"
// paths (useCampaignMetaOperations, useMetaCampaignManagement, useMetaCampaignSync) read
// integrations.access_token from the browser, which is no longer readable, and had no callers.
export const useRealCampaigns = () => {
  const { campaigns, isLoading, error, fetchCampaigns } = useCampaignData();

  return {
    campaigns,
    isLoading,
    error,
    refetch: fetchCampaigns,
  };
};
