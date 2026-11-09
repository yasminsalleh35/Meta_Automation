
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  ACTIVATION_ERROR_STATES,
  activateCascade,
  fetchEffectiveStatus,
  pauseCascade,
  type CascadeIds,
} from "../_shared/metaCascade.ts";
import { mapMetaEffectiveStatus } from "../_shared/status.ts";
import { GRAPH_BASE } from '../_shared/meta.ts'; // audit PLT-03
import { createLogger } from '../_shared/logger.ts';
import { toObject } from '../_shared/errors.ts';

// audit PLT-06: logs estruturados (corpo/status inalterados)
const log = createLogger('meta-campaign-bulk-operations');

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
    
    const unauthenticated = () => new Response(
      JSON.stringify({ success: false, error: "User not authenticated", code: "UNAUTHENTICATED" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return unauthenticated();
    }

    const token = authHeader.replace("Bearer ", "");

    const authClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { data: userData, error: userError } = await authClient.auth.getUser(token);

    if (userError || !userData.user?.id) {
      return unauthenticated();
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
    const baseUrl = GRAPH_BASE;

    const results = [];
    
    // Process each campaign
    for (let i = 0; i < requestData.metaCampaignIds.length; i++) {
      const metaCampaignId = requestData.metaCampaignIds[i];
      const campaignId = requestData.campaignIds[i];
      
      try {
        console.log(`Processing campaign ${i + 1}/${requestData.metaCampaignIds.length}:`, metaCampaignId);
        
        let response: Response | null;
        let newStatus: string;

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

          case 'activate': {
            // audit CMP-09: ativa em cascata Campaign → AdSet → Ad (mesma lógica de simple-campaign-activate)
            const { data: row, error: rowError } = await supabaseClient
              .from('campaigns')
              .select('meta_campaign_id, meta_adset_id, meta_ad_id')
              .eq('id', campaignId)
              .eq('user_id', userData.user.id)
              .maybeSingle();

            if (rowError || !row) {
              throw new Error('Campanha não encontrada');
            }

            const cascadeIds: CascadeIds = {
              campaignId: row.meta_campaign_id || metaCampaignId,
              adsetId: row.meta_adset_id,
              adId: row.meta_ad_id,
            };
            await activateCascade(cascadeIds, accessToken);

            const effective = await fetchEffectiveStatus(cascadeIds.campaignId, 'Campaign', accessToken);
            if (effective && ACTIVATION_ERROR_STATES.includes(effective)) {
              await pauseCascade(cascadeIds, accessToken);
              newStatus = 'paused';
              await supabaseClient
                .from('campaigns')
                .update({ status: newStatus, status_at_sync: effective, updated_at: new Date().toISOString() })
                .eq('id', campaignId)
                .eq('user_id', userData.user.id);
              throw new Error(`Não foi possível ativar: ${effective}`);
            }
            newStatus = mapMetaEffectiveStatus(effective) === 'pending_review' ? 'pending_review' : 'active';
            response = null; // cascata já validou as respostas
            break;
          }

          case 'delete':
            // Graph API: token no header, não no body (DELETE não tem body confiável)
            response = await fetch(`${baseUrl}/${metaCampaignId}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            newStatus = 'deleted';
            break;

          default:
            throw new Error(`Unknown action: ${requestData.action}`);
        }

        if (response && !response.ok) {
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
          log.error('handler', 'Error updating local campaign', { campaignId, error: toObject(updateError) });
        }

        results.push({
          success: true,
          campaignId,
          metaCampaignId,
          action: requestData.action,
          message: `Campaign ${requestData.action}d successfully`
        });

      } catch (error) {
        log.error('handler', 'Error processing campaign', { metaCampaignId, error: toObject(error) });
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
    log.error('handler', 'Bulk operations edge function error', { error: toObject(error) });
    
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
