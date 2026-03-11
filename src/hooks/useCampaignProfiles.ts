import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CampaignProfile } from '@/types/campaignProfiles';

const KEY = ['campaign_profiles'];

export function useProfilesList(params?: { search?: string; onlyActive?: boolean }) {
  return useQuery({
    queryKey: [...KEY, params],
    queryFn: async () => {
      let q = supabase.from('campaign_profiles')
        .select('id,slug,label,description,age_min,age_max,genders,placements_mode,placements,interests,is_active,version,created_at,updated_at,show_strategic_reports,show_dental_specialties,enable_language_targeting,languages')
        .order('updated_at', { ascending: false });
      
      if (params?.onlyActive) q = q.eq('is_active', true);
      
      if (params?.search) {
        q = q.or(`slug.ilike.%${params.search}%,label.ilike.%${params.search}%`);
      }
      
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<CampaignProfile, 'id'|'created_at'|'updated_at'|'version'>) => {
      const { data, error } = await supabase.from('campaign_profiles').insert({
        ...payload,
        version: 1,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<CampaignProfile> & { id: string }) => {
      const { id, ...rest } = payload;
      const { data, error } = await supabase.from('campaign_profiles').update({
        ...rest,
        updated_at: new Date().toISOString(),
      }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useToggleActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase.from('campaign_profiles').update({
        is_active,
        updated_at: new Date().toISOString(),
      }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}