// supabase/functions/meta-assets-cached/index.ts
// Cache-first edge function para ativos Meta (Pages, Instagram, Ad Accounts)
// Estratégia: DB cache (24h TTL) → Meta API (se expirado) → Update DB

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const ASSETS_TTL = 24 * 60 * 60 * 1000; // 24 horas
const API_VERSION = 'v23.0';

interface MetaAssets {
  facebookPages: any[];
  instagramAccounts: any[];
  adAccounts: any[];
  cached_at: string;
  expires_at: string;
}

interface CachedResponse extends MetaAssets {
  cached: boolean;
  source: 'database' | 'meta-api';
  cacheAge?: number;
}

function cors(req: Request) {
  const origin = req.headers.get("origin") ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  };
}

function j(res: unknown, init: ResponseInit = {}) {
  const base = init.headers ?? {};
  return new Response(JSON.stringify(res), {
    ...init,
    headers: { "content-type": "application/json; charset=utf-8", ...base },
  });
}

serve(async (req) => {
  const headers = cors(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!supabaseUrl || !supabaseKey) {
    console.error("[META-ASSETS-CACHED] Missing Supabase environment variables");
    return j({ error: "Missing Supabase configuration" }, { status: 500, headers });
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Authenticate user
  const jwt = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!jwt) {
    return j({ error: "Missing Authorization bearer token" }, { status: 401, headers });
  }

  const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
  if (userErr || !userData?.user?.id) {
    return j({ error: "Invalid session" }, { status: 401, headers });
  }
  const userId = userData.user.id;

  try {
    // STEP 1: Check DB cache
    console.info('[META-ASSETS-CACHED] Checking DB cache for user:', userId);
    
    const { data: integration, error: intError } = await supabase
      .from('integrations')
      .select('id, access_token, meta_assets, updated_at')
      .eq('user_id', userId)
      .eq('provider', 'meta_ads')
      .eq('status', 'active')
      .maybeSingle();

    if (intError) {
      console.error('[META-ASSETS-CACHED] Error fetching integration:', intError);
      return j({ error: 'Integration not found' }, { status: 404, headers });
    }

    if (!integration) {
      return j({ 
        error: 'No active Meta Ads integration found',
        facebookPages: [],
        instagramAccounts: [],
        adAccounts: [],
        cached: false
      }, { status: 200, headers });
    }

    const cachedAssets = integration.meta_assets as MetaAssets | null;
    
    // STEP 2: Validate cache TTL
    const now = Date.now();
    const isValidCache = cachedAssets?.expires_at && new Date(cachedAssets.expires_at).getTime() > now;

    if (isValidCache && cachedAssets) {
      const cacheAge = Math.floor((now - new Date(cachedAssets.cached_at).getTime()) / 1000);
      console.info('[META-ASSETS-CACHED] ✅ Using DB cache', { 
        userId, 
        cacheAge: `${cacheAge}s`,
        pages: cachedAssets.facebookPages?.length ?? 0,
        instagram: cachedAssets.instagramAccounts?.length ?? 0
      });

      return j({
        ...cachedAssets,
        cached: true,
        source: 'database',
        cacheAge,
        timestamp: Date.now()
      } as CachedResponse, { status: 200, headers });
    }

    // STEP 3: Cache expired or missing → Fetch from Meta API
    console.info('[META-ASSETS-CACHED] ⚠️ Cache expired or missing, fetching from Meta API');

    if (!integration.access_token) {
      return j({ error: 'No access token available' }, { status: 401, headers });
    }

    const accessToken = integration.access_token;

    async function get(path: string, params: Record<string, string>) {
      const url = new URL(`https://graph.facebook.com/${API_VERSION}/${path}`);
      for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
      const r = await fetch(url.toString(), { 
        headers: { authorization: `Bearer ${accessToken}` } 
      });
      const text = await r.text();
      let json: any;
      try { json = JSON.parse(text); } catch { json = { raw: text }; }
      return { ok: r.ok, status: r.status, json };
    }

    // Fetch Facebook Pages + Instagram
    const pagesRes = await get("me/accounts", { 
      fields: "id,name,picture,whatsapp_number,instagram_business_account{id,username,profile_picture_url}",
      limit: "100"
    });

    const facebookPages: any[] = [];
    const instagramAccounts: any[] = [];

    if (pagesRes.ok && pagesRes.json?.data) {
      for (const page of pagesRes.json.data) {
        facebookPages.push({
          id: page.id,
          name: page.name,
          pictureUrl: page.picture?.data?.url ?? null,
          whatsappNumber: page.whatsapp_number ?? null,
          whatsappVerifiedName: null
        });

        if (page.instagram_business_account) {
          instagramAccounts.push({
            id: page.instagram_business_account.id,
            name: page.instagram_business_account.username ?? page.name,
            pageId: page.id,
            profilePictureUrl: page.instagram_business_account.profile_picture_url ?? null
          });
        }
      }
    }

    // Fetch Ad Accounts
    const adAccountsRes = await get("me/adaccounts", {
      fields: "id,name,currency,account_status",
      limit: "100"
    });

    const adAccounts: any[] = [];
    if (adAccountsRes.ok && adAccountsRes.json?.data) {
      for (const acc of adAccountsRes.json.data) {
        adAccounts.push({
          id: acc.id,
          name: acc.name,
          currency: acc.currency ?? 'BRL',
          status: acc.account_status === 1 ? 'ACTIVE' : 'INACTIVE',
          permissions: []
        });
      }
    }

    // STEP 4: Update DB cache
    const nowIso = new Date().toISOString();
    const expiresAt = new Date(now + ASSETS_TTL).toISOString();

    const freshAssets: MetaAssets = {
      facebookPages,
      instagramAccounts,
      adAccounts,
      cached_at: nowIso,
      expires_at: expiresAt
    };

    const { error: updateError } = await supabase
      .from('integrations')
      .update({ meta_assets: freshAssets, updated_at: nowIso })
      .eq('id', integration.id);

    if (updateError) {
      console.error('[META-ASSETS-CACHED] Failed to update cache:', updateError);
    } else {
      console.info('[META-ASSETS-CACHED] ✅ Cache updated in DB', {
        pages: facebookPages.length,
        instagram: instagramAccounts.length,
        adAccounts: adAccounts.length
      });
    }

    return j({
      ...freshAssets,
      cached: false,
      source: 'meta-api',
      cacheAge: 0,
      timestamp: Date.now()
    } as CachedResponse, { status: 200, headers });

  } catch (error: any) {
    console.error('[META-ASSETS-CACHED] Unexpected error:', error);
    return j({ 
      error: error?.message ?? 'Unknown error',
      facebookPages: [],
      instagramAccounts: [],
      adAccounts: [],
      cached: false
    }, { status: 500, headers });
  }
});
