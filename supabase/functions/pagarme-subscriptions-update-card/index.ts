import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { requireUser, authErrorResponse } from '../_shared/auth.ts';
import { loadPagarmeConfig, assertOwnsPagarmeSubscription } from '../_shared/pagarme.ts';

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

    // Usuário logado e dono da assinatura (audit SEC-10 / PAY-07)
    const { user, db: supabase } = await requireUser(req);

    const body = await req.json();
    const { subscription_id, token, card_id, card_hash } = body;

    if (!subscription_id || (!token && !card_id && !card_hash)) {
      return new Response(JSON.stringify({ success: false, error: 'subscription_id and card token are required' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    await assertOwnsPagarmeSubscription(supabase, user.id, subscription_id);

    logStep('📝 Request validated', { subscription_id, has_token: !!token, has_card_hash: !!card_hash });

    // Get Pagar.me config (PAY-05: RPC retorna lista; sempre com ambiente)
    const config = await loadPagarmeConfig(supabase);

    logStep('✅ Config loaded');

    // Prepare update payload
    const updatePayload: any = {
      payment_method: 'credit_card'
    };

    // V5: token do tokenizecard → card_token; cartão salvo → card_id (PAY-07)
    if (token) {
      updatePayload.card_token = token;
    } else if (card_id) {
      updatePayload.card_id = card_id;
    } else if (card_hash) {
      // TODO(PAY-07/PAY-12): card_hash é do SDK V4; trocar UpdateCardForm para tokenização V5
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