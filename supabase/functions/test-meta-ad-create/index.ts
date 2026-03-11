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
    const { adAccountId, adConfig, accessToken } = await req.json();

    console.log('[TEST-META-AD-CREATE] Request received:', {
      adAccountId,
      adConfig,
      hasAccessToken: !!accessToken,
    });
    
    // FASE 3: Validar compatibilidade Creative x AdSet
    console.log('[TEST-META-AD-CREATE] Validating Creative and AdSet compatibility...');
    
    // Buscar detalhes do Creative
    const creativeUrl = `https://graph.facebook.com/v23.0/${adConfig.creative.creative_id}?fields=id,object_story_id,object_story_spec&access_token=${accessToken}`;
    const creativeResponse = await fetch(creativeUrl);
    const creativeData = await creativeResponse.json();

    console.log('[TEST-META-AD-CREATE] Creative details:', {
      id: creativeData.id,
      hasObjectStoryId: !!creativeData.object_story_id,
      hasObjectStorySpec: !!creativeData.object_story_spec,
      objectStorySpec: creativeData.object_story_spec
    });
    
    // Buscar detalhes do AdSet
    const adSetUrl = `https://graph.facebook.com/v23.0/${adConfig.adset_id}?fields=id,optimization_goal,destination_type,promoted_object&access_token=${accessToken}`;
    const adSetResponse = await fetch(adSetUrl);
    const adSetData = await adSetResponse.json();

    console.log('[TEST-META-AD-CREATE] AdSet details:', {
      id: adSetData.id,
      optimization_goal: adSetData.optimization_goal,
      destination_type: adSetData.destination_type,
      promoted_object: adSetData.promoted_object
    });
    
    // ✅ VALIDAÇÃO CTWA: Verificar compatibilidade Creative + AdSet
    if (adSetData.destination_type === 'WHATSAPP') {
      console.log('[TEST-META-AD-CREATE] Validating CTWA compatibility...');
      
      // Para CTWA, DEVE ter object_story_spec com CTA
      if (!creativeData.object_story_spec) {
        console.error('[TEST-META-AD-CREATE] CTWA requires object_story_spec');
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Creative incompatível: campanhas WhatsApp requerem object_story_spec com call_to_action'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verificar se tem CTA de WhatsApp
      const hasWhatsAppCTA = 
        creativeData.object_story_spec?.photo_data?.call_to_action?.type === 'WHATSAPP_MESSAGE' ||
        creativeData.object_story_spec?.video_data?.call_to_action?.type === 'WHATSAPP_MESSAGE' ||
        creativeData.object_story_spec?.link_data?.call_to_action?.type === 'WHATSAPP_MESSAGE';

      if (!hasWhatsAppCTA) {
        console.error('[TEST-META-AD-CREATE] Missing WHATSAPP_MESSAGE CTA');
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Creative incompatível: falta call_to_action tipo WHATSAPP_MESSAGE'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[TEST-META-AD-CREATE] ✅ CTWA compatibility validated');
    }
    
    console.log('[TEST-META-AD-CREATE] ✅ Compatibility validation passed');

    // Normalizar ad account ID
    const actId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;

    // Construir URL da API (v23.0 para CTWA)
    const adUrl = `https://graph.facebook.com/v23.0/${actId}/ads?access_token=${accessToken}`;

    console.log('[TEST-META-AD-CREATE] Calling Meta API:', {
      url: adUrl.replace(accessToken, 'TOKEN_MASKED'),
      body: adConfig,
    });

    // Fazer requisição para Meta API
    const adResponse = await fetch(adUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adConfig),
    });

    const rawResponse = await adResponse.json();

    console.log('[TEST-META-AD-CREATE] Meta API Response:', {
      status: adResponse.status,
      ok: adResponse.ok,
      response: rawResponse,
      fbTraceId: adResponse.headers.get('x-fb-trace-id'),
    });

    if (!adResponse.ok) {
      console.error('[TEST-META-AD-CREATE] Ad creation failed:', {
        errorCode: rawResponse.error?.code,
        errorMessage: rawResponse.error?.message,
        errorType: rawResponse.error?.type,
        fbTraceId: adResponse.headers.get('x-fb-trace-id'),
        isTransient: rawResponse.error?.is_transient,
      });
      
      // FASE 4: Retry automático para erros transientes (code 2)
      if (rawResponse.error?.code === 2 && rawResponse.error?.is_transient) {
        console.log('[TEST-META-AD-CREATE] Transient error detected (code 2), retrying in 2 seconds...');
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('[TEST-META-AD-CREATE] Retrying ad creation...');
        const retryResponse = await fetch(adUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(adConfig),
        });
        
        const retryResult = await retryResponse.json();
        
        console.log('[TEST-META-AD-CREATE] Retry response:', {
          status: retryResponse.status,
          ok: retryResponse.ok,
          result: retryResult,
          fbTraceId: retryResponse.headers.get('x-fb-trace-id'),
        });
        
        if (retryResponse.ok) {
          console.log('[TEST-META-AD-CREATE] ✅ Retry successful:', retryResult.id);
          return new Response(
            JSON.stringify({
              success: true,
              adId: retryResult.id,
              rawResponse: retryResult,
              wasRetried: true,
              message: 'Ad criado com sucesso após retry automático'
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        
        console.error('[TEST-META-AD-CREATE] Retry also failed:', retryResult);
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: rawResponse.error?.message || 'Erro ao criar anúncio',
          rawResponse,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[TEST-META-AD-CREATE] Ad created successfully:', rawResponse.id);

    return new Response(
      JSON.stringify({
        success: true,
        adId: rawResponse.id,
        rawResponse,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[TEST-META-AD-CREATE] Unexpected error:', error);
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
