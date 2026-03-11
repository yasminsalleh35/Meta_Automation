
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/hooks/useSupabase';
import { CampaignData } from '@/types/campaign';
import { parseJsonArray } from '@/utils/campaignDataParsing';

export const useCampaignLoader = () => {
  const supabase = useSupabase();
  const { toast } = useToast();

  const loadCampaign = async (campaignId: string, setCampaignData: (data: CampaignData) => void): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      const { data: campaign, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!campaign) {
        throw new Error('Campanha não encontrada');
      }

      // Parse selected locations from database using correct field name
      let selectedLocations = [];
      try {
        if (campaign.location_selected_locations) {
          selectedLocations = JSON.parse(campaign.location_selected_locations as string);
        }
      } catch (e) {
        console.warn('Error parsing location_selected_locations:', e);
        selectedLocations = [];
      }

      // Convert database format to CampaignData format with safe parsing
      const campaignData: CampaignData = {
        campaignId: campaign.id,
        objective: campaign.objective,
        campaignName: campaign.name,
        location: {
          radius: campaign.location_radius || 10,
          selectedLocations: selectedLocations
        },
        gender: campaign.gender || 'all',
        ageRange: {
          min: campaign.age_min || 18,
          max: campaign.age_max || 65
        },
        interests: parseJsonArray(campaign.interests, []),
        placements: parseJsonArray(campaign.placements, ['feed']),
        devices: parseJsonArray(campaign.devices, ['mobile', 'desktop']),
        budget: {
          daily: campaign.budget_daily || 50,
          total: campaign.budget_total || 1000
        },
        duration: {
          startDate: campaign.start_date || '',
          endDate: campaign.end_date || ''
        },
        adTitle: campaign.ad_title || '',
        adText: campaign.ad_text || '',
        destinationUrl: campaign.destination_url || '',
        media: null,
        selectedMediaId: campaign.media_file_id || '',
        facebookPage: campaign.facebook_page || '',
        instagramAccount: campaign.instagram_account || '',
        whatsappNumber: campaign.whatsapp_number || '',
        selectedFanPage: campaign.facebook_page || '',
        selectedInstagram: campaign.instagram_account || '',
        selectedWhatsApp: campaign.whatsapp_number || '',
        meta_campaign_id: campaign.meta_campaign_id || '',
        meta_adset_id: campaign.meta_adset_id || '',
        meta_ad_id: campaign.meta_ad_id || '',
        media_file_id: campaign.media_file_id || ''
      };

      setCampaignData(campaignData);
      return true;
    } catch (error) {
      console.error('Error loading campaign:', error);
      toast({
        title: "Erro ao carregar campanha",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    loadCampaign
  };
};
