import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { trackApiCall } from '@/utils/apiCallTracker';

export interface MetaSelection {
  ad_account_id: string | null;
  page_id: string | null;
  instagram_id: string | null;
  updated_at: string;
  source: "db" | "fallback";
}

export function useMetaSelection() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['meta-selection'],
    queryFn: async (): Promise<MetaSelection> => {
      trackApiCall('meta-selection', 'Fetch ad account selection', 'meta-selection');
      try {
        const { data, error } = await supabase.functions.invoke('meta-selection', {
          body: {}
        });

        if (error) {
          throw new Error(error.message || 'Failed to fetch Meta selection');
        }

        return data;
      } catch (err) {
        console.warn('[useMetaSelection] Edge function failed, using fallback', err);
        // Return fallback data structure
        return {
          ad_account_id: null,
          page_id: null,
          instagram_id: null,
          updated_at: new Date().toISOString(),
          source: "fallback"
        };
      }
    },
    staleTime: 15 * 60 * 1000, // 15 minutos (reduz chamadas API Meta)
    retry: 2
  });

  const invalidateSelection = () => {
    queryClient.invalidateQueries({ queryKey: ['meta-selection'] });
  };

  return {
    ...query,
    invalidateSelection
  };
}