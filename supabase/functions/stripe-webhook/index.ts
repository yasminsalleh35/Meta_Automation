import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { assertRateLimit } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
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
  
  if (!config.secret_key || !config.webhook_secret) {
    logStep("Incomplete Stripe configuration", { 
      hasSecretKey: !!config.secret_key, 
      hasWebhookSecret: !!config.webhook_secret 
    });
    return null;
  }

  return config;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting for webhook endpoint
  const clientIP = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const signature = req.headers.get("stripe-signature") || "";
  const rateLimitKey = `stripe-webhook:${clientIP}:${signature.substring(0, 10)}`;
  
  const rateLimitResponse = assertRateLimit(req, {
    key: rateLimitKey,
    limit: 100, // Allow 100 requests per minute for webhooks
    window: 60
  });
  
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Webhook received");

    // Get Stripe configuration from database
    const stripeConfig = await getStripeConfig(supabaseClient);
    
    if (!stripeConfig) {
      throw new Error("Missing Stripe configuration");
    }

    const stripe = new Stripe(stripeConfig.secret_key, { apiVersion: "2023-10-16" });
    
    const body = await req.text();
    const signature = req.headers.get("stripe-signature")!;

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeConfig.webhook_secret);
      logStep("Webhook signature verified", { type: event.type });
    } catch (err) {
      logStep("Webhook signature verification failed", { error: (err as any)?.message });
      return new Response(`Webhook signature verification failed`, { status: 400 });
    }

    // Check for idempotency - prevent duplicate processing
    const { data: existingEvent } = await supabaseClient
      .from('stripe_event_log')
      .select('id')
      .eq('id', event.id)
      .single();

    if (existingEvent) {
      logStep("Event already processed", { eventId: event.id });
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          if (session.mode !== 'subscription') break;

          const customerId = session.customer as string;
          const customer = await stripe.customers.retrieve(customerId);
          if (!customer || (customer as any).deleted) break;

          const c = customer as Stripe.Customer;
          const email = c.email || session.customer_details?.email;
          const isGuestCheckout = (c.metadata?.is_guest_checkout === 'true');

          // Se já tem user_id → idempotente: nada a fazer
          if (!c.metadata?.user_id && isGuestCheckout && email) {
            const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
              email,
              email_confirm: true,
              user_metadata: { created_via: 'guest_checkout' },
            });

            if (!authError && authUser?.user?.id) {
              await stripe.customers.update(customerId, {
                metadata: { ...c.metadata, user_id: authUser.user.id },
              });
              logStep('checkout.session.completed → user created', { userId: authUser.user.id });
            }
          }
          break;
        }

        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          logStep("Processing subscription event", { 
            subscriptionId: subscription.id,
            customerId: subscription.customer,
            status: subscription.status
          });

          // Get customer to find metadata
          const customer = await stripe.customers.retrieve(subscription.customer as string);
          if (!customer || customer.deleted) {
            logStep("Customer not found", { customerId: subscription.customer });
            break;
          }

          const customerData = customer as Stripe.Customer;
          const isGuestCheckout = customerData.metadata?.is_guest_checkout === 'true';
          let userId = customerData.metadata?.user_id;

          // If it's a guest checkout, create the user first
          if (isGuestCheckout && !userId) {
            const guestEmail = customerData.metadata?.guest_email || customerData.email;
            const guestName = customerData.metadata?.guest_name || customerData.name;
            
            if (guestEmail) {
              logStep("Creating user for guest checkout", { guestEmail });
              
              // Create user in Supabase Auth with temporary password
              const temporaryPassword = `temp_${Math.random().toString(36).substring(2, 15)}`;
              const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
                email: guestEmail,
                password: temporaryPassword,
                email_confirm: true,
                user_metadata: {
                  name: guestName || 'Usuário',
                  created_via: 'guest_checkout',
                  needs_password_setup: true
                }
              });

              if (authError) {
                logStep("Error creating auth user", { error: authError.message });
                break;
              }

              if (authUser?.user) {
                userId = authUser.user.id;
                
                // Update customer with user_id
                await stripe.customers.update(subscription.customer as string, {
                  metadata: {
                    ...customerData.metadata,
                    user_id: userId
                  }
                });
                
                logStep("User created successfully with temporary password", { userId, email: guestEmail });
              }
            }
          }

          if (!userId) {
            logStep("User ID not found", { customerId: subscription.customer });
            break;
          }

          // Update or create subscriber record
          const { error } = await supabaseClient
            .from('subscribers')
            .upsert({
              user_id: userId,
              email: customerData.email,
              plan_type: 'premium',
              stripe_customer_id: subscription.customer,
              stripe_subscription_id: subscription.id,
              subscription_status: subscription.status,
              is_active: subscription.status === 'active',
              plan_expires_at: subscription.current_period_end ? 
                new Date(subscription.current_period_end * 1000).toISOString() : null,
            }, {
              onConflict: 'user_id'
            });

          if (error) {
            logStep("Error updating subscriber", { error: error.message, userId });
          } else {
            logStep("Subscriber updated successfully", { userId, status: subscription.status });
          }
          break;
        }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Processing subscription cancellation", { subscriptionId: subscription.id });

        // Get customer to find user_id
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if (!customer || customer.deleted) {
          logStep("Customer not found", { customerId: subscription.customer });
          break;
        }

        const userId = (customer as Stripe.Customer).metadata?.user_id;
        if (!userId) {
          logStep("User ID not found in customer metadata", { customerId: subscription.customer });
          break;
        }

        // Update subscriber record to inactive
        const { error } = await supabaseClient
          .from('subscribers')
          .update({
            subscription_status: 'canceled',
            is_active: false,
          })
          .eq('user_id', userId);

        if (error) {
          logStep("Error updating canceled subscription", { error: error.message, userId });
        } else {
          logStep("Subscription canceled successfully", { userId });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment succeeded", { 
          invoiceId: invoice.id,
          customerId: invoice.customer,
          amount: invoice.amount_paid
        });
        // Additional payment success handling can be added here
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment failed", { 
          invoiceId: invoice.id,
          customerId: invoice.customer,
          amount: invoice.amount_due
        });
        // Additional payment failure handling can be added here
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    // Log successful processing for idempotency
    await supabaseClient
      .from('stripe_event_log')
      .insert({ id: event.id });

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});