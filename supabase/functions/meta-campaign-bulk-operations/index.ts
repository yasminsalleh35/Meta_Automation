
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BulkOperationRequest {
  action: 'pause' | 'activate' | 'delete';
  campaignIds: string[];
  metaCampaignIds: string[];
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
    console.log('Meta Campaign Bulk Operations function called');
    
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

    const requestData: BulkOperationRequest = await req.json();
    console.log('Bulk operation request:', requestData);

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
    const baseUrl = 'https://graph.facebook.com/v23.0';

    const results = [];
    
    // Process each campaign
    for (let i = 0; i < requestData.metaCampaignIds.length; i++) {
      const metaCampaignId = requestData.metaCampaignIds[i];
      const campaignId = requestData.campaignIds[i];
      
      try {
        console.log(`Processing campaign ${i + 1}/${requestData.metaCampaignIds.length}:`, metaCampaignId);
        
        let response;
        let newStatus;

        switch (requestData.action) {
          case 'pause':
            response = await fetch(`${baseUrl}/${metaCampaignId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                status: 'PAUSED',
                access_token: accessToken
              })
            });
            newStatus = 'paused';
            break;

          case 'activate':
            response = await fetch(`${baseUrl}/${metaCampaignId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                status: 'ACTIVE',
                access_token: accessToken
              })
            });
            newStatus = 'active';
            break;

          case 'delete':
            response = await fetch(`${baseUrl}/${metaCampaignId}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                access_token: accessToken
              })
            });
            newStatus = 'deleted';
            break;

          default:
            throw new Error(`Unknown action: ${requestData.action}`);
        }

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Meta API Error: ${error.error?.message || 'Unknown error'}`);
        }

        // Update local database
        const { error: updateError } = await supabaseClient
          .from('campaigns')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', campaignId)
          .eq('user_id', userData.user.id);

        if (updateError) {
          console.error(`Error updating local campaign ${campaignId}:`, updateError);
        }

        results.push({
          success: true,
          campaignId,
          metaCampaignId,
          action: requestData.action,
          message: `Campaign ${requestData.action}d successfully`
        });

      } catch (error) {
        console.error(`Error processing campaign ${metaCampaignId}:`, error);
        results.push({
          success: false,
          campaignId,
          metaCampaignId,
          action: requestData.action,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Bulk operation completed: ${successCount}/${results.length} successful`);

    return new Response(JSON.stringify({
      success: true,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: results.length - successCount
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    console.error('Bulk operations edge function error:', error);
    
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
