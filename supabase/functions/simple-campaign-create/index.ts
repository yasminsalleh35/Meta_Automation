// 🔧 CTWA v23.0.1 - Video creative fix: link field removed from video_data
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SimpleCampaignPayload {
  campaignName: string;
  adTitle: string;
  adText: string;
  fanpage: string;
  instagram: string;
  whatsappLink: string;
  dailyBudget: number;
  startDate: string;
  endDate?: string | null;
  city: string;
  cityCoordinates?: {
    latitude: number;
    longitude: number;
    center: [number, number];
  } | null;
  radius: number;
  countryCode?: string;
  selected_locations?: Array<{
    key?: string;
    name: string;
    type: 'city' | 'region' | 'country';
    country_code?: string;
    region?: string | null;
    radius?: number;
    distance_unit?: 'kilometer' | 'mile';
    latitude?: number;
    longitude?: number;
  }>;
  campaignType: string;
  status: string;
  optimization: string;
  billingEvent: string;
  platforms: string[];
  placements: string[];
  devices: string[];
  gender: string;
  ageMin: number;
  ageMax: number;
  specialCategories: string[];
  selectedMediaMeta?: {
    file_type: string;
    public_url: string;
    filename: string;
  } | null;
  creativeType: 'upload' | 'post';
  object_story_id?: string | null;
  existing_post_id?: string | null;
  useExistingInstagramPost?: boolean;
  selectedInstagramPostId?: string | null;
  instagramUserId?: string | null; // ✅ NOVO: para montar {IG_USER_ID}_{MEDIA_ID}
  // ✅ Phase 4.4: Scheduling — dayparting
  scheduleStartTime?: string | null; // HH:MM format
  scheduleEndTime?: string | null;   // HH:MM format
  enableDayparting?: boolean;
  daypartingDays?: number[];         // 0=Sunday..6=Saturday
  adSchedule?: Array<{
    start_minute: number;
    end_minute: number;
    days: number[];
    timezone_type: string;
  }> | null;
  // ✅ NOVO: Dados do WhatsApp Business para campanhas nativas
  useWhatsAppNumberFromMeta?: boolean;
  whatsapp_meta?: {
    business_id: string;
    waba_id: string;
    phone_number_id: string;
    display_phone_number: string;
    verified_name?: string;
  } | null;
}

// Garante o formato "act_123..." exatamente uma vez para qualquer entrada.
function toAccountPath(adAccountId: string): string {
  const raw = String(adAccountId || '');
  // strip de qualquer prefixo "act_" repetido: "act_act_123" -> "123"
  const numeric = raw.replace(/^act_+/i, '');
  return `act_${numeric}`;
}

// Sanitiza interesses antes da criação do Ad Set
function sanitizeInterests(interests: Array<{id:string,name:string}> = []) {
  const seen = new Set<string>();
  const clean = [];
  for (const it of interests) {
    if (!it?.id || !/^\d+$/.test(it.id) || !it?.name) continue;
    if (seen.has(it.id)) continue;
    seen.add(it.id);
    clean.push({ id: it.id, name: it.name });
  }
  return clean;
}

// Parser robusto para extrair IDs inválidos do erro 1487079
function extractInvalidInterestIds(msg?: string): string[] {
  if (!msg) return [];
  // captura qualquer sequência numérica longa (IDs de interesse costumam ser números grandes)
  const ids = (msg.match(/\b\d{7,}\b/g) || []).map(s => s.trim());
  return Array.from(new Set(ids));
}

// 🔧 Logger Function
function logger(level: 'info' | 'error' | 'warn', stage: string, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logPrefix = `[${timestamp}][simple-campaign-create][${stage.toUpperCase()}]`;
  
  switch (level) {
    case 'info':
      console.log(`${logPrefix} ${message}`, data || '');
      break;
    case 'error':
      console.error(`${logPrefix} ❌ ${message}`, data || '');
      break;
    case 'warn':
      console.warn(`${logPrefix} ⚠️ ${message}`, data || '');
      break;
  }
}

// 🛡️ CONTINGENCY: Função para salvar campanhas em modo contingência
async function saveToContingency(
  supabaseClient: any,
  userId: string,
  payload: SimpleCampaignPayload,
  integration: any,
  error: any,
  errorStage: string,
  partialIds: {
    campaignId?: string;
    adSetId?: string;
    creativeId?: string;
    adId?: string;
  } = {}
): Promise<void> {
  logger('warn', 'CONTINGENCY-SAVE', '💾 Salvando campanha em modo contingência', {
    userId,
    errorStage,
    hasPartialCampaignId: !!partialIds.campaignId,
    hasPartialAdSetId: !!partialIds.adSetId
  });

  try {
    const contingencyData = {
      user_id: userId,
      status: 'pending',
      campaign_data: {
        // Dados originais do payload
        campaignName: payload.campaignName,
        adTitle: payload.adTitle,
        adText: payload.adText,
        fanpage: payload.fanpage,
        instagram: payload.instagram,
        whatsappLink: payload.whatsappLink,
        dailyBudget: payload.dailyBudget,
        startDate: payload.startDate,
        city: payload.city,
        cityCoordinates: payload.cityCoordinates,
        radius: payload.radius,
        selected_locations: payload.selected_locations,
        campaignType: payload.campaignType,
        optimization: payload.optimization,
        billingEvent: payload.billingEvent,
        platforms: payload.platforms,
        placements: payload.placements,
        devices: payload.devices,
        gender: payload.gender,
        ageMin: payload.ageMin,
        ageMax: payload.ageMax,
        specialCategories: payload.specialCategories,
        selectedMediaMeta: payload.selectedMediaMeta,
        creativeType: payload.creativeType,
        object_story_id: payload.object_story_id,
        existing_post_id: payload.existing_post_id,
        useExistingInstagramPost: payload.useExistingInstagramPost,
        selectedInstagramPostId: payload.selectedInstagramPostId,
        instagramUserId: payload.instagramUserId,
        whatsapp_meta: payload.whatsapp_meta,
        
        // Metadados adicionais
        timestamp: new Date().toISOString(),
        user_agent: 'simple-campaign-create-v23.0',
        api_version: 'v23.0'
      },
      error_message: error instanceof Error ? error.message : String(error),
      error_stack: error instanceof Error ? error.stack : null,
      error_stage: errorStage,
      meta_api_trace_id: error?.fbTraceId || error?.body?.error?.fbtrace_id || null,
      
      // IDs parciais se existirem
      partial_meta_campaign_id: partialIds.campaignId || null,
      partial_meta_adset_id: partialIds.adSetId || null,
      partial_meta_creative_id: partialIds.creativeId || null,
      partial_meta_ad_id: partialIds.adId || null,
      
      // Dados da integração
      ad_account_id: integration?.selected_ad_account_ids?.[0] || integration?.ad_account_id,
      page_id: integration?.selected_page_ids?.[0] || integration?.page_id,
      instagram_id: integration?.selected_instagram_ids?.[0] || payload.instagram,
      access_token_preview: integration?.access_token?.substring(0, 10) || null,
      
      attempts: 0
    };

    const { data, error: insertError } = await supabaseClient
      .from('campaign_contingency')
      .insert(contingencyData)
      .select()
      .single();

    if (insertError) {
      logger('error', 'CONTINGENCY-SAVE-ERROR', '❌ Erro ao salvar contingência', {
        error: insertError.message,
        code: insertError.code
      });
    } else {
      logger('info', 'CONTINGENCY-SAVED', '✅ Campanha salva em contingência', {
        contingency_id: data.id,
        user_id: userId,
        error_stage: errorStage
      });

      // ✅ NOVO: Acionar auto-retry wa.me (fire-and-forget)
      try {
        logger('info', 'AUTO-RETRY-TRIGGER', '🔄 Acionando tentativa automática via wa.me', {
          contingency_id: data.id
        });

        // Buscar access_token completo da integração
        const { data: integrationData } = await supabaseClient
          .from('integrations')
          .select('access_token')
          .eq('user_id', userId)
          .eq('provider', 'meta_ads')
          .eq('status', 'active')
          .single();

        if (!integrationData?.access_token) {
          logger('warn', 'AUTO-RETRY-SKIP', '⚠️ Access token não encontrado, pulando auto-retry');
        } else {
          // Invocar edge function de forma assíncrona (não aguardar resposta)
          supabaseClient.functions.invoke('contingency-auto-retry-walink', {
            body: {
              contingency_id: data.id,
              user_id: userId,
              campaign_data: payload,
              ad_account_id: integration.ad_account_id,
              page_id: integration.page_id,
              instagram_id: payload.instagram,
              access_token: integrationData.access_token
            }
          }).then((result: any) => {
            logger('info', 'AUTO-RETRY-INVOKED', '✅ Auto-retry invocado', { result });
          }).catch((err: any) => {
            logger('error', 'AUTO-RETRY-ERROR', '❌ Erro ao invocar auto-retry', { error: err });
          });
        }
      } catch (autoRetryError) {
        logger('error', 'AUTO-RETRY-EXCEPTION', '❌ Exceção ao tentar auto-retry', { 
          error: autoRetryError instanceof Error ? autoRetryError.message : String(autoRetryError)
        });
        // Não lançar erro - auto-retry é opcional
      }
    }
  } catch (saveError) {
    logger('error', 'CONTINGENCY-SAVE-CRITICAL', '❌ Erro crítico ao salvar contingência', {
      error: saveError instanceof Error ? saveError.message : String(saveError)
    });
  }
}

// ==== [ADD] helpers para tratar interesses inválidos (index.ts) ==============

// ==== [ADD] createAdSetWithInterestRetries (index.ts) ========================

