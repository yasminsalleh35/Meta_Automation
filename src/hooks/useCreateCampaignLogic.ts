
import { useState, useCallback } from 'react';
import { useCampaignData } from '@/hooks/useCampaignData';
import { useCampaignValidation } from '@/hooks/useCampaignValidation';
import { useAISuggestions } from '@/hooks/useAISuggestions';
import { useMetaCampaignCreation } from '@/hooks/useMetaCampaignCreation';
import { useCampaignCreationFlow } from '@/hooks/campaign-creation/useCampaignCreationFlow';

export const useCreateCampaignLogic = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const {
    campaignData,
    updateCampaignData,
    updateLocationData,
    saveCampaign,
    isLocationValid,
    validateStepData,
    emergencyLocationRecovery
  } = useCampaignData();

  const {
    isStep1Valid,
    isStep2Valid,
    isStep3Valid,
    isStep4Valid
  } = useCampaignValidation(campaignData);

  const {
    aiSuggestions,
    isAILoading,
    handleAISuggestion,
    generateImage
  } = useAISuggestions();

  const { handleCreateMetaCampaign, isMetaLoading } = useMetaCampaignCreation();
  const { executeCreationFlow } = useCampaignCreationFlow();

  // ✅ CORRIGIDO: Garantir que objective seja sempre preenchido
  const ensureObjectiveIsSet = useCallback(() => {
    if (!campaignData.objective || campaignData.objective === '') {
      console.log('🔧 FIXING: Setting default objective to advantage_plus_leads');
      updateCampaignData('objective', 'advantage_plus_leads');
      return 'advantage_plus_leads';
    }
    return campaignData.objective;
  }, [campaignData.objective, updateCampaignData]);

  // ✅ CORRIGIDO: Função de navegação com validação robusta
  const canProceedToNextStep = useCallback((step: number): boolean => {
    let canProceed = false;
    
    switch (step) {
      case 1: 
        canProceed = isStep1Valid;
        console.log('🚦 Can proceed from step 1 (Location):', canProceed);
        break;
      case 2: 
        canProceed = isStep2Valid;
        console.log('🚦 Can proceed from step 2 (Budget):', canProceed);
        break;
      case 3: 
        canProceed = isStep3Valid;
        console.log('🚦 Can proceed from step 3 (Duration):', canProceed);
        break;
      case 4: 
        canProceed = isStep4Valid;
        console.log('🚦 Can proceed from step 4 (Creative):', canProceed);
        break;
      default: 
        canProceed = false;
        console.log('🚦 Unknown step:', step);
        break;
    }
    
    return canProceed;
  }, [isStep1Valid, isStep2Valid, isStep3Valid, isStep4Valid]);

  const handleNext = useCallback(() => {
    const canProceed = canProceedToNextStep(currentStep);
    
    console.log('➡️ Attempting to go to next step:', {
      currentStep,
      canProceed,
      nextStep: currentStep + 1
    });

    if (canProceed && currentStep < 4) {
      setCurrentStep(prev => prev + 1);
      console.log('✅ Moved to step:', currentStep + 1);
    } else {
      console.log('❌ Cannot proceed from step:', currentStep, 'Validation failed or last step');
    }
  }, [currentStep, canProceedToNextStep]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      console.log('⬅️ Moved back to step:', currentStep - 1);
    }
  }, [currentStep]);

  // ✅ CORRIGIDO: Garantir objective antes da criação da campanha
  const handleCreateMetaCampaignWithVerification = useCallback(async () => {
    console.log('🔧 CRITICAL: Ensuring objective is set before campaign creation');
    
    // Garantir que objective esteja definido
    const finalObjective = ensureObjectiveIsSet();
    
    // Criar dados da campanha com objective garantido
    const campaignDataWithObjective = {
      ...campaignData,
      objective: finalObjective
    };
    
    console.log('✅ CRITICAL: Campaign data with guaranteed objective:', {
      objective: finalObjective,
      hasObjective: !!finalObjective,
      timestamp: new Date().toISOString()
    });
    
    return await executeCreationFlow(
      campaignDataWithObjective,
      saveCampaign,
      updateCampaignData
    );
  }, [campaignData, saveCampaign, updateCampaignData, executeCreationFlow, ensureObjectiveIsSet]);

  return {
    currentStep,
    campaignData,
    updateCampaignData,
    updateLocationData,
    isAILoading,
    aiSuggestions,
    isMetaLoading,
    handleNext,
    handlePrevious,
    handleCreateMetaCampaign: handleCreateMetaCampaignWithVerification,
    handleAISuggestion,
    generateImage,
    canProceedToNextStep,
    isStep1Valid,
    isStep2Valid,
    isStep3Valid,
    isStep4Valid,
    validateStepData,
    emergencyLocationRecovery,
    ensureObjectiveIsSet
  };
};
