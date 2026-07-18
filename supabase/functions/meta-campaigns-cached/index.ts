import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { resolveMetaIntegration } from "../_shared/metaIntegration.ts";

const META_API_VERSION = "v23.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Test seams: the service-role client and the Meta integration resolver are injected through these
// so tests can drive the handler without real Supabase/Meta access (production uses the defaults).
type AdminFactory = () => any;
type ResolveIntegration = (userId: string) => Promise<{ access_token?: string | null } | null>;
let _adminFactory: AdminFactory = () => createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);
let _resolveIntegration: ResolveIntegration = resolveMetaIntegration;
export function __setTestDeps(deps: { adminFactory?: AdminFactory; resolveIntegration?: ResolveIntegration }): void {
  if (deps.adminFactory) _adminFactory = deps.adminFactory;
  if (deps.resolveIntegration) _resolveIntegration = deps.resolveIntegration;
}

export async function handleRequest(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const admin = _adminFactory();

    // Auth
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await admin.auth.getUser(token || "");
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { 
      status = 'all', 
      search = '', 
      page = 1, 
      page_size = 20,
      ad_account_id 
    } = await req.json();

    if (!ad_account_id) {
      return new Response(JSON.stringify({ error: "ad_account_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(`📦 [meta-campaigns-cached] Reading from DB: user=${user.id}, ad_account=${ad_account_id}, status=${status}, search="${search}", page=${page}`);

    // Build query
    let query = admin
      .from("campaigns")
      .select("id, name, objective, status, meta_campaign_id, meta_adset_id, budget_daily, metrics, last_metrics_sync_at, meta_data_cached_at, media_preview_url, meta_data, created_at", { count: 'exact' })
      .eq("user_id", user.id)
      .eq("ad_account_id", ad_account_id)
      .not("meta_campaign_id", "is", null);

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq("status", status.toLowerCase());
    }

    // Apply search filter
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    // Apply pagination
    const from = (page - 1) * page_size;
    const to = from + page_size - 1;
    query = query.range(from, to);

    // Order: active campaigns first, then by creation date descending
    query = query
      .order("status", { ascending: true })  // 'active' comes before 'paused' alphabetically
      .order("created_at", { ascending: false });

    const { data: campaigns, error, count } = await query;

    if (error) {
      console.error("Database error:", error);
      throw error;
    }

    console.log(`📊 Returned ${campaigns?.length || 0} campaigns (total: ${count})`);

    // Sort: active first, then paused, then draft, then rest — within same status, newest first
    const statusOrder: Record<string, number> = {
      active: 0,
      paused: 1,
      draft: 2,
      archived: 3,
      deleted: 4,
      finished: 5,
      rejected: 6,
    };

    const sorted = (campaigns || []).sort((a: any, b: any) => {
      const aOrder = statusOrder[a.status?.toLowerCase()] ?? 99;
      const bOrder = statusOrder[b.status?.toLowerCase()] ?? 99;
      if (aOrder !== bOrder) return aOrder - bOrder;
      // Same status: newest first
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

    // Real daily budget + ad set resolution from Meta (source of truth). We key off the CAMPAIGN id
    // (every listed row has one) instead of meta_adset_id, so this works even for campaigns imported
    // from Ads Manager that never stored an ad set id locally. For each campaign we read its ad
    // set(s) and derive: budgetReais (sum of the ad sets' daily_budget) and adsetId (when there's a
    // single ad set — used to enable inline editing). Best-effort: on any failure we fall back to
    // the DB value and the stored ad set id.
    const infoByCampaign: Record<string, { budgetReais: number | null; adsetId: string | null }> = {};
    try {
      const campaignIds = Array.from(new Set((sorted || []).map((c: any) => c.meta_campaign_id).filter(Boolean))) as string[];
      if (campaignIds.length > 0) {
        const integration = await _resolveIntegration(user.id);
        const accessToken = integration?.access_token;
        if (accessToken) {
          const summarize = (adsets: any[]) => {
            let totalCents = 0;
            let hasBudget = false;
            for (const a of adsets || []) {
              const cents = Number(a?.daily_budget);
              if (Number.isFinite(cents) && cents > 0) { totalCents += cents; hasBudget = true; }
            }
            return {
              budgetReais: hasBudget ? totalCents / 100 : null,
              adsetId: (adsets && adsets.length === 1) ? String(adsets[0].id) : null,
            };
          };
          const perCampaign = async (cid: string) => {
            try {
              const r = await fetch(
                `https://graph.facebook.com/${META_API_VERSION}/${cid}/adsets?fields=id,daily_budget&limit=25`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
              );
              if (r.ok) infoByCampaign[cid] = summarize((await r.json())?.data || []);
            } catch { /* best-effort */ }
          };

          for (let i = 0; i < campaignIds.length; i += 50) {
            const chunk = campaignIds.slice(i, i + 50);
            // One batched call with field expansion: each campaign's ad sets + their daily_budget.
            const res = await fetch(
              `https://graph.facebook.com/${META_API_VERSION}/?ids=${chunk.join(",")}&fields=adsets.limit(25){id,daily_budget}`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (res.ok) {
              const map = await res.json();
              for (const cid of chunk) infoByCampaign[cid] = summarize(map?.[cid]?.adsets?.data || []);
            } else {
              console.warn("[meta-campaigns-cached] adset batch not ok; falling back per-campaign", res.status);
              await Promise.allSettled(chunk.map(perCampaign));
            }
          }
        }
      }
    } catch (e) {
      console.warn("[meta-campaigns-cached] real budget fetch failed; using DB value", e instanceof Error ? e.message : e);
    }

    // Transform data for frontend
    const items = sorted.map((c: any) => {
      const info = c.meta_campaign_id ? infoByCampaign[c.meta_campaign_id] : undefined;
      return {
      id: c.id,
      metaCampaignId: c.meta_campaign_id,
      // Prefer the stored ad set id; otherwise use the one resolved from Meta (imported campaigns).
      metaAdsetId: c.meta_adset_id || info?.adsetId || null,
      budgetDaily: (info && info.budgetReais != null)
        ? info.budgetReais
        : (c.budget_daily != null ? Number(c.budget_daily) : null),
      name: c.name,
      objective: c.objective,
      status: c.status,
      metrics: c.metrics || {},
      last_metrics_sync_at: c.last_metrics_sync_at,
      meta_data_cached_at: c.meta_data_cached_at,
      mediaPreviewUrl: c.media_preview_url,
      // Include additional fields from meta_data if present
      page: c.meta_data?.page,
      instagram: c.meta_data?.instagram,
      created_time: c.meta_data?.created_time
      };
    });

    return new Response(JSON.stringify({
      items,
      page,
      page_size,
      total: count || 0,
      source: "database"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error in meta-campaigns-cached:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}

// Start the server in production (default). Tests set MCC_DISABLE_SERVE=1 before importing.
if (!Deno.env.get("MCC_DISABLE_SERVE")) {
  serve(handleRequest);
}
