export type PlacementType = 
  | 'facebook_feed'
  | 'facebook_marketplace'
  | 'facebook_video_feeds'
  | 'facebook_right_column'
  | 'instagram_feed'
  | 'instagram_stories'
  | 'instagram_reels'
  | 'instagram_explore';

export type Interest = {
  id: string;
  name: string;
};

export type CampaignProfile = {
  id: string;
  slug: string;
  label: string;
  description?: string | null;
  age_min: number;
  age_max: number;
  genders: 'all' | 'male' | 'female';
  placements_mode: 'automatic' | 'manual';
  placements: PlacementType[];
  interests: Interest[];
  is_active: boolean;
  version: number;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
  // New flags for conditional sections
  show_strategic_reports?: boolean;
  show_dental_specialties?: boolean;
  // Language Targeting
  enable_language_targeting?: boolean;
  languages?: string[];
};