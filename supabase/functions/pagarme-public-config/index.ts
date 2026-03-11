// =============================================
// Edge Function: Public Pagar.me Config
// Returns only safe public configuration
// =============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    // ✅ Always get LIVE config for public checkout
    const { data: config, error } = await supabase
      .rpc('get_pagarme_config_for_functions', { p_environment: 'live' })
      .maybeSingle();

    if (error || !config) {
      console.error('[pagarme::public-config] Config not found', error);
      return new Response(JSON.stringify({ 
        error: 'Configuration not available' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Return only safe public fields
    const publicConfig = {
      environment: config.environment,
      encryption_key: config.encryption_key,
      // Plan IDs for reference (public info)
      plans: {
        mensal: { price: 34999, installments: 1 },
        anual: { price: 249999, installments: 12 }
      }
    };

    return new Response(JSON.stringify(publicConfig), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[pagarme::public-config] Error:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
