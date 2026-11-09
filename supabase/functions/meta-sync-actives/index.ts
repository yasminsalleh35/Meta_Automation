import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { mapMetaEffectiveStatus } from "../_shared/status.ts";
import { normalizeInsight } from "../_shared/metrics.ts";
import { META_GRAPH_VERSION } from '../_shared/meta.ts'; // audit PLT-03

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const API_VERSION = META_GRAPH_VERSION;

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

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

    const { ad_account_id, page_size = 50 } = await req.json();

    if (!ad_account_id) {
      return new Response(JSON.stringify({ error: "ad_account_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Get integration
    const { data: integ } = await admin
      .from("integrations")
      .select("access_token")
      .eq("user_id", user.id)
      .eq("provider", "meta_ads")
      .eq("status", "active")
      .maybeSingle();

    if (!integ?.access_token) {
      return new Response(JSON.stringify({ error: "No active Meta integration" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(`🔄 [meta-sync-actives] Syncing ACTIVE campaigns for user=${user.id}, ad_account=${ad_account_id}`);

    // Ativas + em análise (audit CMP-10: senão pending_review nunca vira active)
    const { data: activeCampaigns } = await admin
      .from("campaigns")
      .select("id, meta_campaign_id, name, status")
      .eq("user_id", user.id)
      .eq("ad_account_id", ad_account_id)
      .in("status", ["active", "pending_review"])
      .not("meta_campaign_id", "is", null)
      .limit(page_size);

    if (!activeCampaigns || activeCampaigns.length === 0) {
      console.log(`ℹ️ No active campaigns to sync`);
      return new Response(JSON.stringify({
        processed: 0,
        nextPageCursor: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(`📊 Syncing ${activeCampaigns.length} active campaigns`);

    const campaignIds = activeCampaigns.map(c => c.meta_campaign_id);
    const insightsMap: Record<string, any> = {};
    const statusMap: Record<string, string> = {};

    // Batch request for insights + status
    const chunks = chunkArray(campaignIds, 50);

    for (const chunk of chunks) {
      const batchUrl = `https://graph.facebook.com/${API_VERSION}/`;
      const batchRequests = chunk.map(id => ({
        method: "GET",
        relative_url: `${id}?fields=effective_status,insights.date_preset(last_30d){impressions,reach,clicks,spend,actions,cost_per_action_type,cpm,cpc,ctr}`
      }));

      const batchRes = await fetch(batchUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: integ.access_token,
          batch: batchRequests
        })
      });

      if (!batchRes.ok) {
        console.error("Batch request failed:", await batchRes.text());
        continue;
      }

      const batchResults = await batchRes.json();
      if (!Array.isArray(batchResults)) {
        console.error("Unexpected batch response:", JSON.stringify(batchResults).substring(0, 300));
        continue;
      }

      for (let i = 0; i < batchResults.length; i++) {
        const result = batchResults[i];
        // audit DATA-04: Meta returns `null` for batch items that timed out; skip
        // them (the campaign keeps its previous metrics) instead of throwing.
        if (!result) {
          console.warn(`⚠️ Batch item ${i} (${chunk[i]}) returned null; skipping`);
          continue;
        }
        if (result.code === 200) {
          try {
            const data = JSON.parse(result.body);
            const campaignId = chunk[i];

            // Store effective_status
            statusMap[campaignId] = data.effective_status;

            // Extract insights — audit DATA-02: shared metric definition
            const insight = data.insights?.data?.[0] || {};
            const n = normalizeInsight(insight);

            insightsMap[campaignId] = {
              impressions: n.impressions,
              reach: n.reach,
              clicks: n.clicks,
              spend: n.spend,
              cpm: Number(insight.cpm) || 0,
              cpc: n.cpc ?? 0,
              ctr: Number(insight.ctr) || 0,
              actions: insight.actions || [],
              conversations: n.conversations,
              cost_per_messaging_conversation_started_7d: n.costPerConversation ?? 0
            };
          } catch (e) {
            console.error("Error parsing batch result:", e);
          }
        }
      }
    }

    // Update campaigns in DB
    let processed = 0;
    for (const campaign of activeCampaigns) {
      const metaCampaignId = campaign.meta_campaign_id;
      const metrics = insightsMap[metaCampaignId];
      const effectiveStatus = statusMap[metaCampaignId];

      if (metrics || effectiveStatus) {
        const updateData: any = {
          last_status_sync_at: new Date().toISOString()
        };

        // audit DATA-04: only mark metrics as synced when they were actually fetched
        if (metrics) {
          updateData.metrics = metrics;
          updateData.last_metrics_sync_at = new Date().toISOString();
          updateData.needs_immediate_sync = false;
        }

        // Atualiza o status sempre que o canônico mudar (inclui pending_review → active)
        const canonicalStatus = mapMetaEffectiveStatus(effectiveStatus);
        if (effectiveStatus) {
          updateData.status_at_sync = effectiveStatus;
        }
        if (canonicalStatus && canonicalStatus !== campaign.status) {
          updateData.status = canonicalStatus;
        }

        const { error } = await admin
          .from("campaigns")
          .update(updateData)
          .eq("id", campaign.id);

        if (error) {
          console.error(`❌ Error updating campaign ${campaign.id}:`, error);
        } else {
          processed++;
        }
      }
    }

    console.log(`✅ Synced ${processed} active campaigns`);

    return new Response(JSON.stringify({
      processed,
      nextPageCursor: null // For future pagination if needed
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error in meta-sync-actives:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
