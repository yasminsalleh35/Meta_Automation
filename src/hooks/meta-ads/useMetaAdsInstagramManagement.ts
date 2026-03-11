
import { useState } from 'react';
import { metaAdsService } from '@/services/metaAdsService';

export const useMetaAdsInstagramManagement = (connection: any) => {
  const [isLoading, setIsLoading] = useState(false);

  const repairCampaignInstagram = async (
    campaignId: string,
    campaignName: string,
    pageId: string,
    creativeIds: string[]
  ) => {
    if (!connection.accessToken) {
      throw new Error('Access token não disponível');
    }

    setIsLoading(true);
    try {
      const result = await metaAdsService.repairCampaignInstagram(
        campaignId,
        campaignName,
        pageId,
        creativeIds,
        connection.accessToken
      );
      
      return result;
    } catch (error) {
      console.error('Error repairing campaign Instagram:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const findBestInstagramForPage = async (pageId: string) => {
    if (!connection.accessToken) {
      throw new Error('Access token não disponível');
    }

    try {
      return await metaAdsService.findBestInstagramForPage(pageId, connection.accessToken);
    } catch (error) {
      console.error('Error finding best Instagram for page:', error);
      throw error;
    }
  };

  return {
    repairCampaignInstagram,
    findBestInstagramForPage,
    isLoading
  };
};
