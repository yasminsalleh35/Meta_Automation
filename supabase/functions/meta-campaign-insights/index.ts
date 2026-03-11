
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InsightsRequest {
  campaignIds: string[];
  metaCampaignIds: string[];
  dateRange?: {
    since: string;
    until: string;
  };
  metrics?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    console.log('Meta Campaign Insights function called');
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    
    const { data: userData, error: userError } = await authClient.auth.getUser(token);
    
    if (userError || !userData.user?.id) {
      throw new Error("User not authenticated");
    }

    console.log('User authenticated:', userData.user.id);

    const requestData: InsightsRequest = await req.json();
    console.log('Insights request:', requestData);

    // Get user's Meta Ads integration
    const { data: integration, error: integrationError } = await supabaseClient
      .from('integrations')
      .select('access_token')
      .eq('user_id', userData.user.id)
      .eq('provider', 'meta_ads')
      .eq('status', 'active')
      .single();

    if (integrationError || !integration?.access_token) {
      throw new Error('Meta Ads integration not found or inactive');
    }

    const accessToken = integration.access_token;
    const baseUrl = 'https://graph.facebook.com/v19.0';

    // Default metrics if not specified
    const metrics = requestData.metrics || [
      'impressions',
      'clicks',
      'spend',
      'cpm',
      'cpc',
      'ctr',
      'reach',
      'frequency'
    ];

    // Default date range (last 30 days)
    const dateRange = requestData.dateRange || {
      since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      until: new Date().toISOString().split('T')[0]
    };

    const insights = [];

    for (let i = 0; i < requestData.metaCampaignIds.length; i++) {
      const metaCampaignId = requestData.metaCampaignIds[i];
      const campaignId = requestData.campaignIds[i];
      
      try {
        console.log(`Fetching insights for campaign ${i + 1}/${requestData.metaCampaignIds.length}:`, metaCampaignId);
        
        const insightsUrl = `${baseUrl}/${metaCampaignId}/insights`;
        const params = new URLSearchParams({
          access_token: accessToken,
          fields: metrics.join(','),
          time_range: JSON.stringify({
            since: dateRange.since,
            until: dateRange.until
          }),
          level: 'campaign'
        });

        const response = await fetch(`${insightsUrl}?${params.toString()}`);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Meta API Error: ${error.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        
        insights.push({
          campaignId,
          metaCampaignId,
          insights: data.data?.[0] || {},
          dateRange,
          success: true
        });

      } catch (error) {
        console.error(`Error fetching insights for campaign ${metaCampaignId}:`, error);
        insights.push({
          campaignId,
          metaCampaignId,
          insights: {},
          dateRange,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`Insights fetch completed for ${insights.length} campaigns`);

    return new Response(JSON.stringify({
      success: true,
      insights,
      dateRange,
      metrics
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    console.error('Insights edge function error:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorResponse = { 
      success: false,
      error: errorMessage
    };
    
    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
