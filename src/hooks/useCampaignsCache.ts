import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMetaSelection } from '@/hooks/useMetaSelection';
import { useSupabase } from '@/hooks/useSupabase';

export interface CachedCampaign {
  id: string;
  metaCampaignId: string;
  name: string;
  objective: string;
  status: string;
  metrics?: {
    impressions?: number;
    reach?: number;
    clicks?: number;
    spend?: number;
    cpm?: number;
    cpc?: number;
    ctr?: number;
    conversations?: number;
    cost_per_messaging_conversation_started_7d?: number;
  };
  last_metrics_sync_at?: string;
  meta_data_cached_at?: string;
  page?: { id?: string; name?: string; picture_url?: string };
  instagram?: { id?: string; username?: string };
  previewUrl?: string; // Deprecated: use mediaPreviewUrl
  mediaPreviewUrl?: string;
  created_time?: string;
}

export interface CampaignsCacheFilters {
  status?: 'all' | 'active' | 'paused' | 'archived';
  search?: string;
  page?: number;
  page_size?: number;
}

export const useCampaignsCache = (filters: CampaignsCacheFilters = {}) => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const { data: selection } = useMetaSelection();

  const {
    status = 'all',
    search = '',
    page = 1,
    page_size = 20
  } = filters;

  const query = useQuery({
    queryKey: ['campaigns-cache', { 
      ad_account_id: selection?.ad_account_id, 
      status, 
      search, 
      page, 
      page_size 
    }],
    queryFn: async () => {
      if (!selection?.ad_account_id) {
        throw new Error('No ad account selected');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meta-campaigns-cached`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            ad_account_id: selection.ad_account_id,
            status,
            search,
            page,
            page_size
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch campaigns');
      }

      return await response.json();
    },
    enabled: !!selection?.ad_account_id,
    staleTime: 2 * 60 * 1000, // 2 minutes (optimized from 15min)
    refetchOnWindowFocus: true, // Auto-refresh when user returns to tab
    refetchOnMount: true,
    refetchInterval: 5 * 60 * 1000 // Auto-refresh every 5 minutes
  });

  const refetch = () => {
    return query.refetch();
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ 
      queryKey: ['campaigns-cache'] 
    });
  };

  // Trust server order (created_at DESC) — no client-side re-sort
  const sortedItems = (query.data?.items || []).map(item => ({
    ...item,
    mediaPreviewUrl: item.previewUrl || item.mediaPreviewUrl
  }));

  return {
    data: sortedItems,
    total: query.data?.total || 0,
    page: query.data?.page || 1,
    page_size: query.data?.page_size || 20,
    isLoading: query.isLoading,
    error: query.error,
    refetch,
    invalidate
  };
};
