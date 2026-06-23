import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { adAccountId, campaignConfig, accessToken } = await req.json();

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
    const campaignUrl = `https://graph.facebook.com/v23.0/${actId}/campaigns?access_token=${accessToken}`;

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
