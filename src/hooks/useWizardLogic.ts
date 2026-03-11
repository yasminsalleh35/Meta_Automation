
import { useCreateCampaignLogic } from '@/hooks/useCreateCampaignLogic';
import { LocationWizardStep } from '@/components/campaign/wizard/steps/LocationWizardStep';
import { BudgetWizardStep } from '@/components/campaign/wizard/steps/BudgetWizardStep';
import { DurationWizardStep } from '@/components/campaign/wizard/steps/DurationWizardStep';
import { CreativeWizardStep } from '@/components/campaign/wizard/steps/CreativeWizardStep';
import { useEffect } from 'react';

export const useWizardLogic = () => {
  const {
    currentStep,
    campaignData,
    updateCampaignData,
    updateLocationData: originalUpdateLocationData,
    isAILoading,
    aiSuggestions,
    isMetaLoading,
    handleNext,
    handlePrevious,
    handleCreateMetaCampaign,
    handleAISuggestion,
    canProceedToNextStep,
    isStep1Valid,
    isStep2Valid,
    isStep3Valid,
    isStep4Valid,
    validateStepData,
    emergencyLocationRecovery,
    ensureObjectiveIsSet
  } = useCreateCampaignLogic();

  // ✅ CORRIGIDO: Garantir que objective seja definido na inicialização
  useEffect(() => {
    if (!campaignData.objective || campaignData.objective === '') {
      console.log('🔧 WIZARD: Setting default objective on initialization');
      updateCampaignData('objective', 'advantage_plus_leads');
    }
  }, [campaignData.objective, updateCampaignData]);

  // ✅ Enhanced updateLocationData with step validation
  const updateLocationData = (field: string, value: any) => {
    console.log('🌟 WIZARD: Enhanced updateLocationData called:', {
      field,
      value: typeof value === 'object' ? JSON.stringify(value) : value,
      currentStep,
      timestamp: new Date().toISOString()
    });

    // Call original function
    originalUpdateLocationData(field, value);

    // ✅ Immediate validation for critical fields
    if (field === 'selectedLocations' && currentStep === 1) {
      setTimeout(() => {
        if (validateStepData) {
          const isValid = validateStepData(1);
          console.log('✅ WIZARD: Step 1 validation result:', isValid);
        }
      }, 100);
    }
  };

  // ✅ Enhanced step navigation with validation
  const handleNextWithValidation = () => {
    console.log('➡️ WIZARD: Enhanced next with validation, current step:', currentStep);
    
    // Force validation for location step
    if (currentStep === 1 && validateStepData) {
      const isValid = validateStepData(1);
      if (!isValid) {
        console.warn('⚠️ WIZARD: Step 1 validation failed, preventing navigation');
        return;
      }
    }
    
    // ✅ CORRIGIDO: Garantir objective antes de avançar
    if (currentStep === 4) {
      ensureObjectiveIsSet();
    }
    
    handleNext();
  };

  const handleAISuggestionWithObjective = () => {
    // ✅ CORRIGIDO: Garantir objective antes de gerar sugestões
    const objective = ensureObjectiveIsSet();
    handleAISuggestion(objective);
  };

  const handleApplySuggestions = (suggestions: any) => {
    if (suggestions.interests) {
      updateCampaignData('interests', suggestions.interests);
    }
    if (suggestions.ageRange) {
      updateCampaignData('ageRange', suggestions.ageRange);
    }
    if (suggestions.gender) {
      updateCampaignData('gender', suggestions.gender);
    }
  };

  const steps = [
    {
      id: 1,
      title: "Localização",
      subtitle: "Onde seus clientes estão?",
      icon: "📍",
      component: LocationWizardStep,
      isValid: isStep1Valid
    },
    {
      id: 2,
      title: "Orçamento",
      subtitle: "Quanto investir por dia?",
      icon: "💰",
      component: BudgetWizardStep,
      isValid: isStep2Valid
    },
    {
      id: 3,
      title: "Duração",
      subtitle: "Quando começar e terminar?",
      icon: "📅",
      component: DurationWizardStep,
      isValid: isStep3Valid
    },
    {
      id: 4,
      title: "Criativos",
      subtitle: "Como será seu anúncio?",
      icon: "🎨",
      component: CreativeWizardStep,
      isValid: isStep4Valid
    }
  ];

  return {
    currentStep,
    campaignData,
    updateCampaignData,
    updateLocationData, // Enhanced version
    isAILoading,
    aiSuggestions,
    isMetaLoading,
    handleNext: handleNextWithValidation, // Enhanced navigation
    handlePrevious,
    handleCreateMetaCampaign,
    handleAISuggestionWithObjective,
    canProceedToNextStep,
    handleApplySuggestions,
    steps,
    validateStepData,
    emergencyLocationRecovery
  };
};
