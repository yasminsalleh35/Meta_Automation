import { TargetingSpecBuilder } from './location/TargetingSpecBuilder';
import { officialLocationSearchService } from './location/OfficialLocationSearchService';
import { locationValidationService } from './location/LocationValidationService';
import { locationDisplayService } from './location/LocationDisplayService';

export class MetaAdsLocationService {
  // ✅ NEW: Use official Meta API for targeting
  async parseLocationToTargeting(campaignData: any, accessToken?: string): Promise<any> {
    if (accessToken) {
      return await TargetingSpecBuilder.buildTargetingSpec(campaignData, accessToken);
    } else {
      console.log('⚠️ No access token for official targeting, using Brasil fallback');
      return {
        geo_locations: { countries: ['BR'] },
        age_min: 18,
        age_max: 65
      };
    }
  }

  // ✅ NEW: Use official Meta location search
  async getLocationSuggestions(
    query: string, 
    accessToken: string, 
    countryCode?: string,
    locationTypes?: Array<'city' | 'region' | 'country'>
  ): Promise<any[]> {
    console.log('🔍 MetaAdsLocationService.getLocationSuggestions', {
      query,
      countryCode: countryCode || 'global',
      locationTypes: locationTypes || ['city', 'region'],
      hasToken: !!accessToken
    });
    
    return await officialLocationSearchService.searchLocations({
      query,
      accessToken,
      locationTypes: locationTypes || ['city', 'region'],
      countryCode
    });
  }

  // ✅ NOVO: Resolver cidade específica para obter key Meta
  async resolveCityToAdGeoKey(params: {
    query: string;
    countryCode: string;
    accessToken: string;
  }): Promise<Array<{
    id: string;
    key: string;
    name: string;
    type: 'city' | 'region' | 'country';
    country_code: string;
    region?: string | null;
    radius?: number;
    distance_unit?: 'kilometer';
  }>> {
    return await officialLocationSearchService.searchLocations({
      query: params.query,
      accessToken: params.accessToken,
      locationTypes: ['city'],
      countryCode: params.countryCode,
      limit: 10
    });
  }

  // Keep existing validation and display services
  validateLocationTargeting = locationValidationService.validateLocationTargeting.bind(locationValidationService);
  getLocationAudienceSize = locationValidationService.getLocationAudienceSize.bind(locationValidationService);
  formatLocationDisplay = locationDisplayService.formatLocationDisplay.bind(locationDisplayService);
}

export const metaAdsLocationService = new MetaAdsLocationService();
