import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { requireUser, authErrorResponse } from '../_shared/auth.ts';
import { loadPagarmeConfig, assertOwnsPagarmeSubscription } from '../_shared/pagarme.ts';

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

    // Usuário logado e dono da assinatura (audit SEC-10 / PAY-07)
    const { user, db: supabase } = await requireUser(req);

    const body = await req.json();
    const { subscription_id, at_period_end = true } = body;

    if (!subscription_id) {
      return new Response(JSON.stringify({ success: false, error: 'subscription_id is required' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    await assertOwnsPagarmeSubscription(supabase, user.id, subscription_id);

    logStep('📝 Request validated', { subscription_id, at_period_end });

    // Get Pagar.me config (PAY-05: RPC retorna lista; sempre com ambiente)
    const config = await loadPagarmeConfig(supabase);

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
    const authResp = authErrorResponse(error, corsHeaders);
    if (authResp) return authResp;

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});