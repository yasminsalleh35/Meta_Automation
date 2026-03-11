
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    console.log('Edge function called, processing request...');
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error('No authorization header provided');
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    
    const { data: userData, error: userError } = await authClient.auth.getUser(token);
    
    if (userError) {
      console.error('Authentication error:', userError);
      throw new Error(`Authentication error: ${userError.message}`);
    }
    
    const user = userData.user;
    if (!user?.id) {
      console.error('User not authenticated');
      throw new Error("User not authenticated");
    }

    console.log('User authenticated:', user.id);

    const campaignData = await req.json();
    console.log('Received campaign data:', JSON.stringify(campaignData, null, 2));

    // ✅ CORRIGIDO: Validação melhorada de localização
    let selectedLocationsData = [];
    
    // Try multiple sources for location data
    if (campaignData.location?.selectedLocations && Array.isArray(campaignData.location.selectedLocations)) {
      selectedLocationsData = campaignData.location.selectedLocations;
    } else if (campaignData.selectedLocations && Array.isArray(campaignData.selectedLocations)) {
      selectedLocationsData = campaignData.selectedLocations;
    }

    if (selectedLocationsData.length === 0) {
      console.warn('No selectedLocations found, trying to create from location data...');
      
      // Emergency reconstruction from available data
      if (campaignData.location?.selectedAddress) {
        const address = campaignData.location.selectedAddress;
        console.log('Reconstructing location from address:', address);
        
        if (address.toLowerCase().includes('brasil') || address.toLowerCase().includes('brazil')) {
          selectedLocationsData = [{
            key: 'BR',
            name: 'Brasil',
            type: 'country',
            country_code: 'BR'
          }];
        } else {
          // Try to create a location from the address
          const parts = address.split(',').map((p: string) => p.trim());
          selectedLocationsData = [{
            key: `ADDR_${Date.now()}`, // Temporary key
            name: parts[0] || address,
            type: 'city',
            radius: campaignData.location.radius || 10
          }];
        }
        
        console.log('Reconstructed location data:', selectedLocationsData);
      }
    }

    if (selectedLocationsData.length === 0) {
      throw new Error("Pelo menos uma localização deve ser selecionada");
    }

    // Validar IDs do Meta se não forem emergência
    const hasValidMetaIDs = selectedLocationsData.every((loc: any) => 
      loc.key && !loc.key.startsWith('emergency_') && !loc.key.startsWith('ADDR_')
    );
    
    if (!hasValidMetaIDs) {
      console.warn('Some locations have temporary keys, but proceeding with save...');
    }

    if (!campaignData.objective) {
      throw new Error("Objetivo da campanha é obrigatório");
    }

    if (!campaignData.campaignName) {
      throw new Error("Nome da campanha é obrigatório");
    }

    const budgetTotal = campaignData.budget?.total && campaignData.budget.total > 0 
      ? campaignData.budget.total 
      : (campaignData.budget?.daily || 50) * 20;

    // ✅ CORRIGIDO: Preparar selected_locations corretamente
    const selectedLocationsJson = JSON.stringify(selectedLocationsData.map((loc: any) => ({
      key: loc.key,
      name: loc.name,
      type: loc.type,
      country_code: loc.country_code || undefined,
      radius: loc.radius || undefined,
      distance_unit: loc.distance_unit || undefined
    })));

    console.log('Prepared selected_locations JSON:', selectedLocationsJson);

    // Get active Meta Ads integration to associate campaign with ad_account_id
    const { data: integration } = await supabaseClient
      .from('integrations')
      .select('ad_account_id')
      .eq('user_id', user.id)
      .eq('provider', 'meta_ads')
      .eq('status', 'active')
      .maybeSingle();

    const activeAdAccountId = integration?.ad_account_id || null;
    console.log('🔍 Active ad_account_id for campaign:', activeAdAccountId);

    const dbCampaign = {
      user_id: user.id,
      ad_account_id: activeAdAccountId,
      name: campaignData.campaignName,
      objective: campaignData.objective,
      status: 'draft',
      
      // ✅ CORRIGIDO: Usar nova coluna selected_locations
      location_radius: campaignData.location?.radius || 10,
      selected_locations: selectedLocationsJson, // Nova coluna
      
      // Manter compatibilidade com colunas antigas por enquanto
      location_country: campaignData.location?.country || 'Brasil',
      location_state: campaignData.location?.state || null,
      location_city: campaignData.location?.city || null,
      
      // Audience
      gender: campaignData.gender || 'all',
      age_min: campaignData.ageRange?.min || 18,
      age_max: campaignData.ageRange?.max || 65,
      interests: JSON.stringify(campaignData.interests || []),
      
      // Campaign settings
      placements: JSON.stringify(campaignData.placements || ['feed']),
      devices: JSON.stringify(campaignData.devices || ['mobile', 'desktop']),
      
      // Budget
      budget_daily: campaignData.budget?.daily || 50,
      budget_total: budgetTotal,
      
      // Duration
      start_date: campaignData.duration?.startDate || null,
      end_date: campaignData.duration?.endDate || null,
      
      // Creatives
      ad_title: campaignData.adTitle || '',
      ad_text: campaignData.adText || '',
      destination_url: campaignData.destinationUrl || '',
      media_file_id: campaignData.selectedMediaId || null,
      
      // Social media
      facebook_page: campaignData.facebookPage || '',
      instagram_account: campaignData.instagramAccount || '',
      whatsapp_number: campaignData.whatsappNumber || '',
      
      // Meta Ads IDs
      meta_campaign_id: campaignData.meta_campaign_id || null,
      meta_adset_id: campaignData.meta_adset_id || null,
      meta_ad_id: campaignData.meta_ad_id || null,
      
      updated_at: new Date().toISOString()
    };

    console.log('Prepared database campaign:', {
      selectedLocationsCount: selectedLocationsData.length,
      selectedLocationsPreview: selectedLocationsData.map((loc: any) => ({ name: loc.name, key: loc.key, type: loc.type })),
      metaIDs: {
        campaign: campaignData.meta_campaign_id,
        adset: campaignData.meta_adset_id,
        ad: campaignData.meta_ad_id
      }
    });

    let result;
    
    if (campaignData.campaignId) {
      console.log('Updating existing campaign:', campaignData.campaignId);
      
      const { data, error } = await supabaseClient
        .from("campaigns")
        .update(dbCampaign)
        .eq('id', campaignData.campaignId)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) {
        console.error('Database update error:', error);
        throw new Error(`Erro ao atualizar campanha: ${error.message}`);
      }
      
      result = data;
      console.log('Campaign updated successfully:', result.id);
    } else {
      console.log('Creating new campaign...');
      
      const { data, error } = await supabaseClient
        .from("campaigns")
        .insert(dbCampaign)
        .select()
        .single();
      
      if (error) {
        console.error('Database insert error:', error);
        throw new Error(`Erro ao criar campanha: ${error.message || error.details || 'Erro desconhecido'}`);
      }
      
      result = data;
      console.log('Campaign created successfully:', result.id);
    }

    const responseData = { 
      success: true, 
      campaignId: result.id,
      message: campaignData.campaignId ? 'Campanha atualizada com sucesso!' : 'Campanha criada com sucesso!'
    };

    console.log('Returning success response:', responseData);

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    console.error('Edge function error:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorResponse = { 
      error: errorMessage,
      success: false 
    };
    
    console.log('Returning error response:', errorResponse);
    
    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
