// ========================================
// 📋 TYPES FOR SIMPLE CAMPAIGN CREATION
// ========================================

export interface SimpleCampaignPayload {
  campaignName: string;
  adTitle: string;
  adText: string;
  fanpage: string;
  instagram: string;
  whatsappLink: string;
  dailyBudget: number;
  startDate: string;
  endDate?: string | null;
  city: string;
  cityCoordinates?: {
    latitude: number;
    longitude: number;
    center: [number, number];
  } | null;
  radius: number;
  mediaFileId?: string | null;
  mediaUrl?: string | null;
  selectedMediaMeta?: {
    file_type: string;
    public_url: string;
    filename: string;
  } | null;
  creativeType: 'upload' | 'post';
  object_story_id?: string | null;
  existing_post_id?: string | null;
  useExistingInstagramPost: boolean;
  selectedInstagramPostId: string | null;
  instagramUserId?: string | null; // ✅ FASE 4: para montar {IG_USER_ID}_{MEDIA_ID}
  forceLinkCreative?: boolean;
  campaignType: string;
  status: string;
  optimization: string;
  billingEvent: string;
  platforms: string[];
  placements: string[];
  devices: string[];
  gender: string;
  ageMin: number;
  ageMax: number;
  specialCategories: string[];
  
  // Additional properties for enhanced campaign processing
  // ✅ v23.0 CTWA: objective é sempre OUTCOME_ENGAGEMENT
  objective?: string; // Ignorado - sempre OUTCOME_ENGAGEMENT
  targetLocations?: any[];
  interests?: any[];
  fanpageName?: string;
  instagramAccount?: string;
  mediaMetadata?: any;
  pageId?: string;
  postId?: string;
  destinationUrl?: string;
  countryCode?: string;
  selected_locations?: any[];
  whatsapp_meta?: any;
  whatsappNumber?: string;
}

export interface CampaignProcessingResult {
  success: boolean;
  campaignId: string;
  adSetId: string;
  creativeId: string;
  adId: string;
  mediaHash?: string;
  mediaUrl?: string;
  videoId?: string;
  postId?: string;
}