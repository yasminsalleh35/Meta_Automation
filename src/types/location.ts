
// Unified LocationData interface for both CampaignData and MetaAds
export interface LocationData {
  id?: string; // Optional ID for UI compatibility
  key: string; // Meta API ID - obrigatório
  name: string;
  type: "country" | "region" | "city" | "zip";
  country_code?: string;
  region?: string;
  radius?: number;
  distance_unit?: "kilometer" | "mile";
  coordinates?: {
    lat: number;
    lng: number;
  };
  // ✅ NOVO: Suporte para custom_locations (fallback sem key)
  latitude?: number;
  longitude?: number;
}

// Location context interface for campaigns
export interface CampaignLocationData {
  radius: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  selectedAddress?: string;
  selectedLocations: LocationData[];
}

// Meta API specific targeting interface
export interface MetaGeoLocationTargeting {
  countries?: string[];
  regions?: Array<{ key: string }>;
  cities?: Array<{ 
    key: string; 
    radius?: number; 
    distance_unit?: "kilometer" | "mile" 
  }>;
  zips?: Array<{ key: string }>;
  location_types: string[];
}

export interface MetaTargetingSpec {
  geo_locations: MetaGeoLocationTargeting;
  age_min: number;
  age_max: number;
  genders?: number[];
  interests?: string[];
}
