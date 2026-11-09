import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handlePreflight } from '../_shared/cors.ts';
import {
  ACTIVATION_ERROR_STATES,
  activateCascade,
  fetchEffectiveStatus,
  pauseCascade,
  type CascadeIds,
} from '../_shared/metaCascade.ts';
import { json } from '../_shared/response.ts';
import { createLogger } from '../_shared/logger.ts';
import { toObject } from '../_shared/errors.ts';

// audit PLT-06: logs estruturados (respostas via _shared/response.ts, corpo/status inalterados)
const log = createLogger('simple-campaign-activate');

// Version: 7.0.0 - Shared CORS + cascade verification + status tracking (2026-03-15)

serve(async (req) => {
  const origin = req.headers.get('Origin');

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
      return json(origin, { error: 'Token de autorização não fornecido' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      log.error('handler', 'Auth error', { error: toObject(authError) });
      return json(origin, { error: 'Usuário não autenticado' }, 401);
    }

    const input = await req.json().catch(() => ({}));
    const rawId = String(input.campaignId || '').trim();

    if (!rawId) {
      return json(origin, { error: 'campaignId é obrigatório' }, 400);
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
        log.error('handler', '❌ Campaign not found by UUID', { error: toObject(error) });
        return json(origin, { error: 'Campanha não encontrada' }, 404);
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
        log.error('handler', '❌ Campaign not found by Meta ID', { error: toObject(error) });
        return json(origin, { error: 'Campanha não encontrada pelo ID da Meta' }, 404);
      }
    } else {
      return json(origin, { error: 'Formato de campaignId não reconhecido (esperado: UUID do DB ou ID numérico da Meta)' }, 400);
    }

    console.log('✅ [ACTIVATE] Campaign found:', { dbId: campaign.id, metaId: campaign.meta_campaign_id });

    if (!campaign.meta_campaign_id) {
      return json(origin, { error: 'Campanha não possui ID do Meta Ads (meta_campaign_id)' }, 400);
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
      log.error('handler', 'Integration error', { error: toObject(integrationError) });
      return json(origin, { error: 'Integração com Meta Ads não encontrada' }, 400);
    }

    const { access_token: accessToken } = integration;

    if (!accessToken) {
      return json(origin, { error: 'Access token não encontrado' }, 400);
    }

    const cascadeIds: CascadeIds = {
      campaignId: campaign.meta_campaign_id,
      adsetId: campaign.meta_adset_id,
      adId: campaign.meta_ad_id,
    };

    // Activate based on mode (cascata compartilhada com meta-campaign-bulk-operations)
    await activateCascade(cascadeIds, accessToken);

    // Verify effective_status for all cascade levels
    console.log('🔍 Verifying effective_status from Meta...');
    const campaignEffective = await fetchEffectiveStatus(campaign.meta_campaign_id, 'Campaign', accessToken);
    const adsetEffective = hasCascadeIds ? await fetchEffectiveStatus(campaign.meta_adset_id, 'AdSet', accessToken) : null;
    const adEffective = hasCascadeIds ? await fetchEffectiveStatus(campaign.meta_ad_id, 'Ad', accessToken) : null;

    const successStates = ['ACTIVE', 'IN_PROCESS', 'PENDING_REVIEW'];

    if (campaignEffective && ACTIVATION_ERROR_STATES.includes(campaignEffective)) {
      log.error('handler', '❌ Activation failed: problematic effective_status', { effective_status: campaignEffective });
      // audit CMP-09: desfaz a ativação parcial e deixa o DB coerente com a Meta
      await pauseCascade(cascadeIds, accessToken);
      const { error: rollbackDbError } = await supabaseClient
        .from('campaigns')
        .update({
          status: 'paused',
          status_at_sync: campaignEffective,
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaign.id);
      if (rollbackDbError) {
        log.error('handler', '⚠️ Rollback DB update failed', { error: toObject(rollbackDbError) });
      }
      return json(origin, {
          success: false,
          error: `Não foi possível ativar: ${campaignEffective}. Verifique políticas e configurações.`
        }, 400);
    }

    if (campaignEffective && !successStates.includes(campaignEffective)) {
      log.warn('handler', '⚠️ Unknown effective_status', { effective_status: campaignEffective });
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
      log.error('handler', 'Update error', { error: toObject(updateError) });
      // If the cascade status columns don't exist yet, retry without them
      if (updateError.message?.includes('meta_adset_status') || updateError.message?.includes('meta_ad_status')) {
        log.warn('handler', '⚠️ Cascade status columns not found, updating without them');
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
          log.error('handler', 'Retry update error', { error: toObject(retryError) });
          return json(origin, { error: 'Erro ao atualizar status da campanha' }, 500);
        }
      } else {
        return json(origin, { error: 'Erro ao atualizar status da campanha' }, 500);
      }
    }

    // Enqueue for metrics sync (non-blocking — don't fail activation if queue insert fails)
    try {
      const { error: syncError } = await supabaseClient
        .from('campaign_sync_queue')
        .insert({
          user_id: user.id,
          meta_campaign_id: campaign.meta_campaign_id,
          kind: 'metrics'
        });
      if (syncError) {
        log.warn('handler', '⚠️ Sync queue insert failed (non-blocking)', { error: syncError.message });
      } else {
        console.log(`📥 Enqueued metrics sync for ${campaign.meta_campaign_id}`);
      }
    } catch (syncErr) {
      log.warn('handler', '⚠️ Sync queue error (non-blocking)', { error: toObject(syncErr) });
    }

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

    return json(origin, {
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
      }, 200);

  } catch (error: any) {
    log.error('handler', '❌ Meta API error', {
      fbtrace_id: error.fbtrace_id || 'N/A',
      code: error.code || 'N/A',
      subcode: error.error_subcode || 'N/A',
      message: error.message,
      is_transient: error.is_transient || false
    });

    if (error.is_transient === true) {
      return json(origin, {
          error: 'Erro temporário na Meta API. Por favor, tente novamente em alguns segundos.',
          is_transient: true
        }, 503);
    }

    let errorMessage = 'Falha ao ativar campanha. Tente novamente ou contate o suporte.';
    if (error?.response?.error) {
      errorMessage = `Erro da Meta Ads API: ${error.response.error.message || 'Erro desconhecido'}`;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    return json(origin, { success: false, error: errorMessage, details: error.message }, 500);
  }
});
