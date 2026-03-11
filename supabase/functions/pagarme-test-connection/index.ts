// =============================================
// Edge Function: Testar conexão com Pagar.me V5
// Valida secret_key fazendo sonda em múltiplos endpoints V5
// =============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const allowOrigin = (req: Request) => req.headers.get('Origin') || '*';
const baseCors = (origin: string) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Vary': 'Origin',
  'Content-Type': 'application/json',
});

const logStep = (step: string, details?: any) => {
  console.log(`[pagarme::test-connection] ${step}`, details ? JSON.stringify(details) : '');
};

// === JSON RESPONSE HELPERS ===
function jsonError(origin: string, originHeader: string, message: string, extra: any = {}, status = 400) {
  logStep(`❌ Error [${origin}]`, { message, status, ...extra });
  return new Response(JSON.stringify({
    success: false,
    error: { origin, message, ...extra }
  }), { 
    status, 
    headers: baseCors(originHeader)
  });
}

function jsonOk(data: any, originHeader: string) {
  logStep('✅ Success', data);
  return new Response(JSON.stringify({ success: true, data }), {
    status: 200, 
    headers: baseCors(originHeader)
  });
}

// === PAGAR.ME V5 CONSTANTS ===
const V5_BASE = 'https://api.pagar.me/core/v5';
// V5 test endpoints (correct as per official docs)
// https://docs.pagar.me/reference/introduction
const v5ProbePaths = [
  '/customers?limit=1',  // Most universal, works with any valid credential
  '/plans?limit=1',      // Fallback option
];

// === UTILITIES ===
function basicAuthFromSecret(secret: string): string {
  // NEVER log the secret key
  const token = btoa(`${secret}:`);
  return `Basic ${token}`;
}

// =============================================
// Helper: Create secure fingerprint of secret key
// =============================================
function maskFingerprint(sk: string): string {
  if (!sk || sk.length <= 14) return sk || 'n/a';
  return `${sk.slice(0, 12)}...${sk.slice(-4)}`; // ex: sk_test_add2...0887
}

// =============================================
// Type: Resolved secret key with source tracking
// =============================================
type ResolvedKey = { 
  key: string; 
  source: 'db' | 'env'; 
  fingerprint: string;
};

// =============================================
// Function: Resolve secret key with DB > ENV priority
// CRITICAL: Database config ALWAYS takes precedence over ENV
// =============================================
function resolveSecretKeyV5(params: {
  environment: 'test' | 'live',
  dbSecret?: string | null
}): ResolvedKey | null {
  const envTest = Deno.env.get('PAGARME_SECRET_KEY_TEST')?.trim() || '';
  const envLive = Deno.env.get('PAGARME_SECRET_KEY_LIVE')?.trim() || '';

  // 1) ABSOLUTE PRIORITY: Database config (if populated from RPC)
  if (params.dbSecret && params.dbSecret.trim()) {
    const key = params.dbSecret.trim();
    return { 
      key, 
      source: 'db', 
      fingerprint: maskFingerprint(key) 
    };
  }

  // 2) FALLBACK: ENV variable for corresponding environment
  if (params.environment === 'test' && envTest) {
    return { 
      key: envTest, 
      source: 'env', 
      fingerprint: maskFingerprint(envTest) 
    };
  }
  if (params.environment === 'live' && envLive) {
    return { 
      key: envLive, 
      source: 'env', 
      fingerprint: maskFingerprint(envLive) 
    };
  }

  // 3) No key available
  return null;
}