async function createAdSetWithInterestRetries({
  adAccountId,
  accessToken,
  adSetPayload,
  logger, // função de log já existente
  maxRetries = 3
}: {
  adAccountId: string;
  accessToken: string;
  adSetPayload: any;
  logger: Function;
  maxRetries?: number;
}) {
  let attempt = 0;
  let lastErr: any = null;
  let payload = JSON.parse(JSON.stringify(adSetPayload));
  
  // ROTA A strict compliance - remove bid fields
  delete payload.bid_amount;
  delete payload.target_roas;

  while (attempt <= maxRetries) {
    try {
      if (attempt > 0) {
        logger('warn', 'ADSET-RETRY', `Retry Ad Set (attempt ${attempt})`, {
          hasFlexibleSpec: !!payload?.targeting?.flexible_spec,
          interestsCount: Array.isArray(payload?.targeting?.flexible_spec?.[0]?.interests)
            ? payload.targeting.flexible_spec[0].interests.length
            : undefined
        });
      }

      const accountPath = toAccountPath(adAccountId);
      const endpoint = `/v23.0/${accountPath}/adsets`;
      logger('info', 'FB-ENDPOINT', 'Calling AdSet endpoint', { endpoint });
      
      const res = await fetch(
        `https://graph.facebook.com${endpoint}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, access_token: accessToken })
        }
      );

      if (res.ok) {
        const result = await res.json();
        return result; // sucesso
      }

      const body = await res.json();
      lastErr = { status: res.status, body };
      const fbMsg: string = body?.error?.error_user_msg || body?.error?.message || String(body?.error?.message ?? '');
      const subcode = body?.error?.error_subcode;

      logger('error', 'FB-ERROR-ADSET', 'Erro na criação do Ad Set', {
        status: res.status,
        fbtrace_id: body?.error?.fbtrace_id,
        error_user_title: body?.error?.error_user_title,
        error_user_msg: fbMsg,
        error_subcode: subcode,
        payload_keys: Object.keys(payload || {})
      });

      // Tratamento específico de interesses inválidos (1487079)
      if (subcode === 1487079 || /Invalid data for field interests/i.test(fbMsg)) {
        const invalidIds = extractInvalidInterestIds(fbMsg);
        let removed: string[] = [];

        if (Array.isArray(payload.targeting?.flexible_spec)) {
          const spec = payload.targeting.flexible_spec[0];
          if (Array.isArray(spec?.interests) && spec.interests.length > 0) {
            if (invalidIds.length > 0) {
              // remove apenas os inválidos
              const before = spec.interests.length;
              spec.interests = spec.interests.filter((i: any) => !invalidIds.includes(String(i?.id)));
              removed = invalidIds;
              logger('info','INTERESTS-AFTER-SANITIZE','Sanitized invalid interests',{ 
                countBefore: before, 
                removedIds: removed, 
                countAfter: spec.interests.length 
              });
              // Se zerou, elimine flexible_spec
              if (spec.interests.length === 0) {
                delete payload.targeting.flexible_spec;
                logger('warn', 'INTERESTS-RETRY', 'Flexible spec emptied — retrying without interests');
              }
            } else {
              // Sem IDs na msg? faz fallback seguro: remove flexible_spec inteira
              delete payload.targeting.flexible_spec;
              logger('warn', 'INTERESTS-RETRY', 'Removed flexible_spec for safety (no IDs parsed)');
            }
          }
        }

        // ✅ retry ÚNICO após saneamento
        // (garantir que targeting_automation.advantage_audience = 0 permaneça no payload)
        if (!payload.targeting.targeting_automation) payload.targeting.targeting_automation = {};
        payload.targeting.targeting_automation.advantage_audience = 0;

        logger('warn', 'ADSET-RETRY', 'Retry Ad Set after interests fix', {
          removed, hasFlexibleSpec: !!payload.targeting.flexible_spec
        });

        attempt++;
        continue; // tenta novamente
      }

      // Tratamento específico do erro 1870227 (advantage_audience obrigatório)
      if (subcode === 1870227 || /Advantage Audience Flag Required/i.test(fbMsg)) {
        if (!payload.targeting.targeting_automation) payload.targeting.targeting_automation = {};
        payload.targeting.targeting_automation.advantage_audience = 0;
        
        logger('warn', 'ADSET-RETRY-1870227', 'Retry Ad Set with explicit advantage_audience flag', {
          advantage_audience: payload.targeting.targeting_automation.advantage_audience
        });

        attempt++;
        continue; // tenta novamente
      }

      // Tratamento específico do erro 2446885 (WhatsApp não é conta Business)
      if (subcode === 2446885) {
        logger('error', 'ADSET-WHATSAPP-NOT-BUSINESS', '❌ Número de WhatsApp não é conta Business', {
          fbtrace_id: body?.error?.fbtrace_id,
          error_user_msg: body?.error?.error_user_msg,
          page_id: (payload as any)?.promoted_object?.page_id,
          whatsapp_phone_number_id: (payload as any)?.promoted_object?.whatsapp_phone_number_id ?? null
        });
        lastErr = {
          status: res.status,
          body,
          userMessage: 'O número de WhatsApp vinculado à sua Página é uma conta pessoal. Acesse o Meta Business Suite e conecte uma conta WhatsApp Business.'
        };
        break;
      }

      // Outros erros → não insistir
      break;
    } catch (err: any) {
      lastErr = err;
      break;
    }
  }

  throw new Error((lastErr as any)?.userMessage || 'Ad set creation failed after retries: ' + (lastErr?.message || lastErr?.body?.error?.error_user_msg || lastErr?.body?.error?.message || 'Unknown error'));
}


// 🏷️ Special Ad Categories Normalization
type SpecialAdCategory = "NONE" | "CREDIT" | "EMPLOYMENT" | "HOUSING" | "ISSUES_ELECTIONS_POLITICS";

function normalizeSpecialAdCategories(input?: string | string[]) {
  const allowed = new Set<SpecialAdCategory>([
    "NONE","CREDIT","EMPLOYMENT","HOUSING","ISSUES_ELECTIONS_POLITICS"
  ]);

  const raw = Array.isArray(input) ? input : (input ? [input] : []);
  const cats = raw
    .map(s => String(s).toUpperCase().trim())
    .filter(s => allowed.has(s as SpecialAdCategory)) as SpecialAdCategory[];

  const categories: SpecialAdCategory[] = cats.length ? cats : ["NONE"];
  const needsCountry = categories.includes("ISSUES_ELECTIONS_POLITICS");

  // Ajuste se você tiver país do usuário/conta; por ora BR resolve nosso caso
  const country = needsCountry ? ["BR"] : undefined;

  return { categories, country };
}

// 🎥 Get Best Video Thumbnail
async function getBestVideoThumb(videoId: string, accessToken: string): Promise<string | null> {
  const url = `https://graph.facebook.com/v23.0/${videoId}/thumbnails?fields=uri,is_preferred,height,width&limit=25&access_token=${accessToken}`;
  const res = await fetch(url);
  let data: any = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    console.warn('[VIDEO-THUMB][FB-ERROR]', { status: res.status, fbtrace_id: res.headers.get('x-fb-trace-id'), body: data });
    return null;
  }

  const thumbs: Array<{uri: string; is_preferred?: boolean; height?: number; width?: number}> = data?.data || [];
  if (!thumbs.length) return null;

  // 1) preferida pela Meta
  const preferred = thumbs.find(t => t.is_preferred && t.uri);
  if (preferred?.uri) {
    console.log('[VIDEO-THUMB-SELECT]', { reason: 'is_preferred', uri: preferred.uri });
    return preferred.uri;
  }

  // 2) maior área (melhor qualidade)
  const byArea = thumbs
    .filter(t => t?.uri)
    .map(t => ({ ...t, area: (t.height || 0) * (t.width || 0) }))
    .sort((a,b) => (b.area - a.area));
  if (byArea[0]?.uri) {
    console.log('[VIDEO-THUMB-SELECT]', { reason: 'largest_area', uri: byArea[0].uri });
    return byArea[0].uri;
  }

  // 3) fallback: primeira disponível
  console.log('[VIDEO-THUMB-SELECT]', { reason: 'first', uri: thumbs[0].uri });
  return thumbs[0].uri || null;
}

// 🎥 Wait for Video Ready with thumbnails endpoint (more reliable)
async function waitVideoReady(
  videoId: string,
  accessToken: string,
  opts: { timeoutMs?: number; pollMs?: number } = {}
): Promise<{ ready: boolean; thumbUrl?: string }> {
  const timeoutMs = opts.timeoutMs ?? 300_000; // 5 minutes default
  const pollMs = opts.pollMs ?? 3_000; // 3 seconds between checks
  const start = Date.now();

  logger('info', 'video-processing', 'Aguardando processamento do vídeo', { videoId });

  while (Date.now() - start < timeoutMs) {
    try {
      // ✅ RELIABLE METHOD: Check thumbnails endpoint
      const thumbsResponse = await fetch(`https://graph.facebook.com/v23.0/${videoId}/thumbnails?limit=1&fields=uri&access_token=${accessToken}`);
      
      if (thumbsResponse.ok) {
        const thumbsData = await thumbsResponse.json();
        const hasThumb = Array.isArray(thumbsData?.data) && thumbsData.data.length > 0;
        
        if (hasThumb) {
          const thumbUrl = thumbsData.data[0].uri;
          logger('info', 'video-ready', 'Vídeo processado com sucesso', {
            videoId,
            thumbUrl: thumbUrl.substring(0, 50) + '...',
            elapsed: Date.now() - start
          });
          return { ready: true, thumbUrl };
        }
      }

      // Best-effort status logging (don't depend on these fields)
      try {
        const statusUrl = `https://graph.facebook.com/v23.0/${videoId}?fields=status&access_token=${accessToken}`;
        const statusResponse = await fetch(statusUrl);
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          logger('info', 'video-status', 'Status do processamento do vídeo', {
            videoId,
            status: statusData.status,
            hasThumb: false,
            elapsed: Date.now() - start
          });
        }
      } catch (statusError) {
        // Ignore status check errors - thumbnails check is the reliable method
      }

    } catch (error) {
      logger('warn', 'video-status', 'Erro ao verificar status do vídeo', { videoId, error: error instanceof Error ? error.message : String(error) });
    }
    
    await new Promise(r => setTimeout(r, pollMs));
  }
  
  logger('warn', 'video-timeout', 'Timeout aguardando processamento do vídeo', { videoId, timeoutMs });
  return { ready: false };
}

// 🎨 Build Video Creative Payload - ROUTE A (Website/WhatsApp)
function buildVideoCreativePayload(opts: {
  pageId: string;
  instagramUserId?: string | null;
  videoId: string;
  message?: string | null;
  title?: string | null;
  ctaLink?: string | null;
  thumbUrl?: string | null;
  includeIG: boolean;
  includeCTA: boolean;
  ctaType?: 'WHATSAPP_MESSAGE' | 'LEARN_MORE'; // ✅ CTA dinâmico
  usedMode?: 'whatsapp_native' | 'traffic_fallback' | 'leads'; // ✅ CRÍTICO para garantir link
}) {
  const video_data: any = {
    video_id: opts.videoId,
    title: opts.title ?? " ",  // string (avoid null)
    message: opts.message ?? " ", // string (avoid null)
  };

  // ✅ CTWA v23.0 FIX: Para vídeos, "link" NÃO é permitido dentro de video_data
  // O destino WhatsApp vem do Ad Set via promoted_object.page_id
  // Apenas incluímos call_to_action: { type: 'WHATSAPP_MESSAGE' }
  if (opts.includeCTA) {
    if (opts.ctaType === 'WHATSAPP_MESSAGE') {
      // Para CTWA: apenas o CTA, sem campo "link"
      video_data.call_to_action = { type: 'WHATSAPP_MESSAGE' };
      logger('info', 'CREATIVE-VIDEO-CTA', 'CTA WHATSAPP_MESSAGE adicionado (sem link em video_data)', { 
        mode: opts.usedMode,
        note: 'Destino WhatsApp vem do Ad Set promoted_object.page_id'
      });
    } else if (opts.ctaLink) {
      // Para outros CTAs (LEARN_MORE): incluir link E call_to_action
      video_data.link = opts.ctaLink;
      video_data.call_to_action = {
        type: 'LEARN_MORE',
        value: { link: opts.ctaLink }
      };
      logger('info', 'CREATIVE-VIDEO-CTA', 'CTA LEARN_MORE com link adicionado', { 
        link: opts.ctaLink.substring(0, 30) + '...'
      });
    }
  }

  // MANDATORY: Thumbnail for video creatives (CRITICAL to avoid error 1443226)
  if (opts.thumbUrl) {
    video_data.image_url = opts.thumbUrl;
  } else {
    logger('error', 'video-thumb-missing', 'CRITICAL: Thumbnail obrigatório para creative de vídeo', { videoId: opts.videoId });
    throw new Error('VIDEO_THUMB_REQUIRED - image_url obrigatório em video_data para evitar erro 1443226');
  }

  // ROUTE A: object_story_spec with Instagram integration
  const object_story_spec: any = {
    page_id: opts.pageId,
    video_data
  };

  // [IG-INCLUDE] — ADICIONAR: só seta se existir IG
  if (opts.includeIG && opts.instagramUserId) {
    object_story_spec.instagram_user_id = opts.instagramUserId;
    logger('info','IG-USED','Using instagram user for creative',{ instagramUserId: String(opts.instagramUserId||'').slice(0,6)+'...' });
  }

  const payload = {
    object_story_spec
  };

  logger('info', 'creative-video-payload', 'Video creative payload built', {
    page_id: object_story_spec.page_id,
    video_id: video_data.video_id,
    has_image_url: !!video_data.image_url,
    cta_type: video_data.call_to_action?.type,
    cta_link: video_data.call_to_action?.value?.link 
      ? video_data.call_to_action.value.link.substring(0, 30) + '...'
      : 'N/A'
  });

  return payload;
}

// 🎨 Build Image Creative Payload  
function buildImageCreativePayload(opts: {
  pageId: string;
  instagramUserId?: string | null;
  imageHash: string;
  message?: string | null;
  title?: string | null;
  ctaLink?: string | null;
  includeIG: boolean;
  includeCTA: boolean;
  ctaType?: 'WHATSAPP_MESSAGE' | 'LEARN_MORE'; // ✅ CTA dinâmico
  usedMode?: 'whatsapp_native' | 'traffic_fallback' | 'leads'; // ✅ CRÍTICO para garantir link
}) {
  const link_data: any = {
    image_hash: opts.imageHash,
    message: opts.message || '',
    name: opts.title || '',
  };

  // ✅ CTWA v23.0 CRITICAL FIX: Campo "link" é SEMPRE obrigatório para modo whatsapp_native
  if (opts.usedMode === 'whatsapp_native') {
    // Para CTWA, SEMPRE incluir link (Meta API exige mesmo sem CTA visível)
    link_data.link = opts.ctaLink || `https://wa.me/${opts.pageId}`;
    logger('info', 'CREATIVE-LINK-ADDED', 'Link CTWA obrigatório incluído', { 
      link: link_data.link.substring(0, 30) + '...',
      source: opts.ctaLink ? 'provided' : 'page_fallback',
      mode: opts.usedMode
    });
  } else if (opts.ctaLink) {
    // Para outros modos, usar link se fornecido
    link_data.link = opts.ctaLink;
  }

  // ✅ CTA dinâmico: WHATSAPP_MESSAGE (nativo) ou LEARN_MORE (wa.me)
  if (opts.includeCTA) {
    if (opts.ctaType === 'WHATSAPP_MESSAGE') {
      link_data.call_to_action = { type: 'WHATSAPP_MESSAGE' };
    } else if (opts.ctaLink) {
      link_data.call_to_action = {
        type: 'LEARN_MORE',
        value: { link: opts.ctaLink }
      };
    }
  }

  const object_story_spec: any = {
    page_id: opts.pageId,
    link_data
  };

  if (opts.includeIG && opts.instagramUserId) {
    object_story_spec.instagram_user_id = opts.instagramUserId;
    logger('info','IG-USED','Using instagram user for creative',{ instagramUserId: String(opts.instagramUserId||'').slice(0,6)+'...' });
  }

  const payload = {
    name: 'Image Creative',
    object_story_spec
  };

  console.log('[CREATIVE-IMAGE-PAYLOAD]', JSON.stringify(payload));
  return payload;
}

// 🔄 Fetch with Exponential Backoff & Retry for Rate Limits
async function fetchWithBackoff(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      logger('info', 'FETCH-ATTEMPT', `Tentativa ${attempt + 1}/${maxRetries + 1}`, { url: url.substring(0, 80) });
      
      const response = await fetch(url, options);
      
      // Success case
      if (response.ok) {
        return response;
      }
      
      // Check for rate limit errors
      const isRateLimit = response.status === 429;
      let errorBody: any = null;
      
      try {
        const clonedResponse = response.clone();
        errorBody = await clonedResponse.json();
      } catch {}
      
      const errorCode = errorBody?.error?.code;
      const errorSubcode = errorBody?.error?.error_subcode;
      const isMetaRateLimit = errorCode === 80004 || errorCode === 17 || errorSubcode === 2446079;
      
      if (isRateLimit || isMetaRateLimit) {
        if (attempt < maxRetries) {
          // Calculate backoff delay: exponential with jitter
          const baseDelay = 1000; // 1s
          const exponentialDelay = baseDelay * Math.pow(2, attempt); // 1s, 2s, 4s
          const jitter = Math.random() * 1000; // 0-1s random
          const totalDelay = Math.min(exponentialDelay + jitter, 32000); // max 32s
          
          const retryAfter = response.headers.get('Retry-After');
          const finalDelay = retryAfter ? parseInt(retryAfter) * 1000 : totalDelay;
          
          logger('warn', 'RATE-LIMIT-RETRY', `Rate limit detectado, aguardando ${Math.round(finalDelay / 1000)}s antes de retry`, {
            attempt: attempt + 1,
            maxRetries,
            errorCode,
            errorSubcode,
            retryAfter,
            calculatedDelay: Math.round(totalDelay / 1000) + 's',
            finalDelay: Math.round(finalDelay / 1000) + 's',
            fbTraceId: response.headers.get('x-fb-trace-id')
          });
          
          await new Promise(resolve => setTimeout(resolve, finalDelay));
          continue; // Retry
        } else {
          logger('error', 'RATE-LIMIT-EXHAUSTED', 'Retries esgotadas após rate limit', {
            attempts: maxRetries + 1,
            errorCode,
            errorSubcode,
            fbTraceId: response.headers.get('x-fb-trace-id')
          });
          throw new Error(`Meta API Rate Limit: ${errorBody?.error?.message || 'Too many requests'} (Code: ${errorCode})`);
        }
      }
      
      // Non-rate-limit error - return response for caller to handle
      return response;
      
    } catch (error) {
      lastError = error as Error;
      
      // Network errors - retry with backoff
      if (attempt < maxRetries) {
        const delay = 1000 * Math.pow(2, attempt) + Math.random() * 1000;
        logger('warn', 'NETWORK-ERROR-RETRY', `Erro de rede, retry em ${Math.round(delay / 1000)}s`, {
          attempt: attempt + 1,
          maxRetries,
          error: lastError.message
        });
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw lastError;
    }
  }
  
  throw lastError || new Error('Fetch failed after retries');
}

