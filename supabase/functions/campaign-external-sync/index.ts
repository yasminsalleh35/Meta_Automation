// External Campaign Sync - Meta API v23 Compatible
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { resolveMetaIntegration } from '../_shared/metaIntegration.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const META_API_VERSION = 'v23.0';
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

interface MetaCampaignData {
  id: string;
  name: string;
  objective: string;
  status: string;
  created_time: string;
}

interface MetaAdSetData {
  id: string;
  name: string;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  end_time?: string;
  targeting: any;
}

interface MetaAdData {
  id: string;
  name: string;
  creative?: {
    id: string;
  };
}

interface MetaCreativeData {
  id: string;
  title?: string;
  body?: string;
  image_url?: string;
  video_id?: string;
  thumbnail_url?: string;
  object_story_spec?: any;
}

interface MetaInsightsData {
  impressions?: string;
  reach?: string;
  clicks?: string;
  spend?: string;
  actions?: Array<{ action_type: string; value: string }>;
  cost_per_action_type?: Array<{ action_type: string; value: string }>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Authenticate admin user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: adminUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !adminUser) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', adminUser.id)
      .in('role', ['admin', 'super_admin'])
      .single();

    if (!roleData) {
      throw new Error('Admin access required');
    }

    // Parse request body
    const body = await req.json();
    const { user_id, meta_campaign_id, meta_adset_id, meta_creative_id, meta_ad_id } = body;

    if (!user_id || !meta_campaign_id || !meta_adset_id || !meta_ad_id) {
      throw new Error('Missing required fields: user_id, meta_campaign_id, meta_adset_id, meta_ad_id');
    }

    console.log('🔄 External sync request:', { user_id, meta_campaign_id, meta_adset_id, meta_ad_id });

    // Get user's Meta integration
    const integration = await resolveMetaIntegration(user_id);
    if (!integration?.access_token) {
      throw new Error('User does not have an active Meta Ads integration');
    }

    const accessToken = integration.access_token;
    const adAccountId = integration.ad_account_id;

    console.log('✅ Meta integration found:', { provider: integration.provider, ad_account_id: adAccountId });

    // Fetch Campaign data
    console.log('📊 Fetching campaign data...');
    const campaignResponse = await fetch(
      `${META_BASE_URL}/${meta_campaign_id}?fields=id,name,objective,status,created_time,updated_time&access_token=${accessToken}`
    );
    
    if (!campaignResponse.ok) {
      const error = await campaignResponse.json();
      throw new Error(`Meta API Campaign error: ${error.error?.message || 'Unknown error'}`);
    }
    
    const campaignData: MetaCampaignData = await campaignResponse.json();
    console.log('✅ Campaign data:', campaignData);

    // Fetch AdSet data
    console.log('📊 Fetching adset data...');
    const adsetResponse = await fetch(
      `${META_BASE_URL}/${meta_adset_id}?fields=id,name,daily_budget,lifetime_budget,start_time,end_time,targeting&access_token=${accessToken}`
    );
    
    if (!adsetResponse.ok) {
      const error = await adsetResponse.json();
      throw new Error(`Meta API AdSet error: ${error.error?.message || 'Unknown error'}`);
    }
    
    const adsetData: MetaAdSetData = await adsetResponse.json();
    console.log('✅ AdSet data:', adsetData);

    // Fetch Ad data
    console.log('📊 Fetching ad data...');
    const adResponse = await fetch(
      `${META_BASE_URL}/${meta_ad_id}?fields=id,name,creative{id}&access_token=${accessToken}`
    );
    
    if (!adResponse.ok) {
      const error = await adResponse.json();
      throw new Error(`Meta API Ad error: ${error.error?.message || 'Unknown error'}`);
    }
    
    const adData: MetaAdData = await adResponse.json();
    console.log('✅ Ad data:', adData);

    // Fetch Creative data if creative_id provided or from ad
    let creativeData: MetaCreativeData | null = null;
    const finalCreativeId = meta_creative_id || adData.creative?.id;
    
    if (finalCreativeId) {
      console.log('📊 Fetching creative data...');
      const creativeResponse = await fetch(
        `${META_BASE_URL}/${finalCreativeId}?fields=id,title,body,image_url,video_id,thumbnail_url,object_story_spec&access_token=${accessToken}`
      );
      
      if (creativeResponse.ok) {
        creativeData = await creativeResponse.json();
        console.log('✅ Creative data:', creativeData);
      }
    }

    // Fetch Insights (metrics)
    console.log('📊 Fetching insights...');
    const insightsResponse = await fetch(
      `${META_BASE_URL}/${meta_ad_id}/insights?fields=impressions,reach,clicks,spend,actions,cost_per_action_type&access_token=${accessToken}`
    );
    
    let insightsData: MetaInsightsData = {};
    if (insightsResponse.ok) {
      const insightsResult = await insightsResponse.json();
      if (insightsResult.data && insightsResult.data.length > 0) {
        insightsData = insightsResult.data[0];
      }
    }
    console.log('✅ Insights data:', insightsData);

    // Process metrics
    const metrics = {
      impressions: parseInt(insightsData.impressions || '0'),
      reach: parseInt(insightsData.reach || '0'),
      clicks: parseInt(insightsData.clicks || '0'),
      spend: parseFloat(insightsData.spend || '0'),
      cpa: undefined as number | undefined,
      conversations: undefined as number | undefined,
      cost_per_messaging_conversation_started_7d: undefined as number | undefined
    };

    // Extract conversations and CPA from actions
    if (insightsData.actions) {
      const conversationAction = insightsData.actions.find(
        a => a.action_type === 'onsite_conversion.messaging_conversation_started_7d'
      );
      if (conversationAction) {
        metrics.conversations = parseInt(conversationAction.value);
      }
    }

    if (insightsData.cost_per_action_type) {
      const cpaAction = insightsData.cost_per_action_type.find(
        a => a.action_type === 'onsite_conversion.messaging_conversation_started_7d'
      );
      if (cpaAction) {
        metrics.cost_per_messaging_conversation_started_7d = parseFloat(cpaAction.value);
        metrics.cpa = parseFloat(cpaAction.value);
      }
    }

    // Extract media preview
    let mediaPreviewUrl: string | undefined;
    if (creativeData) {
      mediaPreviewUrl = creativeData.thumbnail_url || creativeData.image_url;
      
      // Try to get from object_story_spec if not found
      if (!mediaPreviewUrl && creativeData.object_story_spec) {
        const linkData = creativeData.object_story_spec.link_data;
        if (linkData) {
          mediaPreviewUrl = linkData.picture || linkData.image_url;
        }
      }
    }

    // Prepare campaign record
    const now = new Date().toISOString();
    const campaignRecord = {
      user_id,
      name: campaignData.name,
      objective: campaignData.objective || 'UNKNOWN',
      status: mapMetaStatusToLocal(campaignData.status),
      meta_campaign_id,
      meta_adset_id,
      meta_ad_id,
      ad_account_id: adAccountId,
      budget_daily: adsetData.daily_budget ? parseFloat(adsetData.daily_budget) / 100 : null,
      budget_total: adsetData.lifetime_budget ? parseFloat(adsetData.lifetime_budget) / 100 : null,
      start_date: adsetData.start_time ? new Date(adsetData.start_time).toISOString().split('T')[0] : null,
      end_date: adsetData.end_time ? new Date(adsetData.end_time).toISOString().split('T')[0] : null,
      ad_title: creativeData?.title,
      ad_text: creativeData?.body,
      media_preview_url: mediaPreviewUrl,
      metrics,
      meta_data: {
        campaign: campaignData,
        adset: adsetData,
        ad: adData,
        creative: creativeData
      },
      meta_data_cached_at: now,
      last_metrics_sync_at: now,
      processing_status: 'completed',
      meta_integration_status: 'active',
      selected_locations: adsetData.targeting?.geo_locations || null,
      age_min: adsetData.targeting?.age_min || 18,
      age_max: adsetData.targeting?.age_max || 65,
      gender: mapMetaGenderToLocal(adsetData.targeting?.genders),
      created_at: campaignData.created_time,
      updated_at: now
    };

    // Check if campaign already exists
    const { data: existingCampaign } = await supabase
      .from('campaigns')
      .select('id')
      .eq('meta_campaign_id', meta_campaign_id)
      .eq('user_id', user_id)
      .maybeSingle();

    let result;
    if (existingCampaign) {
      // Update existing campaign
      console.log('📝 Updating existing campaign:', existingCampaign.id);
      const { data, error } = await supabase
        .from('campaigns')
        .update(campaignRecord)
        .eq('id', existingCampaign.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
      console.log('✅ Campaign updated');
    } else {
      // Insert new campaign
      console.log('📝 Inserting new campaign');
      const { data, error } = await supabase
        .from('campaigns')
        .insert(campaignRecord)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
      console.log('✅ Campaign inserted');
    }

    return new Response(
      JSON.stringify({
        success: true,
        campaign_id: result.id,
        campaign_name: campaignData.name,
        action: existingCampaign ? 'updated' : 'created',
        metrics
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('❌ External sync error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});

function mapMetaStatusToLocal(metaStatus: string): string {
  const statusMap: Record<string, string> = {
    'ACTIVE': 'active',
    'PAUSED': 'paused',
    'DELETED': 'finished',
    'ARCHIVED': 'finished'
  };
  return statusMap[metaStatus] || 'draft';
}

function mapMetaGenderToLocal(genders?: number[]): string {
  if (!genders || genders.length === 0) return 'all';
  if (genders.length === 2) return 'all';
  if (genders.includes(1)) return 'male';
  if (genders.includes(2)) return 'female';
  return 'all';
}
