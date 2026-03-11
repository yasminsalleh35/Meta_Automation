// =============================================
// Edge Function: Check Pagar.me Subscription
// Verifica status da assinatura Pagar.me V5
// =============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[CHECK-PAGARME-SUBSCRIPTION] Function started');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! }
        }
      }
    );

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('[CHECK-PAGARME-SUBSCRIPTION] Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('[CHECK-PAGARME-SUBSCRIPTION] User authenticated:', { 
      userId: user.id, 
      email: user.email 
    });

    // Check if user is admin or super_admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'super_admin'])
      .maybeSingle();

    if (roleData) {
      console.log('[CHECK-PAGARME-SUBSCRIPTION] Admin access detected');
      return new Response(
        JSON.stringify({
          subscribed: true,
          is_admin: true,
          subscription_tier: 'admin',
          subscription_end: null,
          plan_name: 'Acesso Administrativo',
          plan_features: ['Acesso completo sem assinatura'],
          plan_limits: {},
          provider: 'admin'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Get active environment from pagarme_settings
    const { data: settings } = await supabase
      .from('pagarme_settings')
      .select('active_environment')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const environment = settings?.active_environment || 'test';
    console.log('[CHECK-PAGARME-SUBSCRIPTION] Using environment:', environment);

    // Check for active Pagar.me subscription
    const { data: subscription, error: subError } = await supabase
      .from('pagarme_subscriptions')
      .select('*, subscription_plans!inner(name, features, limits)')
      .eq('user_id', user.id)
      .eq('environment', environment)
      .eq('status', 'active')
      .maybeSingle();

    if (subError) {
      console.error('[CHECK-PAGARME-SUBSCRIPTION] Error fetching subscription:', subError);
    }

    if (subscription) {
      console.log('[CHECK-PAGARME-SUBSCRIPTION] Active subscription found:', {
        subscriptionId: subscription.pagarme_subscription_id,
        planCode: subscription.plan_code,
        status: subscription.status
      });

      return new Response(
        JSON.stringify({
          subscribed: true,
          subscription_tier: 'premium',
          subscription_end: subscription.current_period_end,
          plan_name: subscription.plan_code === 'mensal' ? 'Plano Mensal' : 'Plano Anual',
          plan_features: [
            'Campanhas ilimitadas',
            'Orçamento ilimitado',
            'IA ilimitada',
            'Análises avançadas',
            'Suporte prioritário'
          ],
          plan_limits: {
            campaigns: -1,
            monthlyBudget: -1,
            aiSuggestions: -1
          },
          provider: 'pagarme',
          pagarme_subscription_id: subscription.pagarme_subscription_id,
          status: subscription.status
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // No active subscription found
    console.log('[CHECK-PAGARME-SUBSCRIPTION] No active subscription found');
    return new Response(
      JSON.stringify({
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        provider: null
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('[CHECK-PAGARME-SUBSCRIPTION] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
