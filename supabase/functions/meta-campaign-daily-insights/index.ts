import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { trackApiCall } from "../_shared/trackApiCall.ts";

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

    const { meta_campaign_id, date_preset = "last_7d" } = await req.json();

    if (!meta_campaign_id) {
      return new Response(JSON.stringify({ error: "meta_campaign_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Verify campaign belongs to user
    const { data: campaign, error: campaignError } = await admin
      .from("campaigns")
      .select("id, meta_campaign_id")
      .eq("user_id", user.id)
      .eq("meta_campaign_id", meta_campaign_id)
      .single();

    if (campaignError || !campaign) {
      return new Response(JSON.stringify({ error: "Campaign not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Get user's Meta access token
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

    // Fetch daily insights from Meta API with time_increment=1 (daily breakdown)
    const fields = "impressions,reach,clicks,spend,ctr,cpc,cpm,actions,cost_per_action_type";
    const metaUrl = `https://graph.facebook.com/${API_VERSION}/${meta_campaign_id}/insights?fields=${fields}&date_preset=${date_preset}&time_increment=1&access_token=${integ.access_token}`;

    console.log(`📊 [meta-campaign-daily-insights] Fetching daily insights for ${meta_campaign_id}`);

    trackApiCall(admin, user.id, `daily_insights:${date_preset}`);
    const metaRes = await fetch(metaUrl);

    if (!metaRes.ok) {
      const errorText = await metaRes.text();
      console.error(`❌ Meta API error:`, errorText);

      // Return empty data instead of error (campaign might be new with no data)
      return new Response(JSON.stringify({
        daily_data: [],
        meta_campaign_id,
        date_preset,
        source: "meta_api",
        note: "No daily data available yet"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const metaData = await metaRes.json();
    const rawData = metaData.data || [];

    console.log(`📈 Got ${rawData.length} daily data points`);

    // Map to clean daily format
    const dailyData = rawData.map((day: any) => {
      const actions = day.actions || [];
      const conversationsAction = actions.find(
        (a: any) => a.action_type === 'onsite_conversion.messaging_conversation_started_7d'
      );

      return {
        date: day.date_start,
        impressions: Number(day.impressions) || 0,
        clicks: Number(day.clicks) || 0,
        ctr: Number(day.ctr) || 0,
        spend: Number(day.spend) || 0,
        reach: Number(day.reach) || 0,
        cpc: Number(day.cpc) || 0,
        cpm: Number(day.cpm) || 0,
        conversations: conversationsAction ? Number(conversationsAction.value) : 0,
      };
    });

    return new Response(JSON.stringify({
      daily_data: dailyData,
      meta_campaign_id,
      date_preset,
      total_days: dailyData.length,
      source: "meta_api"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error in meta-campaign-daily-insights:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
