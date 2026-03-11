
import { metaAdsService } from '@/services/metaAdsService';

export const useMetaAdsInsights = (connection: any) => {
  const getCampaignInsights = async (adId: string) => {
    if (!connection.accessToken) {
      throw new Error('Access token não disponível');
    }

    try {
      return await metaAdsService.getCampaignInsights(adId, connection.accessToken);
    } catch (error) {
      console.error('Error fetching campaign insights:', error);
      throw error;
    }
  };

  return {
    getCampaignInsights
  };
};
