import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { META_GRAPH_VERSION } from '../_shared/meta.ts'; // audit PLT-03

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
};

const META_API_VERSION = Deno.env.get("META_API_VERSION") ?? META_GRAPH_VERSION;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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

    // 1) Authentication
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...cors, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // 2) Parse request body
    const body = await req.json().catch(() => ({}));
    // type "adgeolocation" (busca de cidades/estados do wizard) fica aberto a qualquer usuário
    // autenticado: o navegador não lê mais o access_token para chamar a Graph direto (audit SEC-12).
    // type "adinterest" (padrão) continua só para admin.
    const searchType: "adinterest" | "adgeolocation" =
      body?.type === "adgeolocation" ? "adgeolocation" : "adinterest";
    const q: string = (body?.q ?? "").toString().trim();
    const limit: number = Math.min(Math.max(parseInt(body?.limit ?? "25", 10) || 25, 1), 50);
    const locale: string = (body?.locale ?? "pt_BR").toString();
    const country: string = (body?.country ?? "BR").toString();
    const adAccountId: string | undefined = body?.ad_account_id;
    const allowedGeoTypes = ["city", "region", "country"];
    const locationTypes: string[] = Array.isArray(body?.location_types)
      ? body.location_types.filter((t: unknown) => allowedGeoTypes.includes(String(t)))
      : ["city", "region"];
    const countryCode: string | undefined =
      typeof body?.country_code === "string" && /^[A-Za-z]{2}$/.test(body.country_code)
        ? body.country_code.toUpperCase()
        : undefined;

    if (searchType === "adinterest") {
      const { data: isAdmin } = await supabase.rpc("is_admin_user");
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden (admin only)" }), {
          headers: { ...cors, "Content-Type": "application/json" },
          status: 403,
        });
      }
    }

    if (!q || q.length < 2) {
      return new Response(JSON.stringify({ error: "Query `q` is required (min 2 chars)" }), {
        headers: { ...cors, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // 3) Resolve Meta access token: user's integration → fallback env.
    // Lido com service_role: authenticated não tem SELECT em access_token (audit SEC-12).
    const userId = userData.user.id;
    let accessToken: string | null = null;

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
    const { data: integ } = await admin
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
        error: "No valid Meta access token found (connect Meta Ads or set META_SYSTEM_USER_TOKEN).",
      }), {
        headers: { ...cors, "Content-Type": "application/json" },
        status: 412,
      });
    }

    const base = `https://graph.facebook.com/${META_API_VERSION}/search`;

    // 4a) adgeolocation: cidades/estados/países com key oficial da Meta
    if (searchType === "adgeolocation") {
      const geoParams = new URLSearchParams({
        type: "adgeolocation",
        q,
        limit: String(limit),
        location_types: JSON.stringify(locationTypes.length ? locationTypes : ["city", "region"]),
      });
      if (countryCode) geoParams.set("country_code", countryCode);

      log("Calling Meta Geo Search", { q, limit, locationTypes, countryCode: countryCode ?? null });
      const geoUrl = `${base}?${geoParams.toString()}&access_token=${encodeURIComponent(accessToken)}`;
      let geoResp = await fetch(geoUrl);
      if (geoResp.status === 429) {
        await new Promise((r) => setTimeout(r, 500));
        geoResp = await fetch(geoUrl);
      }
      const geoJson = await geoResp.json().catch(() => ({}));
      if (!geoResp.ok) {
        const message = geoJson?.error?.message || "Meta API error";
        log("Meta API error (geo)", { status: geoResp.status, message, code: geoJson?.error?.code });
        return new Response(JSON.stringify({ error: message, code: geoJson?.error?.code }), {
          headers: { ...cors, "Content-Type": "application/json" },
          status: 502,
        });
      }

      const geoItems = (Array.isArray(geoJson?.data) ? geoJson.data : [])
        .map((r: any) => ({
          key: r?.key != null ? String(r.key) : "",
          name: String(r?.name ?? ""),
          type: r?.type ?? null,
          country_code: r?.country_code ?? null,
          country_name: r?.country_name ?? null,
          region: r?.region ?? null,
          region_id: r?.region_id ?? null,
        }))
        .filter((x: any) => x.key && x.name);

      return new Response(JSON.stringify({ items: geoItems }), {
        headers: { ...cors, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 4b) Call Meta adinterest search endpoint
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