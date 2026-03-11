import { useState } from 'react';
import { CampaignData, getInitialCampaignData } from '@/types/campaign';
import { useCampaignActions } from '@/hooks/useCampaignActions';
import { useCampaignDatabase } from '@/hooks/useCampaignDatabase';
import { useCampaignDataProtection } from '@/hooks/useCampaignDataProtection';
import { LocationDataValidator } from '@/services/location/LocationDataValidator';
import { useToast } from '@/hooks/use-toast';

export const useCampaignData = () => {
  const [campaignData, setCampaignData] = useState<CampaignData>(getInitialCampaignData());
  const [locationValidation, setLocationValidation] = useState<{
    isValid: boolean;
    audienceSize?: number;
  }>({ isValid: false });

  const { toast } = useToast();

  const {
    addInterest,
    removeInterest,
    updateCampaignData,
    updateLocationData: originalUpdateLocationData
  } = useCampaignActions(campaignData, setCampaignData);

  const {
    saveCampaign: saveCampaignToDb,
    loadCampaign: loadCampaignFromDb,
    isSaving
  } = useCampaignDatabase();

  const {
    protectLocationData,
    validateAndRecoverLocationData,
    getLastValidLocations
  } = useCampaignDataProtection();

  // ✅ ENHANCED: Protected updateLocationData with immediate validation
  const updateLocationData = (field: string, value: any) => {
    console.log('🔄 ENHANCED: updateLocationData called with protection:', {
      field,
      valueType: typeof value,
      isArray: Array.isArray(value),
      valueLength: Array.isArray(value) ? value.length : 'N/A',
      timestamp: new Date().toISOString()
    });

    // Use protected update
    protectLocationData(field, value, campaignData, setCampaignData);

    // Also call original function for compatibility
    originalUpdateLocationData(field, value);

    // Immediate validation for selectedLocations
    if (field === 'selectedLocations') {
      setTimeout(() => {
        setCampaignData(current => {
          console.log('🔍 POST-UPDATE VALIDATION:', {
            selectedLocationsCount: current.location.selectedLocations?.length || 0,
            hasValidData: !!(current.location.selectedLocations && current.location.selectedLocations.length > 0),
            timestamp: new Date().toISOString()
          });
          return current;
        });
      }, 50);
    }
  };

  const saveCampaign = async (): Promise<string | null> => {
    console.log('💾 ENHANCED: Pre-save validation and recovery...');
    
    // ✅ STEP 1: Validate and attempt recovery
    const isValid = validateAndRecoverLocationData(campaignData, setCampaignData);
    
    if (!isValid) {
      console.error('❌ CRITICAL: Could not validate or recover location data');
      throw new Error('Dados de localização inválidos. Recarregue a página e tente novamente.');
    }

    // ✅ STEP 2: Final validation before save
    const finalValidationErrors = LocationDataValidator.validateLocationData(campaignData);
    
    if (finalValidationErrors.length > 0) {
      console.error('❌ CRITICAL: Final validation failed:', finalValidationErrors);
      
      // Show user-friendly error
      const errorMessage = finalValidationErrors
        .map(err => err.message)
        .join('. ');
      
      toast({
        title: "Erro nos dados de localização",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw new Error(`Validação final falhou: ${errorMessage}`);
    }

    // ✅ STEP 3: Proceed with normal save
    console.log('✅ ENHANCED: All validations passed, proceeding with save');
    
    const campaignId = await saveCampaignToDb(campaignData);
    
    if (campaignId) {
      setCampaignData(prev => ({ ...prev, campaignId }));
    }
    
    return campaignId;
  };

  const loadCampaign = async (campaignId: string): Promise<boolean> => {
    const result = await loadCampaignFromDb(campaignId, setCampaignData);
    
    // ✅ Post-load validation and recovery
    if (result) {
      setTimeout(() => {
        validateAndRecoverLocationData(campaignData, setCampaignData);
      }, 100);
    }
    
    return result;
  };

  const validateLocationTargeting = (isValid: boolean, audienceSize?: number) => {
    console.log('🔍 Location validation updated:', { isValid, audienceSize });
    setLocationValidation({ isValid, audienceSize });
  };

  // ✅ ENHANCED: Location validation with fallback protection
  const isLocationValid = (): boolean => {
    const errors = LocationDataValidator.validateLocationData(campaignData);
    const isValid = errors.length === 0;
    
    console.log('📍 ENHANCED Location validation check:', {
      validationErrors: errors.length,
      isValid,
      selectedLocationsCount: campaignData.location.selectedLocations?.length || 0,
      hasLastValidData: getLastValidLocations().length > 0,
      timestamp: new Date().toISOString()
    });
    
    return isValid;
  };

  // ✅ ENHANCED: Step validation with immediate recovery
  const validateStepData = (step: number): boolean => {
    if (step === 1) {
      // Force validation and recovery for location step
      const isValid = validateAndRecoverLocationData(campaignData, setCampaignData);
      
      if (!isValid) {
        toast({
          title: "Dados de localização perdidos",
          description: "Tentando recuperar automaticamente...",
          variant: "destructive"
        });
      }
      
      return isValid;
    }
    
    return true;
  };

  // ✅ ENHANCED: Emergency recovery function
  const emergencyLocationRecovery = () => {
    console.log('🚨 EMERGENCY: Attempting emergency location recovery...');
    
    const lastValid = getLastValidLocations();
    if (lastValid.length > 0) {
      console.log('🔄 EMERGENCY: Restoring from last valid data');
      setCampaignData(current => ({
        ...current,
        location: {
          ...current.location,
          selectedLocations: lastValid
        }
      }));
      return true;
    }
    
    // Create emergency fallback
    const emergency = LocationDataValidator.createEmergencyFallback();
    setCampaignData(current => ({
      ...current,
      location: {
        ...current.location,
        selectedLocations: emergency.selectedLocations
      }
    }));
    
    toast({
      title: "Localização recuperada",
      description: "Dados de localização foram restaurados automaticamente",
      variant: "default"
    });
    
    return true;
  };

  // ✅ LEGACY: Keep existing functions for compatibility
  const checkDataIntegrity = () => {
    const errors = LocationDataValidator.validateLocationData(campaignData);
    return {
      hasLocation: !!campaignData.location,
      hasSelectedLocations: !!(campaignData.location.selectedLocations && campaignData.location.selectedLocations.length > 0),
      validationErrors: errors,
      isValid: errors.length === 0,
      timestamp: new Date().toISOString()
    };
  };

  const forceDataSync = () => {
    console.log('🔄 FORCING DATA SYNC...');
    validateAndRecoverLocationData(campaignData, setCampaignData);
  };

  return {
    campaignData,
    setCampaignData,
    addInterest,
    removeInterest,
    updateCampaignData,
    updateLocationData, // Enhanced with protection
    saveCampaign, // Enhanced with validation
    loadCampaign, // Enhanced with recovery
    isSaving,
    locationValidation,
    validateLocationTargeting,
    isLocationValid, // Enhanced validation
    checkDataIntegrity,
    forceDataSync,
    validateStepData, // New function
    emergencyLocationRecovery // New function
  };
};

export type { CampaignData };
