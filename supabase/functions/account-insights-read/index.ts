/**
 * Edge Function: account-insights-read
 * 
 * Lê métricas do cache (account_insights_cache) para o período solicitado.
 * Retorna dados agregados da conta, incluindo conversões e CPA calculado.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 🚀 V2.3 - Using Service Role Key for cache query (fixes RLS)
    console.log('[READ] v2.3 - Started at:', new Date().toISOString());
    
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log('[READ-V2] Function started - USER:', userId);
    console.log('[Read] User ID:', userId);

    // Parse request body
    const { datePreset = 'last_30d' } = await req.json().catch(() => ({}));
    console.log('[Read] Requested datePreset:', datePreset);

    // Validate datePreset
    if (!['today', 'last_7d', 'last_30d'].includes(datePreset)) {
      return new Response(
        JSON.stringify({ error: 'invalid_date_preset', message: 'Must be today, last_7d, or last_30d' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's Meta integration using admin client (bypasses RLS for access_token)
    console.log('[Read] Querying integrations table with admin client for user:', userId);
    const { data: integration, error: integrationError } = await supabaseAdmin
      .from('integrations')
      .select('ad_account_id, access_token')
      .eq('provider', 'meta_ads')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    console.log('[Read] Integration query result:', { 
      found: !!integration, 
      error: integrationError?.message || null,
      userId,
      provider: 'meta_ads',
      status: 'active',
      hasAdAccount: !!integration?.ad_account_id,
      hasToken: !!integration?.access_token,
      integrationData: integration ? {
        id: integration.id,
        provider: integration.provider,
        ad_account_id: integration.ad_account_id
      } : null
    });

    // 🔍 CORREÇÃO 3: Log detalhado da integração
    console.log('[Read] Integration raw data:', {
      integration,
      hasAdAccount: !!integration?.ad_account_id,
      hasToken: !!integration?.access_token,
      tokenPreview: integration?.access_token ? integration.access_token.substring(0, 20) + '...' : null
    });

    if (integrationError || !integration) {
      console.log('[Read] No Meta integration found');
      return new Response(
        JSON.stringify({
          stale: true,
          datePreset,
          data: null,
          message: 'No Meta integration configured',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { ad_account_id } = integration;

    // Read from cache using admin client (bypasses RLS)
    console.log('[Read] Querying cache with admin client:', {
      userId,
      adAccountId: ad_account_id,
      datePreset
    });
    const { data: cachedData, error: cacheError } = await supabaseAdmin
      .from('account_insights_cache')
      .select('*')
      .eq('user_id', userId)
      .eq('ad_account_id', ad_account_id)
      .eq('date_preset', datePreset)
      .maybeSingle();

    if (cacheError) {
      console.error('[Read] Cache error:', cacheError);
      throw cacheError;
    }

    // No data in cache - still return active campaigns count from DB
    if (!cachedData) {
      console.log('[Read] No cached data found');

      // Even with stale data, count active campaigns directly from DB
      const { count: staleActiveCount } = await supabaseAdmin
        .from('campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .ilike('status', 'active');

      return new Response(
        JSON.stringify({
          stale: true,
          datePreset,
          impressions: 0,
          reach: 0,
          clicks: 0,
          spend: 0,
          conversations: 0,
          cpa: 0,
          activeCampaigns: staleActiveCount || 0,
          updatedAt: null,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract conversions from actions
    const actions = cachedData.actions || [];
    const conversationAction = actions.find(
      (a: any) => a.action_type === 'onsite_conversion.messaging_first_reply'
    );
    const conversations = Number(conversationAction?.value || 0);

    // Calculate CPA
    const spend = Number(cachedData.spend || 0);
    const cpa = conversations > 0 ? spend / conversations : 0;

    // Get active campaigns count (case-insensitive: 'active', 'ACTIVE', 'Active')
    // Use admin client to bypass RLS (same pattern as integration/cache queries above)
    const { count: activeCampaignsCount } = await supabaseAdmin
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .ilike('status', 'active');

    return new Response(
      JSON.stringify({
        stale: false,
        datePreset,
        impressions: Number(cachedData.impressions || 0),
        reach: Number(cachedData.reach || 0),
        clicks: Number(cachedData.clicks || 0),
        spend,
        conversations,
        cpa,
        activeCampaigns: activeCampaignsCount || 0,
        updatedAt: cachedData.updated_at,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('[Read] Error:', error);
    return new Response(
      JSON.stringify({ error: 'internal_error', message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