// === V5 PROBE FUNCTION ===
async function probePagarmeV5(secret: string, environment: 'test' | 'live'): Promise<any> {
  const auth = basicAuthFromSecret(secret);
  const probeResults: Array<{ path: string; status: number; error?: any }> = [];
  
  // Validate secret key prefix matches environment
  const expectedPrefix = environment === 'test' ? 'sk_test_' : 'sk_live_';
  const prefixMatches = secret.startsWith(expectedPrefix);
  
  if (!prefixMatches) {
    logStep('⚠️ Secret key prefix mismatch', {
      environment,
      expectedPrefix,
      actualPrefix: secret.substring(0, 8)
    });
  }

  for (const path of v5ProbePaths) {
    const url = `${V5_BASE}${path}`;
    logStep('🔍 Probing V5', { url, environment });

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': auth,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'Camply/pagarme-test-connection'
        }
      });

      // 2xx valida a conexão
      if (res.ok) {
        let data: any = null;
        try { 
          data = await res.json(); 
        } catch (jsonError) {
          // Se não conseguir parsear, ainda é sucesso (2xx)
          logStep('⚠️ V5 probe success but JSON parse failed', { path, status: res.status });
        }
        logStep('✅ V5 probe successful', { path, status: res.status });
        return { ok: true, path, status: res.status, data, prefixMatches };
      }

      // Erro — tentar extrair payload para diagnóstico
      let errJson: any = null;
      try { 
        errJson = await res.json(); 
      } catch {
        errJson = { raw_status: res.status, raw_text: await res.text().catch(() => '') };
      }
      
      // Store probe result for detailed error reporting
      probeResults.push({ path, status: res.status, error: errJson });
      logStep('❌ V5 probe failed', { path, status: res.status, err: errJson });

    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      probeResults.push({ path, status: 0, error: msg });
      logStep('💥 V5 probe exception', { path, error: msg });
    }
  }

  // All probes failed - return detailed error
  return { ok: false, probeResults, prefixMatches };
}

