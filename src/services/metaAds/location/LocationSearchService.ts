
import { brazilianCities } from '@/data/brazilianCities';

export class LocationSearchService {
  private baseUrl = 'https://graph.facebook.com/v19.0';

  // Get location suggestions from Meta Ads API
  async getLocationSuggestions(query: string, accessToken: string): Promise<any[]> {
    console.log('🔍 Searching locations for:', query);
    console.log('🔑 Access token available:', !!accessToken);

    try {
      // If no access token, use local suggestions only
      if (!accessToken) {
        console.log('⚠️ No access token available, using local suggestions only');
        return this.getLocalSuggestions(query);
      }

      const encodedQuery = encodeURIComponent(query);
      const url = `${this.baseUrl}/search?type=adgeolocation&q=${encodedQuery}&limit=20&locale=pt_BR&access_token=${accessToken}`;
      
      console.log('🌐 Making request to Meta Ads API...');
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Meta Ads API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        // Fallback to local suggestions
        console.log('🔄 Falling back to local suggestions due to API error');
        return this.getLocalSuggestions(query);
      }
      
      const data = await response.json();
      console.log('✅ Meta Ads API response:', data);
      
      // Process Meta API results
      const metaResults = (data.data || []).map((result: any) => ({
        id: result.key || result.id || `${result.name}_${Date.now()}`,
        key: result.key || result.id,
        name: result.name,
        type: result.type || 'city',
        latitude: result.latitude,
        longitude: result.longitude,
        country_code: result.country_code || 'BR',
        region: result.region,
        supports_region: result.supports_region || false,
        supports_city: result.supports_city || false,
        display_name: this.formatDisplayName(result),
        targeting_data: this.createTargetingData(result)
      }));

      // If Meta API returns results, use them; otherwise fallback to local
      if (metaResults.length > 0) {
        console.log('✅ Returning Meta API results:', metaResults.length);
        return metaResults;
      } else {
        console.log('🔄 Meta API returned no results, using local suggestions');
        return this.getLocalSuggestions(query);
      }
      
    } catch (error) {
      console.error('❌ Error fetching location suggestions from Meta API:', error);
      
      // Always fallback to local suggestions on error
      console.log('🔄 Using local fallback suggestions due to error');
      return this.getLocalSuggestions(query);
    }
  }

  // Get local fallback suggestions
  private getLocalSuggestions(query: string): any[] {
    const cleanQuery = query.toLowerCase().trim();
    
    if (cleanQuery.length < 2) return [];

    return brazilianCities
      .filter(city => 
        city.name.toLowerCase().includes(cleanQuery) ||
        city.state.toLowerCase().includes(cleanQuery)
      )
      .slice(0, 10)
      .map(city => ({
        id: `local_${city.id}`,
        key: city.id.toString(),
        name: city.name,
        type: 'city',
        latitude: city.latitude,
        longitude: city.longitude,
        country_code: 'BR',
        region: city.state,
        supports_city: true,
        display_name: `${city.name}, ${city.state}, BR`,
        targeting_data: this.createTargetingData({
          type: 'city',
          key: city.id.toString(),
          latitude: city.latitude,
          longitude: city.longitude
        })
      }));
  }

  // Format display name for better UX
  private formatDisplayName(result: any): string {
    let displayName = result.name;
    
    if (result.region && result.country_code) {
      displayName = `${result.name}, ${result.region}, ${result.country_code}`;
    } else if (result.country_code) {
      displayName = `${result.name}, ${result.country_code}`;
    }
    
    return displayName;
  }

  // Create targeting data structure
  private createTargetingData(result: any): any {
    const targeting: any = {};
    
    switch (result.type) {
      case 'country':
        targeting.countries = [result.country_code || 'BR'];
        break;
      case 'region':
        targeting.regions = [{ key: result.key }];
        break;
      case 'city':
        if (result.key && !result.key.toString().startsWith('local_')) {
          targeting.cities = [{ key: result.key }];
        } else {
          // Use coordinates for local/unknown cities
          targeting.custom_locations = [{
            latitude: result.latitude,
            longitude: result.longitude,
            radius: 10,
            distance_unit: 'kilometer'
          }];
        }
        break;
      default:
        // Custom location
        targeting.custom_locations = [{
          latitude: result.latitude,
          longitude: result.longitude,
          radius: 10,
          distance_unit: 'kilometer'
        }];
    }
    
    return targeting;
  }
}

export const locationSearchService = new LocationSearchService();
