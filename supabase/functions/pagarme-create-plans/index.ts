// =============================================
// Edge Function: Criar planos Mensal e Anual V5
// Migrado para Pagar.me Core API V5
// =============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  console.log(`[pagarme::create-plans] ${step}`, details ? JSON.stringify(details) : '');
};

// V5 API Base
const V5_BASE = 'https://api.pagar.me/core/v5';

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('🚀 Starting V5 plan creation');

    // === AUTHENTICATION & AUTHORIZATION ===
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      logStep('❌ Missing authorization header');
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    );

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      logStep('❌ Authentication failed', { authError: authError?.message });
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    console.info('[pagarme::create-plans] ✅ User authenticated', { 
      userId: user.id,
      email: user.email 
    });

    // Check admin role
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'super_admin'])
      .limit(1);

    if (rolesError) {
      logStep('❌ Role check failed', { error: rolesError.message });
      return new Response(JSON.stringify({ error: 'Authorization check failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    if (!roles || roles.length === 0) {
      logStep('❌ Admin access denied', { 
        userId: user.id, 
        foundRolesCount: roles?.length || 0 
      });
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    console.info('[pagarme::create-plans] ✅ Admin access confirmed', { 
      userId: user.id,
      role: roles[0].role 
    });

    // Parse body para capturar environment
    const body = await req.json().catch(() => ({}));
    const targetEnvironment = (body.environment || 'test') as 'test' | 'live';
    
    logStep('📋 Target environment', { targetEnvironment });

    // === GET CONFIGURATION VIA SQL FUNCTION COM FILTRO DE ENVIRONMENT ===
    const { data: config, error: configError } = await supabaseAdmin
      .rpc('get_pagarme_config_for_functions', { p_environment: targetEnvironment })
      .single();

    if (configError || !config) {
      logStep('❌ Failed to load config', { error: configError?.message });
      return new Response(JSON.stringify({ 
        error: `Pagar.me not configured for ${targetEnvironment}`,
        hint: 'Configure Pagar.me settings in admin panel for this environment'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // ✅ VALIDAR ENVIRONMENT MATCH
    if (config.environment !== targetEnvironment) {
      logStep('❌ Environment mismatch', { 
        requested: targetEnvironment, 
        configured: config.environment 
      });
      return new Response(JSON.stringify({ 
        error: `Environment mismatch: Expected ${targetEnvironment}, got ${config.environment}`,
        hint: 'Database configuration does not match requested environment'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const environment = config.environment as 'test' | 'live';
    const secretKey = config.secret_key;
    const existingMensalId = config.plan_id_mensal;
    const existingAnualId = config.plan_id_anual;

    console.info('[pagarme::create-plans] ✅ Config loaded', { 
      environment, 
      targetEnvironment,
      accountId: config.account_id,
      has_secret: !!secretKey,
      existingMensalId,
      existingAnualId,
      match: '✅'
    });

    if (!secretKey) {
      return new Response(JSON.stringify({ 
        error: `Secret key not configured for ${environment}`,
        hint: 'Add secret key in Pagar.me settings'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // === CHECK IDEMPOTENCY - Skip if plans already exist ===
    if (existingMensalId && existingAnualId) {
      logStep('✅ Plans already exist (idempotent)', { 
        mensalId: existingMensalId, 
        anualId: existingAnualId 
      });
      return new Response(JSON.stringify({
        ok: true,
        alreadyExists: true,
        mensal: { id: existingMensalId },
        anual: { id: existingAnualId },
        environment
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    logStep('📝 Creating plans using API V5', { environment });

    // === CREATE MENSAL PLAN (V5 API) ===
    let mensalPlanId = existingMensalId;
    
    if (!mensalPlanId) {
      const mensalPlanData = {
        name: 'ASSINATURA CAMPLY MENSAL',
        description: 'Plano mensal Camply com pagamento recorrente',
        interval: 'month',
        interval_count: 1,
        billing_type: 'prepaid',
        payment_methods: ['credit_card'],
        installments: [1],
        status: 'active',
        currency: 'BRL',
        items: [{
          name: 'Assinatura Camply Mensal',
          quantity: 1,
          pricing_scheme: {
            price: 34999, // R$ 349,99
            scheme_type: 'unit'
          }
        }],
        metadata: { 
          plan_code: 'mensal',
          created_by: 'camply_admin',
          api_version: 'v5'
        }
      };

      logStep('Creating mensal plan (V5)', { 
        name: mensalPlanData.name, 
        price: 34999,
        interval: 'month'
      });

      // Basic Auth for V5
      const authBasic = btoa(`${secretKey}:`);

      const mensalResponse = await fetch(`${V5_BASE}/plans`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authBasic}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(mensalPlanData)
      });

      const mensalResult = await mensalResponse.json();

      if (!mensalResponse.ok) {
        logStep('❌ Failed to create mensal plan', { 
          status: mensalResponse.status,
          error: mensalResult
        });
        return new Response(JSON.stringify({ 
          error: 'Failed to create mensal plan',
          details: mensalResult,
          hint: 'V5 API requires Basic Auth with secret_key'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      mensalPlanId = mensalResult.id;
      logStep('✅ Mensal plan created (V5)', { plan_id: mensalPlanId });
    }

    // === CREATE ANUAL PLAN (V5 API) ===
    let anualPlanId = existingAnualId;
    
    if (!anualPlanId) {
      const anualPlanData = {
        name: 'ASSINATURA ANUAL CAMPLY',
        description: 'Plano anual Camply com 12x sem juros no cartão',
        interval: 'year',
        interval_count: 1,
        billing_type: 'prepaid',
        payment_methods: ['credit_card'],
        installments: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        status: 'active',
        currency: 'BRL',
        items: [{
          name: 'Assinatura Camply Anual',
          quantity: 1,
          pricing_scheme: {
            price: 249900, // R$ 2.499,00
            scheme_type: 'unit'
          }
        }],
        metadata: { 
          plan_code: 'anual',
          created_by: 'camply_admin',
          api_version: 'v5',
          default_installments: '12'
        }
      };

      logStep('Creating anual plan (V5)', { 
        name: anualPlanData.name, 
        price: 249900,
        interval: 'year',
        installments: 12
      });

      const authBasic = btoa(`${secretKey}:`);

      const anualResponse = await fetch(`${V5_BASE}/plans`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authBasic}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(anualPlanData)
      });

      const anualResult = await anualResponse.json();

      if (!anualResponse.ok) {
        logStep('❌ Failed to create anual plan', { 
          status: anualResponse.status,
          error: anualResult
        });
        return new Response(JSON.stringify({ 
          error: 'Failed to create anual plan',
          details: anualResult,
          hint: 'V5 API requires Basic Auth with secret_key'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      anualPlanId = anualResult.id;
      logStep('✅ Anual plan created (V5)', { plan_id: anualPlanId });
    }

    // === SAVE PLAN IDs TO DATABASE (pagarme_config) ===
    logStep('💾', 'Saving plan IDs to pagarme_config', { environment });

    const { error: updateError } = await supabaseAdmin
      .from('pagarme_config')
      .update({
        plan_id_mensal: mensalPlanId,
        plan_id_anual: anualPlanId,
        updated_at: new Date().toISOString()
      })
      .eq('environment', environment);

    if (updateError) {
      logStep('⚠️ Failed to save plan IDs', { updateError });
    } else {
      logStep('✅ Saved plan ids to pagarme_config', { environment });
    }

    return new Response(JSON.stringify({
      ok: true,
      mensal: { id: mensalPlanId },
      anual: { id: anualPlanId },
      environment
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    logStep('💥 Error creating plans', { 
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
