
export interface LocationValidationError {
  type: 'MISSING_SELECTED_LOCATIONS' | 'INVALID_LOCATION_STRUCTURE' | 'MISSING_META_IDS' | 'ASYNC_STATE_ISSUE';
  message: string;
  context: any;
}

export interface LocationRecoveryData {
  selectedLocations: Array<{
    id: string;
    name: string;
    type: 'country' | 'region' | 'city' | 'zip';
    key: string;
    country_code?: string;
    radius?: number;
    distance_unit?: 'kilometer' | 'mile';
  }>;
  fallbackApplied: boolean;
  recoveryMethod: string;
}

export class LocationDataValidator {
  static validateLocationData(campaignData: any): LocationValidationError[] {
    const errors: LocationValidationError[] = [];
    
    console.log('🔍 VALIDATOR: Starting location data validation:', {
      hasLocation: !!campaignData.location,
      hasSelectedLocations: !!campaignData.location?.selectedLocations,
      selectedLocationsCount: campaignData.location?.selectedLocations?.length || 0,
      timestamp: new Date().toISOString()
    });

    // Check if location object exists
    if (!campaignData.location) {
      errors.push({
        type: 'MISSING_SELECTED_LOCATIONS',
        message: 'Location object is missing from campaign data',
        context: { campaignData: Object.keys(campaignData) }
      });
      return errors;
    }

    // Check if selectedLocations array exists and has items
    if (!campaignData.location.selectedLocations || !Array.isArray(campaignData.location.selectedLocations)) {
      errors.push({
        type: 'MISSING_SELECTED_LOCATIONS',
        message: 'selectedLocations is not an array or is missing',
        context: { 
          selectedLocations: campaignData.location.selectedLocations,
          type: typeof campaignData.location.selectedLocations
        }
      });
    } else if (campaignData.location.selectedLocations.length === 0) {
      errors.push({
        type: 'MISSING_SELECTED_LOCATIONS',
        message: 'selectedLocations array is empty',
        context: { 
          location: campaignData.location,
          hasLegacyData: !!(campaignData.location.city || campaignData.location.selectedAddress)
        }
      });
    }

    // Validate structure of each location
    if (campaignData.location.selectedLocations?.length > 0) {
      const invalidLocations = campaignData.location.selectedLocations.filter((loc: any) => 
        !loc || !loc.id || !loc.name || !loc.key || !loc.type
      );

      if (invalidLocations.length > 0) {
        errors.push({
          type: 'INVALID_LOCATION_STRUCTURE',
          message: 'Some locations have invalid structure',
          context: { 
            invalidCount: invalidLocations.length,
            invalidLocations: invalidLocations,
            validCount: campaignData.location.selectedLocations.length - invalidLocations.length
          }
        });
      }

      // Check for Meta API IDs
      const locationsWithoutKeys = campaignData.location.selectedLocations.filter((loc: any) => !loc.key);
      if (locationsWithoutKeys.length > 0) {
        errors.push({
          type: 'MISSING_META_IDS',
          message: 'Some locations are missing Meta API IDs (key field)',
          context: { 
            missingKeysCount: locationsWithoutKeys.length,
            locationsWithoutKeys: locationsWithoutKeys.map((loc: any) => loc.name)
          }
        });
      }
    }

    console.log('✅ VALIDATOR: Validation completed:', {
      errorsFound: errors.length,
      errorTypes: errors.map(e => e.type),
      timestamp: new Date().toISOString()
    });

    return errors;
  }

  static attemptLocationRecovery(campaignData: any): LocationRecoveryData | null {
    console.log('🔧 VALIDATOR: Attempting location data recovery...');

    // Try to recover from legacy city/state data
    if (campaignData.location?.city && !campaignData.location.selectedLocations?.length) {
      console.log('🔄 RECOVERY: Found legacy city data, converting...');
      
      const recoveredLocation = {
        id: `recovery_city_${Date.now()}`,
        name: campaignData.location.city,
        type: 'city' as const,
        key: `${campaignData.location.city}, ${campaignData.location.state || 'BR'}`,
        country_code: 'BR',
        radius: campaignData.location.radius || 10,
        distance_unit: 'kilometer' as const
      };

      return {
        selectedLocations: [recoveredLocation],
        fallbackApplied: true,
        recoveryMethod: 'legacy_city_conversion'
      };
    }

    // Try to recover from selectedAddress
    if (campaignData.location?.selectedAddress && !campaignData.location.selectedLocations?.length) {
      console.log('🔄 RECOVERY: Found selectedAddress data, converting...');
      
      const recoveredLocation = {
        id: `recovery_address_${Date.now()}`,
        name: campaignData.location.selectedAddress,
        type: 'city' as const,
        key: `${campaignData.location.selectedAddress}, BR`,
        country_code: 'BR',
        radius: campaignData.location.radius || 10,
        distance_unit: 'kilometer' as const
      };

      return {
        selectedLocations: [recoveredLocation],
        fallbackApplied: true,
        recoveryMethod: 'selected_address_conversion'
      };
    }

    // Try to recover from coordinates with a default city
    if (campaignData.location?.coordinates && !campaignData.location.selectedLocations?.length) {
      console.log('🔄 RECOVERY: Found coordinates, creating fallback location...');
      
      const recoveredLocation = {
        id: `recovery_coords_${Date.now()}`,
        name: 'São Paulo', // Default fallback city
        type: 'city' as const,
        key: 'São Paulo, BR',
        country_code: 'BR',
        radius: campaignData.location.radius || 25,
        distance_unit: 'kilometer' as const,
        coordinates: campaignData.location.coordinates
      };

      return {
        selectedLocations: [recoveredLocation],
        fallbackApplied: true,
        recoveryMethod: 'coordinates_fallback'
      };
    }

    console.log('❌ RECOVERY: No recovery options available');
    return null;
  }

  static createEmergencyFallback(): LocationRecoveryData {
    console.log('🚨 VALIDATOR: Creating emergency fallback location...');
    
    const emergencyLocation = {
      id: `emergency_${Date.now()}`,
      name: 'Brasil',
      type: 'country' as const,
      key: 'BR',
      country_code: 'BR',
      radius: 50,
      distance_unit: 'kilometer' as const
    };

    return {
      selectedLocations: [emergencyLocation],
      fallbackApplied: true,
      recoveryMethod: 'emergency_country_fallback'
    };
  }
}
