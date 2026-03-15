
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CampaignManagementRequest {
  action: 'pause' | 'activate' | 'delete' | 'get_status';
  campaignId: string;
  metaCampaignId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    console.log('Meta Campaign Management function called');
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Use the anon key client for auth operations
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    
    const { data: userData, error: userError } = await authClient.auth.getUser(token);
    
    if (userError || !userData.user?.id) {
      throw new Error("User not authenticated");
    }

    console.log('User authenticated:', userData.user.id);

    const requestData: CampaignManagementRequest = await req.json();
    console.log('Request data:', requestData);

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

    let result;

    switch (requestData.action) {
      case 'pause':
        console.log('Pausing campaign:', requestData.metaCampaignId);
        
        const pauseResponse = await fetch(`${baseUrl}/${requestData.metaCampaignId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'PAUSED',
            access_token: accessToken
          })
        });

        if (!pauseResponse.ok) {
          const error = await pauseResponse.json();
          throw new Error(`Meta API Error: ${error.error?.message || 'Unknown error'}`);
        }

        // Update local database
        const { error: updatePauseError } = await supabaseClient
          .from('campaigns')
          .update({ 
            status: 'paused',
            updated_at: new Date().toISOString()
          })
          .eq('id', requestData.campaignId)
          .eq('user_id', userData.user.id);

        if (updatePauseError) {
          console.error('Error updating local campaign status:', updatePauseError);
        }

        result = {
          success: true,
          action: 'pause',
          campaignId: requestData.campaignId,
          metaCampaignId: requestData.metaCampaignId,
          message: 'Campaign paused successfully'
        };
        break;

      case 'activate':
        console.log('Activating campaign:', requestData.metaCampaignId);
        
        const activateResponse = await fetch(`${baseUrl}/${requestData.metaCampaignId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'ACTIVE',
            access_token: accessToken
          })
        });

        if (!activateResponse.ok) {
          const error = await activateResponse.json();
          throw new Error(`Meta API Error: ${error.error?.message || 'Unknown error'}`);
        }

        // Update local database
        const { error: updateActiveError } = await supabaseClient
          .from('campaigns')
          .update({ 
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', requestData.campaignId)
          .eq('user_id', userData.user.id);

        if (updateActiveError) {
          console.error('Error updating local campaign status:', updateActiveError);
        }

        result = {
          success: true,
          action: 'activate',
          campaignId: requestData.campaignId,
          metaCampaignId: requestData.metaCampaignId,
          message: 'Campaign activated successfully'
        };
        break;

      case 'delete':
        console.log('Deleting campaign:', requestData.metaCampaignId);
        
        const deleteResponse = await fetch(`${baseUrl}/${requestData.metaCampaignId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: accessToken
          })
        });

        if (!deleteResponse.ok) {
          const error = await deleteResponse.json();
          throw new Error(`Meta API Error: ${error.error?.message || 'Unknown error'}`);
        }

        // Update local database - mark as deleted instead of removing
        const { error: updateDeleteError } = await supabaseClient
          .from('campaigns')
          .update({ 
            status: 'deleted',
            updated_at: new Date().toISOString()
          })
          .eq('id', requestData.campaignId)
          .eq('user_id', userData.user.id);

        if (updateDeleteError) {
          console.error('Error updating local campaign status:', updateDeleteError);
        }

        result = {
          success: true,
          action: 'delete',
          campaignId: requestData.campaignId,
          metaCampaignId: requestData.metaCampaignId,
          message: 'Campaign deleted successfully'
        };
        break;

      case 'get_status':
        console.log('Getting campaign status:', requestData.metaCampaignId);
        
        const statusResponse = await fetch(
          `${baseUrl}/${requestData.metaCampaignId}?fields=id,name,status,effective_status,configured_status,objective&access_token=${accessToken}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );

        if (!statusResponse.ok) {
          const error = await statusResponse.json();
          throw new Error(`Meta API Error: ${error.error?.message || 'Unknown error'}`);
        }

        const campaignStatus = await statusResponse.json();
        
        result = {
          success: true,
          action: 'get_status',
          campaignId: requestData.campaignId,
          metaCampaignId: requestData.metaCampaignId,
          status: campaignStatus
        };
        break;

      default:
        throw new Error(`Unknown action: ${requestData.action}`);
    }

    console.log('Operation completed successfully:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    console.error('Edge function error:', error);
    
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
