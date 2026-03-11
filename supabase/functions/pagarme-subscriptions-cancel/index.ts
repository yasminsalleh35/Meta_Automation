import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  console.log(`[pagarme-subscriptions-cancel] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('🚀 Starting subscription cancel');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    const { subscription_id, at_period_end = true } = body;

    if (!subscription_id) {
      throw new Error('subscription_id is required');
    }

    logStep('📝 Request validated', { subscription_id, at_period_end });

    // Get Pagar.me config
    const { data: config, error: configError } = await supabase.rpc('get_pagarme_config_for_functions');
    if (configError || !config?.secret_key) {
      throw new Error('Pagar.me config not found');
    }

    logStep('✅ Config loaded');

    // Cancel subscription in Pagar.me v5
    const pagarmeUrl = `https://api.pagar.me/core/v5/subscriptions/${subscription_id}`;
    const pagarmeResponse = await fetch(pagarmeUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(config.secret_key + ':')}`
      },
      body: JSON.stringify({ cancel_pending_invoices: at_period_end })
    });

    const pagarmeResult = await pagarmeResponse.json();
    
    if (!pagarmeResponse.ok) {
      logStep('❌ Pagar.me API error', pagarmeResult);
      throw new Error(`Pagar.me API error: ${pagarmeResult.errors?.[0]?.message || 'Unknown error'}`);
    }

    logStep('✅ Subscription canceled in Pagar.me', { status: pagarmeResult.status });

    // Update local database
    const { error: updateError } = await supabase
      .from('subscribers')
      .update({ 
        subscription_status: 'canceled', 
        is_active: false, 
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('pagarme_subscription_id', String(subscription_id));

    if (updateError) {
      logStep('❌ Failed to update local DB', updateError);
      throw new Error('Failed to update subscription status locally');
    }

    logStep('✅ Local DB updated');

    // Log audit trail
    await supabase.from('payment_audit_log').insert({
      source: 'pagarme-subscriptions-cancel',
      provider: 'pagarme',
      ref_id: String(subscription_id),
      message: `Subscription canceled - at_period_end: ${at_period_end}`,
      metadata: { at_period_end, status: pagarmeResult.status }
    });

    logStep('🎉 Cancel completed successfully');

    return new Response(JSON.stringify({
      success: true,
      status: pagarmeResult.status,
      subscription_id: subscription_id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    logStep('💥 Error canceling subscription', error.message);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});