// ⏱️ Smart Delay Between Meta API Calls
async function smartDelay(ms: number, context: string) {
  logger('info', 'SMART-DELAY', `Aguardando ${ms}ms para evitar rate limit`, { context });
  await new Promise(resolve => setTimeout(resolve, ms));
}

// 📤 Upload Media to Meta
async function uploadMediaToMeta(params: {
  adAccountId: string;
  fileUrl: string;
  accessToken: string;
  apiVersion?: string;
  forceVideo?: boolean;
}): Promise<{ hash?: string; video_id?: string; file_type: string }> {
  const { adAccountId, fileUrl, accessToken, apiVersion = "v20.0", forceVideo = false } = params;

  const accountPath = toAccountPath(adAccountId);
  logger('info', 'upload-start', 'Iniciando upload de mídia', { fileUrl, accountPath, forceVideo });

  // Detect file type from URL or content-type (forceVideo overrides for Instagram Reels)
  const isVideo = forceVideo || fileUrl.includes('.mp4') || fileUrl.includes('.mov') || fileUrl.includes('.avi');

  if (isVideo) {
    const url = `https://graph.facebook.com/v23.0/${accountPath}/advideos`;
    
    const formData = new FormData();
    formData.set("file_url", fileUrl);
    // Optional: add name/description
    // formData.set("name", "campaign-video.mp4");

    const res = await fetchWithBackoff(url + `?access_token=${encodeURIComponent(accessToken)}`, {
      method: "POST",
      body: formData
    }, 3);

    let body: any = null;
    try { body = await res.json(); } catch {}

    if (!res.ok) {
      logger('error', 'video-upload', 'Erro no upload do vídeo', {
        status: res.status,
        fbtrace_id: res.headers.get("x-fb-trace-id"),
        body,
        endpoint: url
      });
      throw new Error(`Video upload failed: ${JSON.stringify(body)}`);
    }

    const videoId = body?.id;
    if (!videoId) {
      throw new Error("Video upload succeeded but no id returned");
    }

    logger('info', 'video-upload-success', 'Vídeo enviado com sucesso', {
      videoId,
      fbtrace_id: res.headers.get("x-fb-trace-id"),
      endpoint: url
    });

    return { video_id: videoId, file_type: 'video' };
  } else {
    // Image upload - keep existing blob method as it works fine
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      throw new Error(`Failed to download file: ${fileResponse.statusText}`);
    }

    const fileBlob = await fileResponse.blob();
    const formData = new FormData();
    formData.append('source', fileBlob, 'image.jpg');
    formData.append('name', 'Campaign Image');
    
    const uploadUrl = `https://graph.facebook.com/v23.0/${accountPath}/adimages`;
    const uploadResponse = await fetchWithBackoff(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: formData,
    }, 3);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      logger('error', 'image-upload', 'Erro no upload da imagem', { error: errorText });
      throw new Error(`Image upload failed: ${errorText}`);
    }

    const result = await uploadResponse.json();
    const imageHash = result.images?.[Object.keys(result.images)[0]]?.hash;
    
    if (!imageHash) {
      throw new Error('Failed to get image hash from upload response');
    }

    logger('info', 'image-upload-success', 'Imagem enviada com sucesso', { imageHash });
    return { hash: imageHash, file_type: 'image' };
  }
}

