
import { useCallback, useRef } from 'react';
import { CampaignData } from '@/types/campaign';
import { LocationDataValidator } from '@/services/location/LocationDataValidator';

export const useCampaignDataProtection = () => {
  const stateProtectionRef = useRef<{
    lastValidSelectedLocations: any[];
    lastUpdateTimestamp: number;
  }>({
    lastValidSelectedLocations: [],
    lastUpdateTimestamp: 0
  });

  const protectLocationData = useCallback((
    field: string, 
    value: any, 
    campaignData: CampaignData,
    setCampaignData: (updater: (prev: CampaignData) => CampaignData) => void
  ) => {
    console.log('🛡️ PROTECTION: Protecting location data update:', {
      field,
      valueType: typeof value,
      isSelectedLocations: field === 'selectedLocations',
      timestamp: new Date().toISOString()
    });

    // Special protection for selectedLocations
    if (field === 'selectedLocations') {
      console.log('🔒 PROTECTION: Processing selectedLocations update:', {
        isArray: Array.isArray(value),
        itemCount: Array.isArray(value) ? value.length : 0,
        previousValidCount: stateProtectionRef.current.lastValidSelectedLocations.length
      });

      // Validate incoming data
      if (Array.isArray(value) && value.length > 0) {
        const validItems = value.filter(item => 
          item && 
          typeof item === 'object' && 
          item.id && 
          item.name && 
          item.key && 
          item.type
        );

        if (validItems.length > 0) {
          // Store as last valid data
          stateProtectionRef.current.lastValidSelectedLocations = validItems;
          stateProtectionRef.current.lastUpdateTimestamp = Date.now();
          
          console.log('✅ PROTECTION: Valid selectedLocations stored:', {
            validCount: validItems.length,
            locations: validItems.map(loc => ({ name: loc.name, key: loc.key }))
          });
        } else {
          console.warn('⚠️ PROTECTION: Received invalid selectedLocations, using last valid data');
          value = stateProtectionRef.current.lastValidSelectedLocations;
        }
      } else if ((!value || !Array.isArray(value) || value.length === 0) && 
                 stateProtectionRef.current.lastValidSelectedLocations.length > 0) {
        console.warn('🔄 PROTECTION: Empty selectedLocations detected, restoring from backup');
        value = stateProtectionRef.current.lastValidSelectedLocations;
      }
    }

    // Apply the protected update
    setCampaignData(current => {
      const updatedLocation = {
        ...current.location,
        [field]: value
      };

      const updatedData = {
        ...current,
        location: updatedLocation
      };

      console.log('✅ PROTECTION: State updated successfully:', {
        field,
        selectedLocationsCount: updatedData.location.selectedLocations?.length || 0
      });

      return updatedData;
    });
  }, []);

  const validateAndRecoverLocationData = useCallback((
    campaignData: CampaignData,
    setCampaignData: (updater: (prev: CampaignData) => CampaignData) => void
  ): boolean => {
    console.log('🔍 PROTECTION: Validating and attempting recovery...');

    const validationErrors = LocationDataValidator.validateLocationData(campaignData);
    
    if (validationErrors.length === 0) {
      console.log('✅ PROTECTION: Validation passed, no recovery needed');
      return true;
    }

    console.log('⚠️ PROTECTION: Validation failed, attempting recovery:', {
      errorCount: validationErrors.length,
      errorTypes: validationErrors.map(e => e.type)
    });

    // Attempt recovery
    const recoveryResult = LocationDataValidator.attemptLocationRecovery(campaignData);
    
    if (recoveryResult) {
      console.log('🔧 PROTECTION: Recovery successful, applying data:', {
        method: recoveryResult.recoveryMethod,
        locationsCount: recoveryResult.selectedLocations.length
      });

      setCampaignData(current => ({
        ...current,
        location: {
          ...current.location,
          selectedLocations: recoveryResult.selectedLocations
        }
      }));

      return true;
    }

    // Emergency fallback
    console.log('🚨 PROTECTION: Using emergency fallback');
    const emergencyFallback = LocationDataValidator.createEmergencyFallback();
    
    setCampaignData(current => ({
      ...current,
      location: {
        ...current.location,
        selectedLocations: emergencyFallback.selectedLocations
      }
    }));

    return true;
  }, []);

  const getLastValidLocations = useCallback(() => {
    return stateProtectionRef.current.lastValidSelectedLocations;
  }, []);

  return {
    protectLocationData,
    validateAndRecoverLocationData,
    getLastValidLocations
  };
};
