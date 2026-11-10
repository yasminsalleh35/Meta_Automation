
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GRAPH_BASE } from '../_shared/meta.ts';
import { waLinkFromPhone } from '../_shared/phone.ts';
import { toMessage, toObject } from '../_shared/errors.ts';
import type { CampaignStatus } from '../_shared/status.ts';
import { inactiveAccountReason } from '../_shared/auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdvantageCampaignPayload {
  name: string;
  daily_budget: number;
  start_time: string;
  location: {
    city: string;
    radius: number;
  };
  fanpage_id: string;
  instagram_actor_id: string;
  media: {
    type: "image" | "video";
    hash_or_id: string;
  };
  title: string;
  copy: string;
  whatsapp_number: string;
}

// audit QA-03/PLT-02: o facebook-nodejs-business-sdk (Node) não inicializava no Edge Runtime
// (WORKER_ERROR até no OPTIONS). Chamadas diretas à Graph API no lugar do SDK.
// Em erro, lança { response: { error } } no mesmo formato que o catch abaixo já trata.
async function graphCreate(adAccountId: string, edge: string, params: Record<string, unknown>, accessToken: string): Promise<{ id: string }> {
  const res = await fetch(`${GRAPH_BASE}/${adAccountId}/${edge}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(params),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.error) {
    throw { response: { error: body?.error ?? { message: `HTTP ${res.status}` } } };
  }
  return body as { id: string };
}

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

    // audit ADM-02: conta suspensa / em exclusão não cria campanha
    const blocked = await inactiveAccountReason(user.id);
    if (blocked) {
      return new Response(
        JSON.stringify({ success: false, error: blocked.code, message: blocked.message }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // Parse request body
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método não permitido' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: AdvantageCampaignPayload = await req.json();
    
    // 📦 LOG DETALHADO DO PAYLOAD ADVANTAGE+
    console.log('🚀 Payload Advantage+ Campaign recebido:');
    console.log(JSON.stringify({
      name: payload.name,
      daily_budget: payload.daily_budget,
      location: payload.location,
      fanpage_id: payload.fanpage_id,
      instagram_actor_id: payload.instagram_actor_id,
      media: payload.media,
      title: payload.title,
      copy: payload.copy,
      whatsapp_number: payload.whatsapp_number
    }, null, 2));

    // Validate required fields
    const requiredFields: (keyof AdvantageCampaignPayload)[] = ['name', 'daily_budget', 'fanpage_id', 'instagram_actor_id', 'title', 'copy', 'whatsapp_number'];
    for (const field of requiredFields) {
      if (!payload[field]) {
        return new Response(
          JSON.stringify({ error: `Campo obrigatório ausente: ${String(field)}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get user's Meta Ads integration
    const { data: integration, error: integrationError } = await supabaseClient
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .eq('provider', 'meta_ads')
      .single();

    if (integrationError || !integration) {
      console.error('Integration error:', integrationError);
      return new Response(
        JSON.stringify({ error: 'Integração com Meta Ads não encontrada ou inativa' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔗 Meta Ads integration found for user:', user.id);

    const { access_token: accessToken, ad_account_id } = integration;

    if (!accessToken || !ad_account_id) {
      return new Response(
        JSON.stringify({ error: 'Access token ou Ad Account ID não encontrados na integração' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }


    // Clean and fix ad_account_id
    const cleanAdAccountId = ad_account_id.replace(/^act_+/, 'act_');
    const adAccountId = cleanAdAccountId.startsWith('act_') ? cleanAdAccountId : `act_${cleanAdAccountId}`;
    console.log(`🔧 Ad Account ID processed: ${ad_account_id} → ${adAccountId}`);

    // Convert budget to cents
    const budgetInCents = Math.round(payload.daily_budget * 100);
    console.log(`💰 Budget: R$${payload.daily_budget} → ${budgetInCents} centavos`);

    // Format WhatsApp link
    // audit CMP-06: normalização única (+55); número inválido → 400 antes de criar algo na Meta
    const whatsappLink = waLinkFromPhone(payload.whatsapp_number);
    if (!whatsappLink) {
      return new Response(
        JSON.stringify({ success: false, error: 'INVALID_WHATSAPP', message: 'O número de WhatsApp informado é inválido. Use DDD + número.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('📱 WhatsApp link built');

    // 🎯 LOG DOS PARÂMETROS ADVANTAGE+ (SEM SEGMENTAÇÃO MANUAL)
    console.log('🎯 Configuração Advantage+ (targeting automático):');
    console.log(JSON.stringify({
      adAccountId,
      objective: 'OUTCOME_TRAFFIC',
      optimization_goal: 'LINK_CLICKS',
      billing_event: 'IMPRESSIONS',
      budgetInCents,
      targeting: {
        // ⭐ ADVANTAGE+: Sem age_min, age_max, genders, interests
        geo_locations: {
          custom_locations: [{
            address_string: payload.location.city,
            radius: payload.location.radius,
            distance_unit: 'kilometer'
          }]
        },
        publisher_platforms: ['facebook', 'instagram'],
        facebook_positions: ['feed'],
        device_platforms: ['mobile']
      },
      whatsappLink,
      fanpage_id: payload.fanpage_id,
      instagram_actor_id: payload.instagram_actor_id
    }, null, 2));

    // 1. Create Campaign - Advantage+ Traffic
    console.log('📈 Creating Advantage+ Campaign...');
    const campaignParams = {
      name: `${payload.name} - Advantage+ Tráfego WhatsApp`,
      objective: 'OUTCOME_TRAFFIC',
      status: 'PAUSED',
      special_ad_categories: [],
      // ✅ Meta API v23.0 (subcode 4834011): orçamento no Ad Set (sem CBO) → flag obrigatória.
      is_adset_budget_sharing_enabled: false
    };

    const campaign = await graphCreate(adAccountId, 'campaigns', campaignParams, accessToken);
    console.log('✅ Advantage+ Campaign created:', campaign.id);

    // 2. Create AdSet - Advantage+ Targeting (sem segmentação manual)
    console.log('🎯 Creating Advantage+ AdSet (automated targeting)...');
    const adSetParams = {
      name: `${payload.name} - Advantage+ AdSet`,
      campaign_id: campaign.id,
      billing_event: 'IMPRESSIONS',
      optimization_goal: 'LINK_CLICKS',
      daily_budget: budgetInCents,
      start_time: payload.start_time,
      targeting: {
        // 🌟 ADVANTAGE+: Apenas localização, sem idade/gênero/interesses
        geo_locations: {
          custom_locations: [{
            address_string: payload.location.city,
            radius: payload.location.radius,
            distance_unit: 'kilometer'
          }]
        },
        publisher_platforms: ['facebook', 'instagram'],
        facebook_positions: ['feed'],
        // ✅ Sem instagram_positions para evitar erro 1815508
        device_platforms: ['mobile']
        // ⭐ ADVANTAGE+: age_min, age_max, genders, interests REMOVIDOS
      },
      status: 'PAUSED'
    };

    const adSet = await graphCreate(adAccountId, 'adsets', adSetParams, accessToken);
    console.log('✅ Advantage+ AdSet created:', adSet.id);

    // 3. Create Ad Creative - Advantage+
    console.log('🎨 Creating Advantage+ Creative...');
    
    // Determine media object based on type
    let mediaObject = {};
    if (payload.media.type === 'image') {
      mediaObject = { image_hash: payload.media.hash_or_id };
    } else if (payload.media.type === 'video') {
      mediaObject = { video_id: payload.media.hash_or_id };
    }

    const creativeParams = {
      name: `${payload.name} - Advantage+ Creative`,
      object_story_spec: {
        page_id: payload.fanpage_id,
        // audit PLT-03: a Meta descontinuou instagram_actor_id no object_story_spec → instagram_user_id
        // (o payload do frontend mantém o nome antigo do campo)
        instagram_user_id: payload.instagram_actor_id,
        link_data: {
          ...mediaObject,
          link: whatsappLink,
          message: payload.copy,
          name: payload.title,
          caption: 'Clique e fale conosco no WhatsApp',
          call_to_action: {
            type: 'LEARN_MORE',
            value: {
              link: whatsappLink
            }
          }
        }
      }
    };

    const creative = await graphCreate(adAccountId, 'adcreatives', creativeParams, accessToken);
    console.log('✅ Advantage+ Creative created:', creative.id);

    // 4. Create Ad - Advantage+
    console.log('📢 Creating Advantage+ Ad...');
    const adParams = {
      name: `${payload.name} - Advantage+ Ad`,
      adset_id: adSet.id,
      creative: { creative_id: creative.id },
      status: 'PAUSED'
    };

    const ad = await graphCreate(adAccountId, 'ads', adParams, accessToken);
    console.log('✅ Advantage+ Ad created:', ad.id);

    // Save campaign to database
    const { error: saveError } = await supabaseClient
      .from('campaigns')
      .insert({
        user_id: user.id,
        name: payload.name,
        meta_campaign_id: campaign.id,
        meta_adset_id: adSet.id,
        meta_ad_id: ad.id,
        objective: 'OUTCOME_TRAFFIC',
        budget_daily: payload.daily_budget,
        location_city: payload.location.city,
        location_radius: payload.location.radius,
        facebook_page: payload.fanpage_id,
        instagram_account: payload.instagram_actor_id,
        ad_title: payload.title,
        ad_text: payload.copy,
        whatsapp_number: payload.whatsapp_number,
        destination_url: whatsappLink,
        // audit CMP-10: DB usa o vocabulário canônico minúsculo ('paused'), não o da Meta
        status: 'paused' satisfies CampaignStatus,
        processing_status: 'completed',
        meta_integration_status: 'active',
        created_at: new Date().toISOString()
      });

    if (saveError) {
      console.error('Error saving Advantage+ campaign to database:', saveError);
    } else {
      console.log('✅ Advantage+ campaign saved to database');
    }

    const response = {
      success: true,
      message: 'Campanha Advantage+ criada com sucesso!',
      campaign_type: 'Advantage+ Traffic',
      data: {
        campaignId: campaign.id,
        adSetId: adSet.id,
        adId: ad.id,
        creativeId: creative.id,
        status: 'PAUSED',
        advantage_plus: true,
        automated_targeting: true
      }
    };

    console.log('🎉 Advantage+ campaign creation completed successfully');

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (err: unknown) {
    console.error('❌ Error in Advantage+ campaign creation:', toObject(err));
    
    let errorMessage = 'Erro interno do servidor';
    let statusCode = 500;

    const error = err as any;
    if (error?.response?.error) {
      const fbError = error.response.error;
      errorMessage = `Erro da Meta Ads API: ${fbError.message || fbError.error_user_msg || 'Erro desconhecido'}`;
      statusCode = 400;
      
      console.error('Facebook API Error Details:', {
        code: fbError.code,
        message: fbError.message,
        type: fbError.type,
        error_subcode: fbError.error_subcode,
        fbtrace_id: fbError.fbtrace_id
      });

      if (fbError.code === 190) {
        errorMessage = 'Token de acesso expirado. Reconecte sua conta Meta Ads.';
        statusCode = 401;
      } else if (fbError.code === 100) {
        errorMessage = 'Parâmetros inválidos na criação da campanha Advantage+. Verifique os dados enviados.';
      }
    } else {
      errorMessage = toMessage(err);
    }

    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        details: toMessage(err),
        campaign_type: 'Advantage+ Traffic'
      }),
      { 
        status: statusCode, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
