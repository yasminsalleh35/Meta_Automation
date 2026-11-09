import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { normalizeInsight } from "../_shared/metrics.ts";
import { META_GRAPH_VERSION } from '../_shared/meta.ts'; // audit PLT-03

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface InsightsRequest {
  campaignIds?: string[];
  metaCampaignIds?: string[];
  datePreset?: string;
  // Single campaign request (token fetched server-side)
  campaignId?: string;
  adId?: string;
}

interface CampaignInsights {
  campaignId: string;
  impressions?: number;
  reach?: number;
  clicks?: number;
  spend?: number;
  ctr?: number;
  cpc?: number;
  conversations?: number;
  // Cost per conversation (spend / conversations). Undefined when there are no conversations.
  cpa?: number;
  source?: 'api' | 'fallback';
}

// audit DATA-02: CPA used to fall back to spend/clicks (i.e. CPC labelled as CPA)
// and looked for `lead` actions that CTWA campaigns never produce. Now CPC and
// cost per conversation come from the shared definition and are reported separately.
function derivedMetrics(raw: any): Pick<CampaignInsights, 'cpc' | 'conversations' | 'cpa' | 'source'> {
  const n = normalizeInsight(raw);
  return {
    cpc: n.cpc ?? undefined,
    conversations: n.conversations,
    cpa: n.costPerConversation ?? undefined,
    source: 'api',
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const supabaseServiceRole = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get JWT from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Invalid or expired token");
    }

    const requestData: InsightsRequest = await req.json();
    console.log("Request data:", requestData);

    // Handle single campaign request (token fetched server-side)
    if (requestData.campaignId || requestData.adId) {
      let adId = requestData.adId;

      // If only campaignId (internal UUID), resolve meta_ad_id from DB
      if (!adId && requestData.campaignId) {
        const { data: campaign } = await supabaseServiceRole
          .from("campaigns")
          .select("meta_ad_id")
          .eq("id", requestData.campaignId)
          .eq("user_id", user.id)
          .maybeSingle();
        adId = campaign?.meta_ad_id;
      }

      if (!adId) {
        throw new Error("Could not resolve ad ID for insights");
      }

      // Fetch token server-side
      const { data: singleIntegration } = await supabaseServiceRole
        .from("integrations")
        .select("access_token")
        .eq("user_id", user.id)
        .eq("provider", "meta_ads")
        .eq("status", "active")
        .maybeSingle();

      if (!singleIntegration?.access_token) {
        throw new Error("No active Meta integration found");
      }

      const apiVersion = Deno.env.get('META_API_VERSION') ?? META_GRAPH_VERSION;
      const apiUrl = `https://graph.facebook.com/${apiVersion}/${adId}/insights?fields=impressions,reach,clicks,spend,actions,cost_per_action_type,ctr&date_preset=last_30d&access_token=${singleIntegration.access_token}`;

      const response = await fetch(apiUrl);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to fetch insights");
      }

      const insights = result.data?.[0] || {};

      const campaignInsights: CampaignInsights = {
        campaignId: adId,
        impressions: insights.impressions ? parseInt(insights.impressions) : 0,
        reach: insights.reach ? parseInt(insights.reach) : 0,
        clicks: insights.clicks ? parseInt(insights.clicks) : 0,
        spend: insights.spend ? parseFloat(insights.spend) : 0,
        ctr: insights.ctr ? parseFloat(insights.ctr) : 0,
        ...derivedMetrics(insights),
      };

      return new Response(JSON.stringify(campaignInsights), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle bulk campaign requests
    const { campaignIds, metaCampaignIds } = requestData;
    
    if (!campaignIds && !metaCampaignIds) {
      throw new Error("Either campaignIds or metaCampaignIds must be provided");
    }

    // Get user's Meta integration
    const { data: integration, error: integrationError } = await supabaseServiceRole
      .from("integrations")
      .select("access_token, ad_account_id")
      .eq("user_id", user.id)
      .eq("provider", "meta_ads")
      .eq("status", "active")
      .single();

    if (integrationError || !integration) {
      console.log("⚠️ No active Meta Ads integration found - returning empty insights");
      return new Response(JSON.stringify({
        success: false,
        insights: [],
        error: "No active Meta Ads integration found"
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = integration.access_token;
    const insights: CampaignInsights[] = [];

    // If we have campaignIds, we need to resolve them to metaCampaignIds
    let targetMetaCampaignIds = metaCampaignIds || [];
    
    if (campaignIds && campaignIds.length > 0) {
      const { data: campaigns, error: campaignsError } = await supabaseServiceRole
        .from("campaigns")
        .select("id, meta_campaign_id")
        .in("id", campaignIds)
        .eq("user_id", user.id);

      if (campaignsError) {
        throw campaignsError;
      }

      targetMetaCampaignIds = campaigns
        ?.filter(c => c.meta_campaign_id)
        .map(c => c.meta_campaign_id) || [];
    }

    // Fetch insights for each campaign
    for (const metaCampaignId of targetMetaCampaignIds) {
      try {
        const dateRange = requestData.datePreset || "last_30d";
        const apiVersion = Deno.env.get('META_API_VERSION') ?? META_GRAPH_VERSION;
        
        const apiUrl = `https://graph.facebook.com/${apiVersion}/${metaCampaignId}/insights` +
          `?fields=impressions,reach,clicks,spend,actions,cost_per_action_type,ctr` +
          `&date_preset=${dateRange}` +
          `&access_token=${accessToken}`;

        const response = await fetch(apiUrl);
        const result = await response.json();

        if (response.ok && result.data && result.data.length > 0) {
          const campaignData = result.data[0];

          insights.push({
            campaignId: metaCampaignId,
            impressions: campaignData.impressions ? parseInt(campaignData.impressions) : 0,
            reach: campaignData.reach ? parseInt(campaignData.reach) : 0,
            clicks: campaignData.clicks ? parseInt(campaignData.clicks) : 0,
            spend: campaignData.spend ? parseFloat(campaignData.spend) : 0,
            ctr: campaignData.ctr ? parseFloat(campaignData.ctr) : 0,
            ...derivedMetrics(campaignData),
          });
        } else {
          console.warn(`No insights data for campaign ${metaCampaignId}:`, result);
          // Add empty insights for campaigns with no data
          insights.push({
            campaignId: metaCampaignId,
            impressions: 0,
            reach: 0,
            clicks: 0,
            spend: 0,
            ctr: 0,
            source: 'fallback'
          });
        }
      } catch (error) {
        console.error(`Error fetching insights for campaign ${metaCampaignId}:`, error);
        // Add error entry
        insights.push({
          campaignId: metaCampaignId,
          impressions: 0,
          reach: 0,
          clicks: 0,
          spend: 0,
          ctr: 0,
          source: 'fallback'
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      insights: insights
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        success: false
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});