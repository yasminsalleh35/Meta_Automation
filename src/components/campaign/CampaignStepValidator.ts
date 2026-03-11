
import { CampaignData } from '@/types/campaign';

export const validateStep = (step: number, campaignData: CampaignData): boolean => {
  switch (step) {
    case 2: // Etapa 1: Configuração da Campanha (antiga etapa 2)
      return !!(
        campaignData.objective &&
        campaignData.location.selectedLocations.length > 0 &&
        campaignData.budget.daily > 0 &&
        campaignData.duration.startDate
      );
    
    case 3: // Etapa 2: Criativos WhatsApp (antiga etapa 3)
      return !!(
        campaignData.campaignName &&
        campaignData.adText &&
        campaignData.whatsappNumber &&
        (campaignData.media || campaignData.selectedMediaId)
      );
    
    default:
      return true;
  }
};
