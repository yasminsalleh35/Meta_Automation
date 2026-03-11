import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  console.log(`[pagarme-calc] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('🚀 Starting installment calculation');

    const body = await req.json();
    const { 
      amount, 
      installments_max = 12, 
      free_installments = 0, 
      interest_rate = 0 
    } = body;

    if (!amount || amount <= 0) {
      throw new Error('Valid amount is required');
    }

    logStep('📝 Request validated', { amount, installments_max, free_installments, interest_rate });

    const monthlyRate = Number(interest_rate) / 100;
    const installmentOptions = [];

    for (let i = 1; i <= installments_max; i++) {
      if (i <= free_installments) {
        // Parcelas sem juros
        const installmentAmount = Math.round(amount / i);
        installmentOptions.push({
          number: i,
          amount: installmentAmount,
          total: amount,
          interest: 0,
          isFree: true,
          description: `${i}x de R$ ${(installmentAmount / 100).toFixed(2).replace('.', ',')} sem juros`
        });
      } else {
        // Parcelas com juros (juros compostos)
        const total = Math.round(amount * Math.pow(1 + monthlyRate, i));
        const installmentAmount = Math.round(total / i);
        const interestAmount = total - amount;
        
        installmentOptions.push({
          number: i,
          amount: installmentAmount,
          total: total,
          interest: interestAmount,
          isFree: false,
          description: `${i}x de R$ ${(installmentAmount / 100).toFixed(2).replace('.', ',')} com juros`
        });
      }
    }

    logStep('✅ Calculation completed', { optionsCount: installmentOptions.length });

    return new Response(JSON.stringify({
      success: true,
      original_amount: amount,
      installment_options: installmentOptions,
      config: { installments_max, free_installments, interest_rate }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    logStep('💥 Calculation error', error.message);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Calculation error occurred'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});