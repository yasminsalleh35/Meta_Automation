
import { useMetaAdsConnection } from './meta-ads/useMetaAdsConnection';
import { useMetaAdsCampaignCreation } from './meta-ads/useMetaAdsCampaignCreation';
import { useMetaAdsInsights } from './meta-ads/useMetaAdsInsights';
import { useMetaAdsCreativeManagement } from './meta-ads/useMetaAdsCreativeManagement';
import { useMetaAdsInstagramManagement } from './meta-ads/useMetaAdsInstagramManagement';

export const useMetaAds = () => {
  const { connection, integration } = useMetaAdsConnection();
  
  const { createCampaign, isLoading: isCampaignLoading } = useMetaAdsCampaignCreation(connection);
  const { getCampaignInsights } = useMetaAdsInsights(connection);
  const { 
    checkCreativeInstagram, 
    updateCreativeInstagram, 
    getCreativeDetails,
    isLoading: isCreativeLoading
  } = useMetaAdsCreativeManagement(connection);
  const { 
    repairCampaignInstagram, 
    findBestInstagramForPage,
    isLoading: isInstagramLoading
  } = useMetaAdsInstagramManagement(connection);

  const isLoading = isCampaignLoading || isCreativeLoading || isInstagramLoading;

  return {
    connection,
    createCampaign,
    getCampaignInsights,
    checkCreativeInstagram,
    updateCreativeInstagram,
    getCreativeDetails,
    repairCampaignInstagram,
    findBestInstagramForPage,
    isLoading,
    // Expose integration data for debugging
    integration
  };
};
