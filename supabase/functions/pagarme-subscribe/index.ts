// =============================================
// Edge Function: Pagar.me Subscribe V5
// Pipeline: Customer → Card (token) → Subscription
// VERSION: 2025-10-03-v5-pure-payload
// =============================================

// 🔥 LOG DE BOOT: Confirma que esta versão foi deployada
console.log('[BOOT] pagarme-subscribe V5 loaded - 2025-10-03-v5-pure-payload');

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  console.log(`[pagarme::subscribe::v5] ${step}`, details ? JSON.stringify(details) : '');
};

const V5_BASE = 'https://api.pagar.me/core/v5';

interface PagarmeErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

interface MobilePhone {
  country_code: string;
  area_code: string;
  number: string;
}

function parsePhoneBR(raw?: string): MobilePhone | null {
  if (!raw) return null;
  const digits = (raw.match(/\d/g) || []).join('');
  // Remove country code if present
  const noCountry = digits.startsWith('55') ? digits.slice(2) : digits;
  // area_code = first 2 digits, rest = number
  const area_code = noCountry.slice(0, 2);
  const number = noCountry.slice(2);
  
  if (area_code.length !== 2 || number.length < 7) {
    logStep('⚠️ invalid phone format', { raw, digits, area_code, number });
    return null;
  }

  return { country_code: '55', area_code, number };
}

function extractV5FailureReason(subscription: any) {
  const charge = subscription?.charges?.data?.[0] || subscription?.last_charge;
  const lastTx = charge?.last_transaction;
  const antifraud = lastTx?.antifraud_response;
  const gateway = lastTx?.gateway_response;
  
  return {
    charge_status: charge?.status,
    tx_status: lastTx?.status,
    acquirer_message: lastTx?.acquirer_message || gateway?.message,
    acquirer_code: lastTx?.acquirer_return_code || gateway?.code,
    refusal_reason: lastTx?.refusal_reason || charge?.failure_reason,
    gateway_errors: gateway?.errors || [],
    antifraud_status: antifraud?.status,
    antifraud_errors: antifraud?.errors || []
  };
}

function getHintForStatus(status: string, details: any): string {
  if (status === 'failed') {
    const msg = details.acquirer_message || details.refusal_reason;
    if (msg?.toLowerCase().includes('saldo') || msg?.toLowerCase().includes('limit')) {
      return 'Saldo insuficiente ou limite ultrapassado. Tente outro cartão.';
    }
    if (msg?.toLowerCase().includes('recusad') || msg?.toLowerCase().includes('negad')) {
      return 'Transação recusada pelo banco. Verifique os dados ou tente outro cartão.';
    }
    return 'Revise os dados do cartão ou tente outro método de pagamento.';
  }
  if (status === 'pending') {
    return 'Pagamento em análise. Você receberá um e-mail quando for aprovado.';
  }
  return 'Entre em contato com o suporte para mais informações.';
}

