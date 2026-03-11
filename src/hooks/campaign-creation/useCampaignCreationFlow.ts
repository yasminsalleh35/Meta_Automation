
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { CampaignData } from '@/types/campaign';
import { useCampaignCreationValidator } from './useCampaignCreationValidator';
import { useMetaCampaignCreationLogic } from './useMetaCampaignCreationLogic';

export const useCampaignCreationFlow = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const { validateCompleteData, validateStep } = useCampaignCreationValidator();
  const { handleCreateMetaCampaign, isMetaLoading } = useMetaCampaignCreationLogic();

  const executeCreationFlow = useCallback(async (
    campaignData: CampaignData,
    saveCampaign: () => Promise<string | null>,
    updateCampaignData?: (field: string, value: any) => void
  ) => {
    console.log('🚀 Starting campaign creation flow...');
    setIsCreating(true);

    try {
      // Step 1: Final validation
      console.log('📋 Step 1: Final validation...');
      const validation = validateCompleteData(campaignData);
      
      if (!validation.isValid) {
        console.log('❌ Final validation failed:', validation.errors);
        toast({
          title: "Dados incompletos",
          description: validation.errors[0],
          variant: "destructive"
        });
        return false;
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        console.log('⚠️ Validation warnings:', validation.warnings);
        toast({
          title: "Atenção",
          description: validation.warnings[0],
          variant: "default"
        });
      }

      // Step 2: Create Meta campaign and save to database
      console.log('🎯 Step 2: Creating Meta campaign and saving to database...');
      const success = await handleCreateMetaCampaign(campaignData, saveCampaign, updateCampaignData);
      
      if (success) {
        console.log('✅ Campaign creation flow completed successfully');
        return true;
      } else {
        console.log('❌ Campaign creation flow failed');
        return false;
      }
    } catch (error) {
      console.error('❌ Error in creation flow:', error);
      
      toast({
        title: "Erro na criação",
        description: "Ocorreu um erro durante a criação da campanha. Tente novamente.",
        variant: "destructive"
      });
      
      return false;
    } finally {
      setIsCreating(false);
    }
  }, [handleCreateMetaCampaign, validateCompleteData, toast]);

  const validateCurrentStep = useCallback((step: number, campaignData: CampaignData) => {
    const validation = validateStep(step, campaignData);
    
    if (!validation.isValid && validation.errors.length > 0) {
      toast({
        title: "Dados incompletos",
        description: validation.errors[0],
        variant: "destructive"
      });
    }
    
    return validation.isValid;
  }, [validateStep, toast]);

  return {
    executeCreationFlow,
    validateCurrentStep,
    isCreating: isCreating || isMetaLoading
  };
};
