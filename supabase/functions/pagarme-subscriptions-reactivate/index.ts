import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  console.log(`[pagarme-subscriptions-reactivate] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('🚀 Starting subscription reactivation');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    const { subscription_id } = body;

    if (!subscription_id) {
      throw new Error('subscription_id is required');
    }

    logStep('📝 Request validated', { subscription_id });

    // Get Pagar.me config
    const { data: config, error: configError } = await supabase.rpc('get_pagarme_config_for_functions');
    if (configError || !config?.secret_key) {
      throw new Error('Pagar.me config not found');
    }

    logStep('✅ Config loaded');

    // Reactivate subscription in Pagar.me v5
    // Note: v5 doesn't have explicit reactivate endpoint
    // We need to update the subscription status instead
    const pagarmeUrl = `https://api.pagar.me/core/v5/subscriptions/${subscription_id}`;
    const pagarmeResponse = await fetch(pagarmeUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(config.secret_key + ':')}`
      },
      body: JSON.stringify({
        status: 'active'
      })
    });

    const pagarmeResult = await pagarmeResponse.json();
    
    if (!pagarmeResponse.ok) {
      logStep('❌ Pagar.me API error', pagarmeResult);
      throw new Error(`Pagar.me API error: ${pagarmeResult.errors?.[0]?.message || 'Unknown error'}`);
    }

    logStep('✅ Subscription reactivated in Pagar.me', { status: pagarmeResult.status });

    // Update local database
    const { error: updateError } = await supabase
      .from('subscribers')
      .update({ 
        subscription_status: pagarmeResult.status, 
        is_active: pagarmeResult.status === 'active',
        canceled_at: null,
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
      source: 'pagarme-subscriptions-reactivate',
      provider: 'pagarme',
      ref_id: String(subscription_id),
      message: 'Subscription reactivated',
      metadata: { subscription_id, status: pagarmeResult.status }
    });

    logStep('🎉 Reactivation completed successfully');

    return new Response(JSON.stringify({
      success: true,
      status: pagarmeResult.status,
      subscription_id: subscription_id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    logStep('💥 Error reactivating subscription', error.message);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});