
import { useMemo } from 'react';
import { CampaignData } from '@/types/campaign';

export const useCampaignValidation = (campaignData: CampaignData) => {
  const isStep1Valid = useMemo(() => {
    const hasSelectedLocations = !!(campaignData.location.selectedLocations && campaignData.location.selectedLocations.length > 0);
    console.log('🔍 Step 1 validation:', {
      hasSelectedLocations,
      selectedLocationsCount: campaignData.location.selectedLocations?.length || 0
    });
    return hasSelectedLocations;
  }, [campaignData.location.selectedLocations]);

  const isStep2Valid = useMemo(() => {
    const hasValidBudget = campaignData.budget.daily > 0 && campaignData.budget.daily >= 20; // Meta minimum
    console.log('🔍 Step 2 validation:', {
      dailyBudget: campaignData.budget.daily,
      isValid: hasValidBudget
    });
    return hasValidBudget;
  }, [campaignData.budget.daily]);

  const isStep3Valid = useMemo(() => {
    const hasStartDate = campaignData.duration.startDate !== '';
    const hasValidEndDate = !campaignData.duration.endDate || 
      (campaignData.duration.endDate !== '' && 
       new Date(campaignData.duration.endDate) > new Date(campaignData.duration.startDate));
    
    const isValid = hasStartDate && hasValidEndDate;
    console.log('🔍 Step 3 validation:', {
      hasStartDate,
      hasValidEndDate,
      isValid
    });
    
    return isValid;
  }, [campaignData.duration.startDate, campaignData.duration.endDate]);

  const isStep4Valid = useMemo(() => {
    const hasName = campaignData.campaignName.trim() !== '';
    const hasAdContent = campaignData.adText.trim() !== '' && campaignData.adTitle.trim() !== '';
    const hasPages = campaignData.selectedFanPage !== '' || 
                    campaignData.selectedInstagram !== '' ||
                    campaignData.selectedWhatsApp !== '';
    const hasMedia = campaignData.media !== null;
    
    const isValid = hasName && hasAdContent && hasPages && hasMedia;
    console.log('🔍 Step 4 validation:', {
      hasName,
      hasAdContent,
      hasPages,
      hasMedia,
      isValid
    });
    
    return isValid;
  }, [
    campaignData.campaignName,
    campaignData.adText,
    campaignData.adTitle,
    campaignData.selectedFanPage,
    campaignData.selectedInstagram,
    campaignData.selectedWhatsApp,
    campaignData.media
  ]);

  return {
    isStep1Valid,
    isStep2Valid,
    isStep3Valid,
    isStep4Valid
  };
};
