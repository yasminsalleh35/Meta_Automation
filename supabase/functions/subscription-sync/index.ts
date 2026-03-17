// =============================================
// Edge Function: Subscription Status Sync
// Phase 5.4: Periodic reconciliation of subscription statuses
// Phase 5.3: Provider fallback on check failure
//
// Modes:
//   - "sync_all" — reconcile all active subscriptions with providers (cron/admin)
//   - "sync_user" — sync a single user's subscription (on-demand)
//   - "expire_grace" — deactivate subscriptions past grace period
// =============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const log = (step: string, details?: any) => {
  console.log(`[subscription-sync] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json().catch(() => ({}));
    const mode = body.mode || 'sync_all';

    log('Started', { mode });

    let result: any = {};

    switch (mode) {
      case 'sync_all':
        result = await syncAllSubscriptions(supabase);
        break;
      case 'sync_user':
        if (!body.user_id) {
          return json(400, { error: 'user_id required for sync_user mode' });
        }
        result = await syncUserSubscription(supabase, body.user_id);
        break;
      case 'expire_grace':
        result = await expireGracePeriods(supabase);
        break;
      default:
        return json(400, { error: `Unknown mode: ${mode}` });
    }

    log('Completed', result);

    return json(200, { success: true, ...result });

  } catch (error: any) {
    log('ERROR', { message: error.message });
    return json(500, { error: error.message });
  }
});

function json(status: number, data: any) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ── sync_all: Reconcile all active subscribers with their payment providers ──

async function syncAllSubscriptions(supabase: any) {
  // Fetch all subscribers that haven't been synced in the last 6 hours
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

  const { data: subscribers, error } = await supabase
    .from('subscribers')
    .select('id, user_id, provider, stripe_subscription_id, pagarme_subscription_id, asaas_subscription_id, subscription_status, is_active, last_synced_at')
    .eq('is_active', true)
    .or(`last_synced_at.is.null,last_synced_at.lt.${sixHoursAgo}`)
    .limit(50); // Process max 50 per run to avoid timeouts

  if (error) {
    log('Error fetching subscribers', { error: error.message });
    return { synced: 0, errors: 1 };
  }

  if (!subscribers || subscribers.length === 0) {
    return { synced: 0, message: 'No subscribers need syncing' };
  }

  log(`Syncing ${subscribers.length} subscribers`);

  let synced = 0;
  let errors = 0;

  for (const sub of subscribers) {
    try {
      await syncUserSubscription(supabase, sub.user_id);
      synced++;
    } catch (e: any) {
      log('Error syncing user', { user_id: sub.user_id, error: e.message });
      errors++;
    }
  }

  return { synced, errors, total: subscribers.length };
}

// ── sync_user: Sync a single user's subscription with their provider ──

async function syncUserSubscription(supabase: any, userId: string) {
  const { data: sub } = await supabase
    .from('subscribers')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!sub) {
    return { status: 'no_subscription' };
  }

  const provider = sub.provider;
  let providerStatus: string | null = null;
  let syncSuccess = false;

  // Try primary provider
  try {
    providerStatus = await checkProviderStatus(supabase, sub, provider);
    syncSuccess = true;
  } catch (e: any) {
    log(`Primary provider ${provider} failed`, { user_id: userId, error: e.message });

    // Phase 5.3: Try fallback providers
    const fallbackProviders = ['pagarme', 'stripe', 'asaas'].filter(p => p !== provider);
    for (const fallback of fallbackProviders) {
      try {
        providerStatus = await checkProviderStatus(supabase, sub, fallback);
        syncSuccess = true;
        log(`Fallback to ${fallback} succeeded`, { user_id: userId });

        // Record the fallback
        await supabase
          .from('subscribers')
          .update({ fallback_provider: fallback })
          .eq('user_id', userId);
        break;
      } catch {
        continue;
      }
    }
  }

  if (!syncSuccess) {
    // All providers failed — keep current status but mark sync attempt
    await supabase
      .from('subscribers')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('user_id', userId);

    return { status: 'sync_failed', provider };
  }

  // Update subscriber if status changed
  if (providerStatus && providerStatus !== sub.subscription_status) {
    const isActive = ['active', 'trialing'].includes(providerStatus);

    await supabase
      .from('subscribers')
      .update({
        subscription_status: providerStatus,
        is_active: isActive,
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Clear grace period if now active
        ...(isActive ? { grace_period_ends_at: null, payment_failure_count: 0 } : {}),
      })
      .eq('user_id', userId);

    // Log the transition
    await supabase.from('subscription_status_log').insert({
      user_id: userId,
      provider,
      previous_status: sub.subscription_status,
      new_status: providerStatus,
      reason: 'subscription-sync reconciliation',
    }).catch(() => {});

    log('Status updated via sync', { user_id: userId, old: sub.subscription_status, new: providerStatus });
  } else {
    // No change, just update sync timestamp
    await supabase
      .from('subscribers')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('user_id', userId);
  }

  return { status: providerStatus || sub.subscription_status, synced: true };
}

// ── Check subscription status from a specific provider API ──

async function checkProviderStatus(supabase: any, sub: any, provider: string): Promise<string> {
  switch (provider) {
    case 'stripe':
      return await checkStripeStatus(supabase, sub);
    case 'pagarme':
      return await checkPagarmeStatus(supabase, sub);
    case 'asaas':
      return await checkAsaasStatus(supabase, sub);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

async function checkStripeStatus(supabase: any, sub: any): Promise<string> {
  if (!sub.stripe_subscription_id) throw new Error('No Stripe subscription ID');

  // Get Stripe config
  const { data: config } = await supabase.rpc('get_stripe_config_for_functions');
  if (!config?.[0]?.secret_key) throw new Error('No Stripe config');

  const response = await fetch(
    `https://api.stripe.com/v1/subscriptions/${sub.stripe_subscription_id}`,
    {
      headers: {
        'Authorization': `Bearer ${config[0].secret_key}`,
      },
    }
  );

  if (!response.ok) throw new Error(`Stripe API error: ${response.status}`);

  const subscription = await response.json();
  return subscription.status; // active, past_due, canceled, trialing, etc.
}

