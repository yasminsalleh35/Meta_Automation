
import { LocationData, MetaTargetingSpec } from '@/types/location';

/**
 * Construtor de especificação de targeting conforme documentação Meta
 * Baseado em: https://developers.facebook.com/docs/marketing-api/targeting-specs
 */
export class TargetingSpecBuilder {
  /**
   * Constrói targeting spec completo conforme documentação Meta
   */
  static async buildTargetingSpec(
    campaignData: any,
    accessToken: string
  ): Promise<MetaTargetingSpec> {
    console.log('🎯 CORRECTED: Building Meta targeting spec with enhanced location preservation...');
    
    const targeting: MetaTargetingSpec = {
      geo_locations: {
        location_types: ['home', 'recent']
      },
      age_min: 18,
      age_max: 65
    };

    // ✅ CORREÇÃO CRÍTICA: Ordem correta e preservação de dados específicos
    const locationData = this.extractLocationDataWithPriority(campaignData);
    
    if (locationData.length > 0) {
      targeting.geo_locations = this.buildGeoLocations(locationData);
      console.log('✅ CORRECTED: Geo targeting built with preserved city data:', JSON.stringify(targeting.geo_locations, null, 2));
    } else {
      console.error('❌ CRITICAL: No valid location data found after all attempts');
      throw new Error('Dados de localização não encontrados. Selecione uma localização válida.');
    }

    const validation = this.validateTargetingSpec(targeting);
    if (!validation.isValid) {
      throw new Error(`Targeting inválido: ${validation.error}`);
    }

    return targeting;
  }

  /**
   * ✅ CORREÇÃO CRÍTICA: Extrai dados priorizando cidade específica sobre país
   */
  private static extractLocationDataWithPriority(campaignData: any): LocationData[] {
    console.log('🔍 CORRECTED: Enhanced location extraction with city priority...');
    
    // Priority 1: Direct selectedLocations (from Meta campaign creation)
    if (campaignData.selectedLocations && Array.isArray(campaignData.selectedLocations) && campaignData.selectedLocations.length > 0) {
      console.log('✅ Found selectedLocations at root level:', campaignData.selectedLocations.length);
      const locations = this.validateAndPrioritizeLocations(campaignData.selectedLocations);
      if (locations.length > 0) return locations;
    }
    
    // Priority 2: location.selectedLocations (from location wizard)
    if (campaignData.location?.selectedLocations && Array.isArray(campaignData.location.selectedLocations) && campaignData.location.selectedLocations.length > 0) {
      console.log('✅ Found selectedLocations in location object:', campaignData.location.selectedLocations.length);
      const locations = this.validateAndPrioritizeLocations(campaignData.location.selectedLocations);
      if (locations.length > 0) return locations;
    }

    // Priority 3: ✅ CORREÇÃO: Parse inteligente do selectedAddress
    if (campaignData.location?.selectedAddress) {
      console.log('🎯 CORRECTED: Smart parsing from selectedAddress:', campaignData.location.selectedAddress);
      const parsedLocations = this.parseAddressToSpecificLocation(campaignData.location.selectedAddress, campaignData.location.radius || 10);
      if (parsedLocations.length > 0) return parsedLocations;
    }

    console.error('❌ No valid location data sources found after all attempts');
    return [];
  }

  /**
   * ✅ NOVO: Valida e prioriza localizações específicas sobre genéricas
   */
  private static validateAndPrioritizeLocations(locations: any[]): LocationData[] {
    const validLocations = locations
      .filter(loc => loc && loc.name && loc.key)
      .map(loc => ({
        key: loc.key,
        name: loc.name,
        type: loc.type || 'city',
        country_code: loc.country_code,
        region: loc.region,
        radius: loc.radius,
        distance_unit: loc.distance_unit || 'kilometer',
        coordinates: loc.coordinates
      }));

    // ✅ CORREÇÃO: Priorizar cidades sobre países
    const cities = validLocations.filter(loc => loc.type === 'city');
    const regions = validLocations.filter(loc => loc.type === 'region' || loc.type === 'state');
    const countries = validLocations.filter(loc => loc.type === 'country');

    // Retornar em ordem de prioridade: cidades > regiões > países
    return [...cities, ...regions, ...countries];
  }

  /**
   * ✅ CORREÇÃO CRÍTICA: Parse inteligente de endereço para localização específica
   */
  private static parseAddressToSpecificLocation(address: string, radius: number): LocationData[] {
    console.log('🎯 CORRECTED: Smart address parsing for specific location:', address);
    
    // ✅ CORREÇÃO: Detectar cidade específica ANTES de país
    const addressParts = address.split(',').map(p => p.trim());
    
    // Se tem múltiplas partes, a primeira geralmente é a cidade
    if (addressParts.length >= 2) {
      const cityName = addressParts[0];
      const stateName = addressParts[1];
      const countryName = addressParts[addressParts.length - 1];
      
      console.log('🏙️ CORRECTED: Detected city from address:', {
        city: cityName,
        state: stateName,
        country: countryName
      });
      
      // ✅ PRIORIZAR CIDADE sobre país
      if (cityName && !cityName.toLowerCase().includes('brasil') && !cityName.toLowerCase().includes('brazil')) {
        return [{
          key: `CITY_${cityName.toUpperCase().replace(/\s+/g, '_')}`,
          name: cityName,
          type: 'city',
          region: stateName,
          country_code: countryName.toLowerCase().includes('brasil') || countryName.toLowerCase().includes('brazil') ? 'BR' : undefined,
          radius: radius,
          distance_unit: 'kilometer'
        }];
      }
    }
    
    // ✅ ÚLTIMO RECURSO: Brasil apenas se não conseguir detectar cidade
    if (address.toLowerCase().includes('brasil') || address.toLowerCase().includes('brazil')) {
      console.log('⚠️ CORRECTED: Using Brasil as last resort only');
      return [{
        key: 'BR',
        name: 'Brasil',
        type: 'country',
        country_code: 'BR',
        radius: radius,
        distance_unit: 'kilometer'
      }];
    }
    
    console.error('❌ Could not parse address to specific location:', address);
    return [];
  }

