
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SimpleCampaignListFilters {
  status?: 'ACTIVE' | 'PAUSED' | 'REJECTED' | '';
  dateFrom?: string;
  dateTo?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from request headers
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autorização não fornecido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user authentication
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ User authenticated:', user.email);

    // Parse request body for filters
    const filters: SimpleCampaignListFilters = req.method === 'POST' ? await req.json() : {};
    console.log('📊 Received filters:', JSON.stringify(filters, null, 2));

    // Build query for campaigns created via SimpleCampaignWizard
    let query = supabaseClient
      .from('campaigns')
      .select(`
        id,
        name,
        status,
        created_at,
        meta_campaign_id,
        meta_adset_id,
        meta_ad_id,
        metrics,
        media_preview_url,
        last_metrics_sync_at
      `)
      .eq('user_id', user.id)
      .not('meta_campaign_id', 'is', null) // Only campaigns with Meta integration
      .order('created_at', { ascending: false });

    // Apply status filter
    if (filters.status && filters.status.trim() !== '') {
      // Map internal status to Meta status
      const statusMap = {
        'ACTIVE': 'active',
        'PAUSED': 'paused',
        'REJECTED': 'finished'
      };
      query = query.eq('status', statusMap[filters.status] || filters.status.toLowerCase());
    }

    // Apply date filters
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo + 'T23:59:59');
    }

    const { data: campaigns, error: campaignsError } = await query;

    if (campaignsError) {
      console.error('Database error:', campaignsError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar campanhas' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📈 Found ${campaigns?.length || 0} campaigns`);
    console.log('[SIMPLE-CAMPAIGN-LIST] Campanhas retornadas:', campaigns);
    console.log('[SIMPLE-CAMPAIGN-LIST] Sessão ativa:', user.id);

    // Transform campaigns to the expected format with real metrics
    const transformedCampaigns = (campaigns || []).map(campaign => {
      // Map internal status to display status
      const statusMap = {
        'active': 'ACTIVE',
        'paused': 'PAUSED',
        'finished': 'REJECTED',
        'draft': 'PAUSED'
      };

      // Extract metrics from database (already synced by meta-campaign-auto-sync)
      const m = campaign.metrics || {};

      return {
        campaignId: campaign.id,
        name: campaign.name || 'Campanha sem nome',
        status: (statusMap as any)[campaign.status] || 'PAUSED',
        createdAt: campaign.created_at,
        impressions: m.impressions || 0,
        clicks: m.clicks || 0,
        costPerResult: m.cost_per_messaging_conversation_started_7d || 0,
        reach: m.reach || 0,
        spend: m.spend || 0,
        ctr: m.ctr || 0,
        conversations: m.conversations || 0,
        metaCampaignId: campaign.meta_campaign_id,
        metaAdsetId: campaign.meta_adset_id,
        metaAdId: campaign.meta_ad_id,
        lastMetricsSyncAt: campaign.last_metrics_sync_at,
        mediaPreviewUrl: campaign.media_preview_url
      };
    });

    const response = {
      success: true,
      campaigns: transformedCampaigns,
      total: transformedCampaigns.length
    };

    console.log('🎉 Simple campaign list retrieved successfully');

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Error in simple campaign list:', error);
    
    let errorMessage = 'Erro interno do servidor';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage
      }),
      { 
        status: statusCode, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
