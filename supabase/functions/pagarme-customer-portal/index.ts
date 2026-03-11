// =============================================
// Edge Function: pagarme-customer-portal
// Substitui customer-portal para usar Pagar.me
// =============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  console.log(`[pagarme-customer-portal] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Function started');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid token');
    }

    logStep('User authenticated', { user_id: user.id });

    // Get user's subscription from subscribers table
    const { data: subscriber, error: subError } = await supabaseClient
      .from('subscribers')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (subError || !subscriber) {
      logStep('No active subscription found', { error: subError });
      return new Response(JSON.stringify({ 
        error: 'Nenhuma assinatura ativa encontrada. Primeiro assine um plano para acessar o portal.' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    logStep('Active subscription found', { 
      subscription_id: subscriber.pagarme_subscription_id,
      plan_type: subscriber.plan_type 
    });

    // Get Pagar.me config
    const { data: config, error: configError } = await supabaseClient.rpc('get_pagarme_config_for_functions');
    
    if (configError || !config) {
      throw new Error('Pagar.me configuration not found');
    }

    logStep('Pagar.me config loaded');

    // Create a simplified portal URL
    // Since Pagar.me doesn't have a native customer portal like Stripe,
    // we'll redirect to a custom page within our app
    const appUrl = Deno.env.get('SITE_URL') || 'https://app.camply.com.br';
    const portalUrl = `${appUrl}/dashboard/subscription?action=manage`;

    logStep('Portal URL created', { url: portalUrl });

    return new Response(JSON.stringify({ url: portalUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR', { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});