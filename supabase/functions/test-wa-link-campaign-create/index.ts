import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WaLinkCampaignPayload {
  adAccountId: string;
  pageId: string;
  accessToken: string;
  campaignName: string;
  adTitle: string;
  adText: string;
  whatsappLink: string;
  dailyBudget: number;
  selectedMediaMeta?: {
    file_type: string;
    public_url: string;
  };
  creativeType: 'upload' | 'post';
  selectedInstagramPostId?: string;
  instagramUserId?: string;
  selected_locations: any[];
  countryCode: string;
}

// 🔧 Teste de conectividade Meta API
async function testMetaConnection(adAccountId: string, accessToken: string, logs: string[]) {
  logs.push(`[TEST] Testing Meta API connection...`);
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v23.0/${adAccountId}?fields=id,name,currency,account_status&access_token=${accessToken}`,
      { method: 'GET' }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      logs.push(`[TEST-ERROR] Status: ${response.status}`);
      logs.push(`[TEST-ERROR] Code: ${data.error?.code}`);
      logs.push(`[TEST-ERROR] Type: ${data.error?.type}`);
      logs.push(`[TEST-ERROR] Message: ${data.error?.message}`);
      logs.push(`[TEST-ERROR] Subcode: ${data.error?.error_subcode}`);
      logs.push(`[TEST-ERROR] FBTrace: ${data.error?.fbtrace_id}`);
      throw new Error(`Meta API connection failed: ${data.error?.message}`);
    }
    
    logs.push(`[TEST] ✅ Connected to: ${data.name} (${data.currency})`);
    logs.push(`[TEST] ✅ Account Status: ${data.account_status}`);
    return true;
  } catch (error: any) {
    logs.push(`[TEST-ERROR] ${error.message}`);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: WaLinkCampaignPayload = await req.json();
    const logs: string[] = [];

    logs.push(`[INIT] Starting WA.ME Link campaign creation`);
    
    // 🔍 VALIDAÇÃO DETALHADA DO PAYLOAD
    logs.push(`[DEBUG] ========== PAYLOAD VALIDATION ==========`);
    logs.push(`[DEBUG] Ad Account: ${payload.adAccountId}`);
    logs.push(`[DEBUG] Access Token length: ${payload.accessToken?.length || 0}`);
    logs.push(`[DEBUG] Campaign Name: ${payload.campaignName}`);
    logs.push(`[DEBUG] Page ID: ${payload.pageId}`);
    logs.push(`[DEBUG] WhatsApp Link: ${payload.whatsappLink}`);
    logs.push(`[DEBUG] Daily Budget: ${payload.dailyBudget}`);
    logs.push(`[DEBUG] Creative Type: ${payload.creativeType}`);
    logs.push(`[DEBUG] Locations: ${JSON.stringify(payload.selected_locations)}`);
    logs.push(`[DEBUG] Country Code: ${payload.countryCode}`);
    logs.push(`[DEBUG] ========================================`);

    // 🔍 VALIDAÇÕES CRÍTICAS
    if (!payload.adAccountId) {
      throw new Error('[VALIDATION] Ad Account ID is missing');
    }
    if (!payload.adAccountId.startsWith('act_')) {
      throw new Error('[VALIDATION] Ad Account ID must start with "act_"');
    }
    if (!payload.accessToken) {
      throw new Error('[VALIDATION] Access token is missing');
    }
    if (payload.accessToken.length < 100) {
      throw new Error('[VALIDATION] Access token appears to be invalid (too short)');
    }
    if (!payload.campaignName) {
      throw new Error('[VALIDATION] Campaign name is missing');
    }
    if (!payload.pageId) {
      throw new Error('[VALIDATION] Page ID is missing');
    }
    if (!payload.whatsappLink) {
      throw new Error('[VALIDATION] WhatsApp link is missing');
    }
    
    logs.push(`[VALIDATION] ✅ All required fields present`);

    // 🔍 TESTE DE CONECTIVIDADE
    await testMetaConnection(payload.adAccountId, payload.accessToken, logs);

    logs.push(`[CONFIG] Campaign: ${payload.campaignName}`);
    logs.push(`[CONFIG] WhatsApp Link: ${payload.whatsappLink}`);

    // ✅ PASSO 1: Criar Campaign com OUTCOME_TRAFFIC
    logs.push(`[CAMPAIGN] Creating with objective: OUTCOME_TRAFFIC`);
    
    const campaignPayload = {
      name: payload.campaignName,
      objective: 'OUTCOME_TRAFFIC',
      status: 'PAUSED',
      special_ad_categories: [] // ✅ Obrigatório na Meta API v23.0
    };

    logs.push(`[CAMPAIGN] Payload: ${JSON.stringify(campaignPayload)}`);

    const campaignResponse = await fetch(
      `https://graph.facebook.com/v23.0/${payload.adAccountId}/campaigns?access_token=${payload.accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignPayload)
      }
    );

    const campaign = await campaignResponse.json();
    
    if (!campaignResponse.ok) {
      logs.push(`[CAMPAIGN-ERROR] ========== META API ERROR ==========`);
      logs.push(`[CAMPAIGN-ERROR] HTTP Status: ${campaignResponse.status}`);
      logs.push(`[CAMPAIGN-ERROR] Error Code: ${campaign.error?.code}`);
      logs.push(`[CAMPAIGN-ERROR] Error Type: ${campaign.error?.type}`);
      logs.push(`[CAMPAIGN-ERROR] Error Message: ${campaign.error?.message}`);
      logs.push(`[CAMPAIGN-ERROR] Error Subcode: ${campaign.error?.error_subcode}`);
      logs.push(`[CAMPAIGN-ERROR] FBTrace ID: ${campaign.error?.fbtrace_id}`);
      logs.push(`[CAMPAIGN-ERROR] Is Transient: ${campaign.error?.is_transient}`);
      logs.push(`[CAMPAIGN-ERROR] Full Error: ${JSON.stringify(campaign.error)}`);
      logs.push(`[CAMPAIGN-ERROR] =====================================`);
      
      // Retornar logs mesmo em caso de erro
      return new Response(
        JSON.stringify({ 
          success: false,
          error: campaign.error?.message || 'Failed to create campaign',
          error_code: campaign.error?.code,
          error_type: campaign.error?.type,
          error_subcode: campaign.error?.error_subcode,
          fbtrace_id: campaign.error?.fbtrace_id,
          logs
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    logs.push(`[CAMPAIGN] ✅ Created: ${campaign.id}`);

    // ✅ PASSO 2: Criar AdSet com LINK_CLICKS
    logs.push(`[ADSET] Creating with optimization_goal: LINK_CLICKS`);

    const geoTargeting = buildGeoTargeting(payload.selected_locations, payload.countryCode);
    logs.push(`[ADSET] Geo targeting: ${JSON.stringify(geoTargeting)}`);

    // ✅ Payload completo do AdSet com plataformas
    const adsetPayload = {
      name: `${payload.campaignName} - AdSet`,
      campaign_id: campaign.id,
      optimization_goal: 'LINK_CLICKS',
      billing_event: 'IMPRESSIONS',
      daily_budget: (payload.dailyBudget * 100).toString(),
      targeting: {
        geo_locations: geoTargeting,
        age_min: 18,
        age_max: 65,
        genders: [0],
        publisher_platforms: ['facebook', 'instagram'], // ✅ Facebook + Instagram
        device_platforms: ['mobile'] // ✅ Mobile only
      },
      status: 'PAUSED'
    };

    logs.push(`[ADSET] Payload: ${JSON.stringify(adsetPayload)}`);

    const adsetResponse = await fetch(
      `https://graph.facebook.com/v23.0/${payload.adAccountId}/adsets?access_token=${payload.accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adsetPayload)
      }
    );

    const adset = await adsetResponse.json();
    if (!adsetResponse.ok) {
      logs.push(`[ADSET-ERROR] ${JSON.stringify(adset.error)}`);
      throw new Error(adset.error?.message || 'Failed to create adset');
    }
    logs.push(`[ADSET] ✅ Created: ${adset.id}`);

    // ✅ PASSO 3: Upload de Mídia
    let imageHash: string | undefined;
    
    if (payload.creativeType === 'upload' && payload.selectedMediaMeta) {
      logs.push(`[MEDIA] Downloading image from: ${payload.selectedMediaMeta.public_url}`);
      
      const imageResponse = await fetch(payload.selectedMediaMeta.public_url);
      const imageBuffer = await imageResponse.arrayBuffer();
      
      // Converter para base64 em chunks
      const uint8Array = new Uint8Array(imageBuffer);
      const chunkSize = 8192;
      let base64 = '';
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        base64 += String.fromCharCode(...chunk);
      }
      const base64Image = btoa(base64);
      
      logs.push(`[MEDIA] Uploading to Meta (size: ${imageBuffer.byteLength} bytes)`);
      
      const uploadResponse = await fetch(
        `https://graph.facebook.com/v23.0/${payload.adAccountId}/adimages?access_token=${payload.accessToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bytes: base64Image })
        }
      );
      
      const uploadResult = await uploadResponse.json();
      if (!uploadResponse.ok) {
        logs.push(`[MEDIA-ERROR] ${JSON.stringify(uploadResult.error)}`);
        throw new Error(uploadResult.error?.message || 'Failed to upload image');
      }
      
      imageHash = uploadResult.images?.bytes?.hash;
      logs.push(`[MEDIA] ✅ Image hash: ${imageHash}`);
    }

    // ✅ PASSO 4: Criar Creative com wa.me link
    logs.push(`[CREATIVE] Creating with wa.me link`);

    const creativePayload: any = {
      name: `${payload.campaignName} - Creative`,
      object_story_spec: {
        page_id: payload.pageId,
        link_data: {
          link: payload.whatsappLink,
          message: payload.adText,
          name: payload.adTitle,
          call_to_action: {
            type: 'WHATSAPP_MESSAGE'
          }
        }
      }
    };

    // ✅ Adicionar Instagram User ID se disponível
    if (payload.instagramUserId) {
      creativePayload.object_story_spec.instagram_user_id = payload.instagramUserId;
      logs.push(`[CREATIVE] Instagram User ID added: ${payload.instagramUserId}`);
    }

    // ✅ Adicionar image_hash se houver upload
    if (imageHash) {
      creativePayload.object_story_spec.link_data.image_hash = imageHash;
      logs.push(`[CREATIVE] Image hash added: ${imageHash}`);
    }

    let creativeResponse = await fetch(
      `https://graph.facebook.com/v23.0/${payload.adAccountId}/adcreatives?access_token=${payload.accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creativePayload)
      }
    );

    let creative = await creativeResponse.json();

    // ✅ FALLBACK: Se WHATSAPP_MESSAGE falhar, usar LEARN_MORE
    if (!creativeResponse.ok && creative.error?.code === 100) {
      logs.push(`[CREATIVE] WHATSAPP_MESSAGE failed, retrying with LEARN_MORE`);
      
      creativePayload.object_story_spec.link_data.call_to_action.type = 'LEARN_MORE';
      
      creativeResponse = await fetch(
        `https://graph.facebook.com/v23.0/${payload.adAccountId}/adcreatives?access_token=${payload.accessToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(creativePayload)
        }
      );
      
      creative = await creativeResponse.json();
    }

    if (!creativeResponse.ok) {
      logs.push(`[CREATIVE-ERROR] ${JSON.stringify(creative.error)}`);
      throw new Error(creative.error?.message || 'Failed to create creative');
    }
    logs.push(`[CREATIVE] ✅ Created: ${creative.id}`);

    // ✅ PASSO 5: Criar Ad
    logs.push(`[AD] Creating final ad`);

    const adResponse = await fetch(
      `https://graph.facebook.com/v23.0/${payload.adAccountId}/ads?access_token=${payload.accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `AD - ${payload.campaignName}`,
          adset_id: adset.id,
          creative: { creative_id: creative.id },
          status: 'PAUSED'
        })
      }
    );

    const ad = await adResponse.json();
    if (!adResponse.ok) {
      logs.push(`[AD-ERROR] ${JSON.stringify(ad.error)}`);
      throw new Error(ad.error?.message || 'Failed to create ad');
    }
    logs.push(`[AD] ✅ Created: ${ad.id}`);
    logs.push(`[SUCCESS] Campaign creation completed!`);

    return new Response(
      JSON.stringify({
        success: true,
        campaign_id: campaign.id,
        adset_id: adset.id,
        creative_id: creative.id,
        ad_id: ad.id,
        logs
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('❌ Error:', error);
    
    const errorLogs = [
      `[ERROR] ========== EXCEPTION CAUGHT ==========`,
      `[ERROR] Message: ${error.message}`,
      `[ERROR] Stack: ${error.stack}`,
      `[ERROR] ======================================`
    ];
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        error_stack: error.stack,
        logs: errorLogs
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});

function buildGeoTargeting(locations: any[], countryCode: string) {
  if (!locations || locations.length === 0) {
    return { countries: [countryCode] };
  }

  const result: any = {};

  locations.forEach(loc => {
    if (loc.type === 'region' && loc.key) {
      result.regions = result.regions || [];
      result.regions.push({ key: loc.key });
    } else if (loc.type === 'city' && loc.latitude && loc.longitude) {
      result.custom_locations = result.custom_locations || [];
      result.custom_locations.push({
        latitude: loc.latitude,
        longitude: loc.longitude,
        radius: loc.radius || 10,
        distance_unit: 'kilometer'
      });
    }
  });

  result.location_types = ['home'];
  return result;
}
