
export interface SimpleCampaignFormData {
  campaignName: string;
  adTitle: string;
  adText: string;
  fanpage: string;
  instagram: string;
  whatsappNumber: string;
  whatsappLink?: string;
  selectedMediaFile: any | null;
  dailyBudget: number;
  startDate: Date;
  endDate?: Date | null;
  city: string;
  cityCoordinates?: {
    latitude: number;
    longitude: number;
    center: [number, number];
  } | null;
  radius: number;
  creativeType: 'upload' | 'post';
  selectedInstagramPost?: {
    id: string;
    caption: string;
    media_url: string;
    instagram_user_id?: string;
  } | null;
  useExistingInstagramPost: boolean;
  selectedInstagramPostId: string | null;
  object_story_id?: string | null;
  countryCode?: string; // ✅ NOVO: código do país (BR, US, PT, ES, etc.)
  selected_locations?: Array<{
    key?: string;
    name: string;
    type: 'city' | 'region' | 'country';
    country_code?: string;
    region?: string | null;
    radius?: number;
    distance_unit?: 'kilometer' | 'mile';
    latitude?: number;
    longitude?: number;
  }>; // ✅ NOVO: localizações Meta estruturadas
  // ✅ Phase 4.4: Scheduling — dayparting
  scheduleStartTime?: string | null; // HH:MM format, e.g. "08:00"
  scheduleEndTime?: string | null;   // HH:MM format, e.g. "22:00"
  enableDayparting?: boolean;
  daypartingDays?: number[];         // 0=Sunday..6=Saturday (Meta format)
  // AI targeting toggle
  useAISuggestions?: boolean;
  aiTargeting?: {
    interests: Array<{ id: string; name: string }>;
    ageMin: number;
    ageMax: number;
    genders: 'all' | 'male' | 'female';
  } | null;
}

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
  // ✅ NOVO: Dados da mídia para upload na Meta API
  selectedMediaMeta?: {
    file_type: string;
    public_url: string;
    filename: string;
  } | null;
  // ✅ NOVO: Dados para promoção de post existente
  creativeType: 'upload' | 'post';
  object_story_id?: string | null;
  existing_post_id?: string | null;
  useExistingInstagramPost: boolean;
  selectedInstagramPostId: string | null;
  instagramUserId?: string | null;
  forceLinkCreative?: boolean;
  campaignType: string;
  status: string;
  // ✅ Campos forçados pela Edge Function (v23.0 CTWA):
  // - objective: OUTCOME_ENGAGEMENT
  // - optimization_goal: CONVERSATIONS
  // - billing_event: IMPRESSIONS
  // - destination_type: WHATSAPP
  // - platforms: facebook, instagram
  // - placements: feed, story, reels
  // - devices: mobile
  optimization_goal?: string; // Ignorado - sempre CONVERSATIONS
  billing_event?: string; // Ignorado - sempre IMPRESSIONS
  platforms?: string[]; // Ignorado - sempre facebook + instagram
  placements?: string[]; // Ignorado - sempre feed + story + reels
  devices?: string[]; // Ignorado - sempre mobile
  gender: string;
  ageMin: number;
  ageMax: number;
  specialCategories: string[];
  countryCode?: string; // ✅ NOVO: código do país selecionado
  selected_locations?: Array<{
    key?: string;
    name: string;
    type: 'city' | 'region' | 'country';
    country_code?: string;
    region?: string | null;
    radius?: number;
    distance_unit?: 'kilometer' | 'mile';
    latitude?: number;
    longitude?: number;
  }>; // ✅ NOVO: localizações Meta estruturadas
  // ✅ Phase 4.4: Scheduling — dayparting
  scheduleStartTime?: string | null; // HH:MM format
  scheduleEndTime?: string | null;   // HH:MM format
  enableDayparting?: boolean;
  daypartingDays?: number[];         // 0=Sunday..6=Saturday
  adSchedule?: Array<{
    start_minute: number;
    end_minute: number;
    days: number[];
    timezone_type: string;
  }> | null;
}

export interface SimpleCampaignWizardStep {
  id: number;
  title: string;
  description: string;
  isComplete: boolean;
  isActive: boolean;
}
