import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { resolveMetaIntegration } from "../_shared/metaIntegration.ts";

const META_API_VERSION = "v23.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, supabaseKey);

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

    const sorted = (campaigns || []).sort((a, b) => {
      const aOrder = statusOrder[a.status?.toLowerCase()] ?? 99;
      const bOrder = statusOrder[b.status?.toLowerCase()] ?? 99;
      if (aOrder !== bOrder) return aOrder - bOrder;
      // Same status: newest first
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

    // Real daily budget from Meta (source of truth). The DB `budget_daily` can be the column
    // default (R$50) for campaigns imported from Ads Manager, and can drift if changed there, so we
    // override the DISPLAYED value with the live ad set daily_budget. Best-effort: on any failure we
    // fall back to the DB value (one batched Meta call for the current page — ids limit is 50).
    const realBudgetByAdset: Record<string, number> = {};
    try {
      const adsetIds = Array.from(new Set((sorted || []).map((c: any) => c.meta_adset_id).filter(Boolean))) as string[];
      if (adsetIds.length > 0) {
        const integration = await resolveMetaIntegration(user.id);
        const accessToken = integration?.access_token;
        if (accessToken) {
          const applyBudget = (id: string, cents: unknown) => {
            const n = Number(cents);
            if (Number.isFinite(n) && n > 0) realBudgetByAdset[id] = n / 100;
          };
          const perId = async (id: string) => {
            try {
              const r = await fetch(
                `https://graph.facebook.com/${META_API_VERSION}/${id}?fields=daily_budget`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
              );
              if (r.ok) applyBudget(id, (await r.json())?.daily_budget);
            } catch { /* best-effort */ }
          };

          for (let i = 0; i < adsetIds.length; i += 50) {
            const chunk = adsetIds.slice(i, i + 50);
            const res = await fetch(
              `https://graph.facebook.com/${META_API_VERSION}/?ids=${chunk.join(",")}&fields=daily_budget`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (res.ok) {
              const map = await res.json();
              for (const id of chunk) applyBudget(id, map?.[id]?.daily_budget);
            } else {
              // One bad/stale id can 400 the whole batch — fall back to per-id so the rest still resolve.
              console.warn("[meta-campaigns-cached] budget batch not ok; falling back per-id", res.status);
              await Promise.allSettled(chunk.map(perId));
            }
          }
        }
      }
    } catch (e) {
      console.warn("[meta-campaigns-cached] real budget fetch failed; using DB value", e instanceof Error ? e.message : e);
    }

    // Transform data for frontend
    const items = sorted.map(c => ({
      id: c.id,
      metaCampaignId: c.meta_campaign_id,
      metaAdsetId: c.meta_adset_id,
      budgetDaily: (c.meta_adset_id && realBudgetByAdset[c.meta_adset_id] != null)
        ? realBudgetByAdset[c.meta_adset_id]
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
    }));

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
});
