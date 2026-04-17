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

    const { meta_campaign_id } = await req.json();

    if (!meta_campaign_id) {
      return new Response(JSON.stringify({ error: "meta_campaign_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Get campaign from DB
    const { data: campaign, error: campaignError } = await admin
      .from("campaigns")
      .select("*, meta_ad_id")
      .eq("user_id", user.id)
      .eq("meta_campaign_id", meta_campaign_id)
      .single();

    if (campaignError || !campaign) {
      return new Response(JSON.stringify({ error: "Campaign not found" }), {
        status: 404,
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

    console.log(`🔄 [meta-campaign-refresh-one] Refreshing campaign ${campaign.name} (${meta_campaign_id})`);

    // Fetch fresh data from Meta including creative with retry logic
    // Always request ads creative fields — don't gate on meta_ad_id
    const fields = `effective_status,insights.date_preset(last_30d){impressions,reach,clicks,spend,actions,cost_per_action_type,cpm,cpc,ctr},ads.limit(1){creative{thumbnail_url,image_url,effective_image_url,object_story_spec}}`;
    const metaUrl = `https://graph.facebook.com/${API_VERSION}/${meta_campaign_id}?fields=${fields}&access_token=${integ.access_token}`;

    // Retry logic for Meta API (3 attempts with 2s delay)
    let metaData;
    let lastError;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`📡 Attempt ${attempt}/3 - Fetching data from Meta API...`);
        trackApiCall(admin, user.id, 'campaign_refresh_one');
        const metaRes = await fetch(metaUrl);
        
        if (!metaRes.ok) {
          const error = await metaRes.text();
          throw new Error(`Meta API error: ${error}`);
        }
        
        metaData = await metaRes.json();
        console.log(`✅ Successfully fetched data on attempt ${attempt}`);
        break;
      } catch (error) {
        lastError = error;
        console.error(`❌ Attempt ${attempt}/3 failed:`, error instanceof Error ? error.message : error);
        
        if (attempt < 3) {
          console.log(`⏳ Waiting 2s before retry...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    if (!metaData) {
      console.error("🚫 All retry attempts failed");
      throw new Error(lastError instanceof Error ? lastError.message : "Failed to fetch campaign from Meta after 3 attempts");
    }

    const insight = metaData.insights?.data?.[0] || {};
    const effectiveStatus = metaData.effective_status;
    
    console.log(`📊 Metrics extracted:`, {
      impressions: insight.impressions || 0,
      reach: insight.reach || 0,
      clicks: insight.clicks || 0,
      spend: insight.spend || 0,
      effectiveStatus
    });

    // Extract metrics
    const actions = insight.actions || [];
    const conversationsAction = actions.find(
      (a: any) => a.action_type === 'onsite_conversion.messaging_conversation_started_7d'
    );
    const conversations = conversationsAction ? Number(conversationsAction.value) : 0;

    const costPerActionType = insight.cost_per_action_type || [];
    const costPerConversationAction = costPerActionType.find(
      (c: any) => c.action_type === 'onsite_conversion.messaging_conversation_started_7d'
    );
    const costPerConversation = costPerConversationAction ? Number(costPerConversationAction.value) : 0;

    const metrics = {
      impressions: Number(insight.impressions) || 0,
      reach: Number(insight.reach) || 0,
      clicks: Number(insight.clicks) || 0,
      spend: Number(insight.spend) || 0,
      cpm: Number(insight.cpm) || 0,
      cpc: Number(insight.cpc) || 0,
      ctr: Number(insight.ctr) || 0,
      actions: insight.actions || [],
      conversations: conversations,
      cost_per_messaging_conversation_started_7d: costPerConversation
    };

    // Extract media preview URL from creative — check multiple sources in priority order
    let mediaPreviewUrl: string | undefined = campaign.media_preview_url || undefined;
    if (metaData.ads?.data?.[0]) {
      const ad = metaData.ads.data[0];
      const creative = ad.creative || {};
      const spec = creative.object_story_spec || {};

      // Try each source in priority order
      const freshUrl =
        creative.effective_image_url ||                // Best: Meta-resolved image URL
        creative.image_url ||                          // Image creatives
        creative.thumbnail_url ||                      // Video/Reel creatives
        spec.link_data?.picture ||                     // Link-based creatives
        spec.video_data?.image_url ||                  // Video data thumbnail
        undefined;

      if (freshUrl) {
        mediaPreviewUrl = freshUrl;
        console.log(`🖼️ Media preview found for campaign ${meta_campaign_id}: ${freshUrl.substring(0, 80)}...`);
      } else {
        console.log(`⚠️ No media preview extracted for campaign ${meta_campaign_id}, keeping existing: ${mediaPreviewUrl ? 'yes' : 'none'}`);
      }
    }

    // Update in DB with retry logic — only update media_preview_url if we have a value (don't overwrite existing with null)
    const updateData: any = {
      metrics,
      last_metrics_sync_at: new Date().toISOString(),
      status_at_sync: effectiveStatus
    };
    if (mediaPreviewUrl) {
      updateData.media_preview_url = mediaPreviewUrl;
    }

    if (effectiveStatus) {
      updateData.status = effectiveStatus.toLowerCase();
    }

    console.log(`💾 Updating campaign in database...`);
    
    // Retry logic for DB update (3 attempts with 2s delay)
    let updateSuccess = false;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`📝 DB Update attempt ${attempt}/3...`);
        const { error: updateError } = await admin
          .from("campaigns")
          .update(updateData)
          .eq("id", campaign.id);

        if (updateError) {
          throw updateError;
        }
        
        updateSuccess = true;
        console.log(`✅ DB updated successfully on attempt ${attempt}`);
        break;
      } catch (error) {
        console.error(`❌ DB Update attempt ${attempt}/3 failed:`, error);
        
        if (attempt < 3) {
          console.log(`⏳ Waiting 2s before retry...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          console.error("🚫 All DB update attempts failed");
          throw new Error("Failed to update campaign in database after 3 attempts");
        }
      }
    }

    console.log(`✅ Campaign ${campaign.name} (${meta_campaign_id}) refreshed successfully`);

    return new Response(JSON.stringify({
      updated: true,
      meta_campaign_id,
      metrics,
      status: effectiveStatus
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error in meta-campaign-refresh-one:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
