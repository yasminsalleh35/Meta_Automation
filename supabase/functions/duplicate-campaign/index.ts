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

    // Build new campaign data using ACTUAL DB column names
    const newName = `${original.name} (cópia)`;
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    const newCampaign: Record<string, any> = {
      user_id: user.id,
      name: newName,
      objective: original.objective || 'OUTCOME_ENGAGEMENT',
      status: 'draft',
      // Creatives
      ad_title: original.ad_title,
      ad_text: original.ad_text,
      destination_url: original.destination_url,
      media_file_id: original.media_file_id,
      media_preview_url: original.media_preview_url,
      // Social media assets (correct DB column names)
      facebook_page: original.facebook_page,
      instagram_account: original.instagram_account,
      whatsapp_number: original.whatsapp_number,
      // Budget
      budget_daily: original.budget_daily,
      budget_total: original.budget_total,
      // Location (correct DB column names)
      location_country: original.location_country,
      location_state: original.location_state,
      location_city: original.location_city,
      location_radius: original.location_radius,
      selected_locations: original.selected_locations,
      // Targeting
      gender: original.gender,
      age_min: original.age_min,
      age_max: original.age_max,
      interests: original.interests,
      placements: original.placements,
      devices: original.devices,
      // Scheduling — reset start_date to today
      start_date: today,
      end_date: original.end_date,
      // Meta data
      ad_account_id: original.ad_account_id,
      meta_data: original.meta_data ? { ...original.meta_data, duplicated_from: campaignId } : null,
      source: original.source || 'camply',
      // Meta IDs are NOT copied (new campaign needs to be created on Meta)
      // meta_campaign_id, meta_adset_id, meta_ad_id are intentionally omitted
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
