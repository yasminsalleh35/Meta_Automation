// ============================================
// 🔄 CONTINGENCY AUTO-RETRY WA.ME
// ============================================
// Esta função recebe campanhas que falharam com CTWA
// e tenta recriar usando estratégia wa.me link (OUTCOME_TRAFFIC)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const META_API_VERSION = 'v23.0';

interface AutoRetryPayload {
  contingency_id: string;
  user_id: string;
  campaign_data: any;
  ad_account_id: string;
  page_id: string;
  instagram_id: string | null;
  access_token: string;
}

function logger(level: 'info' | 'error' | 'warn', stage: string, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logPrefix = `[${timestamp}][auto-retry-walink][${stage.toUpperCase()}]`;
  
  const logData = {
    level,
    stage,
    message,
    timestamp,
    ...data
  };

  switch (level) {
    case 'info':
      console.log(`${logPrefix} ${message}`, JSON.stringify(logData));
      break;
    case 'error':
      console.error(`${logPrefix} ❌ ${message}`, JSON.stringify(logData));
      break;
    case 'warn':
      console.warn(`${logPrefix} ⚠️ ${message}`, JSON.stringify(logData));
      break;
  }
}

function toAccountPath(adAccountId: string): string {
  const raw = String(adAccountId || '');
  const numeric = raw.replace(/^act_+/i, '');
  return `act_${numeric}`;
}

