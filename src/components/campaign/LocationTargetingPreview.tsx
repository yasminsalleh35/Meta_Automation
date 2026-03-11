
import React, { useEffect } from 'react';
import { LocationSettingsData } from '@/types/locationSettings';

interface LocationTargetingPreviewProps {
  location: LocationSettingsData;
  onValidationChange?: (isValid: boolean) => void;
}

export const LocationTargetingPreview: React.FC<LocationTargetingPreviewProps> = ({
  location,
  onValidationChange
}) => {
  // ✅ CORREÇÃO: Validação positiva - se há localizações com Meta IDs = válido
  useEffect(() => {
    const hasValidLocations = location.selectedLocations && 
                             location.selectedLocations.length > 0 && 
                             location.selectedLocations.every(loc => loc.key);
    
    console.log('✅ LocationTargetingPreview validation:', {
      hasValidLocations,
      selectedLocationsCount: location.selectedLocations?.length || 0,
      locationsWithKeys: location.selectedLocations?.filter(loc => loc.key).length || 0
    });
    
    // Sempre reportar validação positiva se há localizações válidas
    onValidationChange?.(hasValidLocations);
  }, [location.selectedLocations, onValidationChange]);

  // Componente oculto - validação ocorre em background
  return null;
};
