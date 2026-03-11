// supabase/functions/meta-oauth-exchange/index.ts
// Troca de "code" por access_token (curto e, opcionalmente, longo), valida escopos
// e persiste/atualiza na tabela "integrations" (provider: 'meta_ads').
//
// Busca as configurações do Meta Ads diretamente do banco de dados
// através da função get_meta_ads_config()
//
// NÃO ALTERAR outras funções fora deste escopo.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

type OAuthExchangeBody = {
  code: string;
  redirectUri?: string;   // opcional; se não vier, usamos a URI padrão
  state?: string;         // opcional, log/eco para auditoria
};

type MetaAdsConfig = {
  app_id: string;
  app_secret: string;
  business_manager_id?: string;
};

function cors(req: Request) {
  const origin = req.headers.get("origin") ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function j(res: unknown, init: ResponseInit = {}) {
  const base = init.headers ?? {};
  return new Response(JSON.stringify(res), {
    ...init,
    headers: { "content-type": "application/json; charset=utf-8", ...base },
  });
}

async function fetchJson(url: string, body: URLSearchParams) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const text = await r.text();
  let json: any;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { ok: r.ok, status: r.status, json };
}

serve(async (req) => {
  const headers = cors(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers });
  }

  if (req.method !== "POST") {
    return j({ error: "Method not allowed" }, { status: 405, headers });
  }

  // Auth (verify_jwt=true recomendado nessas edges)
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!supabaseUrl || !supabaseKey) {
    console.error("[META-OAUTH-EXCHANGE] Missing required Supabase environment variables");
    return j({ error: "Missing Supabase configuration" }, { status: 500, headers });
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  const jwt = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!jwt) {
    return j({ error: "Missing Authorization bearer token" }, { status: 401, headers });
  }
  const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
  if (userErr || !userData?.user?.id) {
    return j({ error: "Invalid session" }, { status: 401, headers });
  }
  const userId = userData.user.id;

  let body: OAuthExchangeBody;
  try {
    body = await req.json();
  } catch {
    return j({ error: "Invalid JSON body" }, { status: 400, headers });
  }

  if (!body.code || typeof body.code !== "string") {
    return j({ error: "Missing 'code' param" }, { status: 400, headers });
  }

  // Buscar configurações Meta Ads do banco de dados
  console.info("[META-OAUTH-EXCHANGE] Fetching Meta Ads config from database");
  const { data: configData, error: configErr } = await supabase.rpc('get_meta_ads_config');
  
  if (configErr || !configData || configData.length === 0) {
    console.error("[META-OAUTH-EXCHANGE] Failed to fetch Meta Ads config", { configErr, configData });
    return j({ 
      error: "meta_ads_config_missing", 
      details: "Meta Ads configuration not found. Configure it in the admin panel first." 
    }, { status: 400, headers });
  }

  const metaConfig = configData[0];
  if (!metaConfig.app_id || !metaConfig.app_secret) {
    console.error("[META-OAUTH-EXCHANGE] Meta Ads config incomplete", { 
      hasAppId: !!metaConfig.app_id, 
      hasAppSecret: !!metaConfig.app_secret 
    });
    return j({ 
      error: "meta_ads_config_incomplete", 
      details: "Meta Ads App ID and App Secret are required. Configure them in the admin panel." 
    }, { status: 400, headers });
  }

  const APP_ID = metaConfig.app_id;
  const APP_SECRET = metaConfig.app_secret;
  const API_VERSION = Deno.env.get('META_API_VERSION') ?? 'v23.0';

  // Validate redirect URI against allowed URIs
  const validRedirectUris = [
    'https://iacamply.com/auth/meta-callback',
    'https://iacamply.com/auth/callback/meta',
    'https://iacamply.com/auth/logout/meta'
  ];
  
  const REDIRECT_URI = body.redirectUri || 'https://iacamply.com/auth/meta-callback';
  
  if (!validRedirectUris.includes(REDIRECT_URI)) {
    console.error('[meta-oauth-exchange][INVALID-REDIRECT-URI]', REDIRECT_URI);
    return j({ error: 'Invalid redirect URI' }, { status: 400, headers });
  }

  console.info("[META-OAUTH-EXCHANGE] Using Meta config", {
    appId: APP_ID,
    redirectUri: REDIRECT_URI,
    apiVersion: API_VERSION,
    hasAppSecret: !!APP_SECRET
  });

  // 1) Troca do authorization code -> short-lived access_token
  const tokenUrl = `https://graph.facebook.com/${API_VERSION}/oauth/access_token`;
  const tokenParams = new URLSearchParams({
    client_id: APP_ID,
    client_secret: APP_SECRET,
    redirect_uri: REDIRECT_URI,
    code: body.code,
  });

  const t0 = Date.now();
  const short = await fetchJson(tokenUrl, tokenParams);
  if (!short.ok) {
    console.error("[META-OAUTH-EXCHANGE] token exchange failed", {
      status: short.status,
      response: short.json,
      redirect_uri: REDIRECT_URI,
    });
    return j({
      error: "meta_token_exchange_failed",
      details: short.json,
    }, { status: 502, headers });
  }

  const shortToken = String(short.json.access_token ?? "");
  const tokenType  = String(short.json.token_type ?? "bearer");
  const expiresIn  = Number(short.json.expires_in ?? 0);

  // 2) (Opcional, mas recomendado) Trocar por long-lived token
  const llUrl = `https://graph.facebook.com/${API_VERSION}/oauth/access_token`;
  const llParams = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: APP_ID,
    client_secret: APP_SECRET,
    fb_exchange_token: shortToken,
  });

  const long = await fetchJson(llUrl, llParams);
  const accessToken = long.ok ? String(long.json.access_token ?? shortToken) : shortToken;
  const longExpires = long.ok ? Number(long.json.expires_in ?? 0) : expiresIn;

  // 3) Validate token and get permissions using v23.0
  async function get(path: string, params: Record<string, string>) {
    const url = new URL(`https://graph.facebook.com/${API_VERSION}/${path}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const r = await fetch(url.toString(), { headers: { authorization: `Bearer ${accessToken}` } });
    const text = await r.text();
    let json: any; try { json = JSON.parse(text); } catch { json = { raw: text }; }
    return { ok: r.ok, status: r.status, json };
  }

  const mePerms = await get("me/permissions", {});
  if (mePerms.ok && mePerms.json.data) {
    const grantedScopes = mePerms.json.data.filter((p: any) => p.status === 'granted').map((p: any) => p.permission);
    const requiredScopes = ['business_management', 'whatsapp_business_management'];
    const missingScopes = requiredScopes.filter(scope => !grantedScopes.includes(scope));
    
    console.log('[meta-oauth-exchange][SCOPES]', `granted=[${grantedScopes.join(',')}] missing=[${missingScopes.join(',')}]`);
    
    if (missingScopes.length > 0) {
      console.warn('[meta-oauth-exchange][MISSING-SCOPES]', missingScopes);
    }
  } else {
    console.error("[meta-oauth-exchange][PERMISSIONS-ERROR]", mePerms);
  }

  const meAccounts = await get("me/accounts", { fields: "id,name,access_token,perms" });
  if (!meAccounts.ok) {
    console.error("[meta-oauth-exchange][ACCOUNTS-ERROR]", meAccounts);
  }

  // 3.4) Buscar Facebook Pages e Instagram Accounts para cache
  let facebookPages: any[] = [];
  let instagramAccounts: any[] = [];
  let adAccounts: any[] = [];

  try {
    console.info('[META-OAUTH-EXCHANGE][ASSETS] Fetching Facebook Pages...');
    const pagesRes = await get("me/accounts", { 
      fields: "id,name,picture,whatsapp_number,instagram_business_account{id,username,profile_picture_url}",
      limit: "100"
    });

    if (pagesRes.ok && pagesRes.json?.data) {
      const pages = pagesRes.json.data;
      for (const page of pages) {
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
      console.info('[META-OAUTH-EXCHANGE][ASSETS]', `Found ${facebookPages.length} pages, ${instagramAccounts.length} Instagram accounts`);
    }

    // Buscar Ad Accounts
    console.info('[META-OAUTH-EXCHANGE][ASSETS] Fetching Ad Accounts...');
    const adAccountsRes = await get("me/adaccounts", {
      fields: "id,name,currency,account_status,amount_spent,balance",
      limit: "100"
    });

    if (adAccountsRes.ok && adAccountsRes.json?.data) {
      adAccounts = adAccountsRes.json.data.map((acc: any) => ({
        id: acc.id,
        name: acc.name,
        currency: acc.currency ?? 'BRL',
        status: acc.account_status === 1 ? 'ACTIVE' : 'INACTIVE',
        permissions: []
      }));
      console.info('[META-OAUTH-EXCHANGE][ASSETS]', `Found ${adAccounts.length} ad accounts`);
    }
  } catch (assetsErr: any) {
    console.warn('[META-OAUTH-EXCHANGE][ASSETS]', 'Failed to fetch assets for cache', {
      error: assetsErr?.message ?? String(assetsErr)
    });
  }

  // 3.5) Buscar WhatsApp Business Assets (não-bloqueante)
  let whatsappAssets: any[] = [];
  try {
    console.info('[META-OAUTH-EXCHANGE][WHATSAPP-ASSETS] Fetching businesses...');
    const bizRes = await get("me/businesses", { fields: "id,name", limit: "50" });
    
    if (!bizRes.ok) {
      throw new Error(`Failed to fetch businesses: ${JSON.stringify(bizRes.json)}`);
    }

    const businesses = bizRes.json?.data ?? [];
    console.info('[META-OAUTH-EXCHANGE][WHATSAPP-ASSETS]', `Found ${businesses.length} businesses`);

    for (const biz of businesses) {
      // Buscar WABAs do business
      const wabaRes = await get(`${biz.id}/owned_whatsapp_business_accounts`, { 
        fields: "id,name", 
        limit: "50" 
      });

      if (!wabaRes.ok) {
        console.warn('[META-OAUTH-EXCHANGE][WABA]', `Failed to fetch WABAs for business ${biz.id}`, wabaRes.json);
        continue;
      }

      const wabas = wabaRes.json?.data ?? [];
      console.info('[META-OAUTH-EXCHANGE][WABA]', `Business ${biz.id} has ${wabas.length} WABAs`);

      for (const waba of wabas) {
        // Buscar telefones do WABA
        let phones: any[] = [];
        try {
          const phoneRes = await get(`${waba.id}/phone_numbers`, { 
            fields: "id,display_phone_number,verified_name", 
            limit: "200" 
          });

          if (phoneRes.ok) {
            phones = (phoneRes.json?.data ?? []).map((pn: any) => ({
              id: pn.id,
              display_phone_number: pn.display_phone_number,
              verified_name: pn.verified_name
            }));
            console.info('[META-OAUTH-EXCHANGE][WABA-NUMBERS]', `WABA ${waba.id} has ${phones.length} phone numbers`);
          } else {
            console.warn('[META-OAUTH-EXCHANGE][WABA-NUMBERS]', `Failed to fetch phone numbers for WABA ${waba.id}`, phoneRes.json);
          }
        } catch (phoneErr) {
          console.warn('[META-OAUTH-EXCHANGE][WABA-NUMBERS]', `Error fetching phones for WABA ${waba.id}:`, phoneErr);
        }

        whatsappAssets.push({
          business_id: biz.id,
          business_name: biz.name,
          waba_id: waba.id,
          waba_name: waba.name,
          phone_numbers: phones
        });
      }
    }

    console.info('[META-OAUTH-EXCHANGE][WHATSAPP-ASSETS]', `Assets collected successfully`, { count: whatsappAssets.length });
  } catch (waError: any) {
    // Não bloquear a integração por falta de WABAs ou permissões
    console.warn('[META-OAUTH-EXCHANGE][WHATSAPP-ASSETS]', 'Skipping WhatsApp assets fetch', { 
      error: waError?.message ?? String(waError),
      details: waError?.json ?? null
    });
    whatsappAssets = [];
  }

  // 4) Persistir/atualizar integração + cache de ativos
  const provider = "meta_ads";
  const nowIso = new Date().toISOString();
  const expiresAt = longExpires > 0 ? new Date(Date.now() + longExpires * 1000).toISOString() : null;

  // Montar estrutura de cache (TTL 24h)
  const cacheExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const metaAssetsCache = {
    facebookPages,
    instagramAccounts,
    adAccounts,
    cached_at: nowIso,
    expires_at: cacheExpiresAt
  };

  const upsertPayload: any = {
    user_id: userId,
    provider,
    status: "active",
    access_token: accessToken,
    token_expires_at: expiresAt,
    updated_at: nowIso,
    app_id: APP_ID,
    meta_assets: metaAssetsCache
  };

  const { data: existing, error: selErr } = await supabase
    .from("integrations")
    .select("id")
    .eq("user_id", userId)
    .eq("provider", provider)
    .maybeSingle();

  let upsertErr;
  if (existing?.id) {
    const { error } = await supabase
      .from("integrations")
      .update(upsertPayload)
      .eq("id", existing.id);
    upsertErr = error ?? null;
  } else {
    const { error } = await supabase
      .from("integrations")
      .insert([{ ...upsertPayload, created_at: nowIso }]);
    upsertErr = error ?? null;
  }

  if (upsertErr) {
    console.error("[META-OAUTH-EXCHANGE] upsert integration failed", upsertErr);
    return j({ error: "integration_persist_failed" }, { status: 500, headers });
  }

  // FASE 4: SYNC AUTOMÁTICO - Buscar e cachear campanhas no DB
  console.log('📦 [META-OAUTH-EXCHANGE] Fetching campaigns from Meta for initial cache...');
  let campaignsCached = 0;
  try {
    // ✅ CORRIGIDO: Usar o ad_account_id que foi selecionado pelo usuário
    const selectedAdAccountId = upsertPayload.ad_account_id;
    
    if (selectedAdAccountId) {
      const accountPath = selectedAdAccountId.startsWith('act_') ? selectedAdAccountId : `act_${selectedAdAccountId}`;
      const campaignsUrl = `https://graph.facebook.com/${API_VERSION}/${accountPath}/campaigns?fields=id,name,objective,status,effective_status,created_time&limit=50&access_token=${accessToken}`;
      
      console.log(`[META-OAUTH-EXCHANGE] Fetching campaigns from ad_account: ${selectedAdAccountId}`);
      const campaignsRes = await fetch(campaignsUrl);
      
      if (campaignsRes.ok) {
        const campaignsData = await campaignsRes.json();
        const campaigns = campaignsData.data || [];
        console.log(`[META-OAUTH-EXCHANGE] Found ${campaigns.length} campaigns`);

        // Salvar campanhas no DB com cache
        for (const campaign of campaigns) {
          const { error: upsertError } = await supabase
            .from('campaigns')
            .upsert({
              user_id: userId,
              ad_account_id: selectedAdAccountId, // ✅ CRÍTICO: incluir ad_account_id
              meta_campaign_id: campaign.id,
              name: campaign.name,
              status: campaign.effective_status?.toLowerCase() || 'paused',
              objective: campaign.objective || 'OUTCOME_TRAFFIC',
              meta_data: {
                id: campaign.id,
                name: campaign.name,
                objective: campaign.objective,
                status: campaign.effective_status,
                created_time: campaign.created_time
              },
              meta_data_cached_at: new Date().toISOString()
            }, {
              onConflict: 'meta_campaign_id',
              ignoreDuplicates: false
            });
          
          if (!upsertError) campaignsCached++;
        }

        console.log(`✅ [META-OAUTH-EXCHANGE] ${campaignsCached} campanhas cacheadas após OAuth para ad_account ${selectedAdAccountId}`);
      } else {
        const errorText = await campaignsRes.text();
        console.warn('⚠️ [META-OAUTH-EXCHANGE] Failed to fetch campaigns:', errorText);
      }
    } else {
      console.warn('⚠️ [META-OAUTH-EXCHANGE] No ad_account_id selected for campaign caching');
    }
  } catch (cacheError) {
    console.warn('⚠️ [META-OAUTH-EXCHANGE] Campaign caching failed:', cacheError);
    // Non-blocking: continuar mesmo se falhar
  }

  console.info("[META-OAUTH-EXCHANGE] success", {
    userId,
    ms: Date.now() - t0,
    tokenType,
    expiresIn: longExpires || expiresIn,
    scopesChecked: mePerms.ok,
    pagesChecked: meAccounts.ok,
    whatsappAssetsCount: whatsappAssets.length,
    campaignsCached
  });

  return j({
    ok: true,
    tokenType,
    expiresIn: longExpires || expiresIn,
    // Para o front fechar o popup com confiança:
    state: body.state ?? null,
    // ✅ Sempre incluir whatsappAssets (pode ser array vazio)
    whatsappAssets,
  }, { status: 200, headers });
});