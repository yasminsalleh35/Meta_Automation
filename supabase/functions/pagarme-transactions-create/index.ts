// =============================================
// Edge Function: Criar transações Pagar.me
// Processa pagamentos únicos (cartão/PIX)
// =============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TransactionRequest {
  amount: number;
  currency: string;
  installments?: number;
  token?: string;
  card_hash?: string;
  customer: {
    name: string;
    email: string;
    document?: string;
    phone?: string;
  };
  metadata?: Record<string, any>;
  payment_method: 'credit_card' | 'pix';
}

const logStep = (step: string, details?: any) => {
  console.log(`[pagarme-transactions-create] ${step}`, details ? JSON.stringify(details) : '');
};

const serve_handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('🚀 Starting transaction creation');

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (!authError && user) {
        userId = user.id;
        logStep('✅ User authenticated', { userId });
      } else {
        logStep('⚠️ Guest transaction');
      }
    }

    // Parse request body
    const body: TransactionRequest = await req.json();
    logStep('📝 Request body parsed', { 
      amount: body.amount, 
      currency: body.currency,
      payment_method: body.payment_method,
      installments: body.installments,
      customer_email: body.customer.email
    });

    // Validate required fields
    if (!body.amount || !body.currency || !body.customer?.email || !body.customer?.name) {
      throw new Error('Missing required fields: amount, currency, customer.email, customer.name');
    }

    if (!body.token && !body.card_hash && body.payment_method === 'credit_card') {
      throw new Error('Missing token or card_hash for credit card payment');
    }

    // Get Pagar.me configuration
    const { data: config, error: configError } = await supabase.rpc('get_pagarme_config_for_functions');
    
    if (configError || !config || !config.secret_key) {
      logStep('❌ Failed to get Pagar.me config', { configError });
      throw new Error('Pagar.me not configured');
    }

    logStep('✅ Pagar.me config loaded', { 
      environment: config.environment,
      has_secret_key: !!config.secret_key
    });

    // Prepare Pagar.me API v5 call
    const pagarmeBaseUrl = 'https://api.pagar.me/core/v5';

    // Prepare transaction data for Pagar.me v5 charges endpoint
    const transactionData: any = {
      amount: body.amount,
      currency: body.currency.toLowerCase(),
      customer: {
        name: body.customer.name,
        email: body.customer.email,
        ...(body.customer.document && { document: body.customer.document }),
        ...(body.customer.phone && { phones: {
          home_phone: {
            country_code: '55',
            area_code: body.customer.phone.replace(/\D/g, '').substring(0, 2),
            number: body.customer.phone.replace(/\D/g, '').substring(2)
          }
        }})
      },
      metadata: {
        ...body.metadata,
        user_id: userId,
        source: 'transactions-create-function',
        created_at: new Date().toISOString()
      }
    };

    if (body.payment_method === 'credit_card') {
      transactionData.payment_method = 'credit_card';
      transactionData.installments = body.installments || 1;
      
      if (body.token) {
        transactionData.card = { id: body.token };
      } else if (body.card_hash) {
        transactionData.card_token = body.card_hash;
      }
    } else if (body.payment_method === 'pix') {
      transactionData.payment_method = 'pix';
      transactionData.pix = {
        expires_in: 86400, // 24 hours in seconds
      };
    }

    logStep('🔄 Calling Pagar.me API v5', { 
      url: `${pagarmeBaseUrl}/charges`,
      payment_method: transactionData.payment_method,
      amount: transactionData.amount
    });

    // Call Pagar.me API v5 - Create charge
    const pagarmeResponse = await fetch(`${pagarmeBaseUrl}/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(config.secret_key + ':')}`
      },
      body: JSON.stringify(transactionData)
    });

    const pagarmeResult = await pagarmeResponse.json();
    
    if (!pagarmeResponse.ok) {
      logStep('❌ Pagar.me API error', { 
        status: pagarmeResponse.status,
        error: pagarmeResult
      });
      throw new Error(`Pagar.me API error: ${pagarmeResult.errors?.[0]?.message || 'Unknown error'}`);
    }

        logStep('✅ Pagar.me v5 transaction created', { 
          transaction_id: pagarmeResult.id,
          status: pagarmeResult.status,
          payment_method: pagarmeResult.payment_method
        });

    // Save to database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        provider: 'pagarme',
        motive: 'one_time',
        amount: body.amount,
        currency: body.currency,
        installments: body.installments || 1,
        status: pagarmeResult.status,
        external_id: pagarmeResult.id.toString(),
        external_raw: pagarmeResult,
        metadata: body.metadata || {}
      })
      .select()
      .single();

    if (paymentError) {
      logStep('❌ Failed to save payment', { paymentError });
      throw new Error('Failed to save payment to database');
    }

    logStep('✅ Payment saved to database', { payment_id: payment.id });

    // Log audit trail
    await supabase.from('payment_audit_log').insert({
      source: 'pagarme-transactions-create',
      provider: 'pagarme',
      ref_id: pagarmeResult.id.toString(),
      message: `Transaction created - Status: ${pagarmeResult.status}`,
      metadata: {
        user_id: userId,
        payment_id: payment.id,
        amount: body.amount,
        currency: body.currency,
        payment_method: body.payment_method
      }
    });

    // Prepare response
    const response = {
      success: true,
      transaction_id: pagarmeResult.id,
      payment_id: payment.id,
      status: pagarmeResult.status,
      amount: body.amount,
      currency: body.currency,
      payment_method: body.payment_method,
      ...(body.payment_method === 'pix' && pagarmeResult.pix_qr_code && {
        pix: {
          qr_code: pagarmeResult.pix_qr_code,
          qr_code_url: pagarmeResult.pix_qr_code_url,
          expires_at: pagarmeResult.pix_expiration_date
        }
      }),
      ...(body.payment_method === 'credit_card' && {
        installments: body.installments || 1,
        authorization_code: pagarmeResult.authorization_code
      })
    };

    logStep('🎉 Transaction completed successfully', { 
      transaction_id: response.transaction_id,
      status: response.status 
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    logStep('💥 Error in transaction creation', { 
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