// 🎯 Create Ad Creative with Retries
async function createAdCreativeWithRetries(
  adAccountId: string,
  pageId: string,
  instagramUserId: string | null,
  uploadResult: { hash?: string; video_id?: string; file_type: string },
  adText: string,
  adTitle: string,
  waLink: string,
  accessToken: string,
  usedMode?: 'whatsapp_native' | 'traffic_fallback' | 'leads' // ✅ NOVO
): Promise<string> {
  const accountPath = toAccountPath(adAccountId);
  let thumbUrl: string | null = null;

  // For videos, get thumbnail - MANDATORY for video creatives
  if (uploadResult.video_id) {
    logger('info', 'video-processing', 'Aguardando processamento do vídeo', { videoId: uploadResult.video_id });
    
    const { ready, thumbUrl: videoThumb } = await waitVideoReady(uploadResult.video_id, accessToken, { timeoutMs: 300000 }); // 5 minutes timeout
    
    if (!ready) {
      throw new Error('Video processing failed or timed out');
    }
    
    thumbUrl = videoThumb || null;

    // Fallback: try to get best thumbnail if not returned from waitVideoReady
    if (!thumbUrl) {
      thumbUrl = await getBestVideoThumb(uploadResult.video_id, accessToken);
    }

    // ✅ CRITICAL: Thumbnail is MANDATORY for video creatives to avoid error 1443226
    if (!thumbUrl) {
      throw new Error('VIDEO_THUMB_REQUIRED - Thumbnail obrigatório para creative de vídeo (erro 1443226)');
    }
    
    logger('info', 'video-thumb-ready', 'Thumbnail do vídeo obtido', { thumbUrl: thumbUrl.substring(0, 50) + '...' });
  }

  // Retry configurations
  const retryConfigs = [
    { includeIG: true, includeCTA: true, name: 'full' },
    { includeIG: false, includeCTA: true, name: 'no-ig' },
    { includeIG: true, includeCTA: false, name: 'no-cta' },
    { includeIG: false, includeCTA: false, name: 'minimal' }
  ];

  for (const config of retryConfigs) {
    try {
      logger('info', 'creative-attempt', `Tentativa de criação do creative: ${config.name}`, config);

      // ✅ Determinar CTA baseado no modo usado
      const ctaType = (usedMode === 'whatsapp_native' && config.includeCTA) ? 'WHATSAPP_MESSAGE' : 'LEARN_MORE';

      let payload;
      if (uploadResult.video_id) {
        payload = buildVideoCreativePayload({
          pageId,
          instagramUserId,
          videoId: uploadResult.video_id,
          message: adText,
          title: adTitle,
          ctaLink: waLink,
          thumbUrl,
          includeIG: config.includeIG,
          includeCTA: config.includeCTA,
          ctaType, // ✅ CTA dinâmico
          usedMode // ✅ CRÍTICO: Passar usedMode para garantir link em todas as tentativas
        });
      } else if (uploadResult.hash) {
        payload = buildImageCreativePayload({
          pageId,
          instagramUserId,
          imageHash: uploadResult.hash,
          message: adText,
          title: adTitle,
          ctaLink: waLink,
          includeIG: config.includeIG,
          includeCTA: config.includeCTA,
          ctaType, // ✅ CTA dinâmico
          usedMode // ✅ CRÍTICO: Passar usedMode para garantir link em todas as tentativas
        });
      } else {
        throw new Error('Neither video_id nor hash available from upload result');
      }

      const endpoint = `/v23.0/${accountPath}/adcreatives`;
      logger('info', 'FB-ENDPOINT', 'Calling Creative endpoint', { endpoint });
      
      const response = await fetch(`https://graph.facebook.com${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...payload, access_token: accessToken })
      });

      if (response.ok) {
        const result = await response.json();
        logger('info', 'creative-success', `Creative criado com sucesso: ${config.name}`, { 
          creativeId: result.id,
          ctaType,
          mode: usedMode 
        });
        return result.id;
      }

      const errorData = await response.json();
      
      // ✅ Fallback automático: se WhatsApp CTA falhar, tentar LEARN_MORE
      if (ctaType === 'WHATSAPP_MESSAGE' && waLink) {
        logger('warn', 'WHATSAPP-CREATIVE-FALLBACK', 'CTA WhatsApp falhou, tentando LEARN_MORE', {
          error: errorData?.error?.message?.substring(0, 100)
        });
        // Próxima iteração do loop tentará sem WhatsApp CTA
        continue;
      }

      const code = errorData?.error?.code;
      const subcode = errorData?.error?.error_subcode;
      
      logger('warn', 'creative-error', `Erro na tentativa ${config.name}`, { code, subcode, error: errorData.error });

      // Handle specific error 1443226 (missing thumbnail)
      if (subcode === 1443226) {
        logger('error', 'fb-error', 'Erro 1443226: Seu anúncio precisa de uma miniatura de vídeo', {
          error_user_title: 'Seu anúncio precisa de uma miniatura de vídeo',
          videoId: uploadResult.video_id,
          hasThumbUrl: !!thumbUrl
        });
        // Força nova tentativa garantindo thumb
        if (!thumbUrl && uploadResult.video_id) {
          thumbUrl = await getBestVideoThumb(uploadResult.video_id, accessToken);
        }
        continue; // Try again with thumbnail
      }

      // Handle Instagram errors with retry logic for video
      if (code === 100 && (errorData.error?.message?.includes('instagram_actor_id') || errorData.error?.message?.includes('instagram_user_id'))) {
        logger('warn','IG-RETRY','Retrying creative without instagram_user_id');
        continue; // Will try without IG in next iteration
      }

      // Handle CTA errors
      if (code === 100 && errorData.error?.message?.includes('call_to_action')) {
        logger('warn', 'cta-error', 'Erro de CTA, tentando sem CTA na próxima');
        continue; // Will try without CTA in next iteration
      }

      // If this is the last retry, throw the error
      if (config === retryConfigs[retryConfigs.length - 1]) {
        throw new Error(`Creative creation failed: ${errorData.error?.message || 'Unknown error'}`);
      }

    } catch (error: any) {
      logger('error', 'creative-attempt-error', `Erro na tentativa ${config.name}`, { error: error.message });
      
      // If this is the last retry, re-throw the error
      if (config === retryConfigs[retryConfigs.length - 1]) {
        throw error;
      }
    }
  }

  throw new Error('All creative creation attempts failed');
}

// 🚀 Main Handler
serve(async (req) => {
  logger('info', 'startup', '🚀 Iniciando processamento da requisição');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    logger('info', 'cors', 'Processando requisição OPTIONS (CORS preflight)');
    return new Response('ok', { headers: corsHeaders });
  }

  // ✅ MOVER DECLARAÇÕES PARA FORA DO TRY-CATCH (disponível no catch para contingência)
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // ✅ DECLARAR VARIÁVEIS DE RESULTADO (antes do try)
  let user: any = null;
  let integration: any = null;
  let payload: SimpleCampaignPayload | null = null;
  let campaignResult: any = null;
  let adSetResult: any = null;
  let creativeId: string | null = null;
  let adResult: any = null;
  let uploadResult: { hash?: string; video_id?: string; file_type: string } | null = null;

  try {
    // Get request body
    payload = await req.json();
    logger('info', 'payload-received', 'Payload da campanha recebido', { 
      campaignName: payload.campaignName,
      creativeType: payload.creativeType,
      hasMedia: !!payload.selectedMediaMeta 
    });

    // Get Meta Ads config
    const { data: metaConfig } = await supabaseClient
      .rpc('get_meta_ads_config')
      .single();

    if (!metaConfig) {
      throw new Error('Meta Ads configuration not found');
    }

    // Get user's integration
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Authorization header missing');
    }

    const token = authHeader.split(' ')[1];
    const { data: { user: authUser } } = await supabaseClient.auth.getUser(token);
    
    if (!authUser) {
      throw new Error('User not authenticated');
    }

    user = authUser; // ✅ ATRIBUIR (não declarar)

    const { data: integrationData } = await supabaseClient
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'meta_ads')
      .eq('status', 'active')
      .single();

    if (!integrationData) {
      throw new Error('Meta Ads integration not found or inactive');
    }

    integration = integrationData; // ✅ ATRIBUIR (não declarar)

    const accessToken = integration.access_token;
    const adAccountId = integration.ad_account_id;
    const pageId = integration.page_id;
    const whatsappPhoneId = integration.selected_whatsapp_phone_id ?? null;

    logger('info', 'integration-found', 'Integração Meta encontrada', {
      adAccountId: adAccountId?.substring(0, 10) + '...',
      pageId,
      hasWhatsappPhoneId: !!whatsappPhoneId,
      whatsappDisplay: integration.selected_whatsapp_display ?? null
    });

    // [PROFILE-LOAD] — ADICIONAR (não remova nada existente daqui pra cima)
    let campaignProfile: any = null;
    try {
      const { getUserCampaignProfile } = await import('./utils.ts'); // manter caminho/arquivo existentes
      campaignProfile = await getUserCampaignProfile(supabaseClient, user.id);
      logger('info', 'PROFILE-LOADED', 'Campaign profile loaded', {
        hasProfile: !!campaignProfile,
        profileId: campaignProfile?.id
      });
    } catch (err) {
      logger('warn', 'PROFILE-LOAD-ERROR', 'Failed to load campaign profile', { message: (err as Error).message });
    }

    // Upload media if provided
    if (payload.selectedMediaMeta?.public_url) {
      const uploadStartTime = Date.now();
      logger('info', 'UPLOAD-START', 'Iniciando upload de mídia para Meta API');
      uploadResult = await uploadMediaToMeta({
        adAccountId,
        fileUrl: payload.selectedMediaMeta.public_url,
        accessToken
      });
      logger('info', 'media-uploaded', 'Mídia enviada com sucesso', { uploadResult });
      
      // ✅ Delay estratégico após upload de mídia (operação pesada)
      await smartDelay(1500, 'post-media-upload');
    }

    // ✅ CTWA NATIVO: WhatsApp opcional - promoted_object.page_id busca automaticamente
    logger('info', 'CTWA-WHATSAPP-MODE', '🔗 Modo WhatsApp configurado', {
      whatsappLink: payload.whatsappLink || null,
      pageId: pageId,
      mode: payload.whatsappLink ? 'manual_whatsapp_provided' : 'auto_from_page_id',
      note: payload.whatsappLink 
        ? 'WhatsApp fornecido manualmente pelo usuário'
        : 'WhatsApp será buscado automaticamente via promoted_object.page_id'
    });

    // Validação obrigatória apenas da página
    if (!pageId) {
      throw new Error('Página do Facebook é obrigatória para campanhas CTWA');
    }

    // ✅ PHASE 6: WhatsApp pre-validation (non-blocking)
    // Checks if the page has WhatsApp connected before attempting campaign creation.
    // If user has selected a phone_number_id, we trust it. Otherwise, verify via page.
    if (!whatsappPhoneId) {
      try {
        const pageCheckRes = await fetch(
          `https://graph.facebook.com/v23.0/${pageId}?fields=whatsapp_number{display_phone_number}&access_token=${accessToken}`,
          { signal: AbortSignal.timeout(8000) }
        );

        if (pageCheckRes.ok) {
          const pageData = await pageCheckRes.json();
          if (!pageData.whatsapp_number) {
            logger('error', 'CTWA-VALIDATION', '❌ Página sem WhatsApp Business conectado', {
              pageId,
              solution: `https://business.facebook.com/latest/settings/pages/${pageId}/whatsapp`
            });
            throw new Error(
              'A Página selecionada não possui WhatsApp Business conectado. ' +
              'Acesse o Meta Business Suite e vincule uma conta WhatsApp Business à sua Página, ' +
              'ou selecione um número de WhatsApp na tela de integrações.'
            );
          }
          logger('info', 'CTWA-VALIDATION', '✅ WhatsApp verificado via página', {
            pageId,
            whatsappNumber: pageData.whatsapp_number.display_phone_number
          });
        } else {
          // API check failed but user may still have valid setup — allow and let Meta API decide
          logger('warn', 'CTWA-VALIDATION', 'Não foi possível verificar WhatsApp via API, prosseguindo', {
            pageId,
            status: pageCheckRes.status
          });
        }
      } catch (whatsappCheckError: any) {
        // If this is our own validation error, re-throw it
        if (whatsappCheckError.message?.includes('WhatsApp Business conectado')) {
          throw whatsappCheckError;
        }
        // Network/timeout errors: log and proceed — Meta API will be the final validator
        logger('warn', 'CTWA-VALIDATION', 'Verificação de WhatsApp falhou (timeout/rede), prosseguindo', {
          error: whatsappCheckError instanceof Error ? whatsappCheckError.message : String(whatsappCheckError)
        });
      }
    } else {
      logger('info', 'CTWA-VALIDATION', '✅ WhatsApp phone_number_id fornecido pelo usuário', {
        pageId,
        whatsappPhoneId,
        whatsappDisplay: integration.selected_whatsapp_display ?? null
      });
    }

    logger('info', 'CTWA-CONFIG', 'Configuração CTWA detectada', {
      hasWhatsAppLink: !!payload.whatsappLink,
      whatsappNumber: payload.whatsappLink 
        ? payload.whatsappLink.substring(0, 30) + '...' 
        : 'AUTO (via promoted_object.page_id)',
      pageId: pageId.substring(0, 10) + '...'
    });
    
    // ✅ Create campaign - OUTCOME_ENGAGEMENT (v23.0)
    const { categories, country } = normalizeSpecialAdCategories(payload.specialCategories);
    
    const campaignPayload = {
      name: payload.campaignName,
      objective: 'OUTCOME_ENGAGEMENT', // ✅ Meta API v23.0 usa "OUTCOME_ENGAGEMENT" para Click-to-WhatsApp
      status: 'PAUSED',
      special_ad_categories: categories.length === 1 && categories[0] === 'NONE' ? [] : categories,
      access_token: accessToken
      // ❌ NÃO incluir promoted_object aqui - vai no AdSet
    };

    if (country) {
      // special_ad_category_country só é usado para algumas categorias como IEP
      if (country && payload.specialCategories && payload.specialCategories.length > 0) {
        (campaignPayload as any).special_ad_category_country = country;
      }
    }

    // LOG útil para auditoria
    logger('info', 'campaign-payload', 'Campaign payload preparado (CTWA v23.0)', {
      objective: campaignPayload.objective,
      special_ad_categories: campaignPayload.special_ad_categories,
      api_version: 'v23.0'
    });

    // ✅ LOG específico CTWA
    logger('info', 'CTWA-CAMPAIGN-CONFIG', '📋 Configuração completa CTWA v23.0', {
      objective: 'OUTCOME_ENGAGEMENT',
      api_version: 'v23.0',
      note: 'promoted_object será configurado no AdSet, não no Campaign'
    });

    const accountPath = toAccountPath(adAccountId);
    logger('info','ACCOUNT-PATH','Resolved account path',{ accountPath });
    
    const campaignEndpoint = `/v23.0/${accountPath}/campaigns`;
    logger('info', 'FB-ENDPOINT', 'Calling Campaign endpoint (v23.0)', { endpoint: campaignEndpoint });
    
    const campaignResponse = await fetch(`https://graph.facebook.com${campaignEndpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaignPayload)
    });

    if (!campaignResponse.ok) {
      const errorData = await campaignResponse.json();
      const fbTraceId = campaignResponse.headers.get('x-fb-trace-id');
      
      logger('error', 'CAMPAIGN-CREATION-ERROR', '❌ Erro ao criar campanha CTWA v23.0', {
        status: campaignResponse.status,
        error_code: errorData.error?.code,
        error_subcode: errorData.error?.error_subcode,
        error_message: errorData.error?.message,
        error_user_msg: errorData.error?.error_user_msg,
        fb_trace_id: fbTraceId,
        objective: 'OUTCOME_ENGAGEMENT',
        api_version: 'v23.0'
      });
      
      throw new Error(`Campaign creation failed: ${errorData.error?.message || 'Unknown error'}`);
    }

    campaignResult = await campaignResponse.json(); // ✅ ATRIBUIR (não declarar)
    logger('info', 'campaign-created', '✅ Campanha CTWA v23.0 criada com sucesso', {
      campaignId: campaignResult.id,
      objective: 'OUTCOME_ENGAGEMENT',
      name: payload.campaignName,
      status: 'PAUSED',
      special_ad_categories: campaignPayload.special_ad_categories,
      api_version: 'v23.0'
    });

    // ✅ Delay estratégico após criação de campanha
    await smartDelay(500, 'post-campaign-creation');

    // Create ad set - CTWA EXCLUSIVO: CONVERSATIONS + WHATSAPP
    const adSetName = 'ADSET - Click-to-WhatsApp (Conversas)';
    
    // Map gender to Meta format
    const genderMap: Record<string, number[]> = {
      'all': [0],
      'male': [1], 
      'female': [2]
    };
    const gendersArray = genderMap[payload.gender] || [0];

    // ✅ Phase 4.4: Dayparting requires lifetime_budget + end_time (Meta API constraint)
    const hasDayparting = payload.adSchedule && payload.adSchedule.length > 0 && payload.endDate;
    const budgetInCents = Math.round(payload.dailyBudget * 100);

    const adSetPayload: any = {
      name: adSetName,
      campaign_id: campaignResult.id,
      // When dayparting is active: use lifetime_budget (daily * days remaining)
      // When no dayparting: use daily_budget as before
      ...(hasDayparting
        ? (() => {
            const startMs = new Date(payload.startDate).getTime();
            const endMs = new Date(payload.endDate!).getTime();
            const days = Math.max(1, Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24)));
            return { lifetime_budget: String(budgetInCents * days) };
          })()
        : { daily_budget: String(budgetInCents) }),
      billing_event: 'IMPRESSIONS',
      optimization_goal: 'CONVERSATIONS', // ✅ CTWA: sempre CONVERSATIONS
      destination_type: 'WHATSAPP', // ✅ CTWA: sempre WHATSAPP
      bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
      start_time: payload.startDate,
      ...(payload.endDate ? { end_time: payload.endDate } : {}),
      // ✅ Phase 4.4: Dayparting — ad delivery schedule (only with lifetime_budget + end_time)
      ...(hasDayparting
        ? { adset_schedule: JSON.stringify(payload.adSchedule) }
        : {}),
      status: 'PAUSED',
      promoted_object: {
        page_id: pageId
      }, // ✅ CTWA v23.0: only page_id in promoted_object — WhatsApp resolved from Page's linked WABA
      targeting: {},
      access_token: accessToken
    };

    // [TARGETING-BASE] — ✅ Suportar regions + custom_locations
    let geo_locations: any = {
      location_types: ['home', 'recent']
    };
    
    if (payload.selected_locations && payload.selected_locations.length > 0) {
      logger('info', 'GEO-LOCATIONS-BUILD', 'Building from selected_locations', {
        count: payload.selected_locations.length
      });
      
      const customLocations = [];
      const regions = [];
      
      for (const loc of payload.selected_locations) {
        console.log(`📍 Processando localização:`, {
          name: loc.name,
          type: loc.type,
          hasKey: !!loc.key,
          hasCoordinates: !!(loc.latitude && loc.longitude)
        });

        // ✅ FASE 2: REGIÃO/ESTADO com logs detalhados
        if (loc.type === 'region') {
          // ✅ PRIORIDADE 1: Key Meta oficial (targeting oficial v23)
          if (loc.key) {
            regions.push({ key: loc.key });
            
            logger('info', '🎯 OFFICIAL-REGION-TARGETING', 'Using Meta API official region key', {
              name: loc.name,
              key: loc.key,
              country: loc.country_code,
              source: loc.source || 'meta_api',
              targeting_type: 'geo_locations.regions',
              precision: 'OFFICIAL',
              note: '✅ Estado segmentado via Meta API oficial (v23 compliant)'
            });
            
            console.log(`✅ [OFFICIAL-TARGETING] Estado "${loc.name}" usando key oficial: ${loc.key}`);
            console.log(`   → Payload: geo_locations.regions[{ key: "${loc.key}" }]`);
          } 
          // ✅ FALLBACK 1: Coordenadas com raio amplo (80km max)
          else if (loc.latitude && loc.longitude) {
            customLocations.push({
              latitude: loc.latitude,
              longitude: loc.longitude,
              radius: 80, // Raio máximo permitido pela Meta API
              distance_unit: 'kilometer'
            });
            
            logger('warn', '⚠️ FALLBACK-REGION-COORDINATES', 'Region without Meta key, using custom_location', {
              name: loc.name,
              lat: loc.latitude,
              lng: loc.longitude,
              radius: 80,
              country: loc.country_code,
              source: loc.source || 'mapbox',
              targeting_type: 'custom_locations',
              precision: 'APPROXIMATE',
              note: '⚠️ Targeting aproximado - Meta key não disponível. Recomenda-se conectar Meta API.'
            });
            
            console.warn(`⚠️ [FALLBACK-COORDINATES] Estado "${loc.name}" SEM key Meta`);
            console.log(`   → Usando: custom_locations[{ lat: ${loc.latitude}, lng: ${loc.longitude}, radius: 80km }]`);
            console.log(`   → Precisão: APROXIMADA (recomenda-se Meta API para targeting oficial)`);
          }
          // ❌ FALLBACK 2: País inteiro (última opção)
          else {
            if (!geo_locations.countries) geo_locations.countries = [];
            if (!geo_locations.countries.includes(payload.countryCode || 'BR')) {
              geo_locations.countries.push(payload.countryCode || 'BR');
            }
            
            logger('error', '❌ FALLBACK-REGION-COUNTRY', 'Region targeting fell back to entire country', {
              name: loc.name,
              country: payload.countryCode || 'BR',
              reason: 'No Meta key AND no coordinates available',
              targeting_type: 'geo_locations.countries',
              precision: 'COUNTRY-WIDE',
              note: '❌ TARGETING MUITO AMPLO - Configurar Meta API ou fornecer coordenadas'
            });
            
            console.error(`❌ [FALLBACK-COUNTRY] Estado "${loc.name}" caiu em fallback de país inteiro!`);
            console.error(`   → CRÍTICO: Nenhuma key Meta nem coordenadas disponíveis`);
            console.error(`   → Usando: geo_locations.countries = ["${payload.countryCode || 'BR'}"]`);
          }
        }
        
        // ✅ CIDADE com lat/lng (custom_locations)
        else if (loc.type === 'city' && loc.latitude && loc.longitude) {
          customLocations.push({
            latitude: loc.latitude,
            longitude: loc.longitude,
            radius: loc.radius || payload.radius || 10,
            distance_unit: 'kilometer'
          });
          logger('info', 'GEO-CITY-LATLNG', 'Adding city via lat/lng', {
            name: loc.name,
            lat: loc.latitude,
            lng: loc.longitude,
            radius: loc.radius || payload.radius || 10
          });
        }
        // ✅ Cidade com key Meta (alternativa)
        else if (loc.type === 'city' && loc.key) {
          customLocations.push({
            key: loc.key,
            radius: loc.radius || payload.radius || 10,
            distance_unit: 'kilometer'
          });
          logger('info', 'GEO-CITY-KEY', 'Adding city via Meta key', {
            name: loc.name,
            key: loc.key,
            radius: loc.radius || payload.radius || 10
          });
        }
      }
      
      // ✅ Aplicar regions se houver
      if (regions.length > 0) {
        geo_locations.regions = regions;
        logger('info', 'GEO-TARGETING', 'Using regions targeting', { 
          count: regions.length,
          example: regions[0]
        });
      }
      
      // ✅ Aplicar custom_locations se houver
      if (customLocations.length > 0) {
        geo_locations.custom_locations = customLocations;
        logger('info', 'GEO-TARGETING', 'Using custom_locations', { 
          count: customLocations.length 
        });
      }
      
      // ✅ Fallback se nenhum válido
      if (regions.length === 0 && customLocations.length === 0) {
        geo_locations.countries = [payload.countryCode || 'BR'];
        logger('info', 'GEO-TARGETING', 'Fallback to country', { 
          country: payload.countryCode || 'BR' 
        });
      }
    } 
    // ✅ Fallback legado para cityCoordinates
    else if (payload.cityCoordinates) {
      geo_locations.custom_locations = [{
        latitude: payload.cityCoordinates.latitude,
        longitude: payload.cityCoordinates.longitude,
        radius: payload.radius || 10,
        distance_unit: 'kilometer'
      }];
      logger('info', 'GEO-TARGETING', 'Using legacy cityCoordinates');
    } 
    // ✅ Fallback final
    else {
      geo_locations.countries = [payload.countryCode || 'BR'];
      logger('info', 'GEO-TARGETING', 'Final fallback to country', { 
        country: payload.countryCode || 'BR' 
      });
    }
    
    let targeting = {
      publisher_platforms: ['facebook', 'instagram'],
      facebook_positions: ['feed', 'video_feeds', 'story'],
      instagram_positions: ['stream', 'story', 'reels'],
      device_platforms: ['mobile'],
      geo_locations,
      age_min: payload.ageMin || 18,
      age_max: payload.ageMax || 65,
      genders: gendersArray
    };

    // [TARGETING-OVERLAY] — Apply AI targeting OR profile overlay
    try {
      if (payload.useAISuggestions && payload.aiTargeting) {
        // ✅ AI TARGETING MODE: Use AI-generated targeting instead of profile
        const { resolveInterestNames, sanitizeInterests, mapGenders, clampAge } = await import('./utils.ts');

        // Resolve AI interest names to Meta IDs
        const resolvedInterests = await resolveInterestNames(
          payload.aiTargeting.interests || [],
          accessToken
        );

        const sanitized = sanitizeInterests(resolvedInterests);

        targeting.age_min = clampAge(payload.aiTargeting.ageMin, 13, 65);
        targeting.age_max = clampAge(payload.aiTargeting.ageMax, 13, 65);
        targeting.genders = mapGenders(payload.aiTargeting.genders);

        if (sanitized.length > 0) {
          targeting.flexible_spec = [{ interests: sanitized }];
        }

        logger('info', 'AI-TARGETING-APPLIED', 'AI suggestions applied to targeting (profile overlay skipped)', {
          interests_resolved: sanitized.length,
          age_min: targeting.age_min,
          age_max: targeting.age_max,
          genders: targeting.genders,
        });
      } else if (campaignProfile) {
        // ✅ PROFILE MODE: Apply profile overlay (existing behavior)
        const { applyProfileOverlayOnTargeting } = await import('./utils.ts');
        const targetingBefore = targeting;
        targeting = applyProfileOverlayOnTargeting(targeting, campaignProfile);
        logger('info', 'PROFILE-APPLIED', 'Campaign profile applied to targeting', {
          before: targetingBefore,
          after: targeting
        });
      } else {
        logger('info', 'PROFILE-SKIPPED', 'No campaign profile found; using defaults');
      }
    } catch (err) {
      logger('warn', 'TARGETING-APPLY-ERROR', 'Failed to apply targeting overlay', { message: (err as Error).message });
    }

    // Apply targeting to adSetPayload
    adSetPayload.targeting = targeting;

    // ✅ Sempre explicite a flag exigida pela Meta
    if (!adSetPayload.targeting.targeting_automation) adSetPayload.targeting.targeting_automation = {};
    // Use 0 (desligado) para manter direcionamento manual do perfil
    adSetPayload.targeting.targeting_automation.advantage_audience = 0;

    // Log auxiliar
    logger('info','TARGETING-AUTOMATION','Advantage audience flag applied',{ advantage_audience: 0 });

    const sampleInterestIds = ((targeting as any).flexible_spec?.[0]?.interests || []).slice(0,5).map((i:any)=>i.id);
    logger('info','INTERESTS-SUMMARY','Interests post-profile',{ count: ((targeting as any).flexible_spec?.[0]?.interests||[]).length, sample: sampleInterestIds });
    
    logger('info', 'TARGETING-SUMMARY', 'Resumo do targeting pós-perfil', {
      age_min: targeting.age_min,
      age_max: targeting.age_max,
      genders: targeting.genders,
      hasFlexibleSpec: !!(targeting as any).flexible_spec,
      interestsCount: Array.isArray((targeting as any)?.flexible_spec?.[0]?.interests)
        ? (targeting as any).flexible_spec[0].interests.length
        : 0
    });

    logger('info', 'adset-payload', 'Ad Set CTWA payload prepared', {
      destination_type: adSetPayload.destination_type,
      optimization_goal: adSetPayload.optimization_goal,
      billing_event: adSetPayload.billing_event,
      bid_strategy: adSetPayload.bid_strategy,
      promoted_object: adSetPayload.promoted_object,
      publisher_platforms: adSetPayload.targeting.publisher_platforms,
      daily_budget: adSetPayload.daily_budget,
      has_custom_locations: !!payload.cityCoordinates
    });

    // ✅ Log detalhado do promoted_object antes da criação
    logger('info', 'ADSET-CTWA-CONFIG', '📱 Configuração CTWA do Ad Set', {
      page_id: pageId,
      whatsapp_phone_id_available: whatsappPhoneId ?? 'none',
      whatsapp_display: integration.selected_whatsapp_display ?? null,
      destination_type: 'WHATSAPP',
      optimization_goal: 'CONVERSATIONS',
      note: 'promoted_object contains only page_id — WhatsApp resolved from Page linked WABA'
    });

    // ✅ CREATE AD SET - CTWA SIMPLES (com tratamento de erro específico para WhatsApp)
    try {
      adSetResult = await createAdSetWithInterestRetries({
        adAccountId,
        accessToken,
        adSetPayload,
        logger
      });
    } catch (adSetError: any) {
      // Detectar erro específico de WhatsApp não vinculado
      const errorMessage = adSetError?.message || JSON.stringify(adSetError);
      
      if (errorMessage.includes('whatsapp') || 
          errorMessage.includes('phone number') || 
          errorMessage.includes('not linked')) {
        logger('error', 'ADSET-WHATSAPP-ERROR', '❌ WhatsApp não vinculado à página', {
          pageId: pageId,
          error: errorMessage,
          solution: 'Vincular WhatsApp à página no Meta Business Suite'
        });
        
        throw new Error(
          `WhatsApp não vinculado à página selecionada. ` +
          `Configure em: https://business.facebook.com/latest/settings/pages/${pageId}/whatsapp`
        );
      }
      
      // Re-throw outros erros
      throw adSetError;
    }
    
    const adsetId = adSetResult.id || adSetResult;
    logger('info', 'ADSET-CREATED', '✅ Ad Set CTWA criado com sucesso', {
      adset_id: adsetId,
      campaign_id: campaignResult.id,
      optimization_goal: 'CONVERSATIONS',
      destination_type: 'WHATSAPP',
      promoted_object_page_id: pageId,
      daily_budget: adSetPayload.daily_budget,
      billing_event: adSetPayload.billing_event,
      bid_strategy: adSetPayload.bid_strategy,
      publisher_platforms: adSetPayload.targeting.publisher_platforms
    });

    // ✅ Delay estratégico após criação de adset
    await smartDelay(500, 'post-adset-creation');

    // [IG-RESOLVE] — ADICIONAR (não remova nada existente)
    const instagramUserId: string | null =
      (integration?.selected_instagram_ids && integration.selected_instagram_ids[0]) ||
      payload?.instagram || // caso front envie
      null;

    logger('info', 'IG-RESOLVED', 'Resolved instagram user id', {
      hasIG: !!instagramUserId
    });

    // Create creative - supports both upload and existing post
    if (payload.creativeType === 'post') {
      // ✅ FASE 4: Criar creative com post existente do Instagram
      const mediaId = payload.selectedInstagramPostId;
      const igUserId = payload.instagramUserId || instagramUserId;

      if (!igUserId || !mediaId) {
        throw new Error('Instagram User ID e Media ID são obrigatórios para promover post existente');
      }

      const objectStoryId = `${igUserId}_${mediaId}`;
      const creativeEndpoint = `/v23.0/${toAccountPath(adAccountId)}/adcreatives`;
      const isCTWA = !!payload.whatsappLink;

      logger('info', 'CREATIVE-EXISTING-POST', '🔄 Criando creative com post existente do Instagram (V23)', {
        instagram_user_id: igUserId,
        media_id: mediaId,
        object_story_id: objectStoryId,
        is_ctwa: isCTWA
      });

      // ✅ CTWA campaigns MUST use dark post with WHATSAPP_MESSAGE CTA
      // object_story_id alone does NOT include CTA, causing ad creation to fail
      if (isCTWA) {
        logger('info', 'CREATIVE-CTWA-DARK-POST', '🔄 CTWA campaign: creating dark post with WHATSAPP_MESSAGE CTA (object_story_id incompatible with CTWA)');

        // Step 1: Fetch the original post's media type and URL
        let postMediaType = 'IMAGE';
        let postMediaUrl = '';
        let postThumbnailUrl = '';

        try {
          const mediaCheckUrl = `https://graph.facebook.com/v23.0/${mediaId}?fields=media_type,media_url,thumbnail_url&access_token=${accessToken}`;
          const mediaCheckRes = await fetch(mediaCheckUrl);
          if (mediaCheckRes.ok) {
            const mediaInfo = await mediaCheckRes.json();
            postMediaType = mediaInfo.media_type || 'IMAGE';
            postMediaUrl = mediaInfo.media_url || '';
            postThumbnailUrl = mediaInfo.thumbnail_url || '';
            logger('info', 'CTWA-MEDIA-CHECK', 'Post media info fetched', {
              media_type: postMediaType,
              has_media_url: !!postMediaUrl,
              has_thumbnail: !!postThumbnailUrl
            });
          }
        } catch (mediaCheckErr) {
          logger('warn', 'CTWA-MEDIA-CHECK-FAILED', 'Could not fetch post media info', {
            error: (mediaCheckErr as Error).message
          });
        }

        // Step 2: Build dark post creative with WHATSAPP_MESSAGE CTA
        const darkPostSpec: Record<string, any> = {
          page_id: pageId,
        };

        if (instagramUserId) {
          darkPostSpec.instagram_user_id = instagramUserId;
        }

        if ((postMediaType === 'VIDEO' || postMediaType === 'REELS') && postMediaUrl) {
          // For Reels/Videos: download the video and upload to ad account to get video_id
          logger('info', 'CTWA-VIDEO-DARK-POST', 'Uploading Reel/Video to ad account for CTWA dark post', {
            media_id: mediaId,
            has_media_url: !!postMediaUrl,
            has_thumbnail: !!postThumbnailUrl
          });

          const videoUploadResult = await uploadMediaToMeta({
            adAccountId: accountPath,
            fileUrl: postMediaUrl,
            accessToken,
            apiVersion: 'v23.0',
            forceVideo: true
          });

          if (!videoUploadResult.video_id) {
            throw new Error('Video upload succeeded but no video_id returned');
          }

          logger('info', 'CTWA-VIDEO-UPLOADED', 'Video uploaded to ad account', {
            video_id: videoUploadResult.video_id
          });

          // Wait for video processing
          await smartDelay(3000, 'video-processing-wait');

          if (!postThumbnailUrl) {
            logger('warn', 'CTWA-VIDEO-NO-THUMB', 'No thumbnail available for video, Meta may reject creative');
          }

          darkPostSpec.video_data = {
            video_id: videoUploadResult.video_id,
            message: payload.adText || ' ',
            call_to_action: { type: 'WHATSAPP_MESSAGE' },
            ...(postThumbnailUrl ? { image_url: postThumbnailUrl } : {}),
          };
        } else if (postMediaType === 'IMAGE' && postMediaUrl) {
          darkPostSpec.link_data = {
            image_hash: undefined,
            picture: postMediaUrl,
            message: payload.adText || ' ',
            link: payload.whatsappLink,
            name: payload.adTitle || 'Saiba mais',
            call_to_action: {
              type: 'WHATSAPP_MESSAGE',
              value: { link: payload.whatsappLink }
            }
          };
          // Remove undefined keys
          if (!darkPostSpec.link_data.image_hash) delete darkPostSpec.link_data.image_hash;
          logger('info', 'CTWA-IMAGE-DARK-POST', 'Building image dark post for CTWA', {
            has_image_url: !!postMediaUrl
          });
        } else {
          darkPostSpec.link_data = {
            message: payload.adText || ' ',
            link: payload.whatsappLink,
            name: payload.adTitle || 'Saiba mais',
            call_to_action: {
              type: 'WHATSAPP_MESSAGE',
              value: { link: payload.whatsappLink }
            }
          };
          logger('info', 'CTWA-LINK-DARK-POST', 'Building generic link dark post for CTWA (no media available)');
        }

        const darkPostPayload = {
          name: `${payload.campaignName} - Creative`,
          object_story_spec: darkPostSpec,
          access_token: accessToken
        };

        logger('info', 'FB-ENDPOINT', 'Calling Creative endpoint for CTWA dark post', { endpoint: creativeEndpoint });

        const darkPostResponse = await fetch(`https://graph.facebook.com${creativeEndpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(darkPostPayload)
        });

        if (!darkPostResponse.ok) {
          const darkPostError = await darkPostResponse.json();
          logger('error', 'CTWA-DARK-POST-FAILED', '❌ CTWA dark post creative failed', {
            error: darkPostError.error?.message,
            error_code: darkPostError.error?.code,
            media_type: postMediaType,
          });
          throw new Error(`CTWA dark post creative failed: ${darkPostError.error?.message}`);
        }

        const darkPostResult = await darkPostResponse.json();
        creativeId = darkPostResult.id;
        logger('info', 'CTWA-DARK-POST-SUCCESS', '✅ CTWA dark post creative criado com sucesso', {
          creative_id: creativeId,
          media_type: postMediaType,
          method: postMediaType === 'VIDEO' || postMediaType === 'REELS'
            ? 'video_data.video_id (uploaded)'
            : 'link_data'
        });

      } else {
        // Non-CTWA: Use object_story_id directly (no CTA needed)
        const creativePayload = {
          name: `${payload.campaignName} - Creative`,
          object_story_id: objectStoryId,
          access_token: accessToken
        };

        logger('info', 'FB-ENDPOINT', 'Calling Creative endpoint for existing post (non-CTWA)', { endpoint: creativeEndpoint });

        const creativeResponse = await fetch(`https://graph.facebook.com${creativeEndpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(creativePayload)
        });

        if (!creativeResponse.ok) {
          const errorData = await creativeResponse.json();
          logger('error', 'CREATIVE-EXISTING-POST-ERROR', '❌ Erro ao criar creative com post existente', {
            status: creativeResponse.status,
            error_message: errorData.error?.message,
            object_story_id: objectStoryId
          });
          throw new Error(`Creative creation failed: ${errorData.error?.message}`);
        }

        const creativeResult = await creativeResponse.json();
        creativeId = creativeResult.id;

        logger('info', 'CREATIVE-EXISTING-POST-CREATED', '✅ Creative com post existente criado com sucesso', {
          creative_id: creativeId,
          object_story_id: objectStoryId,
          page_id: pageId
        });
      }

      // ✅ Delay estratégico após criação de creative
      await smartDelay(500, 'post-creative-creation');
      
    } else if (uploadResult) {
      // ✅ Fluxo de upload (não modificado)
      logger('info', 'creative-start', '🎨 Iniciando criação do creative CTWA', {
        call_to_action_type: 'WHATSAPP_MESSAGE',
        has_instagram: !!instagramUserId,
        page_id: pageId,
        media_type: uploadResult?.file_type,
        mode: 'whatsapp_native',
        note: 'Link será pageId como fallback (Meta resolve WhatsApp vinculado)'
      });
      
      creativeId = await createAdCreativeWithRetries(
        adAccountId,
        pageId,
        instagramUserId,
        uploadResult,
        payload.adText,
        payload.adTitle,
        payload.whatsappLink || `https://wa.me/${pageId}`, // ✅ CTWA: Use actual wa.me link when available
        accessToken,
        'whatsapp_native' // ✅ CTWA: sempre usar WHATSAPP_MESSAGE CTA
      );
      
      logger('info', 'creative-created', '✅ Creative CTWA criado com sucesso', {
        creative_id: creativeId,
        cta_type: 'WHATSAPP_MESSAGE',
        page_id: pageId,
        has_instagram: !!instagramUserId
      });

      // ✅ Delay estratégico após criação de creative
      await smartDelay(500, 'post-creative-creation');
    }
    
    // ✅ VALIDAÇÃO: Garantir que creative foi criado
    if (!creativeId) {
      throw new Error('Creative não foi criado. Verifique se mídia foi enviada ou post do Instagram foi selecionado.');
    }

    // Create ad - ROUTE A (with retry for transient Meta errors)
    const adPayload: any = {
      name: `${payload.campaignName} - Ad`,
      adset_id: adSetResult.id,
      creative: { creative_id: creativeId },
      status: 'PAUSED',
      access_token: accessToken
    };

    const adEndpoint = `/v23.0/${toAccountPath(adAccountId)}/ads`;
    logger('info', 'FB-ENDPOINT', 'Calling Ad endpoint (v23.0)', {
      endpoint: adEndpoint,
      creative_id: creativeId,
      adset_id: adSetResult.id
    });

    let adCreationAttempts = 0;
    const maxAdAttempts = 2;

    while (adCreationAttempts < maxAdAttempts) {
      adCreationAttempts++;

      const adResponse = await fetch(`https://graph.facebook.com${adEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adPayload)
      });

      if (adResponse.ok) {
        adResult = await adResponse.json();
        logger('info', 'ad-created', 'Anúncio criado com sucesso', {
          adId: adResult.id,
          creativeId: creativeId,
          attempt: adCreationAttempts
        });
        break;
      }

      const errorData = await adResponse.json();
      const errorMsg = errorData.error?.message || 'Unknown error';

      if (adCreationAttempts < maxAdAttempts) {
        logger('warn', 'AD-CREATION-RETRY', `⚠️ Ad creation failed (attempt ${adCreationAttempts}/${maxAdAttempts}), retrying after delay`, {
          error: errorMsg,
          error_code: errorData.error?.code
        });
        await smartDelay(2000, 'ad-creation-retry');
      } else {
        logger('error', 'AD-CREATION-FAILED', `❌ Ad creation failed after ${maxAdAttempts} attempts`, {
          error: errorMsg,
          error_code: errorData.error?.code
        });
        throw new Error(`Ad creation failed: ${errorMsg}`);
      }
    }

    // Save to database
    const { error: dbError } = await supabaseClient
      .from('campaigns')
      .insert({
        user_id: user.id,
        ad_account_id: adAccountId,
        name: payload.campaignName,
        objective: 'OUTCOME_ENGAGEMENT',
        status: 'paused',
        budget_daily: payload.dailyBudget,
        ad_title: payload.adTitle,
        ad_text: payload.adText,
        whatsapp_number: payload.whatsappLink,
        meta_campaign_id: campaignResult.id,
        meta_adset_id: adSetResult.id,
        meta_ad_id: adResult.id,
        meta_data: {
          campaign_id: campaignResult.id,
          adset_id: adSetResult.id,
          ad_id: adResult.id,
          created_via: 'simple-wizard',
          created_at: new Date().toISOString(),
          page_id: pageId,
          instagram_id: instagramUserId
        },
        start_date: payload.startDate,
        ...(payload.endDate ? { end_date: payload.endDate } : {}),
        // Phase 4.4: Scheduling fields
        ...(payload.scheduleStartTime ? { schedule_start_time: payload.scheduleStartTime } : {}),
        ...(payload.scheduleEndTime ? { schedule_end_time: payload.scheduleEndTime } : {}),
        ...(payload.adSchedule ? { ad_schedule: payload.adSchedule } : {}),
        facebook_page: payload.fanpage,
        instagram_account: payload.instagram,
        location_city: payload.city,
        location_radius: payload.radius,
        selected_locations: payload.selected_locations,
        gender: payload.gender,
        age_min: payload.ageMin,
        age_max: payload.ageMax,
        interests: payload.interests,
        processing_status: 'completed',
        meta_integration_status: 'active',
        needs_immediate_sync: true,
        last_status_sync_at: new Date().toISOString(),
        source: 'camply',
        metrics_window: 'last_30d'
      });

    if (dbError) {
      logger('error', 'database-save', 'Erro ao salvar no banco', { error: dbError });
    } else {
      logger('info', 'database-saved', 'Campanha salva no banco com sucesso');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Campaign created successfully!',
        campaignId: campaignResult.id,
        adSetId: adSetResult.id,
        adId: adResult.id,
        creativeId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    logger('error', 'CAMPAIGN-CREATION-FAILED', '❌ Erro na criação da campanha - Ativando modo contingência', { 
      error: error.message, 
      stack: error.stack 
    });

    // 🛡️ MODO CONTINGÊNCIA: Salvar dados para criação manual
    try {
      // ✅ VALIDAR se temos dados mínimos antes de salvar
      if (user?.id && payload && integration) {
        await saveToContingency(
          supabaseClient,
          user.id,
          payload,
          integration,
          error,
          'campaign_creation_error',
          {
            campaignId: campaignResult?.id || null,
            adSetId: adSetResult?.id || null,
            creativeId: creativeId || null,
            adId: adResult?.id || null
          }
        );
        
        logger('info', 'CONTINGENCY-SAVED', '✅ Campanha salva em modo contingência', {
          user_id: user.id,
          has_campaign_id: !!campaignResult?.id,
          has_adset_id: !!adSetResult?.id
        });
      } else {
        logger('error', 'CONTINGENCY-SKIP', '⚠️ Dados insuficientes para contingência', {
          hasUser: !!user,
          hasPayload: !!payload,
          hasIntegration: !!integration
        });
      }
    } catch (contingencyError) {
      logger('error', 'CONTINGENCY-CRITICAL', '❌ Falha ao salvar contingência', { 
        error: contingencyError instanceof Error ? contingencyError.message : String(contingencyError)
      });
    }

    // ✅ IMPORTANTE: Retornar HTTP 200 (sucesso) para o cliente
    logger('info', 'CONTINGENCY-MODE', '🛡️ Retornando sucesso para cliente (modo contingência ativo)');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        status: 'success',
        message: 'Campanha em processamento! Nossa equipe irá finalizar a configuração em breve.',
        campaignId: campaignResult?.id || 'pending',
        adSetId: 'pending',
        adId: 'pending',
        creativeId: 'pending',
        contingency_mode: true,
        note: 'Esta campanha será processada manualmente pela equipe'
      }),
      { 
        status: 200, // ✅ HTTP 200, não 500!
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});