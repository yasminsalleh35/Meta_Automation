import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { planCode, userEmail } = await req.json();

    if (!planCode || !['mensal', 'anual'].includes(planCode)) {
      return new Response(
        JSON.stringify({ error: 'planCode deve ser "mensal" ou "anual"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mapear código público para slug interno
    const slugMap: Record<string, string> = {
      'mensal': 'camply_monthly',
      'anual': 'camply-anual-2026'
    };

    const internalSlug = slugMap[planCode];

    console.log(`[asaas-public-checkout] Buscando plano de produção: ${planCode} → ${internalSlug}`);

    // Buscar plano de PRODUÇÃO no Asaas
    const { data: plan, error: planError } = await supabase
      .from('asaas_plans')
      .select('*')
      .eq('environment', 'production')
      .eq('internal_slug', internalSlug)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      console.error('[asaas-public-checkout] Plano não encontrado:', planError);
      return new Response(
        JSON.stringify({ error: 'Plano não encontrado', details: planError }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[asaas-public-checkout] Plano encontrado:', plan);

    // Buscar configuração Asaas de PRODUÇÃO
    const { data: config } = await supabase.rpc('get_asaas_config_for_functions', {
      p_environment: 'production'
    });

    if (!config || config.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Configuração Asaas de produção não encontrada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const asaasConfig = config[0];

    // Calcular próxima data de vencimento (7 dias a partir de agora)
    const today = new Date();
    today.setDate(today.getDate() + 7);
    const nextDueDate = today.toISOString().split('T')[0];

    // Construir payload do checkout
    let checkoutPayload: any;

    if (plan.cycle === 'MONTHLY') {
      // PLANO MENSAL → Assinatura recorrente
      console.log('[asaas-public-checkout] Criando assinatura MENSAL');
      
      checkoutPayload = {
        name: plan.name,
        billingTypes: ['CREDIT_CARD'],
        chargeTypes: ['RECURRENT'],
        items: [{
          name: plan.name,
          description: plan.description || `Plano ${plan.name}`,
          value: plan.amount,
          quantity: 1
        }],
        subscription: {
          cycle: 'MONTHLY',
          nextDueDate: nextDueDate,
          externalReference: userEmail || 'guest-checkout'
        },
        callback: {
          successUrl: `https://iacamply.com/checkout/sucesso?provider=asaas&env=production&plan=${planCode}`,
          cancelUrl: `https://iacamply.com/checkout/cancelado?provider=asaas`,
          expiredUrl: `https://iacamply.com/checkout/expirado?provider=asaas`
        },
        minutesToExpire: 60
      };
    } else if (plan.cycle === 'YEARLY') {
      // PLANO ANUAL → Parcelamento único (até 12x)
      console.log('[asaas-public-checkout] Criando pagamento ANUAL parcelado');
      
      checkoutPayload = {
        name: plan.name,
        billingTypes: ['CREDIT_CARD'],
        chargeTypes: ['DETACHED', 'INSTALLMENT'],
        items: [{
          name: plan.name,
          description: plan.description || `Plano ${plan.name}`,
          value: plan.amount,
          quantity: 1
        }],
        installment: {
          maxInstallmentCount: plan.max_installment_count || 12
        },
        callback: {
          successUrl: `https://iacamply.com/checkout/sucesso?provider=asaas&env=production&plan=${planCode}`,
          cancelUrl: `https://iacamply.com/checkout/cancelado?provider=asaas`,
          expiredUrl: `https://iacamply.com/checkout/expirado?provider=asaas`
        },
        minutesToExpire: 60
      };
    } else {
      return new Response(
        JSON.stringify({ error: 'Tipo de plano não suportado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[asaas-public-checkout] Payload do checkout:', JSON.stringify(checkoutPayload, null, 2));

    // Criar checkout no Asaas
    const asaasResponse = await fetch('https://api.asaas.com/v3/checkouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'access_token': asaasConfig.api_key,
        'User-Agent': 'iacamply-public/1.0'
      },
      body: JSON.stringify(checkoutPayload)
    });

    const asaasData = await asaasResponse.json();

    if (!asaasResponse.ok) {
      console.error('[asaas-public-checkout] Erro na resposta do Asaas:', asaasData);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao criar checkout no Asaas',
          details: asaasData.errors?.[0]?.description || 'Erro desconhecido',
          asaasErrors: asaasData.errors,
          fullResponse: asaasData
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[asaas-public-checkout] Checkout criado com sucesso:', asaasData);

    // Registrar checkout pendente
    const { error: insertError } = await supabase
      .from('asaas_pending_checkouts')
      .insert({
        plan_id: plan.id,
        plan_code: planCode,
        environment: 'production',
        user_email: userEmail || 'guest@checkout.com',
        asaas_checkout_id: asaasData.id,
        status: 'pending'
      });

    if (insertError) {
      console.error('[asaas-public-checkout] Erro ao registrar checkout pendente:', insertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        checkoutUrl: asaasData.url || asaasData.link,
        checkoutId: asaasData.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[asaas-public-checkout] Erro inesperado:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
