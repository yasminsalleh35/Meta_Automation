
import { useState, useCallback } from 'react';
import { useSimplifiedCampaignData } from './useSimplifiedCampaignData';
import { useCampaignValidation } from './useCampaignValidation';
import { useMetaCampaignCreation } from './useMetaCampaignCreation';
import { useToast } from './use-toast';

export const useSimplifiedWizardLogic = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();
  
  const {
    campaignData,
    updateCampaignData,
    updateLocationData,
    saveCampaign
  } = useSimplifiedCampaignData();

  const {
    isStep1Valid,
    isStep2Valid,
    isStep3Valid,
    isStep4Valid
  } = useCampaignValidation(campaignData);

  const { handleCreateMetaCampaign, isMetaLoading } = useMetaCampaignCreation();

  // Enhanced updateLocationData to ensure objective is set
  const enhancedUpdateLocationData = useCallback((field: string, value: any) => {
    updateLocationData(field, value);
    
    // Ensure objective is always set
    if (!campaignData.objective) {
      updateCampaignData('objective', 'advantage_plus_leads');
    }
  }, [updateLocationData, updateCampaignData, campaignData.objective]);

  const canProceedToNextStep = useCallback((step: number): boolean => {
    switch (step) {
      case 1: return isStep1Valid;
      case 2: return isStep2Valid;
      case 3: return isStep3Valid;
      case 4: return isStep4Valid;
      default: return false;
    }
  }, [isStep1Valid, isStep2Valid, isStep3Valid, isStep4Valid]);

  const handleNext = useCallback(() => {
    const canProceed = canProceedToNextStep(currentStep);
    
    if (!canProceed) {
      let message = '';
      switch (currentStep) {
        case 1:
          message = 'Selecione pelo menos uma localização para continuar';
          break;
        case 2:
          message = 'Configure um orçamento diário válido (mínimo R$ 20)';
          break;
        case 3:
          message = 'Configure as datas da campanha';
          break;
        case 4:
          message = 'Complete todas as informações do anúncio';
          break;
      }
      
      toast({
        title: "Dados incompletos",
        description: message,
        variant: "destructive"
      });
      return;
    }

    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, canProceedToNextStep, toast]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleCreateCampaign = useCallback(async () => {
    try {
      console.log('🚀 Starting campaign creation...');
      
      // Final validation
      if (!isStep4Valid) {
        toast({
          title: "Dados incompletos",
          description: "Complete todas as informações antes de criar a campanha",
          variant: "destructive"
        });
        return;
      }

      // Ensure objective is set
      if (!campaignData.objective) {
        updateCampaignData('objective', 'advantage_plus_leads');
      }

      // Save campaign first
      const campaignId = await saveCampaign();
      if (!campaignId) {
        throw new Error('Falha ao salvar campanha no banco de dados');
      }

      // Create Meta campaign
      const success = await handleCreateMetaCampaign(
        { ...campaignData, campaignId },
        async () => campaignId,
        updateCampaignData
      );

      if (success) {
        toast({
          title: "Sucesso!",
          description: "Campanha criada com sucesso",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('❌ Campaign creation error:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  }, [campaignData, saveCampaign, handleCreateMetaCampaign, updateCampaignData, isStep4Valid, toast]);

  const steps = [
    {
      id: 1,
      title: "Localização",
      subtitle: "Onde seus clientes estão?",
      icon: "📍",
      isValid: isStep1Valid
    },
    {
      id: 2,
      title: "Orçamento",
      subtitle: "Quanto investir por dia?",
      icon: "💰",
      isValid: isStep2Valid
    },
    {
      id: 3,
      title: "Duração",
      subtitle: "Quando começar e terminar?",
      icon: "📅",
      isValid: isStep3Valid
    },
    {
      id: 4,
      title: "Criativos",
      subtitle: "Como será seu anúncio?",
      icon: "🎨",
      isValid: isStep4Valid
    }
  ];

  return {
    currentStep,
    campaignData,
    updateCampaignData,
    updateLocationData: enhancedUpdateLocationData,
    isMetaLoading,
    handleNext,
    handlePrevious,
    handleCreateCampaign,
    canProceedToNextStep,
    steps
  };
};
