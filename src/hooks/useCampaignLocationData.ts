
import { useCallback } from 'react';
import { CampaignData } from '@/types/campaign';
import { LocationData } from '@/types/location';

interface LocationDataResult {
  localizacao: string;
  selectedLocations: LocationData[];
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export const useCampaignLocationData = () => {
  const prepareLocationData = useCallback((campaignData: CampaignData): LocationDataResult => {
    console.log('🗺️ CORRECTED: Enhanced location data preparation with city preservation...');
    
    let selectedLocations: LocationData[] = [];
    let localizacao = 'Brasil'; // Default fallback apenas se realmente necessário

    // ✅ CORREÇÃO: Priorizar dados existentes e válidos
    if (campaignData.location?.selectedLocations && Array.isArray(campaignData.location.selectedLocations) && campaignData.location.selectedLocations.length > 0) {
      const validLocations = campaignData.location.selectedLocations.filter(loc => loc && loc.key && loc.name);
      
      if (validLocations.length > 0) {
        selectedLocations = validLocations;
        
        // ✅ CORREÇÃO: Usar nome da primeira localização específica
        const primaryLocation = validLocations.find(loc => loc.type === 'city') || validLocations[0];
        localizacao = primaryLocation.name;
        
        console.log('✅ CORRECTED: Using existing valid locations:', {
          count: selectedLocations.length,
          primaryLocation: localizacao,
          types: selectedLocations.map(loc => loc.type)
        });
      }
    }
    
    // ✅ CORREÇÃO: Emergency reconstruction apenas se realmente não há dados válidos
    if (selectedLocations.length === 0 && campaignData.location?.selectedAddress) {
      console.log('🚨 CORRECTED: Emergency reconstruction with city priority:', campaignData.location.selectedAddress);
      
      const address = campaignData.location.selectedAddress;
      const addressParts = address.split(',').map(part => part.trim());
      
      // ✅ CORREÇÃO: Detectar cidade específica PRIMEIRO
      if (addressParts.length >= 2 && !addressParts[0].toLowerCase().includes('brasil') && !addressParts[0].toLowerCase().includes('brazil')) {
        const cityName = addressParts[0];
        const stateName = addressParts[1] || '';
        
        selectedLocations = [{
          id: `city-${cityName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          key: `CITY_${cityName.toUpperCase().replace(/\s+/g, '_')}`,
          name: cityName,
          type: 'city',
          region: stateName,
          country_code: 'BR',
          radius: campaignData.location.radius || 10,
          distance_unit: 'kilometer'
        }];
        localizacao = cityName;
        
        console.log('✅ CORRECTED: Emergency reconstruction preserved city:', cityName);
      }
      // ✅ ÚLTIMO RECURSO: Brasil apenas se endereço for genérico
      else if (address.toLowerCase().includes('brasil') || address.toLowerCase().includes('brazil')) {
        selectedLocations = [{
          id: `brasil-${Date.now()}`,
          key: 'BR',
          name: 'Brasil',
          type: 'country',
          country_code: 'BR',
          radius: campaignData.location.radius || 10,
          distance_unit: 'kilometer'
        }];
        localizacao = 'Brasil';
        
        console.log('⚠️ CORRECTED: Using Brasil as last resort only');
      }
    }

    // ✅ CORREÇÃO: Validação final com preservação de dados específicos
    const validatedLocations = selectedLocations.map((location, index) => {
      return {
        id: location.id || `validated-${Date.now()}-${index}`,
        key: location.key || `TEMP_${Date.now()}_${index}`,
        name: location.name || 'Localização',
        type: location.type || 'city',
        country_code: location.country_code,
        region: location.region,
        radius: location.radius || 10,
        distance_unit: location.distance_unit || 'kilometer',
        coordinates: location.coordinates
      } as LocationData;
    });

    // ✅ CORREÇÃO: Fallback final apenas se realmente necessário
    if (validatedLocations.length === 0) {
      console.warn('⚠️ CORRECTED: Final fallback to Brasil (all other methods failed)');
      validatedLocations.push({
        id: `fallback-brasil-${Date.now()}`,
        key: 'BR',
        name: 'Brasil',
        type: 'country',
        country_code: 'BR',
        radius: 10,
        distance_unit: 'kilometer'
      });
      localizacao = 'Brasil';
    }

    const result: LocationDataResult = {
      localizacao,
      selectedLocations: validatedLocations,
      coordinates: campaignData.location?.coordinates
    };

    console.log('✅ CORRECTED: Location data prepared with city preservation:', {
      localizacao: result.localizacao,
      selectedLocationsCount: result.selectedLocations.length,
      hasCoordinates: !!result.coordinates,
      locationTypes: result.selectedLocations.map(loc => loc.type),
      locationNames: result.selectedLocations.map(loc => loc.name),
      isSpecificLocation: result.selectedLocations.some(loc => loc.type === 'city')
    });

    return result;
  }, []);

  return {
    prepareLocationData
  };
};
