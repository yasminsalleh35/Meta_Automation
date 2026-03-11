import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
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
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    // Get Stripe configuration from database
    const stripeConfig = await getStripeConfig(supabaseClient);
    
    if (!stripeConfig) {
      throw new Error("Missing Stripe configuration");
    }
    
    logStep("Stripe config loaded from database");

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { planType, billingPeriod = 'monthly' } = await req.json();
    if (!planType || planType !== 'premium') throw new Error("Plan type must be 'premium'");
    logStep("Plan details received", { planType, billingPeriod });

    const stripe = new Stripe(stripeConfig.secret_key, { apiVersion: "2023-10-16" });
    
    // Check if customer already exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id }
      });
      customerId = customer.id;
      logStep("New customer created", { customerId });
    }

    // Define price based on plan type and billing period
    let priceAmount;
    let planName = 'Camply Premium';
    let priceId = null; // In real implementation, use actual Stripe Price IDs

    if (planType === 'premium') {
      priceAmount = billingPeriod === 'annual' ? 249900 : 34999; // R$ 2.499,00 annual or R$ 349,99 monthly
    } else {
      throw new Error("Invalid plan type");
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";
    
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
      success_url: `${origin}/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/subscription/canceled`,
      metadata: {
        user_id: user.id,
        plan_type: planType,
        billing_period: billingPeriod
      }
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // Send payment confirmation email after successful payment
    // This will be handled by webhook or success page verification

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});