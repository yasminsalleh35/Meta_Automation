import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { requireAdmin, authErrorResponse } from '../_shared/auth.ts';
import { requireMetaAccessToken } from '../_shared/metaIntegration.ts';
import { GRAPH_BASE } from '../_shared/meta.ts'; // audit PLT-03

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Laboratório de testes Meta: somente admin (audit SEC-06/SEC-10)
  let adminUserId = '';
  try {
    adminUserId = (await requireAdmin(req)).user.id;
  } catch (e) {
    const resp = authErrorResponse(e, corsHeaders);
    if (resp) return resp;
    throw e;
  }

  try {
    const { adAccountId, campaignConfig } = await req.json();
    // Token lido no servidor da integração do admin; o navegador não o envia (audit SEC-12)
    const accessToken = await requireMetaAccessToken(adminUserId);

    console.log('[TEST-META-CAMPAIGN-CREATE] Request received:', {
      adAccountId,
      campaignConfig,
      hasAccessToken: !!accessToken,
    });

    // Normalizar ad account ID
    const actId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;

    // Meta API v23.0 (subcode 4834011): se a campanha não usa orçamento de campanha (CBO), é
    // obrigatório declarar is_adset_budget_sharing_enabled. Injetamos o default apenas quando
    // ausente e sem orçamento de campanha — não sobrescreve valor explícito nem quebra CBO.
    const safeCampaignConfig = { ...campaignConfig };
    const hasCampaignBudget = safeCampaignConfig?.daily_budget != null || safeCampaignConfig?.lifetime_budget != null;
    if (!hasCampaignBudget && safeCampaignConfig?.is_adset_budget_sharing_enabled === undefined) {
      safeCampaignConfig.is_adset_budget_sharing_enabled = false;
    }

    // Construir URL da API (v23.0 para CTWA)
    const campaignUrl = `${GRAPH_BASE}/${actId}/campaigns?access_token=${accessToken}`;

    console.log('[TEST-META-CAMPAIGN-CREATE] Calling Meta API:', {
      url: campaignUrl.replace(accessToken, 'TOKEN_MASKED'),
      body: safeCampaignConfig,
    });

    // Fazer requisição para Meta API
    const campaignResponse = await fetch(campaignUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(safeCampaignConfig),
    });

    const rawResponse = await campaignResponse.json();

    console.log('[TEST-META-CAMPAIGN-CREATE] Meta API Response:', {
      status: campaignResponse.status,
      ok: campaignResponse.ok,
      response: rawResponse,
      fbTraceId: campaignResponse.headers.get('x-fb-trace-id'),
    });

    if (!campaignResponse.ok) {
      console.error('[TEST-META-CAMPAIGN-CREATE] Campaign creation failed:', {
        errorCode: rawResponse.error?.code,
        errorMessage: rawResponse.error?.message,
        errorType: rawResponse.error?.type,
        fbTraceId: campaignResponse.headers.get('x-fb-trace-id'),
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: rawResponse.error?.message || 'Erro ao criar campanha',
          rawResponse,
        }),
        {
          status: 200, // Retornar 200 para o frontend processar o erro
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[TEST-META-CAMPAIGN-CREATE] Campaign created successfully:', rawResponse.id);

    return new Response(
      JSON.stringify({
        success: true,
        campaignId: rawResponse.id,
        rawResponse,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[TEST-META-CAMPAIGN-CREATE] Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
