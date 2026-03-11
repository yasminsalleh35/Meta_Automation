// [CAMPly-FIX-Providers]
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

export type ResolvedIntegration = {
  provider: 'meta_ads' | 'meta',
  access_token: string,
  ad_account_id?: string | null,
  page_id?: string | null,
  instagram_actor_id?: string | null
};

export async function resolveMetaIntegration(userId: string): Promise<ResolvedIntegration | null> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Preferir meta_ads, depois meta
  const providerOrder = ['meta_ads', 'meta'] as const;

  for (const provider of providerOrder) {
    const { data, error } = await supabase
      .from('integrations')
      .select('provider, access_token, ad_account_id, page_id')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('[resolveMetaIntegration] supabase error', { provider, error });
      continue;
    }
    if (data?.access_token) {
      return {
        provider: data.provider,
        access_token: data.access_token,
        ad_account_id: data.ad_account_id ?? null,
        page_id: data.page_id ?? null,
        instagram_actor_id: null // preenchido dinamicamente se necessário
      };
    }
  }
  return null;
}