import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Version: 4.0.0 - Replaced SDK with direct fetch() for Deno compatibility (2025-10-14)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from request headers
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autorização não fornecido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user authentication
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const input = await req.json().catch(() => ({}));
    const rawId = String(input.campaignId || '').trim();

    if (!rawId) {
      return new Response(
        JSON.stringify({ error: 'campaignId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Detecta formato do ID (UUID do DB ou ID numérico da Meta)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rawId);
    const isMetaNumericId = /^[0-9]{8,}$/.test(rawId);

    console.log('🔍 [PAUSE] ID format detection:', { rawId, isUUID, isMetaNumericId });

    let campaign;
    if (isUUID) {
      // Busca por UUID do DB
      const { data, error } = await supabaseClient
        .from('campaigns')
        .select('*')
        .eq('id', rawId)
        .eq('user_id', user.id)
        .single();
      
      campaign = data;
      if (error || !campaign) {
        console.error('❌ [PAUSE] Campaign not found by UUID:', error);
        return new Response(
          JSON.stringify({ error: 'Campanha não encontrada' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (isMetaNumericId) {
      // Busca por ID da Meta (fallback para compatibilidade)
      const { data, error } = await supabaseClient
        .from('campaigns')
        .select('*')
        .eq('meta_campaign_id', rawId)
        .eq('user_id', user.id)
        .single();
      
      campaign = data;
      if (error || !campaign) {
        console.error('❌ [PAUSE] Campaign not found by Meta ID:', error);
        return new Response(
          JSON.stringify({ error: 'Campanha não encontrada pelo ID da Meta' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Formato de campaignId não reconhecido (esperado: UUID do DB ou ID numérico da Meta)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [PAUSE] Campaign found:', { dbId: campaign.id, metaId: campaign.meta_campaign_id });

    // Validate required Meta campaign ID
    if (!campaign.meta_campaign_id) {
      return new Response(
        JSON.stringify({ error: 'Campanha não possui ID do Meta Ads (meta_campaign_id)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine pause mode based on available IDs
    const hasCascadeIds = !!(campaign.meta_adset_id && campaign.meta_ad_id);
    const pauseMode = hasCascadeIds ? 'cascade' : 'campaign-only';

    console.log('🔍 [PAUSE] Pause mode determined:', {
      mode: pauseMode,
      campaign: campaign.meta_campaign_id,
      adset: campaign.meta_adset_id || 'N/A',
      ad: campaign.meta_ad_id || 'N/A'
    });

    // Get user's Meta Ads integration
    const { data: integration, error: integrationError } = await supabaseClient
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'meta_ads')
      .eq('status', 'active')
      .single();

    if (integrationError || !integration) {
      console.error('Integration error:', integrationError);
      return new Response(
        JSON.stringify({ error: 'Integração com Meta Ads não encontrada' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { access_token: accessToken } = integration;

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Access token não encontrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const baseUrl = 'https://graph.facebook.com/v23.0';

    // Perform pause based on available IDs
    if (hasCascadeIds) {
      // FULL CASCADE MODE: Pause ad, adset, and campaign
      console.log('🔄 [CASCADE] Step 1/3: Pausing Ad...');
      const pauseAdResponse = await fetch(`${baseUrl}/${campaign.meta_ad_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PAUSED',
          access_token: accessToken
        })
      });

      if (!pauseAdResponse.ok) {
        const adError = await pauseAdResponse.json();
        throw new Error(`Erro ao pausar Ad: ${adError.error?.message || 'Unknown error'}`);
      }
      console.log('✅ Ad paused:', campaign.meta_ad_id);

      console.log('🔄 [CASCADE] Step 2/3: Pausing AdSet...');
      const pauseAdSetResponse = await fetch(`${baseUrl}/${campaign.meta_adset_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PAUSED',
          access_token: accessToken
        })
      });

      if (!pauseAdSetResponse.ok) {
        const adSetError = await pauseAdSetResponse.json();
        throw new Error(`Erro ao pausar AdSet: ${adSetError.error?.message || 'Unknown error'}`);
      }
      console.log('✅ AdSet paused:', campaign.meta_adset_id);

      console.log('🔄 [CASCADE] Step 3/3: Pausing Campaign...');
      const pauseCampaignResponse = await fetch(`${baseUrl}/${campaign.meta_campaign_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PAUSED',
          access_token: accessToken
        })
      });

      if (!pauseCampaignResponse.ok) {
        const campaignError = await pauseCampaignResponse.json();
        throw new Error(`Erro ao pausar Campaign: ${campaignError.error?.message || 'Unknown error'}`);
      }
      console.log('✅ Campaign paused:', campaign.meta_campaign_id);
    } else {
      // CAMPAIGN-ONLY MODE: Only pause campaign
      console.log('⚠️ [CAMPAIGN-ONLY] AdSet/Ad IDs missing, pausing campaign only');
      const pauseCampaignResponse = await fetch(`${baseUrl}/${campaign.meta_campaign_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PAUSED',
          access_token: accessToken
        })
      });

      if (!pauseCampaignResponse.ok) {
        const campaignError = await pauseCampaignResponse.json();
        throw new Error(`Erro ao pausar Campaign: ${campaignError.error?.message || 'Unknown error'}`);
      }
      console.log('✅ Campaign paused (campaign-only mode):', campaign.meta_campaign_id);
    }

    // Update campaign status in database + clear sync flag + dequeue
    const { error: updateError } = await supabaseClient
      .from('campaigns')
      .update({ 
        status: 'paused',
        needs_immediate_sync: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaign.id);

    if (updateError) {
      console.error('Update error:', updateError);
    } else {
      // Remove from sync queue
      await supabaseClient
        .from('campaign_sync_queue')
        .delete()
        .eq('meta_campaign_id', campaign.meta_campaign_id);
      console.log(`🗑️ Removed from sync queue: ${campaign.meta_campaign_id}`);
    }

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar status da campanha' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const successMessage = hasCascadeIds 
      ? 'Campanha, Conjunto de Anúncios e Anúncio pausados com sucesso!'
      : 'Campanha pausada com sucesso (apenas nível campanha)!';

    console.log(`✅ [PAUSE] Campaign paused successfully (${pauseMode}):`, {
      dbId: campaign.id,
      metaId: campaign.meta_campaign_id,
      mode: pauseMode
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: successMessage,
        mode: pauseMode,
        details: {
          campaign: campaign.meta_campaign_id,
          adset: campaign.meta_adset_id || 'N/A',
          ad: campaign.meta_ad_id || 'N/A'
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('❌ [PAUSE] Meta API error:', {
      fbtrace_id: error.fbtrace_id || 'N/A',
      code: error.code || 'N/A',
      subcode: error.error_subcode || 'N/A',
      message: error.message,
      is_transient: error.is_transient || false
    });

    // Erro transitório → 503 (retry)
    if (error.is_transient === true) {
      return new Response(
        JSON.stringify({ 
          error: 'Erro temporário na Meta API. Por favor, tente novamente em alguns segundos.',
          is_transient: true
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let errorMessage = 'Falha ao pausar campanha. Tente novamente ou contate o suporte.';
    if (error?.response?.error) {
      const fbError = error.response.error;
      errorMessage = `Erro da Meta Ads API: ${fbError.message || 'Erro desconhecido'}`;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        details: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
