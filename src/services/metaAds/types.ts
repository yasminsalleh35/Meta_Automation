// Centralized types for Meta Ads operations

// Base location interface for internal use
export interface LocationData {
  key: string; // Meta API ID - this is the primary identifier
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
}

// Meta API specific location interfaces
export interface GeoLocationCity {
  key: string;
  name: string;
  region: string;
  region_id: string;
  country_code: string;
  country_name: string;
  supports_city: boolean;
  supports_region: boolean;
}

export interface GeoLocationRegion {
  key: string;
  name: string;
  country_code: string;
  country_name: string;
  supports_city: boolean;
  supports_region: boolean;
}

export interface GeoLocationTargeting {
  cities: GeoLocationCity[];
  regions: GeoLocationRegion[];
  location_types: string[];
}

export interface TargetingData {
  geo_locations: GeoLocationTargeting;
  age_min: number;
  age_max: number;
  genders?: number[];
  interests?: string[];
}

export interface CreativeData {
  image_hash: string;
  name: string;
  call_to_action_type: string;
  object_story_spec: {
    page_id: string;
    link_data: {
      image_hash: string;
      link: string;
      message: string;
      name: string;
      call_to_action: {
        type: string;
        value: {
          link: string;
        };
      };
    };
  };
}

export interface CampaignConfig {
  name: string;
  objective: string;
  status: string;
  special_ad_categories?: string[];
}

export interface AdSetConfig {
  name: string;
  campaign_id: string;
  optimization_goal: string;
  billing_event: string;
  bid_strategy?: string;
  bid_amount?: number;
  daily_budget: number;
  targeting: TargetingData;
  status: string;
  promoted_object?: {
    page_id: string;
  };
}

export interface AdCreativeConfig {
  name: string;
  object_story_spec: {
    page_id: string;
    link_data: {
      image_hash: string;
      link: string;
      message: string;
      name: string;
      call_to_action: {
        type: string;
        value: {
          link: string;
        };
      };
    };
  };
}

export interface AdConfig {
  name: string;
  adset_id: string;
  creative: {
    creative_id: string;
  };
  status: string;
}

export interface CampaignCreationData {
  localizacao: string;
  criativo: File;
  copy: string;
  link_whatsapp: string;
  daily_budget: number;
  selectedInstagram?: string;
  selectedLocations?: LocationData[];
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface MetaCampaignResponse {
  campaign_id: string;
  adset_id: string;
  creative_id: string;
  ad_id: string;
  status: 'success' | 'error';
  message?: string;
  contingency_mode?: boolean;
}
