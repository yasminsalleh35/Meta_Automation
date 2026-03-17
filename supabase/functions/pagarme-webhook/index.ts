// =============================================
// Edge Function: Webhook Pagar.me
// Processa eventos de subscription, charge e order
// =============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hub-signature',
};

const logStep = (step: string, details?: any) => {
  console.log(`[pagarme::webhook] ${step}`, details ? JSON.stringify(details) : '');
};

// Constant-time string comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature || !secret) return false;

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );

    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return timingSafeEqual(signature, expectedSignature);
  } catch (error) {
    logStep('⚠️ Signature verification error', { error });
    return false;
  }
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('🚀 Webhook V5 received');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Read body as text first for signature verification
    const bodyText = await req.text();
    const event = JSON.parse(bodyText);

    logStep('📝 Event parsed (V5)', { 
      type: event.type,
      id: event.id,
      account_id: event.account?.id
    });

    // V5 events come with account info to determine environment
    const environment = event.account?.test ? 'test' : 'live';

    // Get webhook secret for verification
    const { data: settings } = await supabase
      .from('pagarme_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (settings) {
      const webhookSecret = environment === 'test' 
        ? settings.test_webhook_secret 
        : settings.live_webhook_secret;

      if (webhookSecret) {
        const signature = req.headers.get('x-hub-signature');
        const isValid = await verifyWebhookSignature(bodyText, signature, webhookSecret);

        if (!isValid) {
          logStep('❌ Invalid webhook signature');
          return new Response(JSON.stringify({ error: 'Invalid signature' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        logStep('✅ Webhook signature verified');
      }
    }

    // Store event (idempotency check)
    const eventId = event.id?.toString() || crypto.randomUUID();
    const { data: existingEvent } = await supabase
      .from('pagarme_events')
      .select('id')
      .eq('external_id', eventId)
      .eq('environment', environment)
      .maybeSingle();

    if (existingEvent) {
      logStep('⚠️ Duplicate event, skipping', { eventId });
      return new Response(JSON.stringify({ ok: true, idempotent: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Save event
    await supabase.from('pagarme_events').insert({
      environment,
      event_type: event.type,
      external_id: eventId,
      raw: event
    });

    // Process event based on type
    const eventType = event.type;

    if (eventType?.includes('subscription')) {
      await processSubscriptionEvent(supabase, event, environment);
    } else if (eventType?.includes('charge')) {
      await processChargeEvent(supabase, event, environment);
    } else if (eventType?.includes('order')) {
      await processOrderEvent(supabase, event, environment);
    }

    logStep('✅ Event processed', { eventType });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    logStep('💥 Error processing webhook', { 
      error: error.message,
      stack: error.stack
    });

    return new Response(JSON.stringify({
      ok: false,
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

async function processSubscriptionEvent(supabase: any, event: any, environment: string) {
  const subscription = event.data || event.subscription;
  if (!subscription?.id) return;

  logStep('📋 Processing subscription event', { 
    subscription_id: subscription.id,
    status: subscription.status
  });

  // Update subscription
  await supabase
    .from('pagarme_subscriptions')
    .update({
      status: subscription.status,
      current_period_end: subscription.current_period_end,
      updated_at: new Date().toISOString()
    })
    .eq('pagarme_subscription_id', subscription.id.toString())
    .eq('environment', environment);
}

async function processChargeEvent(supabase: any, event: any, environment: string) {
  const charge = event.data || event.charge;
  if (!charge?.id) return;

  const chargeId = charge.id.toString();
  const status = charge.status;

  logStep('💳 Processing charge event', { 
    charge_id: chargeId,
    status
  });

  // Update subscription with charge info
  if (charge.subscription_id) {
    await supabase
      .from('pagarme_subscriptions')
      .update({
        last_charge_id: chargeId,
        updated_at: new Date().toISOString()
      })
      .eq('pagarme_subscription_id', charge.subscription_id.toString())
      .eq('environment', environment);
  }

  // Handle paid charge - grant entitlement
  if (status === 'paid') {
    await handlePaidCharge(supabase, charge, environment);
  }

  // Phase 5: Handle payment failure with grace period
  if (status === 'payment_failed' || status === 'failed') {
    await handlePaymentFailure(supabase, charge, environment);
  }

  // Handle refunded/chargedback - revoke entitlement
  if (status === 'refunded' || status === 'chargedback') {
    await handleFailedCharge(supabase, charge, environment);
  }
}

async function processOrderEvent(supabase: any, event: any, environment: string) {
  const order = event.data || event.order;
  if (!order?.id) return;

  logStep('📦 Processing order event', { 
    order_id: order.id,
    status: order.status
  });

  // Update subscription with order info
  if (order.subscription_id) {
    await supabase
      .from('pagarme_subscriptions')
      .update({
        last_order_id: order.id.toString(),
        updated_at: new Date().toISOString()
      })
      .eq('pagarme_subscription_id', order.subscription_id.toString())
      .eq('environment', environment);
  }

  // Handle paid order
  if (order.status === 'paid') {
    await handlePaidCharge(supabase, order, environment);
  }
}

async function handlePaidCharge(supabase: any, charge: any, environment: string) {
  logStep('✅ Handling paid charge', { charge_id: charge.id });

  // Get subscription
  const subscriptionId = charge.subscription_id?.toString();
  if (!subscriptionId) return;

  const { data: subscription } = await supabase
    .from('pagarme_subscriptions')
    .select('*')
    .eq('pagarme_subscription_id', subscriptionId)
    .eq('environment', environment)
    .maybeSingle();

  if (!subscription) {
    logStep('⚠️ Subscription not found for charge', { subscriptionId });
    return;
  }

  // Checar se já estava ativa (para não reenviar e-mail)
  const wasAlreadyActive = subscription.status === 'active';

  // Update subscription status
  await supabase
    .from('pagarme_subscriptions')
    .update({ status: 'active' })
    .eq('id', subscription.id);

  // Create/invite user if needed
  let userId = subscription.user_id;
  
  if (!userId) {
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const userExists = existingUser.users.find((u: any) => u.email === subscription.email);

    if (!userExists) {
      logStep('👤 Inviting new user', { email: subscription.email });
      const { data: newUser, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
        subscription.email,
        {
          redirectTo: 'https://iacamply.com/onboarding/criar-senha'
        }
      );

      if (inviteError) {
        logStep('⚠️ Failed to invite user', { error: inviteError });
      } else if (newUser?.user) {
        userId = newUser.user.id;
        
        // Update subscription with user_id
        await supabase
          .from('pagarme_subscriptions')
          .update({ user_id: userId })
          .eq('id', subscription.id);
      }
    } else {
      userId = userExists.id;
    }
  }

  if (!userId) {
    logStep('⚠️ Could not determine user_id');
    return;
  }

  // Grant entitlement
  const validUntil = new Date();
  if (subscription.plan_code === 'mensal') {
    validUntil.setDate(validUntil.getDate() + 30);
  } else {
    validUntil.setFullYear(validUntil.getFullYear() + 1);
  }

  await supabase.from('user_entitlements').upsert({
    user_id: userId,
    plan_code: subscription.plan_code,
    source: 'pagarme',
    status: 'active',
    valid_until: validUntil.toISOString()
  }, {
    onConflict: 'user_id,plan_code'
  });

  logStep('✅ Entitlement granted', { 
    user_id: userId,
    plan_code: subscription.plan_code,
    valid_until: validUntil
  });

  // Update unified subscribers table (FASE 5)
  await supabase.from('subscribers').upsert({
    user_id: userId,
    email: subscription.email,
    provider: 'pagarme',
    pagarme_subscription_id: subscription.pagarme_subscription_id,
    plan_type: 'premium',
    subscription_status: 'active',
    is_active: true,
    current_period_end: subscription.current_period_end,
    // Phase 5: Reset failure tracking on successful payment
    payment_failure_count: 0,
    grace_period_ends_at: null,
    last_payment_failure_at: null,
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }, {
    onConflict: 'user_id'
  });

  // Phase 5: Log status transition
  await supabase.from('subscription_status_log').insert({
    user_id: userId,
    provider: 'pagarme',
    previous_status: wasAlreadyActive ? 'active' : 'inactive',
    new_status: 'active',
    reason: 'charge.paid',
  }).catch(() => {}); // Non-blocking

  logStep('✅ Subscribers table updated', {
    user_id: userId,
    email: subscription.email,
    provider: 'pagarme'
  });

  // Enviar e-mail de onboarding (apenas se não estava ativa antes)
  if (!wasAlreadyActive && subscription.email) {
    try {
      const emailModule = await import('./_shared/emailClient.ts');
      const planName = subscription.plan_code === 'mensal' ? 'Plano Mensal' : 'Plano Anual';
      const amount = subscription.plan_code === 'mensal' ? 'R$ 349,99/mês' : 'R$ 2.499,00/ano';
      
      await emailModule.sendEmail({
        to: [subscription.email],
        subject: 'Bem-vindo(a)! Seu pagamento foi aprovado 🎉',
        html: generateWebhookOnboardingEmail(subscription.email, planName, amount, subscription.pagarme_subscription_id)
      });
      
      logStep('✅ Onboarding email sent (from webhook)');
    } catch (emailError: any) {
      logStep('⚠️ Failed to send onboarding email', { error: emailError.message });
    }
  }
}

function generateWebhookOnboardingEmail(email: string, planName: string, amount: string, subscriptionId: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .alert { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 6px; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Pagamento Aprovado!</h1>
            <p>Sua assinatura foi ativada</p>
          </div>
          <div class="content">
            <div class="alert">
              <strong>🎉 Boa notícia!</strong><br>
              Seu pagamento foi confirmado e sua conta está ativa.
            </div>
            
            <h2>Detalhes da Assinatura</h2>
            <p><strong>Plano:</strong> ${planName}</p>
            <p><strong>Valor:</strong> ${amount}</p>
            <p><strong>E-mail:</strong> ${email}</p>
            <p><strong>ID:</strong> ${subscriptionId}</p>
            
            <p>Você receberá um e-mail separado com o link para definir sua senha e acessar a plataforma.</p>
            
            <p style="margin-top: 30px;">Obrigado por escolher a Camply!</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Camply - Todos os direitos reservados</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Phase 5: Handle payment failure with grace period
async function handlePaymentFailure(supabase: any, charge: any, environment: string) {
  logStep('⚠️ Handling payment failure', { charge_id: charge.id });

  const subscriptionId = charge.subscription_id?.toString();
  if (!subscriptionId) return;

  const { data: subscription } = await supabase
    .from('pagarme_subscriptions')
    .select('user_id, email')
    .eq('pagarme_subscription_id', subscriptionId)
    .eq('environment', environment)
    .maybeSingle();

  if (!subscription?.user_id) return;

  // Get current failure count
  const { data: sub } = await supabase
    .from('subscribers')
    .select('payment_failure_count, subscription_status')
    .eq('user_id', subscription.user_id)
    .maybeSingle();

  const failureCount = (sub?.payment_failure_count || 0) + 1;
  const graceDays = 5;
  const gracePeriodEndsAt = new Date(Date.now() + graceDays * 24 * 60 * 60 * 1000).toISOString();

  // After 3 failures, deactivate. Otherwise grace period with past_due status.
  const newStatus = failureCount >= 3 ? 'inactive' : 'past_due';
  const isActive = failureCount < 3;

  await supabase
    .from('subscribers')
    .update({
      subscription_status: newStatus,
      is_active: isActive,
      payment_failure_count: failureCount,
      last_payment_failure_at: new Date().toISOString(),
      grace_period_ends_at: isActive ? gracePeriodEndsAt : null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', subscription.user_id)
    .eq('provider', 'pagarme');

  // Log status transition
  if (sub?.subscription_status !== newStatus) {
    await supabase.from('subscription_status_log').insert({
      user_id: subscription.user_id,
      provider: 'pagarme',
      previous_status: sub?.subscription_status || null,
      new_status: newStatus,
      reason: `charge.payment_failed (attempt ${failureCount})`,
    }).catch(() => {});
  }

  logStep('⚠️ Payment failure tracked', {
    user_id: subscription.user_id,
    failureCount,
    newStatus,
    isActive,
    gracePeriodEndsAt: isActive ? gracePeriodEndsAt : null,
  });
}

async function handleFailedCharge(supabase: any, charge: any, environment: string) {
  logStep('❌ Handling failed/refunded charge', { charge_id: charge.id });

  const subscriptionId = charge.subscription_id?.toString();
  if (!subscriptionId) return;

  const { data: subscription } = await supabase
    .from('pagarme_subscriptions')
    .select('user_id')
    .eq('pagarme_subscription_id', subscriptionId)
    .eq('environment', environment)
    .maybeSingle();

  if (!subscription?.user_id) return;

  // Revoke entitlement
  await supabase
    .from('user_entitlements')
    .update({ 
      status: 'inactive',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', subscription.user_id)
    .eq('source', 'pagarme');

  logStep('✅ Entitlement revoked', { user_id: subscription.user_id });

  // Update unified subscribers table (FASE 5)
  await supabase
    .from('subscribers')
    .update({
      subscription_status: 'inactive',
      is_active: false,
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', subscription.user_id)
    .eq('provider', 'pagarme');

  logStep('✅ Subscribers table updated (inactive)', { user_id: subscription.user_id });
}
