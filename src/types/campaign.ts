
import { LocationData } from './location';

export interface CampaignData {
  campaignId?: string;
  objective: string;
  location: {
    radius: number;
    coordinates?: {
      lat: number;
      lng: number;
    };
    selectedAddress?: string;
    selectedLocations: LocationData[]; // ✅ CORRIGIDO: Usar interface unificada
  };
  gender: string;
  ageRange: {
    min: number;
    max: number;
  };
  interests: string[];
  placements: string[];
  devices: string[];
  budget: {
    daily: number;
    total: number;
  };
  duration: {
    startDate: string;
    endDate: string;
  };
  campaignName: string;
  adTitle: string;
  adText: string;
  destinationUrl: string;
  media: File | null;
  selectedMediaId: string;
  facebookPage: string;
  instagramAccount: string;
  whatsappNumber: string;
  selectedFanPage: string;
  selectedInstagram: string;
  selectedWhatsApp: string;
  meta_campaign_id?: string;
  meta_adset_id?: string;
  meta_ad_id?: string;
  media_file_id?: string;
}

export const getInitialCampaignData = (): CampaignData => ({
  objective: '',
  location: {
    radius: 10,
    coordinates: undefined,
    selectedAddress: '',
    selectedLocations: [] // ✅ CORRIGIDO: Array vazio tipado corretamente
  },
  gender: 'all',
  ageRange: {
    min: 18,
    max: 65
  },
  interests: [],
  placements: ['feed'],
  devices: ['mobile', 'desktop'],
  budget: {
    daily: 50,
    total: 1000
  },
  duration: {
    startDate: '',
    endDate: ''
  },
  campaignName: '',
  adTitle: '',
  adText: '',
  destinationUrl: '',
  media: null,
  selectedMediaId: '',
  facebookPage: '',
  instagramAccount: '',
  whatsappNumber: '',
  selectedFanPage: '',
  selectedInstagram: '',
  selectedWhatsApp: '',
  meta_campaign_id: '',
  meta_adset_id: '',
  meta_ad_id: '',
  media_file_id: ''
});
