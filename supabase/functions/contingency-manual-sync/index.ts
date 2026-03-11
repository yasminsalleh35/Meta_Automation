import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'
import { corsHeadersFor, handlePreflight } from '../_shared/cors.ts'

interface ManualSyncPayload {
  contingency_id: string;
  meta_campaign_id: string;
  meta_adset_id: string;
  meta_creative_id?: string;
  meta_ad_id: string;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");

  if (req.method === 'OPTIONS') {
    return handlePreflight(req);
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verificar se é admin
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { data: userRoles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRoles || !['admin', 'super_admin'].includes(userRoles.role)) {
      throw new Error('Admin access required');
    }

    const payload: ManualSyncPayload = await req.json();
    console.log('📥 Manual sync request:', {
      contingency_id: payload.contingency_id,
      meta_campaign_id: payload.meta_campaign_id,
      meta_adset_id: payload.meta_adset_id,
      meta_ad_id: payload.meta_ad_id
    });

    // 1. Buscar dados da contingência
    const { data: contingency, error: contingencyError } = await supabaseClient
      .from('campaign_contingency')
      .select('*')
      .eq('id', payload.contingency_id)
      .single();

    if (contingencyError || !contingency) {
      console.error('❌ Contingency not found:', contingencyError);
      throw new Error('Contingency campaign not found');
    }

    console.log('📦 Contingency data loaded for user:', contingency.user_id);

    // 2. Verificar se já existe campanha com esse meta_campaign_id
    const { data: existingCampaign } = await supabaseClient
      .from('campaigns')
      .select('id')
      .eq('meta_campaign_id', payload.meta_campaign_id)
      .eq('user_id', contingency.user_id)
      .maybeSingle();

    if (existingCampaign) {
      console.log('🔄 Updating existing campaign:', existingCampaign.id);
      
      // Atualizar campanha existente
      const { error: updateError } = await supabaseClient
        .from('campaigns')
        .update({
          meta_adset_id: payload.meta_adset_id,
          meta_ad_id: payload.meta_ad_id,
          meta_integration_status: 'active',
          processing_status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingCampaign.id);

      if (updateError) throw updateError;

      console.log('✅ Updated existing campaign:', existingCampaign.id);
    } else {
      console.log('🆕 Creating new campaign in database');
      
      // 3. Criar nova campanha na tabela campaigns
      const campaignData = contingency.campaign_data;

      const newCampaign = {
        user_id: contingency.user_id,
        name: campaignData.campaignName || 'Campanha Contingência',
        objective: 'OUTCOME_ENGAGEMENT',
        status: 'active',
        
        // Meta IDs
        meta_campaign_id: payload.meta_campaign_id,
        meta_adset_id: payload.meta_adset_id,
        meta_ad_id: payload.meta_ad_id,
        
        // Status de integração
        meta_integration_status: 'active',
        processing_status: 'completed',
        
        // Dados da campanha
        ad_title: campaignData.adTitle,
        ad_text: campaignData.adText,
        destination_url: campaignData.whatsappLink,
        whatsapp_number: campaignData.whatsappLink?.match(/\d+/)?.[0],
        
        budget_daily: campaignData.dailyBudget,
        start_date: campaignData.startDate,
        
        location_city: campaignData.city,
        location_radius: campaignData.radius,
        selected_locations: campaignData.cityCoordinates,
        
        facebook_page: campaignData.fanpage,
        instagram_account: campaignData.instagram,
        
        media_file_id: campaignData.mediaFileId,
        media_preview_url: campaignData.selectedMediaMeta?.public_url,
        
        age_min: campaignData.ageMin || 18,
        age_max: campaignData.ageMax || 65,
        gender: campaignData.gender || 'all',
        
        placements: campaignData.placements || ['feed'],
        devices: campaignData.devices || ['mobile', 'desktop'],
        interests: campaignData.interests || [],
        
        ad_account_id: contingency.ad_account_id,
        
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: createdCampaign, error: createError } = await supabaseClient
        .from('campaigns')
        .insert(newCampaign)
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating campaign:', createError);
        throw createError;
      }

      console.log('✅ Created new campaign:', createdCampaign.id);
    }

    // 4. Marcar contingência como completed
    const { error: updateContingencyError } = await supabaseClient
      .from('campaign_contingency')
      .update({
        status: 'completed',
        completed_by: user.id,
        completed_at: new Date().toISOString(),
        admin_notes: `Sincronizada manualmente por ${user.email}. Campaign: ${payload.meta_campaign_id}, AdSet: ${payload.meta_adset_id}, Ad: ${payload.meta_ad_id}`
      })
      .eq('id', payload.contingency_id);

    if (updateContingencyError) {
      console.error('❌ Error updating contingency status:', updateContingencyError);
      throw updateContingencyError;
    }

    console.log('✅ Manual sync completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Campaign synchronized successfully',
        campaignId: payload.meta_campaign_id
      }),
      {
        headers: { ...corsHeadersFor(origin), 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Manual sync error:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.toString()
      }),
      {
        headers: { ...corsHeadersFor(origin), 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
