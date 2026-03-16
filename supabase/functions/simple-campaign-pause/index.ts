import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeadersFor, handlePreflight } from '../_shared/cors.ts';

// Version: 5.0.0 - Shared CORS + cascade verification + status tracking (2026-03-15)

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const cors = corsHeadersFor(origin);

  if (req.method === 'OPTIONS') {
    return handlePreflight(req);
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autorização não fornecido' }),
        { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const input = await req.json().catch(() => ({}));
    const rawId = String(input.campaignId || '').trim();

    if (!rawId) {
      return new Response(
        JSON.stringify({ error: 'campaignId é obrigatório' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rawId);
    const isMetaNumericId = /^[0-9]{8,}$/.test(rawId);

    console.log('🔍 [PAUSE] ID format detection:', { rawId, isUUID, isMetaNumericId });

    let campaign;
    if (isUUID) {
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
          { status: 404, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
      }
    } else if (isMetaNumericId) {
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
          { status: 404, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Formato de campaignId não reconhecido (esperado: UUID do DB ou ID numérico da Meta)' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [PAUSE] Campaign found:', { dbId: campaign.id, metaId: campaign.meta_campaign_id });

    if (!campaign.meta_campaign_id) {
      return new Response(
        JSON.stringify({ error: 'Campanha não possui ID do Meta Ads (meta_campaign_id)' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const hasCascadeIds = !!(campaign.meta_adset_id && campaign.meta_ad_id);
    const pauseMode = hasCascadeIds ? 'cascade' : 'campaign-only';

    console.log('🔍 [PAUSE] Pause mode determined:', {
      mode: pauseMode,
      campaign: campaign.meta_campaign_id,
      adset: campaign.meta_adset_id || 'N/A',
      ad: campaign.meta_ad_id || 'N/A'
    });

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
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const { access_token: accessToken } = integration;

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Access token não encontrado' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const baseUrl = 'https://graph.facebook.com/v23.0';

    // Helper: pause a single Meta object
    async function pauseObject(objectId: string, label: string): Promise<void> {
      const res = await fetch(`${baseUrl}/${objectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAUSED', access_token: accessToken })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(`Erro ao pausar ${label}: ${err.error?.message || 'Unknown error'}`);
      }
      console.log(`✅ ${label} paused:`, objectId);
    }

    // Pause based on mode — reverse order: Ad → AdSet → Campaign
    if (hasCascadeIds) {
      console.log('🔄 [CASCADE] Step 1/3: Pausing Ad...');
      await pauseObject(campaign.meta_ad_id, 'Ad');

      console.log('🔄 [CASCADE] Step 2/3: Pausing AdSet...');
      await pauseObject(campaign.meta_adset_id, 'AdSet');

      console.log('🔄 [CASCADE] Step 3/3: Pausing Campaign...');
      await pauseObject(campaign.meta_campaign_id, 'Campaign');
    } else {
      console.log('⚠️ [CAMPAIGN-ONLY] Pausing only Campaign...');
      await pauseObject(campaign.meta_campaign_id, 'Campaign');
    }

    // Update campaign status in database with cascade status tracking
    const updatePayload: Record<string, any> = {
      status: 'paused',
      status_at_sync: 'PAUSED',
      needs_immediate_sync: false,
      updated_at: new Date().toISOString(),
    };

    if (hasCascadeIds) {
      updatePayload.meta_adset_status = 'PAUSED';
      updatePayload.meta_ad_status = 'PAUSED';
    }

    const { error: updateError } = await supabaseClient
      .from('campaigns')
      .update(updatePayload)
      .eq('id', campaign.id);

    if (updateError) {
      console.error('Update error:', updateError);
      // If cascade status columns don't exist yet, retry without them
      if (updateError.message?.includes('meta_adset_status') || updateError.message?.includes('meta_ad_status')) {
        console.warn('⚠️ Cascade status columns not found, updating without them');
        await supabaseClient
          .from('campaigns')
          .update({
            status: 'paused',
            needs_immediate_sync: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', campaign.id);
      }
    }

    // Remove from sync queue
    await supabaseClient
      .from('campaign_sync_queue')
      .delete()
      .eq('meta_campaign_id', campaign.meta_campaign_id);
    console.log(`🗑️ Removed from sync queue: ${campaign.meta_campaign_id}`);

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
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ [PAUSE] Meta API error:', {
      fbtrace_id: error.fbtrace_id || 'N/A',
      code: error.code || 'N/A',
      subcode: error.error_subcode || 'N/A',
      message: error.message,
      is_transient: error.is_transient || false
    });

    if (error.is_transient === true) {
      return new Response(
        JSON.stringify({
          error: 'Erro temporário na Meta API. Por favor, tente novamente em alguns segundos.',
          is_transient: true
        }),
        { status: 503, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    let errorMessage = 'Falha ao pausar campanha. Tente novamente ou contate o suporte.';
    if (error?.response?.error) {
      errorMessage = `Erro da Meta Ads API: ${error.response.error.message || 'Erro desconhecido'}`;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    return new Response(
      JSON.stringify({ success: false, error: errorMessage, details: error.message }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
});