  /**
   * ✅ NOVO: Constrói geo_locations com suporte a cities (key) e custom_locations (lat/lng)
   */
  private static buildGeoLocations(selectedLocations: LocationData[]): any {
    const geoLocations: any = {
      location_types: ['home', 'recent']
    };

    const countries: string[] = [];
    const regions: Array<{ key: string }> = [];
    const cities: Array<{ key: string; radius?: number; distance_unit?: string }> = [];
    const customLocations: Array<{ latitude: number; longitude: number; radius: number; distance_unit: string }> = [];
    const zips: Array<{ key: string }> = [];

    selectedLocations.forEach((location) => {
      console.log(`🏷️ Processing location: ${location.name} (${location.type})`);
      
      switch (location.type?.toLowerCase()) {
        case 'country':
          if (location.country_code) {
            countries.push(location.country_code);
            console.log(`🌍 Country added: ${location.country_code}`);
          }
          break;
          
        case 'region':
        case 'state':
          if (location.key) {
            regions.push({ key: location.key });
            console.log(`🗺️ Region added: ${location.key}`);
          }
          break;
          
        case 'city':
          // ✅ PRIORIDADE 1: Cidade com key Meta
          if (location.key) {
            const cityObj: any = { key: location.key };
            
            if (location.radius && location.radius >= 1 && location.radius <= 80) {
              cityObj.radius = location.radius;
              cityObj.distance_unit = location.distance_unit || 'kilometer';
            }
            
            cities.push(cityObj);
            console.log(`🏙️ City with key added: ${location.key} ${cityObj.radius ? `(radius: ${cityObj.radius}${cityObj.distance_unit})` : ''}`);
          } 
          // ✅ FALLBACK: Cidade sem key, usar custom_locations
          else if (location.coordinates?.lat && location.coordinates?.lng) {
            customLocations.push({
              latitude: location.coordinates.lat,
              longitude: location.coordinates.lng,
              radius: location.radius || 10,
              distance_unit: location.distance_unit || 'kilometer'
            });
            console.log(`📍 Custom location added: ${location.name} (lat: ${location.coordinates.lat}, lng: ${location.coordinates.lng})`);
          }
          // ✅ FALLBACK ALTERNATIVO: usando campos latitude/longitude diretos
          else if (location.latitude && location.longitude) {
            customLocations.push({
              latitude: location.latitude,
              longitude: location.longitude,
              radius: location.radius || 10,
              distance_unit: location.distance_unit || 'kilometer'
            });
            console.log(`📍 Custom location added (direct coords): ${location.name} (lat: ${location.latitude}, lng: ${location.longitude})`);
          }
          break;
          
        case 'zip':
          if (location.key) {
            zips.push({ key: location.key });
            console.log(`📮 ZIP added: ${location.key}`);
          }
          break;
          
        default:
          console.warn(`⚠️ Unknown location type: ${location.type}, skipping`);
          break;
      }
    });

    // ✅ Montar objeto final com priorização
    if (cities.length > 0) {
      geoLocations.cities = cities;
      console.log(`✅ Cities prioritized in targeting: ${cities.length} cities`);
    }
    if (customLocations.length > 0) {
      geoLocations.custom_locations = customLocations;
      console.log(`✅ Custom locations added: ${customLocations.length} locations`);
    }
    if (regions.length > 0) {
      geoLocations.regions = regions;
    }
    if (countries.length > 0) {
      geoLocations.countries = [...new Set(countries)];
    }
    if (zips.length > 0) {
      geoLocations.zips = zips;
    }

    return geoLocations;
  }

  /**
   * ✅ CORRIGIDO: Validação conforme Meta API
   */
  static validateTargetingSpec(targeting: MetaTargetingSpec): { isValid: boolean; error?: string } {
    if (!targeting.geo_locations) {
      return { isValid: false, error: 'geo_locations é obrigatório' };
    }

    const geoLoc = targeting.geo_locations;
    const hasCountries = geoLoc.countries && geoLoc.countries.length > 0;
    const hasRegions = geoLoc.regions && geoLoc.regions.length > 0;
    const hasCities = geoLoc.cities && geoLoc.cities.length > 0;
    const hasZips = geoLoc.zips && geoLoc.zips.length > 0;

    if (!hasCountries && !hasRegions && !hasCities && !hasZips) {
      return { isValid: false, error: 'Pelo menos um tipo de localização deve ser especificado' };
    }

    if (hasCities) {
      for (const city of geoLoc.cities) {
        if (!city.key) {
          return { isValid: false, error: 'Todas as cidades devem ter um key válido' };
        }
        
        if (city.radius && (city.radius < 1 || city.radius > 80)) {
          return { isValid: false, error: 'Raio da cidade deve estar entre 1 e 80 km' };
        }
        
        if (city.radius && !city.distance_unit) {
          return { isValid: false, error: 'distance_unit é obrigatório quando radius é especificado' };
        }
      }
    }

    return { isValid: true };
  }
}
