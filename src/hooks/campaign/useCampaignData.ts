
import { useState, useEffect } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useToast } from '@/hooks/use-toast';
import { RealCampaign } from '@/types/realCampaign';

export const useCampaignData = () => {
  const supabase = useSupabase();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<RealCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Usuário não autenticado');
      }

      // Get active Meta Ads integration to filter campaigns by ad_account_id
      const { data: integration } = await supabase
        .from('integrations')
        .select('ad_account_id')
        .eq('user_id', session.user.id)
        .eq('provider', 'meta_ads')
        .eq('status', 'active')
        .maybeSingle();

      const activeAdAccountId = integration?.ad_account_id;
      console.log('🔍 Active ad_account_id:', activeAdAccountId);

      // Build query to fetch campaigns:
      // - All campaigns without ad_account_id (legacy/local campaigns)
      // - OR campaigns matching the active ad_account_id
      let query = supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      // If there's an active integration, filter by ad_account_id
      if (activeAdAccountId) {
        query = query.or(`ad_account_id.is.null,ad_account_id.eq.${activeAdAccountId}`);
      } else {
        // No active integration: only show campaigns without ad_account_id (local-only)
        query = query.is('ad_account_id', null);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      console.log('📊 Real campaigns fetched from database:', data);
      
      const mappedCampaigns: RealCampaign[] = (data || []).map(campaign => {
        console.log(`📋 Processing campaign: ${campaign.name}`, {
          id: campaign.id,
          user_id: campaign.user_id,
          media_file_id: campaign.media_file_id,
          destination_url: campaign.destination_url,
          meta_campaign_id: campaign.meta_campaign_id
        });

        return {
          id: campaign.id,
          name: campaign.name,
          status: ['draft', 'active', 'paused', 'finished'].includes(campaign.status) 
            ? campaign.status as 'draft' | 'active' | 'paused' | 'finished'
            : 'draft',
          objective: campaign.objective,
          budget_daily: campaign.budget_daily,
          budget_total: campaign.budget_total,
          location_country: campaign.location_country,
          location_state: campaign.location_state,
          location_city: campaign.location_city,
          location_radius: campaign.location_radius,
          selected_locations: campaign.selected_locations || [],
          age_min: campaign.age_min,
          age_max: campaign.age_max,
          gender: campaign.gender,
          interests: campaign.interests || [],
          placements: campaign.placements || [],
          devices: campaign.devices || [],
          ad_title: campaign.ad_title,
          ad_text: campaign.ad_text,
          destination_url: campaign.destination_url,
          media_file_id: campaign.media_file_id,
          facebook_page: campaign.facebook_page,
          instagram_account: campaign.instagram_account,
          whatsapp_number: campaign.whatsapp_number,
          created_at: campaign.created_at,
          updated_at: campaign.updated_at,
          start_date: campaign.start_date,
          end_date: campaign.end_date,
          meta_campaign_id: campaign.meta_campaign_id,
          meta_adset_id: campaign.meta_adset_id,
          meta_ad_id: campaign.meta_ad_id,
          processing_status: campaign.processing_status,
          meta_integration_status: campaign.meta_integration_status,
          verification_status: campaign.verification_status,
          last_verified_at: campaign.last_verified_at,
          user_id: campaign.user_id,
          error_log: campaign.error_log || [],
          retry_count: campaign.retry_count || 0,
          last_processed_at: campaign.last_processed_at,
          job_id: campaign.job_id,
          ad_account_id: campaign.ad_account_id
        };
      });
      
      console.log('✅ Mapped campaigns with complete data:', mappedCampaigns);
      setCampaigns(mappedCampaigns);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar campanhas';
      console.error('❌ Error fetching campaigns:', err);
      setError(errorMessage);
      toast({
        title: "Erro ao carregar campanhas",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateCampaigns = (updater: (prev: RealCampaign[]) => RealCampaign[]) => {
    setCampaigns(updater);
  };

  useEffect(() => {
    fetchCampaigns();
  }, []); // Apenas no mount, cache no backend gerencia atualizações

  return {
    campaigns,
    setCampaigns,
    updateCampaigns,
    isLoading,
    error,
    fetchCampaigns
  };
};
