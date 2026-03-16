import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeadersFor, handlePreflight } from '../_shared/cors.ts';

// Version: 1.0.0 - Apply optimization suggestions via Meta API with audit logging

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

    // Auth
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
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const input = await req.json().catch(() => ({}));
    const { suggestionId } = input;

    if (!suggestionId) {
      return new Response(
        JSON.stringify({ error: 'suggestionId é obrigatório' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch suggestion
    const { data: suggestion, error: sugError } = await supabaseClient
      .from('optimization_suggestions')
      .select('*')
      .eq('id', suggestionId)
      .eq('user_id', user.id)
      .single();

    if (sugError || !suggestion) {
      return new Response(
        JSON.stringify({ error: 'Sugestão não encontrada' }),
        { status: 404, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    if (suggestion.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: `Sugestão já foi ${suggestion.status === 'applied' ? 'aplicada' : suggestion.status}` }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch campaign
    const { data: campaign, error: campError } = await supabaseClient
      .from('campaigns')
      .select('*')
      .eq('id', suggestion.campaign_id)
      .eq('user_id', user.id)
      .single();

    if (campError || !campaign) {
      return new Response(
        JSON.stringify({ error: 'Campanha não encontrada' }),
        { status: 404, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // Get Meta access token
    const { data: integration } = await supabaseClient
      .from('integrations')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('provider', 'meta_ads')
      .eq('status', 'active')
      .single();

    if (!integration?.access_token) {
      return new Response(
        JSON.stringify({ error: 'Integração Meta Ads não encontrada' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = integration.access_token;
    const baseUrl = 'https://graph.facebook.com/v23.0';
    const action = suggestion.suggested_action;
    const actionType = action?.action || suggestion.type;

    console.log('🔧 [APPLY-OPT] Applying optimization:', {
      suggestionId,
      type: suggestion.type,
      action: actionType,
      campaign: campaign.meta_campaign_id,
    });

    // Capture before state
    let beforeState: Record<string, any> = {};
    let afterState: Record<string, any> = {};
    let success = true;
    let errorMessage: string | null = null;

    try {
      switch (actionType) {
        case 'update_budget':
        case 'increase_budget':
        case 'decrease_budget': {
          const objectId = action?.meta_object_id || campaign.meta_campaign_id;
          const budgetField = action?.field || 'daily_budget';
          const newValue = action?.suggested_value;

          if (!newValue || newValue <= 0) {
            throw new Error('Valor de orçamento inválido. Verifique a sugestão e tente novamente.');
          }

          // Fetch current budget from Meta
          const currentRes = await fetch(
            `${baseUrl}/${objectId}?fields=daily_budget,lifetime_budget,status&access_token=${accessToken}`
          );
          if (currentRes.ok) {
            beforeState = await currentRes.json();
          }

          // Apply budget update (Meta uses cents)
          const budgetInCents = Math.round(newValue * 100);
          const updateRes = await fetch(`${baseUrl}/${objectId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              [budgetField]: budgetInCents,
              access_token: accessToken,
            }),
          });

          if (!updateRes.ok) {
            const err = await updateRes.json();
            throw new Error(`Meta API: ${err.error?.message || 'Erro ao atualizar orçamento'}`);
          }

          // Verify
          const verifyRes = await fetch(
            `${baseUrl}/${objectId}?fields=daily_budget,lifetime_budget,status&access_token=${accessToken}`
          );
          if (verifyRes.ok) {
            afterState = await verifyRes.json();
          }

          // Update local DB
          await supabaseClient
            .from('campaigns')
            .update({
              [budgetField === 'daily_budget' ? 'budget_daily' : 'budget_total']: newValue,
              updated_at: new Date().toISOString(),
            })
            .eq('id', campaign.id);

          console.log(`✅ [APPLY-OPT] Budget updated: ${beforeState.daily_budget} → ${afterState.daily_budget}`);
          break;
        }

        case 'pause_campaign':
        case 'pause': {
          const objectId = campaign.meta_campaign_id;

          // Capture before
          const beforeRes = await fetch(
            `${baseUrl}/${objectId}?fields=status,effective_status&access_token=${accessToken}`
          );
          if (beforeRes.ok) beforeState = await beforeRes.json();

          // Pause
          const pauseRes = await fetch(`${baseUrl}/${objectId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'PAUSED', access_token: accessToken }),
          });

          if (!pauseRes.ok) {
            const err = await pauseRes.json();
            throw new Error(`Meta API: ${err.error?.message || 'Erro ao pausar'}`);
          }

          // Verify
          const afterRes = await fetch(
            `${baseUrl}/${objectId}?fields=status,effective_status&access_token=${accessToken}`
          );
          if (afterRes.ok) afterState = await afterRes.json();

          await supabaseClient
            .from('campaigns')
            .update({ status: 'paused', updated_at: new Date().toISOString() })
            .eq('id', campaign.id);

          console.log('✅ [APPLY-OPT] Campaign paused');
          break;
        }

        case 'activate_campaign':
        case 'activate': {
          const objectId = campaign.meta_campaign_id;

          const beforeRes = await fetch(
            `${baseUrl}/${objectId}?fields=status,effective_status&access_token=${accessToken}`
          );
          if (beforeRes.ok) beforeState = await beforeRes.json();

          const activateRes = await fetch(`${baseUrl}/${objectId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'ACTIVE', access_token: accessToken }),
          });

          if (!activateRes.ok) {
            const err = await activateRes.json();
            throw new Error(`Meta API: ${err.error?.message || 'Erro ao ativar'}`);
          }

          const afterRes = await fetch(
            `${baseUrl}/${objectId}?fields=status,effective_status&access_token=${accessToken}`
          );
          if (afterRes.ok) afterState = await afterRes.json();

          await supabaseClient
            .from('campaigns')
            .update({ status: 'active', updated_at: new Date().toISOString() })
            .eq('id', campaign.id);

          console.log('✅ [APPLY-OPT] Campaign activated');
          break;
        }

        case 'duplicate_campaign': {
          // Create a copy of the campaign via Meta API
          const copyRes = await fetch(`${baseUrl}/${campaign.meta_campaign_id}/copies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              access_token: accessToken,
              deep_copy: true,
              status_option: 'PAUSED',
            }),
          });

          if (!copyRes.ok) {
            const err = await copyRes.json();
            throw new Error(`Meta API: ${err.error?.message || 'Erro ao duplicar campanha'}`);
          }

          const copyData = await copyRes.json();
          afterState = copyData;
          beforeState = { original_campaign_id: campaign.meta_campaign_id };

          console.log('✅ [APPLY-OPT] Campaign duplicated:', copyData);
          break;
        }

        case 'adjust_targeting':
        case 'review_creative':
        case 'update_creative':
        default: {
          // These require manual action — just mark suggestion as applied (acknowledged)
          beforeState = { note: 'Ação requer revisão manual' };
          afterState = { note: 'Sugestão aceita pelo usuário' };
          console.log('ℹ️ [APPLY-OPT] Manual action acknowledged:', actionType);
          break;
        }
      }
    } catch (applyError: any) {
      success = false;
      errorMessage = applyError.message;
      console.error('❌ [APPLY-OPT] Apply failed:', applyError.message);
    }

    // Update suggestion status
    await supabaseClient
      .from('optimization_suggestions')
      .update({
        status: success ? 'applied' : 'pending',
        applied_at: success ? new Date().toISOString() : null,
      })
      .eq('id', suggestionId);

    // Create audit log
    const { error: logError } = await supabaseClient
      .from('optimization_logs')
      .insert({
        user_id: user.id,
        suggestion_id: suggestionId,
        campaign_id: campaign.id,
        meta_campaign_id: campaign.meta_campaign_id,
        action_type: actionType,
        action_payload: action || {},
        before_state: beforeState,
        after_state: afterState,
        success,
        error_message: errorMessage,
      });

    if (logError) {
      console.error('⚠️ [APPLY-OPT] Failed to create audit log:', logError.message);
    }

    if (!success) {
      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Otimização aplicada com sucesso',
        action: actionType,
        before: beforeState,
        after: afterState,
      }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ [APPLY-OPT] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Erro interno' }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
});
