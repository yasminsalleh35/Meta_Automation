// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function json(status: number, data: any) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    // Auth
    const supabaseAnon = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json(401, { error: 'No authorization header' });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
    if (authError || !user) return json(401, { error: 'Invalid token' });

    // Parse body
    const body = await req.json();
    const { campaignId } = body;

    if (!campaignId) {
      return json(400, { error: 'campaignId is required' });
    }

    // Get original campaign
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: original, error: fetchError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError) {
      console.error('[duplicate-campaign] Fetch error:', fetchError);
      return json(500, { error: 'Failed to fetch original campaign' });
    }

    if (!original) {
      return json(404, { error: 'Campaign not found' });
    }

    // Build new campaign data (remove IDs and meta references)
    const newName = `${original.name || original.campaign_name} (cópia)`;
    const now = new Date().toISOString();

    const newCampaign: Record<string, any> = {
      user_id: user.id,
      name: newName,
      campaign_name: newName,
      status: 'DRAFT',
      // Copy all configuration fields
      ad_title: original.ad_title,
      ad_text: original.ad_text,
      daily_budget: original.daily_budget,
      fanpage: original.fanpage,
      instagram: original.instagram,
      whatsapp_link: original.whatsapp_link,
      whatsapp_number: original.whatsapp_number,
      creative_type: original.creative_type,
      media_url: original.media_url,
      media_file_id: original.media_file_id,
      campaign_type: original.campaign_type || 'simple',
      // Location
      city: original.city,
      city_coordinates: original.city_coordinates,
      radius: original.radius,
      country_code: original.country_code,
      selected_locations: original.selected_locations,
      // Targeting
      gender: original.gender,
      age_min: original.age_min,
      age_max: original.age_max,
      special_categories: original.special_categories,
      interests: original.interests,
      // Scheduling
      start_date: now.split('T')[0], // Reset to today
      end_date: original.end_date,
      // Meta IDs are NOT copied (new campaign needs to be created on Meta)
      // meta_campaign_id: null,
      // meta_adset_id: null,
      // meta_ad_id: null,
      created_at: now,
      updated_at: now,
    };

    // Remove null/undefined fields
    for (const key of Object.keys(newCampaign)) {
      if (newCampaign[key] === undefined) {
        delete newCampaign[key];
      }
    }

    const { data: inserted, error: insertError } = await supabase
      .from('campaigns')
      .insert(newCampaign)
      .select('id, name')
      .single();

    if (insertError) {
      console.error('[duplicate-campaign] Insert error:', insertError);
      return json(500, { error: 'Failed to create duplicate campaign', details: insertError.message });
    }

    console.log('[duplicate-campaign] Success:', {
      originalId: campaignId,
      newId: inserted.id,
      newName: inserted.name,
    });

    return json(200, {
      success: true,
      newCampaignId: inserted.id,
      newCampaignName: inserted.name,
      message: 'Campaign duplicated successfully',
    });

  } catch (error) {
    console.error('[duplicate-campaign] Error:', error);
    return json(500, {
      error: 'Failed to duplicate campaign',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});
