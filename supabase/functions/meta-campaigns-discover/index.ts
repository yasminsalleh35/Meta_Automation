import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const API_VERSION = "v23.0";

interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  objective?: string;
  created_time?: string;
  updated_time?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await admin.auth.getUser(token || "");

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get active integration (token server-side only)
    const { data: integration, error: integError } = await admin
      .from("integrations")
      .select("access_token, ad_account_id")
      .eq("user_id", user.id)
      .eq("provider", "meta_ads")
      .eq("status", "active")
      .maybeSingle();

    if (integError || !integration?.access_token || !integration?.ad_account_id) {
      return new Response(JSON.stringify({ error: "No active Meta Ads integration found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adAccountId = integration.ad_account_id;
    const accessToken = integration.access_token;

    console.log(`🔍 [meta-campaigns-discover] Starting full import for user=${user.id}, ad_account=${adAccountId}`);

    // Check circuit breaker
    const { data: rateLimit } = await admin
      .from("meta_rate_limits")
      .select("blocked_until")
      .eq("ad_account_id", adAccountId)
      .maybeSingle();

    if (rateLimit?.blocked_until && new Date(rateLimit.blocked_until).getTime() > Date.now()) {
      const remainingMin = Math.ceil((new Date(rateLimit.blocked_until).getTime() - Date.now()) / 60000);
      return new Response(JSON.stringify({
        error: `Rate limit active. Try again in ${remainingMin} minutes.`,
        blocked_until: rateLimit.blocked_until,
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch existing campaigns from DB to determine source preservation
    const { data: existingCampaigns } = await admin
      .from("campaigns")
      .select("meta_campaign_id, source")
      .eq("user_id", user.id)
      .not("meta_campaign_id", "is", null);

    const existingSourceMap = new Map<string, string>();
    for (const c of existingCampaigns || []) {
      if (c.meta_campaign_id) {
        existingSourceMap.set(c.meta_campaign_id, c.source || "camply");
      }
    }

    // Normalize ad account ID to prevent double act_ prefix
    const accountPath = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;

    // Paginate through ALL campaigns from Meta
    const allMetaCampaigns: MetaCampaign[] = [];
    let nextUrl: string | null =
      `https://graph.facebook.com/${API_VERSION}/${accountPath}/campaigns?fields=id,name,status,effective_status,objective,created_time,updated_time&limit=100&access_token=${accessToken}`;

    while (nextUrl) {
      const response = await fetch(nextUrl);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const errorCode = errorBody?.error?.code;

        // Trigger circuit breaker on rate limit
        if (errorCode === 80004 || errorCode === 17 || response.status === 429) {
          const blockedUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString();
          await admin.from("meta_rate_limits").upsert({
            ad_account_id: adAccountId,
            blocked_until: blockedUntil,
            last_error_code: String(errorCode),
            last_error_at: new Date().toISOString(),
          }, { onConflict: "ad_account_id" });
          console.warn(`🛡️ Circuit breaker triggered for ${adAccountId}`);
        }

        throw new Error(errorBody?.error?.message || `Meta API error: ${response.status}`);
      }

      const data = await response.json();
      if (data.data) {
        allMetaCampaigns.push(...data.data);
      }
      nextUrl = data.paging?.next || null;
    }

    console.log(`📊 Found ${allMetaCampaigns.length} campaigns on Meta`);

    // Status mapping
    const statusMap: Record<string, string> = {
      ACTIVE: "active",
      PAUSED: "paused",
      DELETED: "deleted",
      ARCHIVED: "finished",
      IN_PROCESS: "pending_review",
    };

    // UPSERT each campaign
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    const now = new Date().toISOString();

    for (const mc of allMetaCampaigns) {
      const existingSource = existingSourceMap.get(mc.id);
      const isExisting = existingSource !== undefined;
      const localStatus = statusMap[mc.effective_status] || statusMap[mc.status] || "paused";

      // Build upsert data
      const upsertData: Record<string, unknown> = {
        user_id: user.id,
        ad_account_id: adAccountId,
        meta_campaign_id: mc.id,
        name: mc.name,
        objective: mc.objective || "OUTCOME_ENGAGEMENT",
        status: localStatus,
        status_at_sync: mc.effective_status || mc.status,
        meta_updated_time: mc.updated_time || null,
        last_discovered_at: now,
        is_deleted_on_meta: false,
        source: isExisting && existingSource === "camply" ? "camply" : "meta_import",
      };

      // Upsert using the real UNIQUE constraint on meta_campaign_id
      const { data: upsertResult, error } = await admin
        .from("campaigns")
        .upsert(upsertData, {
          onConflict: "meta_campaign_id",
          ignoreDuplicates: false,
        })
        .select("id")
        .single();

      if (error) {
        // If conflict resolution fails, try update directly
        if (error.code === "23505" || error.message?.includes("duplicate")) {
          const { error: updateError } = await admin
            .from("campaigns")
            .update({
              name: mc.name,
              status: localStatus,
              status_at_sync: mc.effective_status || mc.status,
              meta_updated_time: mc.updated_time || null,
              last_discovered_at: now,
              is_deleted_on_meta: false,
              ad_account_id: adAccountId,
            })
            .eq("user_id", user.id)
            .eq("meta_campaign_id", mc.id);

          if (updateError) {
            console.error(`❌ Failed to update campaign ${mc.id}:`, updateError.message);
            skipped++;
          } else {
            updated++;
          }
        } else {
          console.error(`❌ Failed to upsert campaign ${mc.id}:`, error.message);
          skipped++;
        }
      } else {
        if (isExisting) {
          updated++;
        } else {
          imported++;
        }
      }
    }

    console.log(`✅ [meta-campaigns-discover] Done: imported=${imported}, updated=${updated}, skipped=${skipped}, total_meta=${allMetaCampaigns.length}`);

    return new Response(JSON.stringify({
      success: true,
      imported,
      updated,
      skipped,
      total_meta: allMetaCampaigns.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("❌ [meta-campaigns-discover] Error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
