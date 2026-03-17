import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AsaasWebhookPayload {
  event: string;
  payment?: {
    id: string;
    customer: string;
    subscription?: string;
    billingType: string;
    value: number;
    status: string;
    dueDate: string;
    confirmedDate?: string;
  };
  subscription?: {
    id: string;
    customer: string;
    billingType: string;
    cycle: string;
    value: number;
    nextDueDate: string;
    status: string;
    externalReference?: string;
    checkoutSession?: string;
  };
  checkout?: {
    id: string;
    link: string;
    status: string;
    customer: string;
    subscription: {
      id: string;
      cycle: string;
      value: number;
    };
  };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const environment = url.searchParams.get('env') || 'sandbox';

    console.log(`[Asaas Webhook] Received event for environment: ${environment}`);

    const payload: AsaasWebhookPayload = await req.json();
    const eventType = payload.event;

    console.log(`[Asaas Webhook] Event type: ${eventType}`, JSON.stringify(payload, null, 2));

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate webhook signature
    const { data: configData } = await supabase
      .rpc('get_asaas_config_for_functions', { p_environment: environment });

    if (configData && configData[0]?.webhook_secret) {
      const webhookSecret = configData[0].webhook_secret;
      const signature = req.headers.get('Asaas-Signature');
      
      if (!signature) {
        console.error('[Asaas Webhook] Missing signature');
        return new Response(
          JSON.stringify({ error: 'Missing signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Validate HMAC SHA256
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(webhookSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      const payloadString = JSON.stringify(payload);
      const expectedSignature = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(payloadString)
      );
      
      const expectedSignatureHex = Array.from(new Uint8Array(expectedSignature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      if (signature !== expectedSignatureHex) {
        console.error('[Asaas Webhook] Invalid signature');
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('[Asaas Webhook] Signature validated ✅');
    }

    // Log the webhook event
    const { error: logError } = await supabase
      .from('asaas_webhook_events')
      .insert({
        event_type: eventType,
        environment,
        payload: payload as any,
        external_id: payload.payment?.id || payload.subscription?.id || payload.checkout?.id || null,
        processed: false,
      });

    if (logError) {
      console.error('[Asaas Webhook] Error logging event:', logError);
      return new Response(
        JSON.stringify({ error: 'Failed to log event' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process specific events
    await processWebhookEvent(supabase, eventType, payload, environment);

    console.log(`[Asaas Webhook] Event processed successfully`);

    return new Response(
      JSON.stringify({ success: true, event: eventType }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Asaas Webhook] Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processWebhookEvent(
  supabase: any,
  eventType: string,
  payload: AsaasWebhookPayload,
  environment: string
) {
  console.log(`[Asaas Webhook] Processing event: ${eventType}`);

  switch (eventType) {
    case 'CHECKOUT_PAID':
      await handleCheckoutPaid(supabase, payload, environment);
      break;

    case 'PAYMENT_CONFIRMED':
    case 'PAYMENT_RECEIVED':
      await handlePaymentConfirmed(supabase, payload, environment);
      break;

    case 'SUBSCRIPTION_CREATED':
      await handleSubscriptionCreated(supabase, payload, environment);
      break;

    case 'SUBSCRIPTION_UPDATED':
      await handleSubscriptionUpdated(supabase, payload, environment);
      break;

    case 'SUBSCRIPTION_CANCELED':
      await handleSubscriptionCanceled(supabase, payload, environment);
      break;

    // Phase 5: Handle payment failures with grace period
    case 'PAYMENT_OVERDUE':
      await handlePaymentOverdue(supabase, payload, environment);
      break;

    default:
      console.log(`[Asaas Webhook] Unhandled event type: ${eventType}`);
  }
}

async function handleCheckoutPaid(supabase: any, payload: AsaasWebhookPayload, environment: string) {
  if (!payload.checkout) return;

  const checkoutId = payload.checkout.id;
  console.log(`[CHECKOUT_PAID] Received, marking as paid: ${checkoutId}`);

  // Apenas marcar o checkout como pago
  await supabase
    .from('asaas_pending_checkouts')
    .update({ 
      status: 'paid',
      updated_at: new Date().toISOString()
    })
    .eq('asaas_checkout_id', checkoutId);

  // Marcar evento como processado
  await supabase
    .from('asaas_webhook_events')
    .update({ 
      processed: true, 
      processed_at: new Date().toISOString() 
    })
    .eq('external_id', checkoutId);

  console.log('[CHECKOUT_PAID] Marked as paid');
}

async function handlePaymentConfirmed(supabase: any, payload: AsaasWebhookPayload, environment: string) {
  if (!payload.payment) return;

  console.log(`[Asaas Webhook] Payment confirmed: ${payload.payment.id}`);

  // If payment is linked to a subscription, activate user's subscription
  if (payload.payment.subscription) {
    const { error } = await supabase
      .from('subscribers')
      .update({
        subscription_status: 'active',
        is_active: true,
        // Phase 5: Reset failure tracking on successful payment
        payment_failure_count: 0,
        grace_period_ends_at: null,
        last_payment_failure_at: null,
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('asaas_subscription_id', payload.payment.subscription);

    if (error) {
      console.error('[Asaas Webhook] Error updating subscriber:', error);
    } else {
      console.log(`[Asaas Webhook] Subscriber activated for subscription: ${payload.payment.subscription}`);
    }
  }

  // Mark webhook event as processed
  await supabase
    .from('asaas_webhook_events')
    .update({ processed: true, processed_at: new Date().toISOString() })
    .eq('external_id', payload.payment.id);
}

async function handleSubscriptionCreated(supabase: any, payload: AsaasWebhookPayload, environment: string) {
  if (!payload.subscription) return;

  const subscriptionId = payload.subscription.id;
  const customerId = payload.subscription.customer;
  const checkoutSessionId = payload.subscription.checkoutSession;

  console.log(`[SUBSCRIPTION_CREATED] Processing subscription: ${subscriptionId}`);
  console.log(`[SUBSCRIPTION_CREATED] Customer: ${customerId}, CheckoutSession: ${checkoutSessionId}`);

  // 1. Buscar pending_checkout pelo checkoutSession
  const { data: pendingCheckout } = await supabase
    .from('asaas_pending_checkouts')
    .select('*')
    .eq('asaas_checkout_id', checkoutSessionId)
    .eq('environment', environment)
    .single();

  if (!pendingCheckout) {
    console.log('[SUBSCRIPTION_CREATED] No pending checkout found for checkoutSession:', checkoutSessionId);
    return;
  }

  console.log('[SUBSCRIPTION_CREATED] Found pending checkout:', pendingCheckout);

  // 2. Buscar config da API
  const { data: configData } = await supabase
    .rpc('get_asaas_config_for_functions', { p_environment: environment });

  if (!configData || !configData[0]?.api_key) {
    console.error('[SUBSCRIPTION_CREATED] Asaas API key not found');
    return;
  }

  const apiKey = configData[0].api_key;
  const baseUrl = environment === 'production' 
    ? 'https://api.asaas.com/v3'
    : 'https://api-sandbox.asaas.com/v3';

  // 3. Buscar dados do customer via API
  console.log(`[SUBSCRIPTION_CREATED] Fetching customer data: ${customerId}`);
  const customerResponse = await fetch(`${baseUrl}/customers/${customerId}`, {
    headers: { 'access_token': apiKey }
  });

  if (!customerResponse.ok) {
    const errorText = await customerResponse.text();
    console.error('[SUBSCRIPTION_CREATED] Failed to fetch customer:', errorText);
    return;
  }

  const customerData = await customerResponse.json();
  console.log('[SUBSCRIPTION_CREATED] Customer data:', customerData);

  // 4. Verificar se usuário já existe
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const userExists = existingUsers?.users?.some((u: any) => u.email === customerData.email);

  let user;
  let isNewUser = false;

  if (!userExists) {
    // 5. Criar usuário no Supabase
    console.log('[SUBSCRIPTION_CREATED] Creating new user:', customerData.email);
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: customerData.email,
      email_confirm: true,
      user_metadata: {
        name: customerData.name || customerData.email.split('@')[0],
        provider: 'asaas',
        asaas_customer_id: customerId
      }
    });

    if (createError || !newUser) {
      console.error('[SUBSCRIPTION_CREATED] Failed to create user:', createError);
      return;
    }

    user = newUser.user;
    isNewUser = true;
    console.log('[SUBSCRIPTION_CREATED] User created successfully:', user.id);
  } else {
    user = existingUsers.users.find((u: any) => u.email === customerData.email);
    console.log('[SUBSCRIPTION_CREATED] User already exists:', user.id);
  }

  // 6. Criar/atualizar subscriber com onConflict correto
  const planTypeMap = {
    'anual': 'premium',
    'mensal': 'basic'
  };
  const planCode = payload.subscription.cycle === 'YEARLY' ? 'anual' : 'mensal';
  const planType = planTypeMap[planCode] || 'basic';

  const { error: subscriberError } = await supabase
    .from('subscribers')
    .upsert({
      user_id: user.id,
      email: customerData.email,
      asaas_customer_id: customerId,
      asaas_subscription_id: subscriptionId,
      plan_type: planType,
      subscription_status: 'active',
      is_active: true,
      provider: 'asaas',
      created_by_admin: false,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'email'  // Usar email em vez de user_id
    });

  if (subscriberError) {
    console.error('[SUBSCRIPTION_CREATED] Failed to create subscriber:', subscriberError);
    return;
  }

  console.log('[SUBSCRIPTION_CREATED] Subscriber created/updated successfully');

  // 7. Enviar email de criação de conta (apenas se usuário for novo)
  if (isNewUser) {
    try {
      console.log('[SUBSCRIPTION_CREATED] Sending account creation email');
      const { error: emailError } = await supabase.functions.invoke('send-account-creation', {
        body: {
          email: customerData.email,
          name: customerData.name || customerData.email.split('@')[0],
          provider: 'asaas',
          planCode: planCode,
          subscriptionId: subscriptionId
        }
      });

      if (emailError) {
        console.error('[SUBSCRIPTION_CREATED] Failed to send email:', emailError);
      } else {
        console.log('[SUBSCRIPTION_CREATED] Account creation email sent successfully');
      }
    } catch (emailError) {
      console.error('[SUBSCRIPTION_CREATED] Error invoking send-account-creation:', emailError);
    }
  }

  // 8. Marcar pending_checkout como completed
  await supabase
    .from('asaas_pending_checkouts')
    .update({ 
      status: 'completed',
      asaas_subscription_id: subscriptionId,
      asaas_customer_id: customerId,
      updated_at: new Date().toISOString()
    })
    .eq('asaas_checkout_id', checkoutSessionId);

  // 9. Marcar webhook event como processado
  await supabase
    .from('asaas_webhook_events')
    .update({ 
      processed: true, 
      processed_at: new Date().toISOString() 
    })
    .eq('external_id', subscriptionId);

  console.log('[SUBSCRIPTION_CREATED] Processing completed successfully');
}

async function handleSubscriptionUpdated(supabase: any, payload: AsaasWebhookPayload, environment: string) {
  if (!payload.subscription) return;

  console.log(`[Asaas Webhook] Subscription updated: ${payload.subscription.id}`);

  const { error } = await supabase
    .from('subscribers')
    .update({
      subscription_status: payload.subscription.status.toLowerCase(),
      is_active: payload.subscription.status === 'ACTIVE',
      updated_at: new Date().toISOString(),
    })
    .eq('asaas_subscription_id', payload.subscription.id);

  if (error) {
    console.error('[Asaas Webhook] Error updating subscriber:', error);
  }

  await supabase
    .from('asaas_webhook_events')
    .update({ processed: true, processed_at: new Date().toISOString() })
    .eq('external_id', payload.subscription.id);
}

// Phase 5: Handle overdue payments with grace period
async function handlePaymentOverdue(supabase: any, payload: AsaasWebhookPayload, environment: string) {
  if (!payload.payment) return;

  console.log(`[Asaas Webhook] Payment overdue: ${payload.payment.id}`);

  if (!payload.payment.subscription) return;

  // Get current subscriber
  const { data: sub } = await supabase
    .from('subscribers')
    .select('payment_failure_count, subscription_status, user_id')
    .eq('asaas_subscription_id', payload.payment.subscription)
    .maybeSingle();

  if (!sub) return;

  const failureCount = (sub.payment_failure_count || 0) + 1;
  const graceDays = 5;
  const gracePeriodEndsAt = new Date(Date.now() + graceDays * 24 * 60 * 60 * 1000).toISOString();
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
    .eq('asaas_subscription_id', payload.payment.subscription);

  // Log status transition
  if (sub.user_id && sub.subscription_status !== newStatus) {
    await supabase.from('subscription_status_log').insert({
      user_id: sub.user_id,
      provider: 'asaas',
      previous_status: sub.subscription_status,
      new_status: newStatus,
      reason: `PAYMENT_OVERDUE (attempt ${failureCount})`,
    }).catch(() => {});
  }

  console.log(`[Asaas Webhook] Payment failure tracked: count=${failureCount}, status=${newStatus}`);

  await supabase
    .from('asaas_webhook_events')
    .update({ processed: true, processed_at: new Date().toISOString() })
    .eq('external_id', payload.payment.id);
}

async function handleSubscriptionCanceled(supabase: any, payload: AsaasWebhookPayload, environment: string) {
  if (!payload.subscription) return;

  console.log(`[Asaas Webhook] Subscription canceled: ${payload.subscription.id}`);

  const { error } = await supabase
    .from('subscribers')
    .update({
      subscription_status: 'canceled',
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('asaas_subscription_id', payload.subscription.id);

  if (error) {
    console.error('[Asaas Webhook] Error canceling subscriber:', error);
  }

  await supabase
    .from('asaas_webhook_events')
    .update({ processed: true, processed_at: new Date().toISOString() })
    .eq('external_id', payload.subscription.id);
}
