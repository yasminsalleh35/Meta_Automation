import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { toMessage, toObject } from '../_shared/errors.ts';
import { corsHeadersFor, handlePreflight } from '../_shared/cors.ts';

// Version: 7.0.0 - Shared CORS + cascade verification + status tracking (2026-03-15)

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

    console.log('🔍 [ACTIVATE] ID format detection:', { rawId, isUUID, isMetaNumericId });

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
        console.error('❌ [ACTIVATE] Campaign not found by UUID:', error);
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
        console.error('❌ [ACTIVATE] Campaign not found by Meta ID:', error);
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

    console.log('✅ [ACTIVATE] Campaign found:', { dbId: campaign.id, metaId: campaign.meta_campaign_id });

    if (!campaign.meta_campaign_id) {
      return new Response(
        JSON.stringify({ error: 'Campanha não possui ID do Meta Ads (meta_campaign_id)' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const hasCascadeIds = !!(campaign.meta_adset_id && campaign.meta_ad_id);
    const activateMode = hasCascadeIds ? 'cascade' : 'campaign-only';

    console.log('🔍 [ACTIVATE] Activation mode determined:', {
      mode: activateMode,
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

    // Helper: activate a single Meta object
    async function activateObject(objectId: string, label: string): Promise<void> {
      const res = await fetch(`${baseUrl}/${objectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE', access_token: accessToken })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(`Erro ao ativar ${label}: ${err.error?.message || 'Unknown error'}`);
      }
      console.log(`✅ ${label} activated:`, objectId);
    }

    // Helper: pause a single Meta object (for rollback)
    async function pauseObject(objectId: string, label: string): Promise<void> {
      try {
        await fetch(`${baseUrl}/${objectId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'PAUSED', access_token: accessToken })
        });
        console.log(`🔄 ${label} rolled back to PAUSED:`, objectId);
      } catch (e) {
        console.error(`⚠️ Rollback failed for ${label}:`, objectId, e);
      }
    }

    // Helper: verify effective_status of a Meta object
    async function verifyStatus(objectId: string, label: string): Promise<string | null> {
      try {
        const res = await fetch(
          `${baseUrl}/${objectId}?fields=id,status,effective_status&access_token=${accessToken}`,
          { method: 'GET' }
        );
        if (res.ok) {
          const data = await res.json();
          console.log(`📊 ${label} verification:`, data);
          return data.effective_status || null;
        }
      } catch (e) {
        console.warn(`⚠️ Could not verify ${label} status:`, e);
      }
      return null;
    }

    // Activate based on mode
    if (hasCascadeIds) {
      // CASCADE MODE: Campaign → AdSet → Ad
      console.log('🔄 [CASCADE] Step 1/3: Activating Campaign...');
      await activateObject(campaign.meta_campaign_id, 'Campaign');

      try {
        console.log('🔄 [CASCADE] Step 2/3: Activating AdSet...');
        await activateObject(campaign.meta_adset_id, 'AdSet');

        try {
          console.log('🔄 [CASCADE] Step 3/3: Activating Ad...');
          await activateObject(campaign.meta_ad_id, 'Ad');
        } catch (adError) {
          console.error('❌ Ad activation failed, rolling back...', adError);
          await pauseObject(campaign.meta_adset_id, 'AdSet');
          await pauseObject(campaign.meta_campaign_id, 'Campaign');
          throw new Error(`Falha ao ativar anúncio: ${(adError as any)?.message || 'Erro desconhecido'}`);
        }

      } catch (adsetError) {
        if ((adsetError as any)?.message?.includes('anúncio')) throw adsetError; // re-throw ad error
        console.error('❌ AdSet activation failed, rolling back Campaign...', adsetError);
        await pauseObject(campaign.meta_campaign_id, 'Campaign');
        throw new Error(`Falha ao ativar conjunto de anúncios: ${(adsetError as any)?.message || 'Erro desconhecido'}`);
      }
    } else {
      console.log('⚠️ [CAMPAIGN-ONLY] Activating only Campaign...');
      await activateObject(campaign.meta_campaign_id, 'Campaign');
    }

    // Verify effective_status for all cascade levels
    console.log('🔍 Verifying effective_status from Meta...');
    const campaignEffective = await verifyStatus(campaign.meta_campaign_id, 'Campaign');
    const adsetEffective = hasCascadeIds ? await verifyStatus(campaign.meta_adset_id, 'AdSet') : null;
    const adEffective = hasCascadeIds ? await verifyStatus(campaign.meta_ad_id, 'Ad') : null;

    const successStates = ['ACTIVE', 'IN_PROCESS', 'PENDING_REVIEW'];
    const errorStates = ['PAUSED', 'DISAPPROVED', 'ARCHIVED', 'DELETED'];

    if (campaignEffective && errorStates.includes(campaignEffective)) {
      console.error('❌ Activation failed: problematic effective_status:', campaignEffective);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Não foi possível ativar: ${campaignEffective}. Verifique políticas e configurações.`
        }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    if (campaignEffective && !successStates.includes(campaignEffective)) {
      console.warn('⚠️ Unknown effective_status:', campaignEffective);
    } else if (campaignEffective === 'IN_PROCESS' || campaignEffective === 'PENDING_REVIEW') {
      console.log('ℹ️ Campaign is under review - this is expected');
    }

    // Update campaign status in database with cascade status tracking
    const statusToSet = (campaignEffective === 'IN_PROCESS' || campaignEffective === 'PENDING_REVIEW')
      ? 'pending_review' : 'active';

    const updatePayload: Record<string, any> = {
      status: statusToSet,
      status_at_sync: campaignEffective || 'ACTIVE',
      needs_immediate_sync: true,
      updated_at: new Date().toISOString(),
    };

    // Track cascade statuses if available
    if (hasCascadeIds) {
      updatePayload.meta_adset_status = adsetEffective || 'ACTIVE';
      updatePayload.meta_ad_status = adEffective || 'ACTIVE';
    }

    const { error: updateError } = await supabaseClient
      .from('campaigns')
      .update(updatePayload)
      .eq('id', campaign.id);

    if (updateError) {
      console.error('Update error:', updateError);
      // If the cascade status columns don't exist yet, retry without them
      if (updateError.message?.includes('meta_adset_status') || updateError.message?.includes('meta_ad_status')) {
        console.warn('⚠️ Cascade status columns not found, updating without them');
        const { error: retryError } = await supabaseClient
          .from('campaigns')
          .update({
            status: statusToSet,
            status_at_sync: campaignEffective || 'ACTIVE',
            needs_immediate_sync: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', campaign.id);

        if (retryError) {
          console.error('Retry update error:', retryError);
          return new Response(
            JSON.stringify({ error: 'Erro ao atualizar status da campanha' }),
            { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        return new Response(
          JSON.stringify({ error: 'Erro ao atualizar status da campanha' }),
          { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Enqueue for metrics sync
    await supabaseClient
      .from('campaign_sync_queue')
      .insert({
        user_id: user.id,
        meta_campaign_id: campaign.meta_campaign_id,
        kind: 'metrics'
      });
    console.log(`📥 Enqueued metrics sync for ${campaign.meta_campaign_id}`);

    const successMessage = hasCascadeIds
      ? 'Campanha, Conjunto de Anúncios e Anúncio ativados com sucesso!'
      : 'Campanha ativada com sucesso (apenas nível campanha)!';

    console.log('✅ [ACTIVATE] Activation successful:', {
      mode: activateMode,
      dbId: campaign.id,
      metaId: campaign.meta_campaign_id,
      campaignStatus: campaignEffective,
      adsetStatus: adsetEffective,
      adStatus: adEffective,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: successMessage,
        mode: activateMode,
        details: {
          campaign: campaign.meta_campaign_id,
          campaignStatus: campaignEffective,
          adset: campaign.meta_adset_id || 'N/A',
          adsetStatus: adsetEffective || 'N/A',
          ad: campaign.meta_ad_id || 'N/A',
          adStatus: adEffective || 'N/A',
        }
      }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ [ACTIVATE] Meta API error:', {
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
        { status: 503, headers: { ...corsHeadersFor(req.headers.get('Origin')), 'Content-Type': 'application/json' } }
      );
    }

    let errorMessage = 'Falha ao ativar campanha. Tente novamente ou contate o suporte.';
    if (error?.response?.error) {
      errorMessage = `Erro da Meta Ads API: ${error.response.error.message || 'Erro desconhecido'}`;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    return new Response(
      JSON.stringify({ success: false, error: errorMessage, details: error.message }),
      { status: 500, headers: { ...corsHeadersFor(req.headers.get('Origin')), 'Content-Type': 'application/json' } }
    );
  }
});
