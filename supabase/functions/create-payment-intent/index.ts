import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { toMessage, toObject } from '../_shared/errors.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const logStep = (step: string, details?: any) => {
  console.log(`[PAYMENT-INTENT] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Payment intent creation started');
    
    // Get Stripe secret key
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not configured');
    }
    logStep('Stripe key verified');

    // Parse request body
    const { 
      guest_email, 
      guest_name, 
      guest_whatsapp,
      guest_cpf,
      guest_phone,
      guest_address,
      planType, 
      billingPeriod = 'monthly' 
    } = await req.json();
    
    logStep('Payment intent data received', { 
      guest_email, 
      guest_name, 
      planType, 
      billingPeriod,
      hasAddress: !!guest_address,
      hasCPF: !!guest_cpf
    });

    // Validate required fields
    if (!guest_email || !guest_name || !planType) {
      throw new Error('Missing required fields: guest_email, guest_name, or planType');
    }

    if (planType !== 'premium') {
      throw new Error('Invalid plan type. Only "premium" is supported.');
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Check if customer exists
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: guest_email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      logStep('Existing customer found', { customerId: customer.id });
    } else {
      // Create new customer
      const customerData: any = {
        email: guest_email,
        name: guest_name,
        metadata: {
          whatsapp: guest_whatsapp || '',
          cpf: guest_cpf || '',
          source: 'guest_checkout'
        },
      };

      // Add phone if provided
      if (guest_phone) {
        customerData.phone = guest_phone;
      }

      // Add address if provided
      if (guest_address) {
        customerData.address = {
          line1: `${guest_address.street}, ${guest_address.number}`,
          line2: guest_address.complement || undefined,
          city: guest_address.city,
          state: guest_address.state,
          postal_code: guest_address.cep.replace(/\D/g, ''),
          country: 'BR',
        };
      }

      customer = await stripe.customers.create(customerData);
      logStep('New customer created', { customerId: customer.id });
    }

    // Determine amount based on plan and billing period
    let amount: number;
    if (billingPeriod === 'annual') {
      amount = 249900; // R$ 2.499,00 in cents
    } else {
      amount = 34999; // R$ 349,99 in cents
    }

    // Create payment intent
    const paymentIntentData: any = {
      amount,
      currency: 'brl',
      customer: customer.id,
      setup_future_usage: 'off_session',
      metadata: {
        guest_email,
        guest_name,
        guest_whatsapp: guest_whatsapp || '',
        guest_cpf: guest_cpf || '',
        planType,
        billingPeriod,
        source: 'transparent_checkout'
      },
      receipt_email: guest_email,
      description: `Assinatura ${planType} - ${billingPeriod === 'annual' ? 'Anual' : 'Mensal'}`,
    };

    // Add shipping address if provided (for invoices)
    if (guest_address) {
      paymentIntentData.shipping = {
        name: guest_name,
        phone: guest_phone || undefined,
        address: {
          line1: `${guest_address.street}, ${guest_address.number}`,
          line2: guest_address.complement || undefined,
          city: guest_address.city,
          state: guest_address.state,
          postal_code: guest_address.cep.replace(/\D/g, ''),
          country: 'BR',
        },
      };
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    logStep('Payment intent created', { 
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret?.substring(0, 20) + '...',
      amount 
    });

    return new Response(
      JSON.stringify({
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        customer_id: customer.id,
        amount,
        currency: 'brl'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('[PAYMENT-INTENT] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});