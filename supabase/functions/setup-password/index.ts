import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, extra?: unknown) =>
  console.log(`[SETUP-PASSWORD] ${step}${extra ? " - " + JSON.stringify(extra) : ""}`);

async function findUserIdByEmail(admin: ReturnType<typeof createClient>, email: string): Promise<string | null> {
  // Não há getUserByEmail no SDK; fazemos um scan controlado.
  // Em bases pequenas (caso típico), 1-3 páginas já resolvem.
  const PER_PAGE = 200;
  for (let page = 1; page <= 3; page++) {
    // @ts-ignore - tipos do admin.listUsers
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (error) {
      log("listUsers error", { page, msg: error.message });
      return null;
    }
    const match = data?.users?.find?.((u: any) => (u?.email || "").toLowerCase() === email.toLowerCase());
    if (match?.id) return match.id;
    if (!data?.users?.length) break;
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const { session_id, password } = await req.json();
    if (!session_id || !password) {
      return new Response(JSON.stringify({ error: "Missing session_id or password" }), {
        headers: { ...cors, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!stripeKey || !supabaseUrl || !serviceKey) {
      log("Missing envs");
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        headers: { ...cors, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    // 1) Obtemos sessão e customer
    const session = await stripe.checkout.sessions.retrieve(session_id, { expand: ["customer"] });
    const customer =
      typeof session.customer === "string"
        ? await stripe.customers.retrieve(session.customer)
        : session.customer;

    if (!customer || (customer as any).deleted) {
      return new Response(JSON.stringify({ error: "Stripe customer not found" }), {
        headers: { ...cors, "Content-Type": "application/json" },
        status: 404,
      });
    }

    const c = customer as Stripe.Customer;
    const email = c.email || session.customer_details?.email || "";
    if (!email) {
      return new Response(JSON.stringify({ error: "Email not available from Stripe session/customer" }), {
        headers: { ...cors, "Content-Type": "application/json" },
        status: 422,
      });
    }

    // 2) Tentamos usar o user_id do metadata
    let userId = c.metadata?.user_id;

    // 3) Fallback: se não houver user_id, criamos (ou encontramos) o usuário AGORA
    if (!userId) {
      log("No user_id in Stripe metadata, trying to create/find user", { customerId: c.id, email });

      // Primeiro tentamos localizar por e-mail (evita duplicidade se webhook já criou)
      let foundId = await findUserIdByEmail(admin as any, email);

      if (!foundId) {
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: { created_via: "guest_checkout" },
        });
        if (createErr) {
          // Se já existia e não achamos via listUsers (caso muito raro), tenta listar novamente
          log("createUser error", { msg: createErr.message });
          foundId = await findUserIdByEmail(admin as any, email);
        } else {
          foundId = created?.user?.id ?? null;
        }
      }

      if (!foundId) {
        // Se ainda assim não temos user, sinalizamos para o front tentar de novo
        return new Response(JSON.stringify({ error: "User not ready. Try again shortly." }), {
          headers: { ...cors, "Content-Type": "application/json" },
          status: 409,
        });
      }

      userId = foundId;

      // Persistimos no Stripe para idempotência absoluta
      await stripe.customers.update(c.id, {
        metadata: { ...(c.metadata || {}), user_id: userId },
      });

      log("User resolved and saved to Stripe metadata", { userId });
    }

    // 4) Garante que o usuário existe mesmo
    const fetched = await admin.auth.admin.getUserById(userId).catch((e) => {
      log("getUserById error", { msg: String(e) });
      return null;
    });

    // @ts-ignore
    if (!fetched || !fetched.data?.user) {
      // Último fallback idempotente: tente criar de novo (se cair aqui é bem raro)
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { created_via: "guest_checkout" },
      });
      if (createErr && !createErr.message?.includes("already registered")) {
        log("final createUser error", { msg: createErr.message });
        return new Response(JSON.stringify({ error: createErr.message }), {
          headers: { ...cors, "Content-Type": "application/json" },
          status: 500,
        });
      }
      userId = created?.user?.id || userId;
      await stripe.customers.update(c.id, {
        metadata: { ...(c.metadata || {}), user_id: userId },
      });
    }

    // 5) Define a senha
    const { error: updErr } = await admin.auth.admin.updateUserById(userId, { password });
    if (updErr) {
      log("updateUserById error", { msg: updErr.message });
      return new Response(JSON.stringify({ error: updErr.message }), {
        headers: { ...cors, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // 6) (Opcional) Sincroniza subscribers se já houver assinatura ativa
    try {
      const subs = await stripe.subscriptions.list({ customer: c.id, status: "active", limit: 1 });
      const hasActive = subs.data.length > 0;
      const activeSub = hasActive ? subs.data[0] : null;

      const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
      await db.from("subscribers").upsert({
        user_id: userId,
        email,
        stripe_customer_id: c.id,
        stripe_subscription_id: activeSub?.id ?? null,
        plan_type: "premium",
        subscription_status: hasActive ? "active" : "inactive",
        is_active: hasActive,
        plan_expires_at: activeSub?.current_period_end
          ? new Date(activeSub.current_period_end * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    } catch (e) {
      log("subscribers sync warn", { msg: e instanceof Error ? e.message : String(e) });
      // Não falhamos o fluxo por isso
    }

    log("Password set successfully", { userId, email });
    return new Response(JSON.stringify({ email }), {
      headers: { ...cors, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    log("Unhandled error", { msg: e instanceof Error ? e.message : String(e) });
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      headers: { ...cors, "Content-Type": "application/json" },
      status: 500,
    });
  }
});