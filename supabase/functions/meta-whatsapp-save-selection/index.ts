// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface WhatsAppSelection {
  business_id: string;
  waba_id: string;
  phone_number_id: string;
  display_phone_number?: string;
  verified_name?: string;
}

function json(status: number, data: any) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function logError(prefix: string, error: any) {
  console.error(`${prefix} ERROR:`, error instanceof Error ? error.message : error);
}

function logInfo(prefix: string, message: string, data?: any) {
  console.log(`${prefix} ${message}`, data || '');
}

async function assertAuthedUser(req: Request) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('No authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error('Invalid or expired token');
  }

  return user;
}

function createServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

function validateSelection(body: any): WhatsAppSelection {
  if (!body.business_id || typeof body.business_id !== 'string') {
    throw new Error('business_id is required and must be a string');
  }
  
  if (!body.waba_id || typeof body.waba_id !== 'string') {
    throw new Error('waba_id is required and must be a string');
  }
  
  if (!body.phone_number_id || typeof body.phone_number_id !== 'string') {
    throw new Error('phone_number_id is required and must be a string');
  }

  return {
    business_id: body.business_id,
    waba_id: body.waba_id,
    phone_number_id: body.phone_number_id,
    display_phone_number: body.display_phone_number || null,
    verified_name: body.verified_name || null
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const user = await assertAuthedUser(req);
    
    let body;
    try {
      body = await req.json();
    } catch {
      return json(400, { error: 'Invalid JSON body' });
    }

    const selection = validateSelection(body);
    
    logInfo('[meta-whatsapp-save-selection]', 'Saving WhatsApp selection', {
      userId: user.id,
      businessId: selection.business_id,
      wabaId: selection.waba_id,
      phoneId: selection.phone_number_id
    });

    const supabase = createServiceClient();

    // Find the user's active Meta integration
    const { data: integration, error: findError } = await supabase
      .from('integrations')
      .select('id')
      .eq('user_id', user.id)
      .eq('provider', 'meta_ads')
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findError) {
      logError('[meta-whatsapp-save-selection]', `Database error finding integration: ${findError.message}`);
      throw findError;
    }

    if (!integration) {
      logInfo('[meta-whatsapp-save-selection]', 'No active integration found for user', user.id);
      return json(404, { error: 'No active Meta integration found' });
    }

    // Update the integration with WhatsApp selection
    const { error: updateError } = await supabase
      .from('integrations')
      .update({
        selected_business_id: selection.business_id,
        selected_waba_id: selection.waba_id,
        selected_whatsapp_phone_id: selection.phone_number_id,
        selected_whatsapp_display: selection.display_phone_number,
        selected_whatsapp_verified_name: selection.verified_name,
        updated_at: new Date().toISOString()
      })
      .eq('id', integration.id);

    if (updateError) {
      logError('[meta-whatsapp-save-selection]', `Database error updating integration: ${updateError.message}`);
      throw updateError;
    }

    logInfo('[meta-whatsapp-save-selection]', '[UPDATED]', `phone_id=${selection.phone_number_id}`);

    return json(200, { 
      success: true,
      message: 'WhatsApp selection saved successfully',
      selection: {
        business_id: selection.business_id,
        waba_id: selection.waba_id,
        phone_number_id: selection.phone_number_id,
        display_phone_number: selection.display_phone_number,
        verified_name: selection.verified_name
      }
    });

  } catch (error) {
    logError('[meta-whatsapp-save-selection]', error);
    return json(500, { 
      error: 'Failed to persist WhatsApp selection', 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
});