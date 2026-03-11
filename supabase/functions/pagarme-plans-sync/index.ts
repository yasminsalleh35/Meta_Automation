// =============================================
// Edge Function: Sincronizar planos com Pagar.me
// Cria/atualiza planos de assinatura
// =============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlanSyncRequest {
  plan_type: string;
  force_recreate?: boolean;
}

const logStep = (step: string, details?: any) => {
  console.log(`[pagarme-plans-sync] ${step}`, details ? JSON.stringify(details) : '');
};

const serve_handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('🚀 Starting plan sync');

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user (admin only)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    // Check if user is admin
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError || !userRoles?.some(r => ['admin', 'super_admin'].includes(r.role))) {
      throw new Error('Access denied. Admin role required.');
    }

    logStep('✅ Admin user authenticated', { userId: user.id });

    // Parse request body
    const body: PlanSyncRequest = await req.json();
    logStep('📝 Request body parsed', body);

    if (!body.plan_type) {
      throw new Error('Missing required field: plan_type');
    }

    // Get Pagar.me configuration
    const { data: config, error: configError } = await supabase.rpc('get_pagarme_config_for_functions');
    
    if (configError || !config || !config.secret_key) {
      logStep('❌ Failed to get Pagar.me config', { configError });
      throw new Error('Pagar.me not configured');
    }

    // Get subscription plan from database
    const { data: planData, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('plan_type', body.plan_type)
      .single();

    if (planError || !planData) {
      throw new Error(`Plan not found: ${body.plan_type}`);
    }

    logStep('✅ Subscription plan loaded', { 
      plan_id: planData.id,
      plan_type: planData.plan_type,
      name: planData.name
    });

    // Prepare Pagar.me API call
    const pagarmeBaseUrl = config.environment === 'live' 
      ? 'https://api.pagar.me/1' 
      : 'https://api.pagar.me/1';

    // Check if plan already exists in Pagar.me
    let pagarmeResult: any = null;
    
    if (planData.pagarme_plan_id && !body.force_recreate) {
      logStep('🔍 Checking existing plan in Pagar.me', { pagarme_plan_id: planData.pagarme_plan_id });
      
      try {
        const existingPlanResponse = await fetch(`${pagarmeBaseUrl}/plans/${planData.pagarme_plan_id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${btoa(config.secret_key + ':')}`
          }
        });

        if (existingPlanResponse.ok) {
          pagarmeResult = await existingPlanResponse.json();
          logStep('✅ Plan already exists in Pagar.me', { 
            plan_id: pagarmeResult.id,
            name: pagarmeResult.name 
          });
        }
      } catch (error) {
        logStep('⚠️ Failed to fetch existing plan, will create new one');
      }
    }

    // Create plan if it doesn't exist
    if (!pagarmeResult) {
      const planPayload = {
        amount: Math.round((planData.price_monthly || 0) * 100), // Converter para centavos
        days: 30, // Plano mensal (30 dias)
        name: planData.name,
        trial_days: config.trial_days || 0,
        payment_methods: ['credit_card', 'boleto'],
        color: '#1f2937',
        charges: null, // Indefinido (recorrente)
        installments: 1
      };

      logStep('🔄 Creating plan in Pagar.me', planPayload);

      const createPlanResponse = await fetch(`${pagarmeBaseUrl}/plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(config.secret_key + ':')}`
        },
        body: JSON.stringify(planPayload)
      });

      pagarmeResult = await createPlanResponse.json();

      if (!createPlanResponse.ok) {
        logStep('❌ Pagar.me plan creation failed', { 
          status: createPlanResponse.status,
          error: pagarmeResult
        });
        throw new Error(`Pagar.me API error: ${pagarmeResult.errors?.[0]?.message || 'Unknown error'}`);
      }

      logStep('✅ Plan created in Pagar.me', { 
        plan_id: pagarmeResult.id,
        name: pagarmeResult.name
      });
    }

    // Update subscription plan with Pagar.me ID
    const { error: updateError } = await supabase
      .from('subscription_plans')
      .update({
        pagarme_plan_id: pagarmeResult.id.toString(),
        provider: 'pagarme',
        updated_at: new Date().toISOString()
      })
      .eq('id', planData.id);

    if (updateError) {
      logStep('❌ Failed to update plan', { updateError });
      throw new Error('Failed to update plan in database');
    }

    logStep('✅ Plan updated in database');

    // Log audit trail
    await supabase.from('payment_audit_log').insert({
      source: 'pagarme-plans-sync',
      provider: 'pagarme',
      ref_id: pagarmeResult.id.toString(),
      message: `Plan synced: ${planData.name}`,
      metadata: {
        user_id: user.id,
        plan_type: body.plan_type,
        plan_id: planData.id,
        pagarme_plan_id: pagarmeResult.id,
        force_recreate: body.force_recreate || false
      }
    });

    const response = {
      success: true,
      plan_id: planData.id,
      plan_type: body.plan_type,
      pagarme_plan_id: pagarmeResult.id,
      name: pagarmeResult.name,
      amount: pagarmeResult.amount,
      trial_days: pagarmeResult.trial_days,
      created_new: !planData.pagarme_plan_id || body.force_recreate
    };

    logStep('🎉 Plan sync completed successfully', response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    logStep('💥 Error in plan sync', { 
      error: error.message,
      stack: error.stack
    });

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
};

serve(serve_handler);