function generateOnboardingEmail(name: string, planCode: string, subscriptionId: string): string {
  const planName = planCode === 'mensal' ? 'Plano Mensal' : 'Plano Anual';
  const amount = planCode === 'mensal' ? 'R$ 349,99/mês' : 'R$ 2.499,00/ano';
  const installments = planCode === 'mensal' ? '1x de R$ 349,99' : '12x de R$ 208,25';
  
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmação de Assinatura - Camply</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.6; 
            color: #1f2937; 
            margin: 0;
            padding: 0;
            background-color: #f3f4f6;
          }
          .container { 
            max-width: 600px; 
            margin: 40px auto; 
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 30px; 
            text-align: center;
          }
          .header h1 { 
            margin: 0 0 8px 0; 
            font-size: 24px;
            font-weight: 600;
          }
          .content { 
            padding: 30px;
          }
          .content p { 
            margin: 0 0 16px 0; 
            color: #4b5563;
            font-size: 15px;
          }
          .subscription-details {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .subscription-details table {
            width: 100%;
            border-collapse: collapse;
          }
          .subscription-details td {
            padding: 8px 0;
            color: #374151;
            font-size: 14px;
          }
          .subscription-details td:first-child {
            font-weight: 500;
            color: #1f2937;
          }
          .next-steps {
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
            border-radius: 4px;
            padding: 16px;
            margin: 20px 0;
          }
          .next-steps p {
            margin: 0;
            color: #1e40af;
            font-size: 14px;
          }
          .footer { 
            text-align: center; 
            color: #6b7280; 
            font-size: 13px; 
            padding: 20px;
            background: #f9fafb;
            border-top: 1px solid #e5e7eb;
          }
          .footer p { 
            margin: 4px 0;
          }
          .footer a {
            color: #667eea;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Confirmação de Assinatura</h1>
            <p>Obrigado por assinar a Camply!</p>
          </div>
          
          <div class="content">
            <p>Olá, ${name}</p>
            
            <p>Seu pagamento foi processado com sucesso. Confira abaixo os detalhes da sua assinatura:</p>
            
            <div class="subscription-details">
              <table>
                <tr>
                  <td>Plano:</td>
                  <td>${planName}</td>
                </tr>
                <tr>
                  <td>Valor:</td>
                  <td>${amount}</td>
                </tr>
                <tr>
                  <td>Parcelamento:</td>
                  <td>${installments}</td>
                </tr>
                <tr>
                  <td>ID da Assinatura:</td>
                  <td>${subscriptionId}</td>
                </tr>
              </table>
            </div>
            
            <div class="next-steps">
              <p><strong>Próximo passo:</strong> Você receberá um email separado com instruções para criar sua senha e acessar a plataforma.</p>
            </div>
            
            <p>Se tiver alguma dúvida, nossa equipe de suporte está à disposição.</p>
            
            <p>Atenciosamente,<br>Equipe Camply</p>
          </div>
          
          <div class="footer">
            <p><strong>Camply - Plataforma de Marketing Digital</strong></p>
            <p>© ${new Date().getFullYear()} Camply. Todos os direitos reservados.</p>
            <p style="margin-top: 12px;">
              <a href="https://iacamply.com">iacamply.com</a> | 
              <a href="mailto:suporte@iacamply.com">suporte@iacamply.com</a>
            </p>
            <p style="margin-top: 12px; font-size: 12px;">
              Rua Exemplo, 123 - São Paulo - SP - Brasil
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('🚀 start → validating input');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json().catch(() => ({}));
    
    // ============================================================
    // Normalização V5: aceitar variações e padronizar
    // ============================================================
    const token =
      body.card_token ??
      body['pagarmetoken-0'] ??
      body.token ??
      body.id ??
      body.payment_token ??
      null;
    
    // Validar formato do token V5 imediatamente
    if (!token || !String(token).startsWith('token_') || String(token).length < 15) {
      logStep('❌ invalid token format', { 
        token_present: !!token,
        token_prefix: token ? String(token).substring(0, 10) : 'none'
      });
      return new Response(JSON.stringify({
        error: 'CARD_TOKEN_INVALID',
        details: {
          hint: 'Token ausente, expirado ou inválido. Gere um novo token e tente novamente.'
        }
      }), {
        status: 422,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    const planId = body.plan_id ?? body.plan ?? body.planCode ?? null;
    const requestedInstallments = body.installments ?? null;
    const buyer = body.buyer ?? {};
    const name = buyer.name ?? body.name ?? body.customer?.name ?? null;
    const email = buyer.email ?? body.email ?? body.customer?.email ?? null;
    const phone = buyer.phone ?? body.phone ?? body.customer?.phone ?? null;
    const document = buyer.document ?? body.document ?? body.customer?.document ?? null;
    const address = buyer.address ?? body.address ?? body.customer?.address ?? null;

    // Validação de campos obrigatórios
    const fieldsMissing: string[] = [];
    
    if (!token) fieldsMissing.push('card_token');
    if (!planId) fieldsMissing.push('plan_id');
    if (!requestedInstallments || typeof requestedInstallments !== 'number') {
      fieldsMissing.push('installments (obrigatório, número 1-12)');
    }
    if (!name?.trim()) fieldsMissing.push('buyer.name');
    if (!email?.trim()) fieldsMissing.push('buyer.email');
    if (!document?.trim() || document.replace(/\D/g, '').length !== 11) {
      fieldsMissing.push('buyer.document (CPF com 11 dígitos)');
    }
    
    // ✅ NOVO: Validar endereço obrigatório
    if (!address || typeof address !== 'object') {
      fieldsMissing.push('buyer.address');
    } else {
      if (!address.line_1?.trim()) fieldsMissing.push('buyer.address.line_1');
      if (!address.number?.trim()) fieldsMissing.push('buyer.address.number');
      if (!address.zip_code?.trim() || address.zip_code.replace(/\D/g, '').length !== 8) {
        fieldsMissing.push('buyer.address.zip_code (CEP com 8 dígitos)');
      }
      if (!address.city?.trim()) fieldsMissing.push('buyer.address.city');
      if (!address.state?.trim() || address.state.length !== 2) {
        fieldsMissing.push('buyer.address.state (UF com 2 letras)');
      }
      if (!address.country?.trim()) fieldsMissing.push('buyer.address.country');
    }
    
    // Validar telefone (aceita string simples ou objeto V5)
    let phoneObj: MobilePhone | null = null;
    if (typeof phone === 'object' && phone !== null) {
      if (!phone.country_code || !phone.area_code || !phone.number) {
        fieldsMissing.push('buyer.phone.{country_code,area_code,number}');
      } else {
        phoneObj = phone as MobilePhone;
      }
    } else if (typeof phone === 'string') {
      phoneObj = parsePhoneBR(phone);
      if (!phoneObj) {
        fieldsMissing.push('buyer.phone (formato inválido)');
      }
    } else {
      fieldsMissing.push('buyer.phone');
    }

    // Token V5 validation
    if (token && !/^token_[A-Za-z0-9]{10,}$/.test(token)) {
      fieldsMissing.push('card_token (formato V5 inválido)');
    }

    if (fieldsMissing.length) {
      logStep('❌ payload inválido', { fields_missing: fieldsMissing, received: Object.keys(body) });
      return new Response(JSON.stringify({ 
        ok: false,
        message: 'Payload inválido (campos faltando ou inválidos)',
        fields_missing: fieldsMissing
      }), {
        status: 422,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Normalizar dados
    const customer = {
      name: name!.trim(),
      email: email!.trim(),
      phone: phoneObj!,
      document: document!.replace(/\D/g, ''),
      // ✅ NOVO: Incluir endereço normalizado
      address: {
        line_1: address!.line_1.trim(),
        number: address!.number.trim(),
        zip_code: address!.zip_code.replace(/\D/g, ''),
        city: address!.city.trim(),
        state: address!.state.toUpperCase().trim(),
        country: address!.country.toUpperCase().trim()
      }
    };
    
    // Mapear plan_id para plano V5 (mensal ou anual)
    let planCode: 'mensal' | 'anual';
    if (planId === 'mensal' || planId === 'anual') {
      planCode = planId;
    } else {
      // Se vier um plan_id direto do V5 (plan_xxx), assumir mensal como fallback
      planCode = 'mensal';
      logStep('⚠️ plan_id não reconhecido, assumindo mensal', { received: planId });
    }

    logStep('✓ input-ok', { 
      planId: planCode, 
      hasToken: true, 
      phone: `${customer.phone.country_code}-${customer.phone.area_code}-${customer.phone.number}` 
    });
    
    logStep('→ fetching config', { requesting_environment: 'live' });
    const { data: config, error: configError } = await supabase
      .rpc('get_pagarme_config_for_functions', { p_environment: 'live' })
      .single();

    if (configError || !config) {
      logStep('❌ config not found');
      return new Response(JSON.stringify({ 
        ok: false,
        message: 'Pagar.me não configurado'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // ✅ VALIDAÇÃO CRÍTICA: Confirmar que recebemos config do ambiente live
    if (config.environment !== 'live') {
      logStep('❌ environment mismatch', { 
        expected: 'live', 
        received: config.environment 
      });
      return new Response(JSON.stringify({ 
        ok: false,
        message: 'Configuração de ambiente incorreta'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // ✅ VALIDAÇÃO: Ambos os planos devem estar configurados
    if (!config.plan_id_mensal || !config.plan_id_anual) {
      logStep('❌ incomplete plans configuration', {
        mensal: config.plan_id_mensal || 'MISSING',
        anual: config.plan_id_anual || 'MISSING',
        environment: config.environment
      });
      return new Response(JSON.stringify({
        error: 'INCOMPLETE_PLANS',
        details: {
          mensal_configured: !!config.plan_id_mensal,
          anual_configured: !!config.plan_id_anual,
          hint: 'Ambos os planos (mensal e anual) devem estar configurados no ambiente live'
        }
      }), {
        status: 412,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const finalPlanId = planCode === 'mensal' ? config.plan_id_mensal : config.plan_id_anual;
    
    // 🔒 Validação forte do plan_id (formato V5)
    if (!finalPlanId || typeof finalPlanId !== 'string' || !finalPlanId.startsWith('plan_') || finalPlanId.length < 10) {
      logStep('❌ plan_id invalid or missing', { 
        planCode, 
        finalPlanId,
        environment: config.environment
      });
      return new Response(JSON.stringify({ 
        error: 'PLAN_ID_MISSING',
        details: {
          alias: planCode,
          environment: config.environment,
          hint: `Configure corretamente os IDs dos planos V5 (plan_*) em Admin › Integrações › Pagar.me no ambiente ${config.environment}.`
        }
      }), {
        status: 412,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    logStep('✓ plan resolved', { 
      planCode, 
      finalPlanId,
      environment: config.environment,
      both_plans_configured: {
        mensal: config.plan_id_mensal,
        anual: config.plan_id_anual
      }
    });
    
    // 🔒 Buscar secret_key dos Supabase Secrets (não do banco!)
    const secretKey = config.environment === 'live' 
      ? Deno.env.get('PAGARME_SECRET_KEY_LIVE')
      : Deno.env.get('PAGARME_SECRET_KEY_TEST');
    
    if (!secretKey) {
      logStep('❌ secret_key not found in Supabase Secrets', { 
        environment: config.environment,
        expected_secret: config.environment === 'live' ? 'PAGARME_SECRET_KEY_LIVE' : 'PAGARME_SECRET_KEY_TEST'
      });
      return new Response(JSON.stringify({ 
        error: 'SECRET_KEY_MISSING',
        details: {
          environment: config.environment,
          hint: `Configure a secret key no Supabase: ${config.environment === 'live' ? 'PAGARME_SECRET_KEY_LIVE' : 'PAGARME_SECRET_KEY_TEST'}`
        }
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    const authBasic = btoa(`${secretKey}:`);
    
    logStep('✓ config OK', { 
      email: customer.email,
      using_env: config.environment,
      plan_id: finalPlanId,
      sk_prefix: secretKey.substring(0, 10),
      secret_source: 'supabase_secrets'
    });
    
    // 🔍 health-check → validating plan
    logStep('🔍 health-check → validating plan');

    const planRes = await fetch(`${V5_BASE}/plans/${finalPlanId}`, {
      headers: { 'Authorization': `Basic ${authBasic}` }
    });

    // ❌ Verificar se plano existe (404)
    if (planRes.status === 404) {
      logStep('❌ plan not found on Pagar.me', { finalPlanId });
      return new Response(JSON.stringify({
        error: 'PLAN_NOT_FOUND',
        details: {
          plan_id: finalPlanId,
          environment: config.environment,
          hint: 'O ID do plano informado não existe no Core V5. Crie/Sincronize os planos e salve os IDs no banco.'
        }
      }), {
        status: 412,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // ❌ Falha no lookup do plano (outros erros)
    if (!planRes.ok) {
      const errorText = await planRes.text().catch(() => '');
      logStep('❌ plan lookup failed', { 
        status: planRes.status, 
        body: errorText?.slice(0, 300) 
      });
      return new Response(JSON.stringify({
        error: 'PAGARME_PLAN_LOOKUP_FAILED',
        details: { 
          status: planRes.status, 
          body: errorText?.slice(0, 300) 
        }
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    let finalInstallments: number | null = (typeof requestedInstallments === 'number' ? requestedInstallments : null);

    // Plano encontrado, validar detalhes
    if (planRes.ok) {
      const planDetails = await planRes.json();
      const allowedInstallments: number[] = Array.isArray(planDetails.installments)
        ? planDetails.installments
        : [];

      logStep('✓ plan validated', {
        payment_methods: planDetails.payment_methods,
        billing_type: planDetails.billing_type,
        installments_allowed: allowedInstallments,
        requested_installments: requestedInstallments
      });

      if (!planDetails.payment_methods?.includes('credit_card')) {
        return new Response(JSON.stringify({
          ok: false,
          message: 'Plano não aceita cartão de crédito',
          hint: 'Verifique a configuração do plano no Pagar.me'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Se veio installments, valide contra a lista permitida
      if (finalInstallments !== null &&
          allowedInstallments.length > 0 &&
          !allowedInstallments.includes(finalInstallments)) {
        logStep('❌ installments not allowed', {
          requested: finalInstallments,
          allowed: allowedInstallments
        });
        return new Response(JSON.stringify({
          error: 'INSTALLMENTS_NOT_ALLOWED',
          details: {
            requested: finalInstallments,
            allowed: allowedInstallments,
            hint: `Este plano aceita apenas: ${allowedInstallments.join(', ')} parcelas.`
          }
        }), {
          status: 422,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Se NÃO veio installments, define default por alias e ajusta se necessário
      if (finalInstallments === null) {
        finalInstallments = (planCode === 'anual') ? 12 : 1;

        if (allowedInstallments.length > 0 &&
            !allowedInstallments.includes(finalInstallments)) {
          finalInstallments = (planCode === 'anual')
            ? Math.max(...allowedInstallments)
            : Math.min(...allowedInstallments);

          logStep('⚠️ installments adjusted (fallback)', {
            default_for: planCode,
            adjusted_to: finalInstallments,
            allowed: allowedInstallments
          });
        }
      }
    } else {
      logStep('⚠️ could not validate plan', { status: planRes.status });
      // Sem detalhes do plano, caia no default sensato
      finalInstallments = finalInstallments ?? ((planCode === 'anual') ? 12 : 1);
    }

    // Segurança: nunca prossiga com null
    finalInstallments = finalInstallments ?? ((planCode === 'anual') ? 12 : 1);
    
    logStep('→ upsert customer');

    // 1. Upsert Customer V5
    const customerPayload: any = {
      name: customer.name,
      email: customer.email,
      type: 'individual',
      document: customer.document,
      document_type: 'CPF',
      phones: { mobile_phone: customer.phone },
      // ✅ NOVO: Incluir endereço no customer
      address: customer.address,
      metadata: { 
        source: 'iacamply', 
        env: config.environment 
      }
    };
    
    logStep('✓ phone ready', customer.phone);

    let customerId: string;
    
    // Tentar buscar customer existente por email
    const searchRes = await fetch(`${V5_BASE}/customers?email=${encodeURIComponent(customer.email)}`, {
      headers: { 'Authorization': `Basic ${authBasic}` }
    });

    const searchData = await searchRes.json();
    
    if (searchRes.ok && searchData.data && searchData.data.length > 0) {
      customerId = searchData.data[0].id;
      logStep('✓ customer exists', { customer_id: customerId });
      
      // ✅ UPDATE: Garantir que o documento esteja atualizado no customer existente
      const updateCustomerRes = await fetch(`${V5_BASE}/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${authBasic}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: customer.name,
          email: customer.email,
          type: 'individual',  // ✅ Campo obrigatório no V5
          document: customer.document,
          document_type: 'CPF',
          phones: {
            mobile_phone: customer.phone
          },
          // ✅ NOVO: Incluir endereço no UPDATE
          address: customer.address
        })
      });
      
      if (updateCustomerRes.ok) {
        logStep('✓ customer updated with document', { 
          document: customer.document.substring(0, 3) + '***',
          type: 'individual'
        });
      } else {
        const updateError = await updateCustomerRes.json();
        logStep('❌ customer update failed - CRITICAL', updateError);
        
        // ✅ CRÍTICO: Interromper se não conseguir atualizar documento
        return new Response(
          JSON.stringify({
            ok: false,
            message: 'customer_update_failed',
            details: updateError,
            hint: 'Não foi possível atualizar os dados do cliente. Tente novamente.'
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    } else {
      // Criar novo customer
      const createCustomerRes = await fetch(`${V5_BASE}/customers`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authBasic}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customerPayload)
      });

      const createCustomerData = await createCustomerRes.json();
      
      if (!createCustomerRes.ok) {
        logStep('❌ customer creation failed', createCustomerData);
        throw new Error((createCustomerData as PagarmeErrorResponse).message || 'Falha ao criar cliente');
      }

      customerId = createCustomerData.id;
      logStep('✓ customer created', { customer_id: customerId });
    }

    // 2. Criar Card V5 com token + billing_address
    logStep('→ creating card with billing_address', { 
      token_prefix: token!.substring(0, 12),
      has_address: !!customer.address,
      address_fields: {
        line_1: !!customer.address.line_1,
        number: !!customer.address.number,
        zip_code: !!customer.address.zip_code,
        city: !!customer.address.city,
        state: !!customer.address.state,
        country: !!customer.address.country
      }
    });
    
    const idempotencyKey = crypto.randomUUID();
    
    const createCardRes = await fetch(`${V5_BASE}/customers/${customerId}/cards`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authBasic}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify({ 
        token: token!,
        billing_address: {
          line_1: customer.address.line_1,
          number: customer.address.number,
          zip_code: customer.address.zip_code,
          city: customer.address.city,
          state: customer.address.state,
          country: customer.address.country
        }
      })
    });

    const cardData = await createCardRes.json();
    
    if (!createCardRes.ok) {
      logStep('❌ card creation failed', { 
        status: createCardRes.status,
        message: cardData.message,
        idempotency_key: idempotencyKey
      });
      
      // Se "Token not found", retornar erro específico
      if (cardData.message?.includes('Token not found')) {
        return new Response(JSON.stringify({
          ok: false,
          message: 'Token não encontrado pela Pagar.me (pode ter expirado após ~60s)',
          hint: 'Gere um novo token e tente novamente.'
        }), {
          status: 422,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      
      const errorMsg = (cardData as PagarmeErrorResponse).message || 'Cartão recusado';
      return new Response(JSON.stringify({ ok: false, message: errorMsg }), {
        status: 422,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const cardId = cardData.id;
    logStep('✓ card created', { card_id: cardId });

    // 3. Criar Subscription V5 (payload PURO DOCUMENTADO - raiz)
    // ✅ Estrutura V5 Core API oficial sem charges[] array
    const subscriptionPayload = {
      customer_id: customerId,
      plan_id: finalPlanId,              // ✅ Na raiz (V5 documentado)
      card_id: cardId,                   // ✅ Na raiz
      payment_method: 'credit_card',     // ✅ Na raiz
      installments: finalInstallments,   // ✅ Na raiz
      // ✅ NOVO: Billing obrigatório para transações com cartão
      billing: {
        address: customer.address
      },
      metadata: {
        source: 'camply',
        plan_alias: planCode,
        env: config.environment,
        api_version: 'v5_pure'
      }
    };

    // 🔍 Log detalhado do payload V5 puro
    logStep('📤 FINAL PAYLOAD (V5 documented)', {
      structure: 'root_level_v5',
      customer_id: subscriptionPayload.customer_id,
      plan_id: subscriptionPayload.plan_id,
      card_id: subscriptionPayload.card_id,
      payment_method: subscriptionPayload.payment_method,
      installments: subscriptionPayload.installments,
      has_billing: !!subscriptionPayload.billing,
      has_plan_id: !!subscriptionPayload.plan_id,
      has_card_id: !!subscriptionPayload.card_id,
      plan_format_ok: subscriptionPayload.plan_id?.startsWith('plan_'),
      card_format_ok: subscriptionPayload.card_id?.startsWith('card_')
    });

    logStep('🔍 RAW PAYLOAD JSON', JSON.stringify(subscriptionPayload, null, 2));

    const subscriptionRes = await fetch(`${V5_BASE}/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authBasic}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscriptionPayload)
    });

    const subscriptionData = await subscriptionRes.json();
    
    if (!subscriptionRes.ok) {
      logStep('❌ subscription API failed', {
        status: subscriptionRes.status,
        body: subscriptionData
      });
      
      // Erro específico de pricing_scheme
      if (subscriptionData.errors?.['items[0].pricing_scheme']) {
        return new Response(JSON.stringify({ 
          error: 'SUBSCRIPTION_CREATE_FAILED',
          details: {
            status: subscriptionRes.status,
            pagarme: {
              message: 'Plano não referenciado corretamente',
              errors: subscriptionData.errors
            },
            hint: 'Verifique se plan_id_mensal e plan_id_anual estão configurados no ambiente atual.'
          }
        }), {
          status: 422,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      
      // Erro genérico da API
      return new Response(JSON.stringify({
        error: 'SUBSCRIPTION_CREATE_FAILED',
        details: {
          status: subscriptionRes.status,
          pagarme: subscriptionData
        }
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const firstCharge = subscriptionData?.charges?.data?.[0];
    logStep('✓ subscription created', { 
      subscription_id: subscriptionData.id, 
      status: subscriptionData.status,
      has_charges: !!firstCharge,
      first_charge_status: firstCharge?.status,
      plan_id: finalPlanId
    });

    // 4. Salvar no banco
    await supabase.from('pagarme_subscriptions').insert({
      pagarme_subscription_id: subscriptionData.id,
      pagarme_plan_id: finalPlanId,
      email: customer.email,
      plan_code: planCode,
      status: subscriptionData.status,
      installments: finalInstallments,
      amount_cents: planCode === 'mensal' ? 34999 : 249900,
      currency: 'BRL',
      environment: config.environment
    });

    // 5. Checar status final
    if (subscriptionData.status === 'pending') {
      logStep('⏳ subscription pending', { 
        subscription_id: subscriptionData.id,
        status: subscriptionData.status
      });
      
      return new Response(JSON.stringify({
        ok: true,
        status: 'pending',
        subscription_id: subscriptionData.id,
        message: 'Pagamento em processamento',
        hint: 'Você receberá um e-mail quando for aprovado.'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    if (subscriptionData.status !== 'active') {
      const failureDetails = extractV5FailureReason(subscriptionData);
      
      logStep('❌ subscription failed', { 
        status: subscriptionData.status,
        subscription_id: subscriptionData.id,
        charge_status: failureDetails.charge_status,
        tx_status: failureDetails.tx_status,
        acquirer_code: failureDetails.acquirer_code,
        acquirer_message: failureDetails.acquirer_message,
        antifraud_status: failureDetails.antifraud_status
      });
      
      return new Response(JSON.stringify({
        ok: false,
        message: 'subscription_failed',
        subscription_id: subscriptionData.id,
        status: subscriptionData.status,
        charge_status: failureDetails.charge_status,
        tx_status: failureDetails.tx_status,
        acquirer_code: failureDetails.acquirer_code,
        acquirer_message: failureDetails.acquirer_message,
        refusal_reason: failureDetails.refusal_reason,
        gateway_errors: failureDetails.gateway_errors,
        antifraud: {
          status: failureDetails.antifraud_status,
          errors: failureDetails.antifraud_errors
        },
        hint: getHintForStatus(subscriptionData.status, failureDetails)
      }), {
        status: 402, // Payment Required
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 6. Status = active → Criar usuário e enviar e-mail
    logStep('✅ active subscription → creating user & sending emails');
    
    const { data: authUser } = await supabase.auth.admin.listUsers();
    let userId = authUser.users.find((u: any) => u.email === customer.email)?.id;

    if (!userId) {
      // Criar usuário sem enviar email automático do Supabase
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: customer.email,
        email_confirm: true, // Email já confirmado
        user_metadata: {
          name: customer.name
        }
      });

      if (createError) {
        logStep('⚠️ failed to create user', createError);
      } else if (newUser?.user) {
        userId = newUser.user.id;
        
        // Associar user_id à subscription com retry
        for (let attempt = 1; attempt <= 3; attempt++) {
          const { error: updateError } = await supabase
            .from('pagarme_subscriptions')
            .update({ user_id: userId })
            .eq('pagarme_subscription_id', subscriptionData.id);
          
          if (!updateError) {
            logStep('✓ user_id linked to subscription', { userId, attempt });
            break;
          }
          
          if (attempt < 3) {
            logStep('⚠️ retry linking user_id', { attempt, error: updateError.message });
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            logStep('❌ failed to link user_id after 3 attempts', updateError);
          }
        }
      }
    }

    // Enviar emails
    if (userId) {
      try {
        // 1. Email de criação de conta (com link para definir senha)
        const accountCreationRes = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-account-creation`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: customer.email,
              name: customer.name,
              planCode,
              subscriptionId: subscriptionData.id
            })
          }
        );

        if (accountCreationRes.ok) {
          logStep('✅ account creation email sent');
        } else {
          const errorText = await accountCreationRes.text();
          logStep('⚠️ account creation email failed', { error: errorText });
        }

        // 2. Email de boas-vindas (detalhes da assinatura)
        const emailModule = await import('../_shared/emailClient.ts');
        await emailModule.sendEmail({
          to: [customer.email],
          subject: '✓ Confirmação de Assinatura - Camply',
          html: generateOnboardingEmail(customer.name, planCode, subscriptionData.id)
        });
        logStep('✅ onboarding email sent');
        
      } catch (emailError: any) {
        logStep('⚠️ email send failed', { error: emailError.message });
      }
    }

    logStep('✅ success → all done');

    return new Response(JSON.stringify({
      ok: true,
      success: true, // backward compat
      subscription_id: subscriptionData.id,
      status: subscriptionData.status,
      customer_id: customerId,
      card_id: cardId
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    const msg = error?.message || 'Erro ao processar assinatura';
    const rawPagarmeError = error?.response?.data || null;
    
    logStep('❌ error', { 
      message: msg, 
      pagarme_raw: rawPagarmeError ? JSON.stringify(rawPagarmeError) : 'N/A',
      stack: error?.stack?.substring(0, 200) 
    });
    
    return new Response(JSON.stringify({
      ok: false,
      message: msg,
      details: rawPagarmeError
    }), {
      status: error.status || 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
