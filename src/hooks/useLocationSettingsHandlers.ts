
import { LocationSettingsData } from '@/types/locationSettings';
import { geocodeLocation } from '@/utils/mapboxUtils';
import { useMapbox } from '@/contexts/MapboxContext';

interface UseLocationSettingsHandlersProps {
  location: LocationSettingsData;
  onLocationChange: (field: keyof LocationSettingsData, value: string | number | object) => void;
}

export const useLocationSettingsHandlers = ({
  location,
  onLocationChange
}: UseLocationSettingsHandlersProps) => {
  const { mapboxToken } = useMapbox();
  const selectedLocations = location.selectedLocations || [];

  const handleLocationAdd = async (newLocation: any) => {
    console.log('🔧 CRITICAL: Processing location add with enhanced validation:', {
      locationData: newLocation,
      hasKey: !!newLocation.key,
      key: newLocation.key,
      type: newLocation.type,
      name: newLocation.name || newLocation.display_name,
      currentCount: selectedLocations.length,
      timestamp: new Date().toISOString()
    });
    
    // ✅ VALIDAÇÃO CRÍTICA: Meta ID obrigatório
    if (!newLocation.key) {
      console.error('❌ ERRO CRÍTICO: Location missing Meta ID (key):', newLocation);
      throw new Error('Localização sem ID válido do Meta. Tente novamente.');
    }

    console.log('✅ Location has valid Meta ID:', newLocation.key);

    // ✅ CORREÇÃO: Enhanced geocoding for coordinates (com fallback)
    let coordinates = newLocation.coordinates;
    if (!coordinates && (newLocation.name || newLocation.display_name)) {
      if (mapboxToken) {
        console.log('🗺️ Geocoding for preview coordinates:', newLocation.name || newLocation.display_name);
        try {
          const geocoded = await geocodeLocation(newLocation.name || newLocation.display_name, mapboxToken);
          if (geocoded) {
            coordinates = geocoded;
            console.log('✅ Geocoding successful:', coordinates);
          }
        } catch (error) {
          console.warn('⚠️ Geocoding failed, continuing without coordinates:', error);
        }
      } else {
        console.warn('⚠️ Mapbox token not available, skipping geocoding');
      }
    }

    // ✅ CORREÇÃO CRÍTICA: Estrutura conforme documentação Meta com validação completa
    const locationToAdd = {
      id: newLocation.id || `${newLocation.key}_${Date.now()}`,
      name: newLocation.display_name || newLocation.name,
      type: (newLocation.type as 'country' | 'region' | 'city' | 'zip') || 'city',
      key: newLocation.key, // Meta API ID - obrigatório
      country_code: newLocation.country_code || 'BR',
      region: newLocation.region,
      // Adicionar radius e distance_unit para cidades
      radius: newLocation.type === 'city' ? (newLocation.radius || 10) : undefined,
      distance_unit: newLocation.type === 'city' ? (newLocation.distance_unit || 'kilometer') : undefined,
      coordinates
    };

    // ✅ VALIDAÇÃO FINAL antes de adicionar
    if (!locationToAdd.id || !locationToAdd.name || !locationToAdd.key || !locationToAdd.type) {
      console.error('❌ CRITICAL: Location object missing required fields:', {
        id: !!locationToAdd.id,
        name: !!locationToAdd.name,
        key: !!locationToAdd.key,
        type: !!locationToAdd.type,
        locationToAdd
      });
      throw new Error('Dados de localização incompletos. Tente selecionar novamente.');
    }

    console.log('✅ VALIDATED location object to add:', {
      id: locationToAdd.id,
      key: locationToAdd.key,
      name: locationToAdd.name,
      type: locationToAdd.type,
      radius: locationToAdd.radius,
      distance_unit: locationToAdd.distance_unit,
      hasValidKey: !!locationToAdd.key,
      hasAllRequiredFields: !!(locationToAdd.id && locationToAdd.name && locationToAdd.key && locationToAdd.type)
    });

    // ✅ CORREÇÃO CRÍTICA: Check for duplicates
    const isDuplicate = selectedLocations.some(loc => loc.key === locationToAdd.key);
    if (isDuplicate) {
      console.warn('⚠️ Duplicate location detected, skipping:', locationToAdd.key);
      return;
    }

    // ✅ CORREÇÃO CRÍTICA: Garantir que o array seja atualizado corretamente
    const updatedLocations = [...selectedLocations, locationToAdd];
    
    console.log('📊 BEFORE UPDATE - Current locations:', {
      currentCount: selectedLocations.length,
      currentLocations: selectedLocations.map(loc => ({ 
        id: loc.id,
        name: loc.name, 
        key: loc.key, 
        type: loc.type 
      }))
    });
    
    // ✅ CHAMADA CRÍTICA: Usar especificamente 'selectedLocations' como field
    try {
      onLocationChange('selectedLocations', updatedLocations);
      
      console.log('📊 AFTER UPDATE - Updated locations:', {
        newCount: updatedLocations.length,
        updatedLocations: updatedLocations.map(loc => ({ 
          id: loc.id,
          name: loc.name, 
          key: loc.key, 
          type: loc.type 
        })),
        locationNames: updatedLocations.map(loc => loc.name)
      });

      // Update preview coordinates (se disponível)
      if (coordinates) {
        onLocationChange('coordinates', coordinates);
        onLocationChange('selectedAddress', locationToAdd.name);
      }

      console.log('✅ Location add completed successfully');
    } catch (error) {
      console.error('❌ CRITICAL: Error updating selectedLocations:', error);
      throw new Error('Erro ao adicionar localização. Tente novamente.');
    }
  };

  const handleLocationRemove = (locationId: string) => {
    console.log('🗑️ CRITICAL: Removing location:', {
      locationId,
      currentCount: selectedLocations.length,
      timestamp: new Date().toISOString()
    });
    
    const updatedLocations = selectedLocations.filter(loc => loc.id !== locationId);
    
    console.log('📊 Location removal:', {
      removedId: locationId,
      beforeCount: selectedLocations.length,
      afterCount: updatedLocations.length,
      remainingLocations: updatedLocations.map(loc => ({
        id: loc.id,
        name: loc.name,
        key: loc.key
      }))
    });
    
    try {
      onLocationChange('selectedLocations', updatedLocations);

      // Clear coordinates if no locations left
      if (updatedLocations.length === 0) {
        onLocationChange('coordinates', undefined);
        onLocationChange('selectedAddress', '');
      } else {
        // Update to first remaining location with coordinates
        const firstLocationWithCoords = updatedLocations.find(loc => loc.coordinates);
        if (firstLocationWithCoords?.coordinates) {
          onLocationChange('coordinates', firstLocationWithCoords.coordinates);
          onLocationChange('selectedAddress', firstLocationWithCoords.name);
        }
      }

      console.log('✅ Location removal completed successfully');
    } catch (error) {
      console.error('❌ CRITICAL: Error removing location:', error);
      throw new Error('Erro ao remover localização. Tente novamente.');
    }
  };

  const handleMapUpdate = (coordinates: { lat: number; lng: number }, address: string) => {
    console.log('🗺️ Map updated (preview only):', {
      coordinates,
      address,
      timestamp: new Date().toISOString()
    });
    
    try {
      onLocationChange('coordinates', coordinates);
      onLocationChange('selectedAddress', address);
      console.log('✅ Map update completed successfully');
    } catch (error) {
      console.error('❌ Error updating map coordinates:', error);
    }
  };

  return {
    selectedLocations,
    handleLocationAdd,
    handleLocationRemove,
    handleMapUpdate
  };
};
