export interface TestWizardFormData {
  campaignName: string;
  adTitle: string;
  adText: string;
  fanpage: string;
  instagram: string;
  whatsappNumber: string;
  dailyBudget: number;
  startDate: Date | null;
  countryCode: string;
  city: string;
  cityCoordinates: {
    latitude: number;
    longitude: number;
    center: [number, number];
  } | null;
  radius: number;
  selected_locations: Array<{
    name: string;
    type: 'city' | 'region';
    country_code: string;
    region?: string | null;
    latitude?: number;
    longitude?: number;
    radius?: number;
    distance_unit?: string;
    key?: string;
    source?: string;
  }>;
  creativeType: 'upload' | 'post';
  selectedMediaFile: File | null;
  selectedMediaId: string | null;
  selectedMediaMeta: {
    file_type: string;
    public_url: string;
    filename: string;
  } | null;
  selectedInstagramPost: {
    id: string;
    caption: string;
    media_url: string;
    media_type: string;
  } | null;
  selectedInstagramPostId: string | null;
}

export interface LogEntry {
  timestamp: Date;
  stage: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  data?: any;
}
