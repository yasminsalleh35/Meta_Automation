import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface MetaCampaignPreview {
  campaign_id: string;
  name: string;
  status: string;
  objective: string;
  created_time: string;
  representative_ad?: {
    ad_id: string;
    creative: {
      thumbnail_url?: string;
      image_url?: string;
      effective_object_story_id?: string;
      page_id?: string;
      instagram_actor_id?: string;
      message?: string;
      title?: string;
      link?: string;
    };
  };
  page?: { id?: string; name?: string };
  instagram?: { id?: string; username?: string };
}

// Helper function to map Meta campaign status to our simplified status
function mapMetaStatus(status: string, effectiveStatus?: string): string {
  const normalizedStatus = (effectiveStatus || status).toLowerCase();
  
  switch (normalizedStatus) {
    case 'active':
      return 'active';
    case 'paused':
      return 'paused';
    case 'deleted':
    case 'archived':
      return 'finished';
    default:
      return 'draft';
  }
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

    console.log("Fetching Meta campaigns for user:", user.id);

    // Get user's Meta integration
    const { data: integration, error: integrationError } = await supabaseServiceRole
      .from("integrations")
      .select("access_token, ad_account_id")
      .eq("user_id", user.id)
      .eq("provider", "meta_ads")
      .eq("status", "active")
      .single();

    if (integrationError || !integration) {
      console.error("❌ No Meta integration found:", integrationError);
      throw new Error("No active Meta Ads integration found");
    }

    const { access_token: accessToken, ad_account_id: adAccountId } = integration;
    
    if (!accessToken || !adAccountId) {
      console.error("❌ Missing credentials:", { hasToken: !!accessToken, hasAccountId: !!adAccountId });
      throw new Error("Missing access token or ad account ID");
    }

    // Clean ad account ID - remove 'act_' prefix if already present
    const cleanAdAccountId = adAccountId.startsWith('act_') ? adAccountId.substring(4) : adAccountId;
    
    // Fetch campaigns from Meta API using v23.0
    const apiVersion = Deno.env.get('META_API_VERSION') ?? 'v23.0';
    const campaignsUrl = `https://graph.facebook.com/${apiVersion}/act_${cleanAdAccountId}/campaigns` +
      `?fields=id,name,status,effective_status,objective,created_time` +
      `&limit=50` +
      `&access_token=${accessToken}`;
    
    console.log('🔗 Clean Ad Account ID:', cleanAdAccountId);
    console.log('🔗 Campaigns URL:', campaignsUrl.replace(accessToken, '[HIDDEN]'));

    console.log("Fetching campaigns from Meta API...");
    const campaignsResponse = await fetch(campaignsUrl);
    const campaignsResult = await campaignsResponse.json();

    if (!campaignsResponse.ok) {
      console.error("Meta API error:", campaignsResult);
      throw new Error(campaignsResult.error?.message || "Failed to fetch campaigns from Meta");
    }

    const campaigns: MetaCampaignPreview[] = [];
    
    // Process each campaign
    for (const campaign of campaignsResult.data || []) {
      console.log(`Processing campaign: ${campaign.id}`);
      
      let representativeAd = null;
      
      try {
        // Get the most recent ad for this campaign to show as preview
        const adsUrl = `https://graph.facebook.com/${apiVersion}/${campaign.id}/ads` +
          `?fields=id,name,creative{title,body,image_url,video_url,call_to_action}` +
          `&limit=1` +
          `&access_token=${accessToken}`;

        const adsResponse = await fetch(adsUrl);
        const adsResult = await adsResponse.json();
        
        if (adsResponse.ok && adsResult.data && adsResult.data.length > 0) {
          const ad = adsResult.data[0];
          representativeAd = {
            id: ad.id,
            name: ad.name,
            creative: ad.creative
          };
        }
      } catch (adError) {
        console.warn(`Could not fetch ads for campaign ${campaign.id}:`, adError);
      }

      campaigns.push({
        campaign_id: campaign.id,
        name: campaign.name,
        status: mapMetaStatus(campaign.status, campaign.effective_status),
        objective: campaign.objective || 'UNKNOWN',
        created_time: campaign.created_time,
        representative_ad: representativeAd ? {
          ad_id: representativeAd.id,
          creative: {
            image_url: representativeAd.creative?.image_url,
            title: representativeAd.creative?.title,
            message: representativeAd.creative?.body,
            link: representativeAd.creative?.call_to_action?.value?.link
          }
        } : undefined,
        page: undefined, // Meta API não retorna page info diretamente na campanha
        instagram: undefined // Meta API não retorna instagram info diretamente na campanha
      });
    }

    console.log(`Successfully processed ${campaigns.length} campaigns`);

    return new Response(JSON.stringify({
      success: true,
      previews: campaigns
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error fetching Meta campaigns:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        previews: []
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});