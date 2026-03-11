
import { TargetingSpecBuilder } from './TargetingSpecBuilder';

export class LocationTargetingService {
  /**
   * Parse location data to Meta targeting format using official API
   * @deprecated Use TargetingSpecBuilder.buildTargetingSpec instead
   */
  async parseLocationToTargeting(campaignData: any, accessToken?: string): Promise<any> {
    console.log('⚠️ LocationTargetingService.parseLocationToTargeting is deprecated');
    console.log('✅ Using new TargetingSpecBuilder instead');
    
    if (accessToken) {
      return await TargetingSpecBuilder.buildTargetingSpec(campaignData, accessToken);
    } else {
      // Fallback sem token
      console.log('⚠️ No access token provided, using Brasil fallback');
      return { 
        geo_locations: { 
          countries: ['BR'] 
        },
        age_min: 18,
        age_max: 65
      };
    }
  }
}

export const locationTargetingService = new LocationTargetingService();