async function checkPagarmeStatus(supabase: any, sub: any): Promise<string> {
  if (!sub.pagarme_subscription_id) throw new Error('No Pagar.me subscription ID');

  // Get Pagar.me config
  const { data: settings } = await supabase
    .from('pagarme_settings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!settings) throw new Error('No Pagar.me config');

  const environment = settings.active_environment || 'test';
  const secretKey = environment === 'live' ? settings.live_secret_key : settings.test_secret_key;
  if (!secretKey) throw new Error('No Pagar.me secret key');

  const response = await fetch(
    `https://api.pagar.me/core/v5/subscriptions/${sub.pagarme_subscription_id}`,
    {
      headers: {
        'Authorization': `Basic ${btoa(secretKey + ':')}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) throw new Error(`Pagar.me API error: ${response.status}`);

  const subscription = await response.json();
  return subscription.status; // active, canceled, etc.
}

async function checkAsaasStatus(supabase: any, sub: any): Promise<string> {
  if (!sub.asaas_subscription_id) throw new Error('No Asaas subscription ID');

  // Get Asaas config
  const { data: configData } = await supabase
    .rpc('get_asaas_config_for_functions', { p_environment: 'production' });

  if (!configData?.[0]?.api_key) {
    // Try sandbox
    const { data: sandboxConfig } = await supabase
      .rpc('get_asaas_config_for_functions', { p_environment: 'sandbox' });
    if (!sandboxConfig?.[0]?.api_key) throw new Error('No Asaas config');

    const response = await fetch(
      `https://api-sandbox.asaas.com/v3/subscriptions/${sub.asaas_subscription_id}`,
      { headers: { 'access_token': sandboxConfig[0].api_key } }
    );
    if (!response.ok) throw new Error(`Asaas API error: ${response.status}`);
    const subscription = await response.json();
    return subscription.status?.toLowerCase() || 'inactive';
  }

  const response = await fetch(
    `https://api.asaas.com/v3/subscriptions/${sub.asaas_subscription_id}`,
    { headers: { 'access_token': configData[0].api_key } }
  );

  if (!response.ok) throw new Error(`Asaas API error: ${response.status}`);

  const subscription = await response.json();
  return subscription.status?.toLowerCase() || 'inactive'; // ACTIVE→active, etc.
}

// ── expire_grace: Deactivate subscriptions past their grace period ──

async function expireGracePeriods(supabase: any) {
  const now = new Date().toISOString();

  // Find all past_due subscriptions where grace period has expired
  const { data: expired, error } = await supabase
    .from('subscribers')
    .select('id, user_id, subscription_status, provider')
    .eq('subscription_status', 'past_due')
    .not('grace_period_ends_at', 'is', null)
    .lt('grace_period_ends_at', now);

  if (error) {
    log('Error fetching expired grace periods', { error: error.message });
    return { expired: 0 };
  }

  if (!expired || expired.length === 0) {
    return { expired: 0, message: 'No expired grace periods' };
  }

  log(`Expiring ${expired.length} grace periods`);

  for (const sub of expired) {
    await supabase
      .from('subscribers')
      .update({
        subscription_status: 'inactive',
        is_active: false,
        grace_period_ends_at: null,
        updated_at: now,
      })
      .eq('id', sub.id);

    // Log the transition
    await supabase.from('subscription_status_log').insert({
      user_id: sub.user_id,
      provider: sub.provider,
      previous_status: 'past_due',
      new_status: 'inactive',
      reason: 'grace_period_expired',
    }).catch(() => {});
  }

  return { expired: expired.length };
}
