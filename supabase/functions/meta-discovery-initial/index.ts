import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const API_VERSION = "v23.0";

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

    const { ad_account_id } = await req.json();

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

    console.log(`🔍 [meta-discovery-initial] Discovering campaigns for user=${user.id}, ad_account=${ad_account_id}`);

    const accountPath = ad_account_id.startsWith("act_") ? ad_account_id : `act_${ad_account_id}`;
    let allCampaigns: any[] = [];
    let nextUrl = `https://graph.facebook.com/${API_VERSION}/${accountPath}/campaigns?fields=id,name,objective,effective_status,created_time&limit=100&access_token=${integ.access_token}`;

    // Paginate through all campaigns
    while (nextUrl) {
      const res = await fetch(nextUrl);
      if (!res.ok) {
        const error = await res.text();
        console.error("Meta API error:", error);
        throw new Error("Failed to fetch campaigns from Meta");
      }

      const data = await res.json();
      allCampaigns = allCampaigns.concat(data.data || []);
      nextUrl = data.paging?.next || null;
    }

    console.log(`📦 Found ${allCampaigns.length} campaigns from Meta`);

    let inserted = 0;
    let updated = 0;

    // Upsert each campaign (structure only, no metrics)
    for (const campaign of allCampaigns) {
      const metaData = {
        id: campaign.id,
        name: campaign.name,
        objective: campaign.objective,
        status: campaign.effective_status,
        created_time: campaign.created_time
      };

      const { error: upsertError, data: upsertData } = await admin
        .from("campaigns")
        .upsert({
          user_id: user.id,
          ad_account_id,
          meta_campaign_id: campaign.id,
          name: campaign.name,
          status: campaign.effective_status?.toLowerCase() || "paused",
          objective: campaign.objective,
          meta_data: metaData,
          meta_data_cached_at: new Date().toISOString(),
          status_at_sync: campaign.effective_status
        }, {
          onConflict: "meta_campaign_id",
          ignoreDuplicates: false
        })
        .select();

      if (upsertError) {
        console.error(`❌ Error upserting campaign ${campaign.id}:`, upsertError);
      } else {
        // Check if it was an insert or update (heuristic: if data returned)
        if (upsertData && upsertData.length > 0) {
          inserted++;
        }
      }
    }

    updated = allCampaigns.length - inserted;

    console.log(`✅ Discovery complete: ${inserted} inserted, ${updated} updated`);

    return new Response(JSON.stringify({
      success: true,
      inserted,
      updated,
      total: allCampaigns.length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error in meta-discovery-initial:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
