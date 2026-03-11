import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeadersFor, handlePreflight } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return handlePreflight(req);
  }

  const origin = req.headers.get('Origin');
  const corsHeaders = corsHeadersFor(origin);

  try {
    // Get environment from request body
    const body = await req.json();
    const environment = body.environment || 'sandbox';

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Asaas configuration from database
    const { data: configData, error: configError } = await supabase
      .rpc('get_asaas_config_for_functions', { p_environment: environment });

    if (configError || !configData || configData.length === 0) {
      console.error('[Asaas Test] No config found:', configError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Asaas não configurado. Configure a API Key primeiro.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config = configData[0];
    const apiKey = config.api_key;
    // Use environment from request body (already declared above)

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'API Key não configurada',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine base URL based on environment
    const baseUrl = environment === 'production'
      ? 'https://api.asaas.com/v3'
      : 'https://api-sandbox.asaas.com/v3';

    console.log(`[Asaas Test] Testing connection to ${baseUrl}`);

    // Test connection by fetching account info
    const response = await fetch(`${baseUrl}/myAccount`, {
      method: 'GET',
      headers: {
        'access_token': apiKey,
        'Content-Type': 'application/json',
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('[Asaas Test] API Error:', responseData);
      return new Response(
        JSON.stringify({
          success: false,
          error: responseData.errors?.[0]?.description || 'Erro ao conectar com Asaas',
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Asaas Test] Connection successful:', responseData.name);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          name: responseData.name,
          email: responseData.email,
          walletId: responseData.walletId,
          environment,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Asaas Test] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro ao testar conexão',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
