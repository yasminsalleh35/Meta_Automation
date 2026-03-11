import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
};

const META_API_VERSION = Deno.env.get("META_API_VERSION") ?? "v23.0";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const META_FALLBACK_ACCESS_TOKEN = Deno.env.get("META_SYSTEM_USER_TOKEN") ?? "";

function log(step: string, extra?: unknown) {
  console.log(`[META-TARGETING-SEARCH] ${step}${extra ? " " + JSON.stringify(extra) : ""}`);
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors, status: 200 });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        headers: { ...cors, "Content-Type": "application/json" },
        status: 405,
      });
    }

    // Supabase client with caller's token
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    // 1) Authentication + admin role check
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...cors, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { data: isAdmin } = await supabase.rpc("is_admin_user");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden (admin only)" }), {
        headers: { ...cors, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // 2) Parse request body
    const body = await req.json().catch(() => ({}));
    const q: string = (body?.q ?? "").toString().trim();
    const limit: number = Math.min(Math.max(parseInt(body?.limit ?? "25", 10) || 25, 1), 50);
    const locale: string = (body?.locale ?? "pt_BR").toString();
    const country: string = (body?.country ?? "BR").toString();
    const adAccountId: string | undefined = body?.ad_account_id;

    if (!q || q.length < 2) {
      return new Response(JSON.stringify({ error: "Query `q` is required (min 2 chars)" }), {
        headers: { ...cors, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // 3) Resolve Meta access token: user's integration → fallback env
    const userId = userData.user.id;
    let accessToken: string | null = null;

    const { data: integ } = await supabase
      .from("integrations")
      .select("access_token, status")
      .eq("provider", "meta_ads")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (integ?.access_token) {
      accessToken = integ.access_token;
    } else if (META_FALLBACK_ACCESS_TOKEN) {
      accessToken = META_FALLBACK_ACCESS_TOKEN;
    }

    if (!accessToken) {
      return new Response(JSON.stringify({
        error: "No valid Meta access token found for admin (connect Meta Ads or set META_SYSTEM_USER_TOKEN).",
      }), {
        headers: { ...cors, "Content-Type": "application/json" },
        status: 412,
      });
    }

    // 4) Call Meta adinterest search endpoint
    const base = `https://graph.facebook.com/${META_API_VERSION}/search`;
    const params = new URLSearchParams({
      type: "adinterest",
      q,
      limit: String(limit),
      locale,
      country,
    });
    if (adAccountId) params.set("ad_account_id", adAccountId);

    const url = `${base}?${params.toString()}&access_token=${encodeURIComponent(accessToken)}`;
    log("Calling Meta Targeting Search", { q, limit, locale, country, adAccountId: adAccountId ?? null });

    const metaResp = await fetch(url);
    const metaJson = await metaResp.json().catch(() => ({}));
    if (!metaResp.ok) {
      const message = metaJson?.error?.message || "Meta API error";
      log("Meta API error", { status: metaResp.status, message, code: metaJson?.error?.code });
      return new Response(JSON.stringify({ error: message, code: metaJson?.error?.code }), {
        headers: { ...cors, "Content-Type": "application/json" },
        status: 502,
      });
    }

    // 5) Normalize response
    const raw = Array.isArray(metaJson?.data) ? metaJson.data : [];
    const items = raw
      .map((r: any) => {
        const audience =
          Number(r?.audience_size) ||
          Number(r?.audience_size_upper_bound) ||
          Number(r?.audience_size_lower_bound) ||
          null;

        return {
          id: String(r?.id ?? ""),
          name: String(r?.name ?? ""),
          audience_size: audience,
          topic: r?.topic ?? null,
          path: r?.path ?? null,
        };
      })
      .filter((x: any) => x.id && x.name);

    return new Response(JSON.stringify({ items }), {
      headers: { ...cors, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    log("Unhandled error", { message: e instanceof Error ? e.message : String(e) });
    return new Response(JSON.stringify({ error: "Internal error" }), {
      headers: { ...cors, "Content-Type": "application/json" },
      status: 500,
    });
  }
});