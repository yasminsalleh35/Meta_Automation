
import { CampaignData } from '@/types/campaign';
import { BudgetUtils } from '@/services/metaAds/utils/budgetUtils';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export const useCampaignCreationValidator = () => {
  const validateStep = (step: number, campaignData: CampaignData): ValidationResult => {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    switch (step) {
      case 1: // Location
        if (!campaignData.location.selectedLocations?.length) {
          result.isValid = false;
          result.errors.push('Selecione pelo menos uma localização para sua campanha');
        } else {
          // Verificar se todas as localizações têm Meta ID válido
          const locationsWithoutKey = campaignData.location.selectedLocations.filter(loc => !loc.key);
          if (locationsWithoutKey.length > 0) {
            result.isValid = false;
            result.errors.push(`${locationsWithoutKey.length} localização(ões) sem ID válido do Meta`);
          }
        }
        break;

      case 2: // Budget
        const budgetValidation = BudgetUtils.validateDailyBudget(campaignData.budget.daily);
        if (!budgetValidation.isValid) {
          result.isValid = false;
          result.errors.push(budgetValidation.error || 'Orçamento inválido');
        }
        break;

      case 3: // Duration
        if (!campaignData.duration.startDate) {
          result.isValid = false;
          result.errors.push('Data de início é obrigatória');
        }
        if (campaignData.duration.endDate && 
            new Date(campaignData.duration.endDate) <= new Date(campaignData.duration.startDate)) {
          result.isValid = false;
          result.errors.push('Data de fim deve ser posterior à data de início');
        }
        break;

      case 4: // Creative
        if (!campaignData.campaignName.trim()) {
          result.isValid = false;
          result.errors.push('Nome da campanha é obrigatório');
        }
        if (!campaignData.adTitle.trim()) {
          result.isValid = false;
          result.errors.push('Título do anúncio é obrigatório');
        }
        if (!campaignData.adText.trim()) {
          result.isValid = false;
          result.errors.push('Texto do anúncio é obrigatório');
        }
        if (!campaignData.selectedFanPage && !campaignData.selectedInstagram && !campaignData.selectedWhatsApp) {
          result.isValid = false;
          result.errors.push('Selecione pelo menos uma página ou conta social');
        }
        if (!campaignData.media) {
          result.isValid = false;
          result.errors.push('Imagem ou vídeo é obrigatório');
        }
        break;
    }

    return result;
  };

  const validateCompleteData = (campaignData: CampaignData): ValidationResult => {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Validate all steps
    for (let step = 1; step <= 4; step++) {
      const stepValidation = validateStep(step, campaignData);
      if (!stepValidation.isValid) {
        result.isValid = false;
        result.errors.push(...stepValidation.errors);
      }
      result.warnings.push(...stepValidation.warnings);
    }

    // Additional complete validation
    if (!campaignData.selectedWhatsApp) {
      result.warnings.push('WhatsApp não configurado - algumas funcionalidades podem não funcionar');
    }

    return result;
  };

  return {
    validateStep,
    validateCompleteData
  };
};
