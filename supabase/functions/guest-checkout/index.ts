import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GUEST-CHECKOUT] ${step}${detailsStr}`);
};

// Helper function to get Stripe configuration from database
const getStripeConfig = async (supabaseClient: any) => {
  const { data, error } = await supabaseClient.rpc('get_stripe_config_for_functions');
  
  if (error) {
    logStep("Error fetching Stripe config from database", { error: error.message });
    return null;
  }

  if (!data || data.length === 0) {
    logStep("No Stripe configuration found in database");
    return null;
  }

  const config = data[0];
  
  if (!config.secret_key) {
    logStep("Incomplete Stripe configuration - missing secret_key");
    return null;
  }

  return config;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Guest checkout started");

    // Get Stripe configuration from database
    const stripeConfig = await getStripeConfig(supabaseClient);
    
    if (!stripeConfig) {
      throw new Error("Missing Stripe configuration");
    }
    
    logStep("Stripe config loaded from database");

    const { 
      guest_email, 
      guest_name, 
      guest_whatsapp,
      planType, 
      billingPeriod = 'monthly' 
    } = await req.json();
    
    if (!guest_email || !guest_name || !planType) {
      throw new Error("Missing required fields: guest_email, guest_name, planType");
    }
    
    if (planType !== 'premium') {
      throw new Error("Plan type must be 'premium'");
    }
    
    logStep("Guest checkout data received", { 
      guest_email, 
      guest_name, 
      planType, 
      billingPeriod 
    });

    const stripe = new Stripe(stripeConfig.secret_key, { apiVersion: "2023-10-16" });
    
    // Check if customer already exists
    const customers = await stripe.customers.list({ email: guest_email, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      const customer = await stripe.customers.create({
        email: guest_email,
        name: guest_name,
        metadata: { 
          is_guest_checkout: 'true',
          guest_email: guest_email,
          guest_name: guest_name,
          guest_whatsapp: guest_whatsapp || ''
        }
      });
      customerId = customer.id;
      logStep("New customer created", { customerId });
    }

    // Define price based on plan type and billing period
    let priceAmount;
    let planName = 'Camply Premium';

    if (planType === 'premium') {
      priceAmount = billingPeriod === 'annual' ? 249900 : 34999; // R$ 2.499,00 annual or R$ 349,99 monthly
    } else {
      throw new Error("Invalid plan type");
    }

    const origin = req.headers.get("origin") || "https://iacamply.com";
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: { 
              name: planName,
              description: `Assinatura ${billingPeriod === 'annual' ? 'anual' : 'mensal'} da plataforma Camply - Acesso completo a todas as funcionalidades`
            },
            unit_amount: priceAmount,
            recurring: { interval: billingPeriod === 'annual' ? 'year' : 'month' },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&new_user=true`,
      cancel_url: `${origin}/?checkout=canceled`,
      metadata: {
        guest_email,
        guest_name,
        guest_whatsapp: guest_whatsapp || '',
        plan_type: planType,
        billing_period: billingPeriod,
        is_guest_checkout: 'true'
      }
    });

    logStep("Guest checkout session created", { 
      sessionId: session.id, 
      url: session.url 
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in guest-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});