serve(async (req: Request): Promise<Response> => {
  const origin = allowOrigin(req);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: baseCors(origin) });
  }

  try {
    logStep('🚀 Starting connection test');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // === PARSE REQUEST BODY ===
    let envRaw = 'test';
    try {
      const body = await req.json();
      envRaw = (body?.environment ?? 'test').toString().toLowerCase();
      logStep('📨 Request body parsed', { envRaw });
    } catch (parseError) {
      logStep('⚠️ No body or invalid JSON, defaulting to test', { parseError: String(parseError) });
    }

    // Normalização de sinônimos
    const normalizeEnv = (v: string): 'test' | 'live' => {
      if (['sandbox', 'teste', 'test'].includes(v)) return 'test';
      if (['live', 'prod', 'production', 'produção'].includes(v)) return 'live';
      return 'test';
    };
    const environment = normalizeEnv(envRaw);
    logStep('🔄 Environment normalized', { envRaw, normalized: environment });

    // === AUTENTICAÇÃO DO USUÁRIO ===
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return jsonError(
        'app_auth',
        origin,
        'Missing Authorization header (Bearer token required)',
        { hint: 'Please log in again and ensure session is active' },
        401
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return jsonError(
        'app_auth',
        origin,
        'Invalid or expired user session',
        { hint: 'Please log in again', error: authError?.message },
        401
      );
    }

    logStep('✅ User authenticated', { userId: user.id });

    // Check if user is admin (tolerant to multiple roles)
    const { data: roles, error: rolesErr } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'super_admin'])
      .limit(1);

    if (rolesErr) {
      return jsonError(
        'app_auth',
        origin,
        'Failed to verify user roles',
        { error: rolesErr.message },
        500
      );
    }

    const isAdmin = Array.isArray(roles) && roles.length > 0;
    logStep('🔍 Role check', {
      userId: user.id,
      foundRolesCount: roles?.length ?? 0,
      firstRole: roles?.[0]?.role ?? null
    });

    if (!isAdmin) {
      return jsonError(
        'app_auth',
        origin,
        'Admin access required',
        { hint: 'Contact your administrator for access' },
        403
      );
    }

    logStep('✅ Admin access confirmed', { role: roles[0].role });

    // Get configuration from pagarme_config table for the requested environment
    const { data: config, error: configError } = await supabase
      .rpc('get_pagarme_config_for_functions', { p_environment: environment })
      .single();

    logStep('📋 Configuration loaded', { 
      configEnv: config?.environment, 
      requestEnv: environment,
      has_secret: !!config?.secret_key,
      has_public: !!config?.public_key,
      match: config?.environment === environment ? '✅' : '❌ MISMATCH'
    });

    if (configError || !config) {
      return jsonError(
        'config',
        origin,
        `Pagar.me configuration not found for ${environment} environment`,
        { 
          environment,
          hint: 'Configure Pagar.me settings in admin panel for this environment', 
          error: configError?.message 
        },
        400
      );
    }

    // ✅ Validar match de environment (blocking agora)
    if (config.environment !== environment) {
      logStep('❌ Environment mismatch detected', {
        configEnv: config.environment,
        requestEnv: environment
      });
      return jsonError(
        'config',
        origin,
        `Environment mismatch: Expected ${environment} config, got ${config.environment}`,
        { 
          requestedEnv: environment,
          configEnv: config.environment,
          hint: 'This usually means the database has incorrect configuration'
        },
        400
      );
    }

    // === RESOLVE SECRET KEY WITH STRICT DB > ENV PRIORITY ===
    const resolved = resolveSecretKeyV5({
      environment,
      dbSecret: config.secret_key
    });

    // Track ENV availability for diagnostics
    const hasEnvVar = environment === 'live' 
      ? !!Deno.env.get('PAGARME_SECRET_KEY_LIVE')
      : !!Deno.env.get('PAGARME_SECRET_KEY_TEST');
    
    const hasDbKey = !!(config.secret_key && config.secret_key.trim());

    console.info('[pagarme::test-connection] 🔑 Secret key resolved', {
      environment,
      source: resolved?.source || 'none',           // 'db' OR 'env'
      fingerprint: resolved?.fingerprint || 'n/a',  // ex: sk_test_add2...0887
      hasEnvVar,
      hasDbKey
    });

    if (!resolved || !resolved.key) {
      return jsonError(
        'config',
        origin,
        `Secret key not configured for ${environment} environment`,
        { 
          environment, 
          hasEnvVar, 
          hasDbKey, 
          hint: 'Configure the secret key in admin settings or Supabase secrets' 
        },
        400
      );
    }

    const secretKey = resolved.key;
    const secretSource = resolved.source;
    const fingerprint = resolved.fingerprint;
    const isTestKey = secretKey.startsWith('sk_test_');

    logStep('🔌 Testing Pagar.me V5 connection', { environment });

    // Probe Pagar.me V5 API
    const probe = await probePagarmeV5(secretKey, environment);

    if (!probe.ok) {
      // Extract the most relevant error status
      const firstError = probe.probeResults?.[0];
      const status = firstError?.status || 401;
      const error_type = status === 401 ? 'UNAUTHORIZED' : status === 403 ? 'FORBIDDEN' : 'CONNECTION_ERROR';
      
      // Build comprehensive hints
      const hints = [
        `Confirm your secret key matches the selected environment (${environment === 'test' ? 'sk_test_*' : 'sk_live_*'})`,
        `Current key fingerprint: ${fingerprint} (source: ${secretSource})`,
        `Authorization uses Basic Auth: base64('sk_xxx:') - note the colon at the end`,
      ];

      if (!probe.prefixMatches) {
        hints.unshift(`⚠️ KEY PREFIX MISMATCH: Expected ${environment === 'test' ? 'sk_test_*' : 'sk_live_*'} key for ${environment} environment`);
      }

      if (hasEnvVar && hasDbKey) {
        hints.push(`Note: Both ENV variable and database config exist. Using ${secretSource.toUpperCase()}.`);
      }
      
      logStep('❌ All V5 probes failed', {
        status,
        error_type,
        environment,
        fingerprint,
        source: secretSource,
        prefixMatches: probe.prefixMatches,
        probeResults: probe.probeResults
      });

      return jsonError(
        'pagarme',
        origin,
        'Pagar.me V5 connection test failed',
        {
          http_status: status,
          error_type,
          environment,
          key_fingerprint: fingerprint,
          key_source: secretSource,
          prefix_matches_environment: probe.prefixMatches,
          hints,
          probe_details: probe.probeResults
        },
        status
      );
    }

    logStep('✅ Connection test successful', { 
      environment, 
      path: probe.path,
      fingerprint,
      source: secretSource,
      prefixMatches: probe.prefixMatches
    });

    return jsonOk({
      provider: 'pagarme',
      version: 'v5',
      environment,
      key_fingerprint: fingerprint,
      key_source: secretSource,
      prefix_matches_environment: probe.prefixMatches,
      probe_path: probe.path,
      http_status: probe.status,
      tested_at: new Date().toISOString(),
      sample_response_keys: probe.data ? Object.keys(probe.data).slice(0, 5) : []
    }, origin);

  } catch (error: any) {
    const origin = allowOrigin(req);
    return jsonError(
      'internal',
      origin,
      error?.message || 'Unknown error',
      { stack: error?.stack },
      500
    );
  }
});
