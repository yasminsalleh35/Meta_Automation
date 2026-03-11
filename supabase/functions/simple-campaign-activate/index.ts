import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { toMessage, toObject } from '../_shared/errors.ts';

// Version: 6.0.0 - Replaced SDK with direct fetch() for Deno compatibility (2025-10-14)

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

    console.log('🔍 [ACTIVATE] ID format detection:', { rawId, isUUID, isMetaNumericId });

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
        console.error('❌ [ACTIVATE] Campaign not found by UUID:', error);
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
        console.error('❌ [ACTIVATE] Campaign not found by Meta ID:', error);
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

    console.log('✅ [ACTIVATE] Campaign found:', { dbId: campaign.id, metaId: campaign.meta_campaign_id });

    // Validate required Meta campaign ID
    if (!campaign.meta_campaign_id) {
      return new Response(
        JSON.stringify({ error: 'Campanha não possui ID do Meta Ads (meta_campaign_id)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine activation mode based on available IDs
    const hasCascadeIds = !!(campaign.meta_adset_id && campaign.meta_ad_id);
    const activateMode = hasCascadeIds ? 'cascade' : 'campaign-only';

    console.log('🔍 [ACTIVATE] Activation mode determined:', {
      mode: activateMode,
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

    // Activate based on mode
    if (hasCascadeIds) {
      // CASCADE MODE: Activate campaign, adset, and ad in cascade (Meta recommended order)
      console.log('🔄 [CASCADE] Step 1/3: Activating Campaign...');
      const activateCampaignResponse = await fetch(`${baseUrl}/${campaign.meta_campaign_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ACTIVE',
          access_token: accessToken
        })
      });

      if (!activateCampaignResponse.ok) {
        const campaignError = await activateCampaignResponse.json();
        throw new Error(`Erro ao ativar Campaign: ${campaignError.error?.message || 'Unknown error'}`);
      }
      console.log('✅ Campaign activated:', campaign.meta_campaign_id);

      try {
        // Step 2: Activate AdSet
        console.log('🔄 [CASCADE] Step 2/3: Activating AdSet...');
        const activateAdSetResponse = await fetch(`${baseUrl}/${campaign.meta_adset_id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'ACTIVE',
            access_token: accessToken
          })
        });

        if (!activateAdSetResponse.ok) {
          const adSetError = await activateAdSetResponse.json();
          throw new Error(`Erro ao ativar AdSet: ${adSetError.error?.message || 'Unknown error'}`);
        }
        console.log('✅ AdSet activated:', campaign.meta_adset_id);

        try {
          // Step 3: Activate Ad
          console.log('🔄 [CASCADE] Step 3/3: Activating Ad...');
          const activateAdResponse = await fetch(`${baseUrl}/${campaign.meta_ad_id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'ACTIVE',
              access_token: accessToken
            })
          });

          if (!activateAdResponse.ok) {
            const adError = await activateAdResponse.json();
            throw new Error(`Erro ao ativar Ad: ${adError.error?.message || 'Unknown error'}`);
          }
          console.log('✅ Ad activated:', campaign.meta_ad_id);

        } catch (adError) {
          console.error('❌ Ad activation failed, rolling back AdSet and Campaign...', adError);
          // Rollback AdSet
          await fetch(`${baseUrl}/${campaign.meta_adset_id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'PAUSED', access_token: accessToken })
          });
          // Rollback Campaign
          await fetch(`${baseUrl}/${campaign.meta_campaign_id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'PAUSED', access_token: accessToken })
          });
          throw new Error(`Falha ao ativar anúncio: ${(adError as any)?.message || 'Erro desconhecido'}`);
        }

      } catch (adsetError) {
        console.error('❌ AdSet activation failed, rolling back Campaign...', adsetError);
        // Rollback Campaign
        await fetch(`${baseUrl}/${campaign.meta_campaign_id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'PAUSED', access_token: accessToken })
        });
        throw new Error(`Falha ao ativar conjunto de anúncios: ${(adsetError as any)?.message || 'Erro desconhecido'}`);
      }
    } else {
      // CAMPAIGN-ONLY MODE: Only activate campaign
      console.log('⚠️ [CAMPAIGN-ONLY] Activating only Campaign (AdSet and Ad IDs not available)...');
      const activateCampaignResponse = await fetch(`${baseUrl}/${campaign.meta_campaign_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ACTIVE',
          access_token: accessToken
        })
      });

      if (!activateCampaignResponse.ok) {
        const campaignError = await activateCampaignResponse.json();
        throw new Error(`Erro ao ativar Campaign: ${campaignError.error?.message || 'Unknown error'}`);
      }
      console.log('✅ Campaign activated (campaign-only mode):', campaign.meta_campaign_id);
    }

    // Verify effective_status after activation
    console.log('🔍 Verifying effective_status from Meta...');
    const verificationResponse = await fetch(
      `https://graph.facebook.com/v23.0/${campaign.meta_campaign_id}?fields=id,status,effective_status&access_token=${accessToken}`,
      { method: 'GET' }
    );

    let verificationData: any = null;
    if (verificationResponse.ok) {
      verificationData = await verificationResponse.json();
      console.log('📊 Meta verification result:', verificationData);

      // Estados que indicam sucesso (campanha foi ativada, pode estar em análise)
      const successStates = ['ACTIVE', 'IN_PROCESS', 'PENDING_REVIEW'];
      
      // Estados problemáticos (campanha não foi realmente ativada)
      const errorStates = ['PAUSED', 'DISAPPROVED', 'ARCHIVED', 'DELETED'];

      if (errorStates.includes(verificationData.effective_status)) {
        console.error('❌ Activation failed: problematic effective_status:', verificationData.effective_status);
        return new Response(
          JSON.stringify({
            success: false,
            error: `Não foi possível ativar: ${verificationData.effective_status}. Verifique políticas e configurações.`
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!successStates.includes(verificationData.effective_status)) {
        // Estado desconhecido - log warning mas permite prosseguir
        console.warn('⚠️ Unknown effective_status:', verificationData.effective_status);
      } else if (verificationData.effective_status === 'IN_PROCESS' || verificationData.effective_status === 'PENDING_REVIEW') {
        console.log('ℹ️ Campaign is under review - this is expected');
      }
    }

    // Update campaign status in database + mark for immediate sync + enqueue
    const statusToSet = (verificationData?.effective_status === 'IN_PROCESS' || verificationData?.effective_status === 'PENDING_REVIEW') ? 'pending_review' : 'active';

    const { error: updateError } = await supabaseClient
      .from('campaigns')
      .update({ 
        status: statusToSet,
        status_at_sync: verificationData?.effective_status || 'ACTIVE',
        needs_immediate_sync: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaign.id);

    if (updateError) {
      console.error('Update error:', updateError);
    } else {
      // Enqueue for metrics sync
      await supabaseClient
        .from('campaign_sync_queue')
        .insert({
          user_id: user.id,
          meta_campaign_id: campaign.meta_campaign_id,
          kind: 'metrics'
        });
      console.log(`📥 Enqueued metrics sync for ${campaign.meta_campaign_id}`);
    }

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar status da campanha' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const successMessage = hasCascadeIds 
      ? 'Campanha, Conjunto de Anúncios e Anúncio ativados com sucesso!'
      : 'Campanha ativada com sucesso (apenas nível campanha)!';

    console.log('✅ [ACTIVATE] Activation successful:', {
      mode: activateMode,
      dbId: campaign.id,
      metaId: campaign.meta_campaign_id
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: successMessage,
        mode: activateMode,
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
    console.error('❌ [ACTIVATE] Meta API error:', {
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

    let errorMessage = 'Falha ao ativar campanha. Tente novamente ou contate o suporte.';
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
