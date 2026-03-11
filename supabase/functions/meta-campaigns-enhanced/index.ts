import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { handlePreflight, jsonWithCors } from "../_shared/cors.ts";

const API_VERSION = Deno.env.get("META_API_VERSION") ?? "v23.0";

// 🚀 CACHE GLOBAL de 10 minutos para campanhas
const campaignCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return handlePreflight(req);

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const auth = req.headers.get("Authorization");
    if (!auth) return jsonWithCors(origin, { error: "Unauthorized" }, { status: 401 });

    const token = auth.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return jsonWithCors(origin, { error: "Invalid or expired token" }, { status: 401 });

    // Resolve ad account
    const { data: integ } = await admin
      .from("integrations")
      .select("access_token, ad_account_id, selected_ad_account_ids")
      .eq("user_id", user.id)
      .eq("provider", "meta_ads")
      .eq("status", "active")
      .single();

    if (!integ?.access_token) {
      return jsonWithCors(origin, { campaigns: [], error: "No Meta integration" });
    }

    const adAccountId = (integ.selected_ad_account_ids?.[0] ?? integ.ad_account_id ?? "").replace(/^act_/, "");
    if (!adAccountId) return jsonWithCors(origin, { campaigns: [], error: "No ad account ID" }, { status: 400 });

    // ✅ VERIFICAR CACHE PRIMEIRO
    const cacheKey = `${adAccountId}_campaigns`;
    const cached = campaignCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log(`📦 Usando cache de campanhas (${Math.floor((Date.now() - cached.timestamp) / 1000)}s atrás)`);
      return jsonWithCors(origin, cached.data);
    }

    console.log(`🔄 Buscando campanhas da API Meta (cache expirado ou inexistente)`);

    // Fetch campaigns
    const url =
      `https://graph.facebook.com/${API_VERSION}/act_${adAccountId}/campaigns?fields=id,name,status,effective_status,objective,created_time&limit=50&access_token=${integ.access_token}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const json = await res.json();
    if (!res.ok) {
      return jsonWithCors(origin, { campaigns: [], error: json?.error?.message || "Failed to fetch campaigns" }, { status: res.status });
    }

    // 🚀 PARALELIZAÇÃO: Processar todas as campanhas em paralelo
    const campaigns = await Promise.all(
      (json.data ?? []).map(async (c: any) => {
        // 🚀 Buscar ads, page, instagram e insights EM PARALELO
        const [adsJson, insightsJson] = await Promise.all([
          // Buscar ads
          fetch(
            `https://graph.facebook.com/${API_VERSION}/${c.id}/ads?fields=id,creative{id,thumbnail_url,object_story_spec,effective_object_story_id}&limit=5&access_token=${integ.access_token}`,
            { signal: AbortSignal.timeout(8000) }
          ).then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
          
          // Buscar insights
          fetch(
            `https://graph.facebook.com/${API_VERSION}/${c.id}/insights?fields=impressions,reach,clicks,spend,actions,cost_per_action_type&date_preset=last_7d&access_token=${integ.access_token}`,
            { signal: AbortSignal.timeout(6000) }
          ).then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] }))
        ]);

        let page: any = undefined;
        let instagram: any = undefined;
        let previewUrl: string | undefined = undefined;
        let representative_ad: any = undefined;
        let metrics: any = undefined;

        // Processar dados do ad
        if (adsJson.data?.length) {
          const ad = adsJson.data[0];
          representative_ad = { 
            id: ad.id, 
            creative_id: ad.creative?.id, 
            effective_object_story_id: ad.creative?.effective_object_story_id 
          };

          const pageId = ad.creative?.object_story_spec?.page_id;
          const igId = ad.creative?.object_story_spec?.instagram_actor_id;

          // 🚀 Buscar page e instagram EM PARALELO
          const [pageData, instagramData] = await Promise.all([
            pageId ? fetch(
              `https://graph.facebook.com/${API_VERSION}/${pageId}?fields=name,picture{url}&access_token=${integ.access_token}`,
              { signal: AbortSignal.timeout(6000) }
            ).then(r => r.ok ? r.json() : null).catch(() => null) : Promise.resolve(null),
            
            igId ? fetch(
              `https://graph.facebook.com/${API_VERSION}/${igId}?fields=username&access_token=${integ.access_token}`,
              { signal: AbortSignal.timeout(6000) }
            ).then(r => r.ok ? r.json() : null).catch(() => null) : Promise.resolve(null)
          ]);

          if (pageData) {
            page = { id: pageId, name: pageData.name, picture_url: pageData.picture?.data?.url };
          }
          if (instagramData) {
            instagram = { id: igId, username: instagramData.username };
          }

          previewUrl =
            ad.creative?.thumbnail_url ||
            ad.creative?.object_story_spec?.link_data?.picture ||
            undefined;
        }

        // Processar insights
        if (insightsJson.data?.[0]) {
          const insight = insightsJson.data[0];
          
          const messagingAction = insight.actions?.find(
            (a: any) => a.action_type === 'onsite_conversion.messaging_conversation_started_7d'
          );
          
          const messagingCost = insight.cost_per_action_type?.find(
            (c: any) => c.action_type === 'onsite_conversion.messaging_conversation_started_7d'
          );
          
          metrics = {
            impressions: parseInt(insight.impressions || '0'),
            reach: parseInt(insight.reach || '0'),
            clicks: parseInt(insight.clicks || '0'),
            spend: parseFloat(insight.spend || '0'),
            conversations: messagingAction ? parseInt(messagingAction.value || '0') : undefined,
            cost_per_messaging_conversation_started_7d: messagingCost ? parseFloat(messagingCost.value || '0') : undefined
          };
        }

        return {
          id: c.id,
          name: c.name,
          objective: c.objective || "UNKNOWN",
          status: (c.effective_status || c.status || "DRAFT").toLowerCase(),
          created_time: c.created_time,
          page,
          instagram,
          previewUrl,
          representative_ad,
          metrics,
        };
      })
    );

    const response = {
      ad_account_id: `act_${adAccountId}`,
      paging: {
        after: json.paging?.cursors?.after,
        has_next: !!json.paging?.next,
      },
      campaigns,
    };

    // ✅ ARMAZENAR NO CACHE
    campaignCache.set(cacheKey, { data: response, timestamp: Date.now() });
    console.log(`💾 Campanhas armazenadas no cache (válido por 10 minutos)`);

    return jsonWithCors(origin, response);
  } catch (e) {
    return jsonWithCors(origin, { error: "internal_error", message: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
});