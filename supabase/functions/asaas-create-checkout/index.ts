import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeadersFor, handlePreflight, jsonWithCors } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handlePreflight(req);
  }

  const origin = req.headers.get('Origin');

  try {
    // Get planId from request body
    const { planId } = await req.json();

    if (!planId) {
      return jsonWithCors(origin, { error: 'planId é obrigatório' }, { status: 400 });
    }

    console.log('[asaas-create-checkout] Creating checkout for plan:', planId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonWithCors(origin, { error: 'Não autenticado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return jsonWithCors(origin, { error: 'Não autenticado' }, { status: 401 });
    }

    // Check if user is admin - query user_roles directly to avoid RLS issues with SERVICE_ROLE_KEY
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'super_admin']);

    if (rolesError || !roles || roles.length === 0) {
      console.error('[asaas-create-checkout] User is not admin:', user.id);
      return jsonWithCors(origin, { error: 'Acesso negado. Apenas administradores.' }, { status: 403 });
    }

    console.log('[asaas-create-checkout] Admin verified:', user.email, roles.map(r => r.role));

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('asaas_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      console.error('[asaas-create-checkout] Plan not found:', planError);
      return jsonWithCors(origin, { error: 'Plano não encontrado' }, { status: 404 });
    }

    if (!plan.is_active) {
      return jsonWithCors(origin, { error: 'Plano está inativo' }, { status: 400 });
    }

    console.log('[asaas-create-checkout] Plan found:', plan.name, plan.environment);

    // Determine planCode for tracking
    const planCode: 'mensal' | 'anual' = plan.cycle === 'YEARLY' ? 'anual' : 'mensal';

    // 1. Create pending checkout record BEFORE calling Asaas
    const { data: pendingCheckout, error: pendingError } = await supabase
      .from('asaas_pending_checkouts')
      .insert({
        user_email: user.email,
        plan_code: planCode,
        plan_id: planId,
        environment: plan.environment,
        status: 'pending'
      })
      .select()
      .single();

    if (pendingError || !pendingCheckout) {
      console.error('[asaas-create-checkout] Failed to create pending checkout:', pendingError);
      return jsonWithCors(origin, { error: 'Erro ao criar registro de checkout' }, { status: 500 });
    }

    console.log('[asaas-create-checkout] Pending checkout created:', pendingCheckout.id);

    // Get Asaas configuration for this environment
    const { data: configData, error: configError } = await supabase
      .from('asaas_config')
      .select('api_key, environment')
      .eq('environment', plan.environment)
      .eq('is_active', true)
      .single();

    if (configError || !configData) {
      console.error('[asaas-create-checkout] Config not found:', configError);
      return jsonWithCors(origin, { error: 'Configuração Asaas não encontrada' }, { status: 404 });
    }

    const apiKey = configData.api_key;
    if (!apiKey) {
      return jsonWithCors(origin, { error: 'API Key não configurada' }, { status: 400 });
    }

    // Calculate next due date (7 days from now)
    const today = new Date();
    today.setDate(today.getDate() + 7);
    const nextDueDate = today.toISOString().split('T')[0];

    console.log('[asaas-create-checkout] Next due date:', nextDueDate);

    // Validate plan data before creating checkout
    if (!plan.amount || plan.amount <= 0) {
      return jsonWithCors(origin, { error: 'Valor do plano inválido' }, { status: 400 });
    }

    if (!plan.billing_type) {
      return jsonWithCors(origin, { error: 'Tipo de cobrança não definido' }, { status: 400 });
    }

    if (!['MONTHLY', 'YEARLY', 'QUARTERLY', 'SEMIANNUALLY'].includes(plan.cycle)) {
      return jsonWithCors(origin, { error: 'Ciclo de assinatura inválido' }, { status: 400 });
    }

    // Determine base URL based on environment
    const baseUrl = plan.environment === 'production' 
      ? 'https://api.asaas.com/v3'
      : 'https://api-sandbox.asaas.com/v3';

    // Create checkout payload - DIFFERENTIATE between MONTHLY and YEARLY
    let checkoutPayload: any;

    if (plan.cycle === 'MONTHLY') {
      // ✅ PLANO MENSAL → Assinatura Recorrente
      console.log('[asaas-create-checkout] Creating MONTHLY subscription (RECURRENT)');
      
      checkoutPayload = {
        name: `Teste - ${plan.name}`,
        billingTypes: ['CREDIT_CARD'],
        chargeTypes: ['RECURRENT'], // Subscription
        items: [{
          name: plan.name,
          description: plan.description || `Plano ${plan.name} - Teste`,
          value: plan.amount,
          quantity: 1
        }],
        subscription: {
          cycle: 'MONTHLY',
          nextDueDate: nextDueDate,
          externalReference: user.email
        },
        callback: {
          successUrl: `https://iacamply.com/checkout/sucesso?provider=asaas&env=${plan.environment}&plan=${planCode}`,
          cancelUrl: `https://iacamply.com/checkout/cancelado?provider=asaas`,
          expiredUrl: `https://iacamply.com/checkout/expirado?provider=asaas`
        },
        minutesToExpire: 60
      };
    } else if (plan.cycle === 'YEARLY') {
      // ✅ PLANO ANUAL → Parcelamento Único (até 12x)
      console.log('[asaas-create-checkout] Creating YEARLY installment payment (DETACHED + INSTALLMENT)');
      
      checkoutPayload = {
        name: `Teste - ${plan.name}`,
        billingTypes: ['CREDIT_CARD'],
        chargeTypes: ['DETACHED', 'INSTALLMENT'], // ← CORREÇÃO: adicionar DETACHED
        items: [{
          name: plan.name,
          description: plan.description || `Plano ${plan.name} - Teste`,
          value: plan.amount,
          quantity: 1
        }],
        installment: {
          maxInstallmentCount: plan.max_installment_count || 12
        },
        // ⚠️ NÃO inclui "subscription" para INSTALLMENT
        callback: {
          successUrl: `https://iacamply.com/checkout/sucesso?provider=asaas&env=${plan.environment}&plan=${planCode}`,
          cancelUrl: `https://iacamply.com/checkout/cancelado?provider=asaas`,
          expiredUrl: `https://iacamply.com/checkout/expirado?provider=asaas`
        },
        minutesToExpire: 60
      };
    } else {
      // ❌ Ciclo não suportado
      console.error('[asaas-create-checkout] Unsupported cycle:', plan.cycle);
      return jsonWithCors(origin, { 
        error: 'Ciclo de plano não suportado para checkout',
        details: `Apenas MONTHLY e YEARLY são suportados. Recebido: ${plan.cycle}`
      }, { status: 400 });
    }

    console.log('[asaas-create-checkout] Payload completo:', JSON.stringify(checkoutPayload, null, 2));
    console.log('[asaas-create-checkout] Environment:', plan.environment);
    console.log('[asaas-create-checkout] Base URL:', baseUrl);

    // Call Asaas API to create checkout
    const asaasResponse = await fetch(`${baseUrl}/checkouts`, {
      method: 'POST',
      headers: {
        'access_token': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'iacamply-admin/1.0'
      },
      body: JSON.stringify(checkoutPayload)
    });

    console.log('[asaas-create-checkout] Asaas response status:', asaasResponse.status, asaasResponse.statusText);
    console.log('[asaas-create-checkout] Asaas response content-type:', asaasResponse.headers.get('content-type'));

    const rawBody = await asaasResponse.text();
    let asaasData: any = null;

    try {
      asaasData = rawBody ? JSON.parse(rawBody) : null;
    } catch {
      console.error('[asaas-create-checkout] Asaas non-JSON response body (first 500 chars):', rawBody.slice(0, 500));
    }

    if (!asaasResponse.ok) {
      console.error('[asaas-create-checkout] Asaas API error:', {
        status: asaasResponse.status,
        statusText: asaasResponse.statusText,
        body: asaasData ?? '[non-JSON body, see previous log]'
      });

      let details: string;

      if (asaasData && (asaasData.errors || asaasData.message)) {
        details = asaasData.errors?.[0]?.description || asaasData.message;
      } else {
        details = `HTTP ${asaasResponse.status} ${asaasResponse.statusText} (possível resposta HTML do Asaas)`;
      }

      return jsonWithCors(origin, { 
        error: 'Erro ao criar checkout no Asaas',
        details,
        asaasErrors: asaasData?.errors || [],
        fullResponse: asaasData ?? null
      }, { status: 400 });
    }

    console.log('[asaas-create-checkout] Checkout created successfully:', asaasData.id);

    // 2. Update pending checkout with Asaas checkout ID
    const { error: updateError } = await supabase
      .from('asaas_pending_checkouts')
      .update({ 
        asaas_checkout_id: asaasData.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', pendingCheckout.id);

    if (updateError) {
      console.error('[asaas-create-checkout] Failed to update pending checkout:', updateError);
    } else {
      console.log('[asaas-create-checkout] Pending checkout updated with checkout_id:', asaasData.id);
    }

    return jsonWithCors(origin, {
      success: true,
      checkoutUrl: asaasData.url || asaasData.link,
      checkoutId: asaasData.id,
      expirationDate: asaasData.expirationDate
    });

  } catch (error: any) {
    console.error('[asaas-create-checkout] Error:', error);
    return jsonWithCors(origin, { 
      error: 'Erro interno ao criar checkout',
      details: error.message 
    }, { status: 500 });
  }
});
