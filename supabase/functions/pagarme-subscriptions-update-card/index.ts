import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  console.log(`[pagarme-subscriptions-update-card] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('🚀 Starting card update');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    const { subscription_id, token, card_hash } = body;

    if (!subscription_id) {
      throw new Error('subscription_id is required');
    }

    if (!token && !card_hash) {
      throw new Error('Either token or card_hash is required');
    }

    logStep('📝 Request validated', { subscription_id, has_token: !!token, has_card_hash: !!card_hash });

    // Get Pagar.me config
    const { data: config, error: configError } = await supabase.rpc('get_pagarme_config_for_functions');
    if (configError || !config?.secret_key) {
      throw new Error('Pagar.me config not found');
    }

    logStep('✅ Config loaded');

    // Prepare update payload
    const updatePayload: any = {
      payment_method: 'credit_card'
    };

    if (token) {
      updatePayload.card_id = token;
    } else if (card_hash) {
      updatePayload.card_hash = card_hash;
    }

    // Update card in Pagar.me v5
    const pagarmeUrl = `https://api.pagar.me/core/v5/subscriptions/${subscription_id}/card`;
    const pagarmeResponse = await fetch(pagarmeUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(config.secret_key + ':')}`
      },
      body: JSON.stringify(updatePayload)
    });

    const pagarmeResult = await pagarmeResponse.json();
    
    if (!pagarmeResponse.ok) {
      logStep('❌ Pagar.me API error', pagarmeResult);
      throw new Error(`Pagar.me API error: ${pagarmeResult.errors?.[0]?.message || 'Unknown error'}`);
    }

    logStep('✅ Card updated in Pagar.me', { status: pagarmeResult.status });

    // Log audit trail
    await supabase.from('payment_audit_log').insert({
      source: 'pagarme-subscriptions-update-card',
      provider: 'pagarme',
      ref_id: String(subscription_id),
      message: 'Card updated for subscription',
      metadata: { subscription_id, payment_method: 'credit_card' }
    });

    logStep('🎉 Card update completed successfully');

    return new Response(JSON.stringify({
      success: true,
      status: pagarmeResult.status,
      subscription_id: subscription_id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    logStep('💥 Error updating card', error.message);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});