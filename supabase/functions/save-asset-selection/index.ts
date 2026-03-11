import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SaveAssetSelectionRequest {
  integrationId?: string;
  selectedAdAccount: string;
  selectedPage: string;
  selectedInstagram?: string | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authorization = req.headers.get('Authorization');
    if (!authorization) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify JWT and get user
    const jwt = authorization.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwt);
    
    if (userError || !user) {
      console.error('Invalid JWT:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`User authenticated: ${user.id}`);

    // Parse request body
    const body: SaveAssetSelectionRequest = await req.json();
    const { integrationId, selectedAdAccount, selectedPage, selectedInstagram } = body;

    if (!selectedAdAccount || !selectedPage) {
      return new Response(
        JSON.stringify({ error: 'selectedAdAccount and selectedPage are required' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Save asset selection request:', {
      userId: user.id,
      integrationId,
      selectedAdAccount,
      selectedPage,
      selectedInstagram
    });

    // Find integration to update
    let integrationToUpdate;
    
    if (integrationId) {
      // Use specific integration ID
      const { data: integration, error: integrationError } = await supabaseClient
        .from('integrations')
        .select('*')
        .eq('id', integrationId)
        .eq('user_id', user.id)
        .single();

      if (integrationError || !integration) {
        console.error('Integration not found:', integrationError);
        return new Response(
          JSON.stringify({ error: 'Integration not found' }), 
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      integrationToUpdate = integration;
    } else {
      // Find user's active Meta integration
      const { data: integrations, error: integrationsError } = await supabaseClient
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'meta_ads')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (integrationsError || !integrations || integrations.length === 0) {
        console.error('No active Meta integration found:', integrationsError);
        return new Response(
          JSON.stringify({ error: 'No active Meta integration found' }), 
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      integrationToUpdate = integrations[0];
    }

    console.log(`Updating integration ${integrationToUpdate.id} for user ${user.id}`);

    // Prepare update data
    const updateData: any = {
      ad_account_id: selectedAdAccount,
      selected_ad_account_ids: [selectedAdAccount], // New normalized column
      page_id: selectedPage,
      selected_page_ids: [selectedPage], // New normalized column
      selected_instagram_ids: selectedInstagram ? [selectedInstagram] : [], // New normalized column
      updated_at: new Date().toISOString()
    };

    // Keep legacy columns for backward compatibility
    updateData.selected_accounts = selectedInstagram ? [selectedInstagram] : [];
    updateData.selected_pages = [{ id: selectedPage, name: selectedPage }]; // Simplified for backward compat

    // Update integration
    const { data: updatedIntegration, error: updateError } = await supabaseClient
      .from('integrations')
      .update(updateData)
      .eq('id', integrationToUpdate.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating integration:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update integration' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Asset selection saved successfully');

    // Validate access_token before triggering cache
    if (!integrationToUpdate.access_token) {
      console.error('⚠️ Integration missing access_token, skipping cache refresh');
      return new Response(
        JSON.stringify({ 
          success: true, 
          integration: updatedIntegration,
          message: 'Asset selection saved but integration needs access token'
        }), 
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // ✅ CORREÇÃO 6: Tornar cache de campanhas completamente assíncrono e não-bloqueante
    // Retornar resposta imediatamente e processar cache em background
    console.log(`🔄 Starting background campaign cache for ad_account: ${selectedAdAccount}`);
    
    // Fire-and-forget: não aguardar o resultado
    (async () => {
      try {
        // Set sync flag to prevent race conditions
        await supabaseClient
          .from('integrations')
          .update({ is_syncing_campaigns: true })
          .eq('id', integrationToUpdate.id);
        
        try {
          const { data: campaignData, error: campaignError } = await supabaseClient.functions.invoke(
            'meta-campaigns-cached',
            {
              body: { 
                ad_account_id: selectedAdAccount,
                force_refresh: true 
              },
              headers: {
                Authorization: authorization
              }
            }
          );

          if (campaignError) {
            console.error('⚠️ Error caching campaigns (background):', {
              error: campaignError,
              message: campaignError?.message,
              ad_account: selectedAdAccount
            });
          } else {
            console.log('✅ Campaigns cached successfully (background):', campaignData);
          }
        } finally {
          // Always clear sync flag
          await supabaseClient
            .from('integrations')
            .update({ is_syncing_campaigns: false })
            .eq('id', integrationToUpdate.id);
        }
      } catch (cacheError) {
        // Non-blocking error - just log it
        console.error('⚠️ Failed to trigger campaign cache (background, non-blocking):', cacheError);
      }
    })();

    return new Response(
      JSON.stringify({ 
        success: true, 
        integration: updatedIntegration,
        message: 'Asset selection saved successfully'
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error in save-asset-selection:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
