import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { handlePreflight, jsonWithCors } from "../_shared/cors.ts";

serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return handlePreflight(req);

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const auth = req.headers.get("Authorization");
    if (!auth) return jsonWithCors(origin, { error: "Unauthorized" }, { status: 401 });

    const token = auth.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return jsonWithCors(origin, { error: "Invalid or expired token" }, { status: 401 });

    const { data: integration } = await admin
      .from("integrations")
      .select(`
        ad_account_id, page_id,
        selected_ad_account_ids, selected_page_ids, selected_instagram_ids, updated_at
      `)
      .eq("user_id", user.id)
      .eq("provider", "meta_ads")
      .eq("status", "active")
      .single();

    if (!integration) {
      return jsonWithCors(origin, {
        ad_account_id: null,
        page_id: null,
        instagram_id: null,
        updated_at: new Date().toISOString(),
        source: "fallback",
      });
    }

    return jsonWithCors(origin, {
      ad_account_id: integration.ad_account_id ?? integration.selected_ad_account_ids?.[0] ?? null,
      page_id: integration.selected_page_ids?.[0] ?? integration.page_id ?? null,
      instagram_id: integration.selected_instagram_ids?.[0] ?? null,
      updated_at: integration.updated_at ?? new Date().toISOString(),
      source: "db",
    });
  } catch (e) {
    return jsonWithCors(
      origin,
      {
        error: "internal_error",
        message: e instanceof Error ? e.message : String(e),
        ad_account_id: null,
        page_id: null,
        instagram_id: null,
        updated_at: new Date().toISOString(),
        source: "fallback",
      },
      { status: 500 },
    );
  }
});