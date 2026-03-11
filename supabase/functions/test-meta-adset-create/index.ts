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
    const { adAccountId, adSetConfig, accessToken } = await req.json();

    console.log('[TEST-META-ADSET-CREATE] Request received:', {
      adAccountId,
      adSetConfig,
      hasAccessToken: !!accessToken,
    });

    // Normalizar ad account ID
    const actId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;

    // Construir URL da API (v23.0 para CTWA)
    const adSetUrl = `https://graph.facebook.com/v23.0/${actId}/adsets?access_token=${accessToken}`;

    console.log('[TEST-META-ADSET-CREATE] Calling Meta API:', {
      url: adSetUrl.replace(accessToken, 'TOKEN_MASKED'),
      body: adSetConfig,
    });

    // Criar AbortController para timeout de 25 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    let adSetResponse;
    let rawResponse;

    try {
      // Fazer requisição para Meta API com timeout
      adSetResponse = await fetch(adSetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adSetConfig),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      rawResponse = await adSetResponse.json();
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('[TEST-META-ADSET-CREATE] Request timeout after 25s');
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Timeout: A API do Meta demorou mais de 25 segundos para responder',
          }),
          {
            status: 408,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      throw fetchError;
    }

    console.log('[TEST-META-ADSET-CREATE] Meta API Response:', {
      status: adSetResponse.status,
      ok: adSetResponse.ok,
      response: rawResponse,
      fbTraceId: adSetResponse.headers.get('x-fb-trace-id'),
    });

    if (!adSetResponse.ok) {
      console.error('[TEST-META-ADSET-CREATE] AdSet creation failed:', {
        errorCode: rawResponse.error?.code,
        errorMessage: rawResponse.error?.message,
        errorType: rawResponse.error?.type,
        fbTraceId: adSetResponse.headers.get('x-fb-trace-id'),
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: rawResponse.error?.message || 'Erro ao criar ad set',
          rawResponse,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[TEST-META-ADSET-CREATE] AdSet created successfully:', rawResponse.id);

    return new Response(
      JSON.stringify({
        success: true,
        adSetId: rawResponse.id,
        rawResponse,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[TEST-META-ADSET-CREATE] Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