async function metaApiWithRetry(
  url: string, 
  options: RequestInit, 
  attempt: number = 1
): Promise<Response> {
  const MAX_RETRIES = 3;
  const INITIAL_DELAY = 1000;

  try {
    const response = await fetch(url, options);
    
    if (!response.ok && attempt < MAX_RETRIES) {
      const errorData = await response.clone().json();
      
      // Rate limit - fazer retry
      if (errorData.error?.code === 17) {
        const delay = INITIAL_DELAY * Math.pow(2, attempt - 1);
        logger('warn', 'RATE-LIMIT', `Rate limit detectado, aguardando ${delay}ms`, { attempt });
        await new Promise(resolve => setTimeout(resolve, delay));
        return metaApiWithRetry(url, options, attempt + 1);
      }
    }
    
    return response;
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      const delay = INITIAL_DELAY * Math.pow(2, attempt - 1);
      logger('warn', 'RETRY', `Tentativa ${attempt} falhou, aguardando ${delay}ms`, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      await new Promise(resolve => setTimeout(resolve, delay));
      return metaApiWithRetry(url, options, attempt + 1);
    }
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const payload: AutoRetryPayload = await req.json();
    const { contingency_id, user_id, campaign_data, ad_account_id, page_id, instagram_id, access_token } = payload;

    logger('info', 'INIT', '🔄 Iniciando auto-retry wa.me', { 
      contingency_id, 
      user_id,
      campaign_name: campaign_data.campaignName 
    });

    // Validar token
    if (!access_token || access_token.length < 20) {
      logger('error', 'VALIDATION', 'Access token inválido', { contingency_id });
      
      await supabase
        .from('campaign_contingency')
        .update({
          status: 'auto_retry_failed',
          retry_strategy: 'walink',
          error_message: 'Access token inválido ou expirado. Necessário renovar integração.',
          admin_notes: '⚠️ Token inválido - não tentou criar',
          attempts: 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', contingency_id);

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid access token',
          contingency_id 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const actId = toAccountPath(ad_account_id);

    // ====================================
    // FASE 2: Buscar WhatsApp de Business Settings
    // ====================================
    logger('info', 'WHATSAPP-FETCH', '📞 Buscando WhatsApp do negócio', { contingency_id, user_id });
    
    const { data: businessSettings, error: businessError } = await supabase
      .from('business_settings')
      .select('whatsapp_number')
      .eq('user_id', user_id)
      .single();

    if (businessError || !businessSettings?.whatsapp_number) {
      logger('error', 'WHATSAPP-NOT-FOUND', '❌ WhatsApp não configurado em business_settings', { 
        contingency_id,
        user_id,
        error: businessError?.message 
      });

      await supabase
        .from('campaign_contingency')
        .update({
          status: 'auto_retry_failed',
          retry_strategy: 'walink',
          error_message: 'WhatsApp do negócio não configurado. Configure em "Meu Negócio".',
          error_stage: 'whatsapp_validation',
          attempts: 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', contingency_id);

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'WhatsApp não configurado em business_settings',
          message: 'Configure o WhatsApp em "Meu Negócio" antes de criar campanhas wa.me'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Limpar e validar número
    const cleanedWhatsApp = businessSettings.whatsapp_number.replace(/\D/g, '');
    
    if (cleanedWhatsApp.length !== 11) {
      logger('error', 'WHATSAPP-INVALID', '❌ Número inválido em business_settings', { 
        contingency_id,
        user_id,
        whatsapp: businessSettings.whatsapp_number,
        cleaned_length: cleanedWhatsApp.length
      });

      await supabase
        .from('campaign_contingency')
        .update({
          status: 'auto_retry_failed',
          retry_strategy: 'walink',
          error_message: 'WhatsApp inválido em business_settings. Deve ter 11 dígitos.',
          error_stage: 'whatsapp_validation',
          attempts: 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', contingency_id);

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'WhatsApp inválido',
          message: 'O WhatsApp configurado deve ter 11 dígitos (DDD + número)'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const waLinkUrl = `https://wa.me/55${cleanedWhatsApp}`;
    logger('info', 'WA-LINK-GENERATED', '✅ Link wa.me gerado de business_settings', { 
      contingency_id,
      link: waLinkUrl,
      whatsapp_preview: `${cleanedWhatsApp.slice(0, 4)}****${cleanedWhatsApp.slice(-2)}`
    });

    // ====================================
    // FASE 3: Criar Campaign (OUTCOME_TRAFFIC)
    // ====================================
    logger('info', 'CAMPAIGN', '📝 Criando campanha wa.me', { 
      contingency_id,
      campaign_name: `${campaign_data.campaignName} (wa.me auto)` 
    });

    const campaignPayload = {
      name: `${campaign_data.campaignName} (wa.me auto)`,
      objective: 'OUTCOME_TRAFFIC',
      status: 'PAUSED',
      special_ad_categories: [],
      // ✅ Meta API v23.0 (subcode 4834011): orçamento fica no Ad Set (sem CBO), então é
      // obrigatório declarar is_adset_budget_sharing_enabled. false = sem compartilhamento.
      is_adset_budget_sharing_enabled: false
    };

    const campaignUrl = `https://graph.facebook.com/${META_API_VERSION}/${actId}/campaigns?access_token=${access_token}`;
    const campaignResponse = await metaApiWithRetry(campaignUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaignPayload)
    });

    const campaignResult = await campaignResponse.json();

    if (!campaignResponse.ok) {
      const errorMsg = campaignResult.error?.message || 'Erro desconhecido ao criar campanha';
      logger('error', 'CAMPAIGN-ERROR', errorMsg, { 
        contingency_id,
        error_code: campaignResult.error?.code,
        fbtrace_id: campaignResponse.headers.get('x-fb-trace-id')
      });

      await supabase
        .from('campaign_contingency')
        .update({
          status: 'auto_retry_failed',
          retry_strategy: 'walink',
          error_message: `Falha ao criar campanha wa.me: ${errorMsg}`,
          meta_api_trace_id: campaignResponse.headers.get('x-fb-trace-id'),
          attempts: 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', contingency_id);

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMsg,
          contingency_id,
          stage: 'campaign_creation'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const campaignId = campaignResult.id;
    logger('info', 'CAMPAIGN-SUCCESS', '✅ Campanha criada', { 
      contingency_id,
      campaign_id: campaignId 
    });

    // ====================================
    // FASE 2: Criar AdSet (LINK_CLICKS)
    // ====================================
    logger('info', 'ADSET', '📝 Criando ad set', { contingency_id });

    // Construir targeting
    const targeting: any = {
      age_min: campaign_data.ageMin || 18,
      age_max: campaign_data.ageMax || 65,
      geo_locations: {
        location_types: ['home', 'recent']
      }
    };

    // Adicionar localizações se existirem
    if (campaign_data.selected_locations && campaign_data.selected_locations.length > 0) {
      // Processar CIDADES
      const cities = campaign_data.selected_locations
        .filter((loc: any) => loc.type === 'city' && loc.key)
        .map((loc: any) => ({ key: loc.key }));
      
      if (cities.length > 0) {
        targeting.geo_locations.cities = cities;
        logger('info', 'TARGETING-CITIES', `${cities.length} cidades adicionadas`, { 
          contingency_id,
          cities: cities.map((c: any) => c.key)
        });
      }

      // Processar REGIÕES/ESTADOS
      const regions = campaign_data.selected_locations
        .filter((loc: any) => (loc.type === 'region' || loc.type === 'state') && loc.key)
        .map((loc: any) => ({ key: loc.key }));
      
      if (regions.length > 0) {
        targeting.geo_locations.regions = regions;
        logger('info', 'TARGETING-REGIONS', `${regions.length} regiões/estados adicionados`, { 
          contingency_id,
          regions: regions.map((r: any) => r.key)
        });
      }

      // Log consolidado do targeting final
      logger('info', 'TARGETING-LOCATIONS', 'Localizações processadas', {
        contingency_id,
        total_locations: campaign_data.selected_locations.length,
        cities_count: cities.length,
        regions_count: regions.length,
        country: campaign_data.countryCode || 'BR'
      });
    } else {
      // Se não houver locations específicas, usar targeting por país
      targeting.geo_locations.countries = [campaign_data.countryCode || 'BR'];
      logger('info', 'TARGETING-COUNTRY', 'Targeting por país inteiro', {
        contingency_id,
        country: campaign_data.countryCode || 'BR'
      });
    }

    // Gênero
    if (campaign_data.gender && campaign_data.gender !== 'all') {
      targeting.genders = campaign_data.gender === 'male' ? [1] : [2];
    }

    const dailyBudget = Math.round(parseFloat(campaign_data.dailyBudget) * 100);

    const adSetPayload = {
      name: `AdSet - ${campaign_data.campaignName}`,
      campaign_id: campaignId,
      optimization_goal: 'LINK_CLICKS',
      billing_event: 'IMPRESSIONS',
      daily_budget: dailyBudget,
      destination_type: 'WEBSITE',
      targeting: targeting,
      status: 'PAUSED'
    };

    // Log detalhado do payload antes do envio
    logger('info', 'ADSET-PAYLOAD-FINAL', 'Payload completo do Ad Set', {
      contingency_id,
      payload: JSON.stringify(adSetPayload, null, 2),
      targeting_summary: {
        age: `${targeting.age_min}-${targeting.age_max}`,
        countries: targeting.geo_locations.countries,
        cities: targeting.geo_locations.cities?.length || 0,
        regions: targeting.geo_locations.regions?.length || 0,
        location_types: targeting.geo_locations.location_types
      }
    });

    const adSetUrl = `https://graph.facebook.com/${META_API_VERSION}/${actId}/adsets?access_token=${access_token}`;
    const adSetResponse = await metaApiWithRetry(adSetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adSetPayload)
    });

    const adSetResult = await adSetResponse.json();

    if (!adSetResponse.ok) {
      const errorMsg = adSetResult.error?.message || 'Erro ao criar ad set';
      logger('error', 'ADSET-ERROR', errorMsg, { 
        contingency_id,
        campaign_id: campaignId,
        error_code: adSetResult.error?.code
      });

      await supabase
        .from('campaign_contingency')
        .update({
          status: 'auto_retry_failed',
          retry_strategy: 'walink',
          error_message: `Campanha criada mas falhou ad set: ${errorMsg}`,
          partial_meta_campaign_id: campaignId,
          meta_api_trace_id: adSetResponse.headers.get('x-fb-trace-id'),
          attempts: 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', contingency_id);

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMsg,
          contingency_id,
          campaign_id: campaignId,
          stage: 'adset_creation'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const adSetId = adSetResult.id;
    logger('info', 'ADSET-SUCCESS', '✅ Ad set criado', { 
      contingency_id,
      adset_id: adSetId 
    });

    // ====================================
    // FASE 3: Upload de Mídia (se necessário)
    // ====================================
    let mediaHash = null;
    let videoId = null;

    if (campaign_data.selectedMediaMeta?.public_url && campaign_data.creativeType === 'upload') {
      logger('info', 'MEDIA-UPLOAD', '📤 Fazendo upload de mídia', { contingency_id });

      const fileType = campaign_data.selectedMediaMeta.file_type;
      const isVideo = fileType?.startsWith('video/');

      const mediaUrl = `https://graph.facebook.com/${META_API_VERSION}/${actId}/ad${isVideo ? 'videos' : 'images'}?access_token=${access_token}`;
      
      const mediaPayload: any = {};
      if (isVideo) {
        mediaPayload.file_url = campaign_data.selectedMediaMeta.public_url;
      } else {
        mediaPayload.bytes = campaign_data.selectedMediaMeta.public_url;
        mediaPayload.copy_from = { url: campaign_data.selectedMediaMeta.public_url };
      }

      const mediaResponse = await metaApiWithRetry(mediaUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mediaPayload)
      });

      const mediaResult = await mediaResponse.json();

      if (mediaResponse.ok) {
        if (isVideo) {
          videoId = mediaResult.id;
          logger('info', 'MEDIA-SUCCESS', '✅ Vídeo uploaded', { contingency_id, video_id: videoId });
        } else {
          mediaHash = mediaResult.images?.bytes?.hash || mediaResult.hash;
          logger('info', 'MEDIA-SUCCESS', '✅ Imagem uploaded', { contingency_id, image_hash: mediaHash });
        }
      } else {
        logger('warn', 'MEDIA-ERROR', '⚠️ Falha no upload de mídia, continuando sem mídia', { 
          contingency_id,
          error: mediaResult.error?.message 
        });
      }
    }

    // ====================================
    // FASE 5: Criar Creative com wa.me link
    // ====================================
    logger('info', 'CREATIVE', '🎨 Criando creative', { contingency_id });

    const linkData: any = {
      message: campaign_data.adText || '',
      link: waLinkUrl,
      name: campaign_data.adTitle || '',
      call_to_action: {
        type: 'LEARN_MORE',
        value: {
          link: waLinkUrl
        }
      }
    };

    if (videoId) {
      linkData.video_id = videoId;
    } else if (mediaHash) {
      linkData.image_hash = mediaHash;
    }

    const creativePayload = {
      name: `Creative - ${campaign_data.campaignName}`,
      object_story_spec: {
        page_id: page_id,
        link_data: linkData
      }
    };

    const creativeUrl = `https://graph.facebook.com/${META_API_VERSION}/${actId}/adcreatives?access_token=${access_token}`;
    const creativeResponse = await metaApiWithRetry(creativeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creativePayload)
    });

    const creativeResult = await creativeResponse.json();

    if (!creativeResponse.ok) {
      const errorMsg = creativeResult.error?.message || 'Erro ao criar creative';
      logger('error', 'CREATIVE-ERROR', errorMsg, { 
        contingency_id,
        campaign_id: campaignId,
        adset_id: adSetId
      });

      await supabase
        .from('campaign_contingency')
        .update({
          status: 'auto_retry_failed',
          retry_strategy: 'walink',
          error_message: `Campanha e ad set criados mas falhou creative: ${errorMsg}`,
          partial_meta_campaign_id: campaignId,
          partial_meta_adset_id: adSetId,
          meta_api_trace_id: creativeResponse.headers.get('x-fb-trace-id'),
          attempts: 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', contingency_id);

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMsg,
          contingency_id,
          campaign_id: campaignId,
          adset_id: adSetId,
          stage: 'creative_creation'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const creativeId = creativeResult.id;
    logger('info', 'CREATIVE-SUCCESS', '✅ Creative criado', { 
      contingency_id,
      creative_id: creativeId 
    });

    // ====================================
    // FASE 5: Criar Ad
    // ====================================
    logger('info', 'AD', '📝 Criando anúncio', { contingency_id });

    const adPayload = {
      name: `Ad - ${campaign_data.campaignName}`,
      adset_id: adSetId,
      creative: { creative_id: creativeId },
      status: 'PAUSED'
    };

    const adUrl = `https://graph.facebook.com/${META_API_VERSION}/${actId}/ads?access_token=${access_token}`;
    const adResponse = await metaApiWithRetry(adUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adPayload)
    });

    const adResult = await adResponse.json();

    if (!adResponse.ok) {
      const errorMsg = adResult.error?.message || 'Erro ao criar anúncio';
      logger('error', 'AD-ERROR', errorMsg, { 
        contingency_id,
        campaign_id: campaignId,
        adset_id: adSetId,
        creative_id: creativeId
      });

      await supabase
        .from('campaign_contingency')
        .update({
          status: 'auto_retry_failed',
          retry_strategy: 'walink',
          error_message: `Tudo criado exceto o anúncio final: ${errorMsg}`,
          partial_meta_campaign_id: campaignId,
          partial_meta_adset_id: adSetId,
          partial_meta_creative_id: creativeId,
          meta_api_trace_id: adResponse.headers.get('x-fb-trace-id'),
          attempts: 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', contingency_id);

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMsg,
          contingency_id,
          campaign_id: campaignId,
          adset_id: adSetId,
          creative_id: creativeId,
          stage: 'ad_creation'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const adId = adResult.id;
    logger('info', 'AD-SUCCESS', '✅ Anúncio criado', { 
      contingency_id,
      ad_id: adId 
    });

    // ====================================
    // FASE 6: Salvar campanha na tabela campaigns
    // ====================================
    logger('info', 'SAVE-CAMPAIGN', '💾 Salvando campanha no banco', { contingency_id });

    const { error: campaignInsertError } = await supabase
      .from('campaigns')
      .insert({
        user_id: user_id,
        name: `${campaign_data.campaignName} (wa.me auto)`,
        objective: 'OUTCOME_TRAFFIC',
        status: 'paused',
        meta_campaign_id: campaignId,
        meta_adset_id: adSetId,
        meta_ad_id: adId,
        ad_account_id: ad_account_id,
        facebook_page: page_id,
        instagram_account: instagram_id,
        whatsapp_number: waLinkUrl,
        ad_title: campaign_data.adTitle,
        ad_text: campaign_data.adText,
        budget_daily: parseFloat(campaign_data.dailyBudget),
        destination_url: waLinkUrl,
        age_min: campaign_data.ageMin || 18,
        age_max: campaign_data.ageMax || 65,
        gender: campaign_data.gender || 'all',
        selected_locations: campaign_data.selected_locations || [],
        meta_integration_status: 'completed',
        processing_status: 'completed',
        meta_data: {
          created_via: 'contingency_auto_retry_walink',
          original_contingency_id: contingency_id,
          strategy: 'walink'
        }
      });

    if (campaignInsertError) {
      logger('warn', 'SAVE-CAMPAIGN-ERROR', '⚠️ Campanha criada no Meta mas falhou ao salvar no banco', {
        contingency_id,
        error: campaignInsertError.message
      });
    } else {
      logger('info', 'SAVE-CAMPAIGN-SUCCESS', '✅ Campanha salva no banco', { contingency_id });
    }

    // ====================================
    // FASE 7: Atualizar contingency como sucesso
    // ====================================
    logger('info', 'UPDATE-CONTINGENCY', '📝 Atualizando status da contingência', { contingency_id });

    await supabase
      .from('campaign_contingency')
      .update({
        status: 'auto_retry_success',
        retry_strategy: 'walink',
        partial_meta_campaign_id: campaignId,
        partial_meta_adset_id: adSetId,
        partial_meta_creative_id: creativeId,
        partial_meta_ad_id: adId,
        admin_notes: '✅ Campanha criada automaticamente via wa.me link (OUTCOME_TRAFFIC + LINK_CLICKS)',
        completed_at: new Date().toISOString(),
        attempts: 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', contingency_id);

    logger('info', 'SUCCESS', '🎉 Auto-retry wa.me concluído com sucesso', { 
      contingency_id,
      campaign_id: campaignId,
      adset_id: adSetId,
      creative_id: creativeId,
      ad_id: adId
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        contingency_id,
        campaign_id: campaignId,
        adset_id: adSetId,
        creative_id: creativeId,
        ad_id: adId,
        message: 'Campanha criada com sucesso via wa.me link'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logger('error', 'EXCEPTION', 'Erro inesperado no auto-retry', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        stage: 'exception'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
