// Deep E2E tests for the simple-campaign-create edge function.
// The real handler is exercised end-to-end; only the external boundaries are mocked:
//   • Meta Graph API  -> global `fetch` is replaced with a router that returns canned responses
//   • Supabase        -> a mock client is injected via __setSupabaseFactoryForTests
// Run: deno test -A supabase/functions/_tests/simple-campaign-create.e2e.test.ts
import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
// Disable the production `serve()` call BEFORE importing the module (dynamic import so the env var
// is set first), then drive `handleRequest` directly.
Deno.env.set('SCC_DISABLE_SERVE', '1');
const { handleRequest, __setSupabaseFactoryForTests } = await import('../simple-campaign-create/index.ts');

// ---- Make smartDelay / setTimeout-based waits instant (microtask, no leaked timers) ----------
// Installed per test (see `scc()` below) and ALWAYS restored afterwards, together with `fetch`,
// so other test files in the same `deno test` run see the real globals.
const realSetTimeout = globalThis.setTimeout;
const realFetch = globalThis.fetch;
const fastSetTimeout = ((fn: (...a: unknown[]) => void) => {
  Promise.resolve().then(() => fn());
  return 0 as unknown as number;
}) as unknown as typeof globalThis.setTimeout;

// ---------------------------------------------------------------------------------------------
// Mock Supabase client
// ---------------------------------------------------------------------------------------------
interface MockConfig {
  user: Record<string, unknown>;
  integration: Record<string, unknown>;
  metaConfig: Record<string, unknown>;
  campaignsInsertError: unknown | null;
  contingencyInserts: Array<Record<string, unknown>>;
  campaignInserts?: Array<Record<string, unknown>>;
  // campaign_create_requests (idempotência), chave → linha
  requests?: Map<string, { status: string; response: unknown; updated_at: string }>;
  // profiles row of the caller (audit ADM-02: status 'suspended' blocks creation)
  profile?: Record<string, unknown> | null;
  // Bearer token → user. getUser() FAILS (data.user = null + error) for any other token,
  // exactly like supabase-js does for an expired/forged JWT.
  tokens?: Record<string, Record<string, unknown>>;
  // Extra integration rows (e.g. another user's). `.eq()` filters are applied to all rows.
  otherIntegrations?: Array<Record<string, unknown>>;
}

function makeSupabase(cfg: MockConfig) {
  cfg.requests ??= new Map();
  cfg.campaignInserts ??= [];
  // A chainable query-builder whose terminal ops resolve based on table + operation.
  // A chainable query-builder whose terminal ops resolve based on table + operation.
  // `.eq()` filters are APPLIED: a row is returned only if every eq'd column matches.
  function builder(table: string) {
    const state: { table: string; op: 'select' | 'insert' | 'update'; payload?: any; eqs: Record<string, unknown> } =
      { table, op: 'select', eqs: {} };
    const matches = (row: Record<string, unknown> | null | undefined) =>
      !!row && Object.entries(state.eqs).every(([k, v]) => String(row[k]) === String(v));
    const first = (rows: Array<Record<string, unknown> | null | undefined>) => rows.find(matches) ?? null;
    const resolve = async () => {
      if (table === 'campaign_create_requests') {
        const key = String(state.eqs.idempotency_key ?? state.payload?.idempotency_key);
        const owner = String(state.eqs.user_id ?? state.payload?.user_id ?? '');
        if (owner && owner !== String(cfg.user.id)) return { data: null, error: null }; // another user's key
        if (state.op === 'insert') {
          if (cfg.requests!.has(key)) return { data: null, error: { code: '23505', message: 'duplicate' } };
          cfg.requests!.set(key, { status: 'in_progress', response: null, updated_at: new Date().toISOString() });
          return { data: null, error: null };
        }
        if (state.op === 'update') {
          cfg.requests!.set(key, { ...cfg.requests!.get(key)!, ...state.payload });
          return { data: null, error: null };
        }
        return { data: cfg.requests!.get(key) ?? null, error: null };
      }
      if (state.op === 'insert' && table === 'campaigns') {
        cfg.campaignInserts!.push(state.payload);
        return { data: null, error: cfg.campaignsInsertError };
      }
      if (state.op === 'insert' && table === 'campaign_contingency') {
        cfg.contingencyInserts.push(state.payload);
        return { data: { id: 'cont_1' }, error: null };
      }
      if (table === 'profiles') {
        const row = cfg.profile === undefined ? { status: 'active' } : cfg.profile;
        return { data: first([row ? { id: cfg.user.id, ...row } : null]), error: null };
      }
      if (table === 'integrations') {
        return { data: first([cfg.integration, ...(cfg.otherIntegrations ?? [])]), error: null };
      }
      if (table === 'business_settings') return { data: null, error: null };
      return { data: null, error: null };
    };
    const api: any = {
      select() { return api; },
      eq(col: string, val: unknown) { state.eqs[col] = val; return api; },
      insert(payload: any) { state.op = 'insert'; state.payload = payload; return api; },
      update(payload: any) { state.op = 'update'; state.payload = payload; return api; },
      single() { return resolve(); },
      maybeSingle() { return resolve(); },
      // make the builder itself awaitable (e.g. `await from('campaigns').insert(...)`)
      then(onF: any, onR: any) { return resolve().then(onF, onR); },
    };
    return api;
  }

  const tokens = cfg.tokens ?? { testtoken: cfg.user, t: cfg.user };
  return {
    rpc(_name: string) {
      return { single: async () => ({ data: cfg.metaConfig, error: null }) };
    },
    auth: {
      getUser: async (token: string) => {
        const user = tokens[token];
        return user
          ? { data: { user }, error: null }
          : { data: { user: null }, error: { name: 'AuthApiError', status: 401, message: 'invalid JWT: token is expired' } };
      },
    },
    functions: {
      invoke: async (_name: string, _opts: unknown) => ({ data: null, error: null }),
    },
    from(table: string) { return builder(table); },
  };
}

// ---------------------------------------------------------------------------------------------
// Mock Meta Graph fetch
// ---------------------------------------------------------------------------------------------
interface FetchCall { url: string; method: string; headers: Record<string, string>; body?: string; }

function jsonResp(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });
}

function installFetch(opts: { failAds?: boolean; failAdsTransient?: boolean; adsetFailFirst?: boolean; myPages?: string[] } = {}) {
  const calls: FetchCall[] = [];
  let adsetAttempts = 0;
  const mock = async (input: Request | URL | string, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
    const method = (init?.method || (input instanceof Request ? input.method : 'GET') || 'GET').toUpperCase();
    const headers: Record<string, string> = {};
    if (init?.headers) {
      const h = new Headers(init.headers as HeadersInit);
      h.forEach((v, k) => (headers[k.toLowerCase()] = v));
    }
    const body = typeof init?.body === 'string' ? init.body : undefined;
    calls.push({ url, method, headers, body });

    let path = url;
    try { path = new URL(url).pathname; } catch { /* keep */ }

    if (method === 'DELETE') return jsonResp({ success: true });
    if (path.endsWith('/me/accounts')) return jsonResp({ data: (opts.myPages ?? []).map((id) => ({ id })) });
    if (path.includes('/thumbnails')) return jsonResp({ data: [{ uri: 'https://cdn.test/vthumb.jpg' }] });
    // Instagram media-info check (existing-post flow)
    if (url.includes('fields=media_type')) {
      return jsonResp({ media_type: 'VIDEO', media_url: 'https://cdn.test/video.mp4', thumbnail_url: 'https://cdn.test/thumb.jpg' });
    }
    if (url.startsWith('https://cdn.test/')) return new Response(new Uint8Array([1, 2, 3]), { status: 200 });
    if (path.endsWith('/adimages')) return jsonResp({ images: { img: { hash: 'imgHash1', url: 'https://img' } } });
    if (path.endsWith('/advideos')) return jsonResp({ id: 'vid_1' });
    if (path.endsWith('/campaigns')) return jsonResp({ id: 'cmp_1' });
    if (path.endsWith('/adsets')) {
      adsetAttempts++;
      // Simulate Meta rejecting the pinned WhatsApp number on the first attempt.
      if (opts.adsetFailFirst && adsetAttempts === 1) {
        return jsonResp({ error: { message: 'Invalid parameter', code: 100, error_subcode: 9999,
          error_user_msg: 'The WhatsApp phone number is not valid for this page' } }, 400);
      }
      return jsonResp({ id: 'as_1' });
    }
    if (path.endsWith('/adcreatives')) return jsonResp({ id: 'cr_1' });
    if (path.endsWith('/ads')) {
      if (opts.failAdsTransient) return jsonResp({ error: { message: 'An unexpected error has occurred', code: 2, is_transient: true } }, 500);
      return opts.failAds ? jsonResp({ error: { message: 'boom', code: 100 } }, 400) : jsonResp({ id: 'ad_1' });
    }
    return jsonResp({});
  };
  (globalThis as any).fetch = mock;
  return calls;
}

// ---------------------------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------------------------
function baseConfig(over: Partial<MockConfig> = {}): MockConfig {
  return {
    user: { id: 'u1', email: 't@t.com' },
    integration: {
      id: 'int1', user_id: 'u1', provider: 'meta_ads', status: 'active',
      access_token: 'tok', ad_account_id: '123', page_id: 'page1',
      selected_whatsapp_phone_id: 'wpid', selected_whatsapp_display: '+55 11 99999-9999',
      selected_instagram_ids: [], updated_at: '2026-06-01T00:00:00Z',
    },
    metaConfig: { app_id: 'app', app_secret: 'sec' },
    campaignsInsertError: null,
    contingencyInserts: [],
    ...over,
  };
}

function makeRequest(extra: Record<string, unknown> = {}): Request {
  const payload = {
    campaignName: 'C', adTitle: 'T', adText: 'X', fanpage: 'page1', instagram: '',
    whatsappLink: 'https://wa.me/5511999999999', dailyBudget: 30,
    startDate: '2026-07-01T00:00:00-0300', city: 'São Paulo', radius: 10,
    selected_locations: [{ name: 'São Paulo', type: 'city', latitude: -23.55, longitude: -46.63, radius: 10 }],
    campaignType: 'whatsapp', status: 'PAUSED', optimization: 'CONVERSATIONS', billingEvent: 'IMPRESSIONS',
    platforms: ['facebook', 'instagram'], placements: [], devices: ['mobile'],
    gender: 'all', ageMin: 25, ageMax: 45, specialCategories: [],
    selectedMediaMeta: { file_type: 'image', public_url: 'https://cdn.test/img.jpg', filename: 'img.jpg' },
    creativeType: 'upload', useExistingInstagramPost: false, selectedInstagramPostId: null,
    ...extra,
  };
  return new Request('https://edge.test/simple-campaign-create', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer testtoken', 'Origin': 'https://iacamply.com', 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

const testOpts = { sanitizeOps: false, sanitizeResources: false } as const;

// Deno.test wrapper: fast timers during the test, real setTimeout/fetch restored afterwards.
function scc(name: string, fn: () => Promise<void>) {
  Deno.test({
    ...testOpts,
    name,
    async fn() {
      globalThis.setTimeout = fastSetTimeout;
      try {
        await fn();
      } finally {
        globalThis.setTimeout = realSetTimeout;
        globalThis.fetch = realFetch;
      }
    },
  });
}

// ---------------------------------------------------------------------------------------------
// Scenario 1 — Happy path: image upload CTWA succeeds end to end
// ---------------------------------------------------------------------------------------------
scc('S1 happy path → status:created, no rollback, token hygiene + CORS', async () => {
  const cfg = baseConfig();
  __setSupabaseFactoryForTests(() => makeSupabase(cfg));
  const calls = installFetch({});

  const res = await handleRequest(makeRequest());
  const body = await res.json();

  assertEquals(res.status, 200);
  assertEquals(body.success, true);
  assertEquals(body.status, 'created');
  assertEquals(body.contingency_mode, false);
  assertEquals(body.campaignId, 'cmp_1');
  assertEquals(body.adSetId, 'as_1');
  assertEquals(body.adId, 'ad_1');
  assertEquals(body.creativeId, 'cr_1');

  // CORS echoes the allowed origin (no wildcard)
  assertEquals(res.headers.get('Access-Control-Allow-Origin'), 'https://iacamply.com');

  // No rollback DELETE happened on success
  assert(!calls.some((c) => c.method === 'DELETE'), 'unexpected rollback DELETE on happy path');

  // Token hygiene: no Meta URL carries the access token in the query string
  assert(!calls.some((c) => c.url.includes('access_token=')), 'access_token leaked into a URL');

  // The image upload used an Authorization: Bearer header (not a query token)
  const upload = calls.find((c) => c.url.includes('/adimages'));
  assert(upload, 'expected an /adimages upload call');
  assertEquals(upload!.headers['authorization'], 'Bearer tok');

  // No contingency was recorded
  assertEquals(cfg.contingencyInserts.length, 0);

  // Regression (Meta v23 subcode 4834011): the campaign payload MUST declare
  // is_adset_budget_sharing_enabled because the budget lives on the ad set (no CBO).
  const campaignCall = calls.find((c) => c.method === 'POST' && c.url.includes('/campaigns'));
  assert(campaignCall, 'expected a /campaigns POST');
  const campaignBody = JSON.parse(campaignCall!.body || '{}');
  assertEquals(campaignBody.is_adset_budget_sharing_enabled, false);

  // Regression (Meta v23 subcode 2490562): the ad set must NOT request the discontinued
  // Facebook "video_feeds" placement.
  const adsetCall = calls.find((c) => c.method === 'POST' && c.url.includes('/adsets'));
  assert(adsetCall, 'expected an /adsets POST');
  const fbPositions = JSON.parse(adsetCall!.body || '{}')?.targeting?.facebook_positions ?? [];
  assert(!fbPositions.includes('video_feeds'), `facebook_positions must not contain video_feeds: ${JSON.stringify(fbPositions)}`);
});

// ---------------------------------------------------------------------------------------------
// Scenario 2 — Ad creation fails → rollback deletes the campaign, contingency flagged rolled_back
// ---------------------------------------------------------------------------------------------
scc('S2 deterministic ad failure (Meta 4xx) → rollback DELETE + 422 failed, no contingency', async () => {
  const cfg = baseConfig();
  __setSupabaseFactoryForTests(() => makeSupabase(cfg));
  const calls = installFetch({ failAds: true });

  const res = await handleRequest(makeRequest());
  const body = await res.json();

  assertEquals(res.status, 422);
  assertEquals(body.success, false);
  assertEquals(body.status, 'failed');
  assertEquals(body.code, 'META_INVALID_PARAM');
  assert(typeof body.userMessage === 'string' && body.userMessage.length > 0);

  // The partial campaign was deleted on Meta (rollback)
  const del = calls.find((c) => c.method === 'DELETE');
  assert(del, 'expected a rollback DELETE');
  assert(del!.url.includes('/cmp_1'), 'rollback should target the created campaign id');

  // O usuário corrige e tenta de novo: nada vai para a fila do time
  assertEquals(cfg.contingencyInserts.length, 0);
});

scc('S2b transient ad failure (Meta 5xx) → rollback + 202 queued + contingency(rolled_back)', async () => {
  const cfg = baseConfig();
  __setSupabaseFactoryForTests(() => makeSupabase(cfg));
  const calls = installFetch({ failAdsTransient: true });

  const res = await handleRequest(makeRequest());
  const body = await res.json();

  assertEquals(res.status, 202);
  assertEquals(body.success, false); // NUNCA sucesso
  assertEquals(body.status, 'queued');
  assertEquals(body.code, 'META_TRANSIENT');
  assertEquals(body.contingencyId, 'cont_1');
  assert(calls.some((c) => c.method === 'DELETE'), 'expected a rollback DELETE');

  assertEquals(cfg.contingencyInserts.length, 1);
  const cont = cfg.contingencyInserts[0] as any;
  assertEquals(cont.campaign_data.rolled_back, true);
  assertEquals(cont.partial_meta_campaign_id, null);
  assertEquals(cont.error_stage, 'campaign_creation_error');
});

// ---------------------------------------------------------------------------------------------
// Scenario 3 — Meta succeeds but DB insert fails → reconcile, NO rollback, real ids kept
// ---------------------------------------------------------------------------------------------
scc('S3 db-save failure → created on Meta + reconcilePending, contingency(needs_db_reconcile), no rollback', async () => {
  const cfg = baseConfig({ campaignsInsertError: { message: 'db down', code: '500' } });
  __setSupabaseFactoryForTests(() => makeSupabase(cfg));
  const calls = installFetch({});

  const res = await handleRequest(makeRequest());
  const body = await res.json();

  assertEquals(res.status, 200);
  assertEquals(body.success, true); // a campanha existe de verdade na Meta
  assertEquals(body.status, 'created');
  assertEquals(body.reconcilePending, true);
  assertEquals(body.campaignId, 'cmp_1'); // Meta objects kept — real id returned

  // No rollback — the valid Meta objects must be preserved for reconciliation
  assert(!calls.some((c) => c.method === 'DELETE'), 'must NOT roll back valid Meta objects on DB failure');

  // Contingency row flagged for DB reconciliation, carrying the real Meta ids
  assertEquals(cfg.contingencyInserts.length, 1);
  const cont = cfg.contingencyInserts[0] as any;
  assertEquals(cont.campaign_data.needs_db_reconcile, true);
  assertEquals(cont.partial_meta_campaign_id, 'cmp_1');
  assertEquals(cont.partial_meta_ad_id, 'ad_1');
  assertEquals(cont.error_stage, 'db_save_error');
});

// ---------------------------------------------------------------------------------------------
// Scenario 4 — CORS preflight
// ---------------------------------------------------------------------------------------------
scc('S4 OPTIONS preflight → 204 with origin-scoped CORS', async () => {
  __setSupabaseFactoryForTests(() => makeSupabase(baseConfig()));
  installFetch({});
  const req = new Request('https://edge.test/simple-campaign-create', {
    method: 'OPTIONS',
    headers: { 'Origin': 'https://iacamply.com', 'Access-Control-Request-Method': 'POST' },
  });
  const res = await handleRequest(req);
  await res.body?.cancel();
  assertEquals(res.status, 204);
  assertEquals(res.headers.get('Access-Control-Allow-Origin'), 'https://iacamply.com');
});

// ---------------------------------------------------------------------------------------------
// Scenario 5 — Auth guard (audit CMP-01): no user = 401 UNAUTHENTICATED, never a contingency/200
// ---------------------------------------------------------------------------------------------
scc('S5 missing Authorization → 401, no Meta calls, no contingency', async () => {
  const cfg = baseConfig();
  __setSupabaseFactoryForTests(() => makeSupabase(cfg));
  const calls = installFetch({});
  const req = new Request('https://edge.test/simple-campaign-create', {
    method: 'POST',
    headers: { 'Origin': 'https://iacamply.com', 'Content-Type': 'application/json' },
    body: JSON.stringify({ campaignName: 'C' }),
  });
  const res = await handleRequest(req);
  const body = await res.json();
  assertEquals(res.status, 401);
  assertEquals(body.code, 'UNAUTHENTICATED');
  assertEquals(calls.length, 0);
  assertEquals(cfg.contingencyInserts.length, 0);
});

// ---------------------------------------------------------------------------------------------
// Scenario 6 — existing-post VIDEO CTWA dark post (the case from the 26-06 log).
// Regression for Meta error 105/1815630: the WhatsApp CTA must be the BARE
// { type: 'WHATSAPP_MESSAGE' } (no value.link), and the thumbnail must be kept.
// ---------------------------------------------------------------------------------------------
scc('S6 existing-post VIDEO → bare WHATSAPP_MESSAGE CTA (no value.link) + thumbnail', async () => {
  const cfg = baseConfig();
  (cfg.integration as any).selected_instagram_ids = ['ig_1'];
  __setSupabaseFactoryForTests(() => makeSupabase(cfg));
  const calls = installFetch({});

  const payload = {
    campaignName: 'C', adTitle: 'T', adText: 'Olá', fanpage: 'page1', instagram: '',
    whatsappLink: '', dailyBudget: 30, startDate: '2026-07-01T00:00:00-0300',
    city: 'São Paulo', radius: 10, campaignType: 'whatsapp', status: 'PAUSED',
    selected_locations: [{ name: 'SP', type: 'region', key: '460' }],
    optimization: 'CONVERSATIONS', billingEvent: 'IMPRESSIONS',
    platforms: ['facebook', 'instagram'], placements: [], devices: ['mobile'],
    gender: 'all', ageMin: 25, ageMax: 45, specialCategories: [],
    creativeType: 'post', selectedInstagramPostId: 'media123', useExistingInstagramPost: true,
  };
  const req = new Request('https://edge.test/simple-campaign-create', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer t', 'Origin': 'https://iacamply.com', 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const res = await handleRequest(req);
  const body = await res.json();
  assertEquals(body.status, 'created');

  const creativeCall = calls.find((c) => c.method === 'POST' && c.url.includes('/adcreatives'));
  assert(creativeCall, 'expected an /adcreatives POST (dark post)');
  const spec = JSON.parse(creativeCall!.body || '{}').object_story_spec;
  assert(spec?.video_data, 'expected a video_data dark post');
  // The exact field that caused Meta 105/1815630 must be gone: CTA is bare, no value.link.
  assertEquals(spec.video_data.call_to_action, { type: 'WHATSAPP_MESSAGE' });
  assert(!('value' in spec.video_data.call_to_action), 'CTA must not carry a value/link');
  // Thumbnail must be present (otherwise Meta 1443226).
  assertEquals(spec.video_data.image_url, 'https://cdn.test/thumb.jpg');
});

// ---------------------------------------------------------------------------------------------
// Scenario 7 — per-campaign WhatsApp number pins promoted_object.whatsapp_phone_number_id.
// ---------------------------------------------------------------------------------------------
scc('S7 whatsapp_meta selected → ad set promoted_object pins whatsapp_phone_number_id', async () => {
  const cfg = baseConfig();
  __setSupabaseFactoryForTests(() => makeSupabase(cfg));
  const calls = installFetch({});

  const res = await handleRequest(makeRequest({
    whatsapp_meta: { business_id: 'b1', waba_id: 'w1', phone_number_id: 'PHONE123', display_phone_number: '+55 11 90000-0000' },
  }));
  const body = await res.json();
  assertEquals(body.status, 'created');

  const adset = calls.find((c) => c.method === 'POST' && c.url.includes('/adsets'));
  assert(adset, 'expected an /adsets POST');
  const promoted = JSON.parse(adset!.body || '{}').promoted_object;
  assertEquals(promoted.page_id, 'page1');
  assertEquals(promoted.whatsapp_phone_number_id, 'PHONE123');
});

// ---------------------------------------------------------------------------------------------
// Scenario 8 — self-heal: if Meta rejects the pinned WhatsApp number, retry WITHOUT it (page default).
// ---------------------------------------------------------------------------------------------
scc('S8 pinned WhatsApp rejected → strips it, retries page-only, succeeds', async () => {
  const cfg = baseConfig();
  __setSupabaseFactoryForTests(() => makeSupabase(cfg));
  const calls = installFetch({ adsetFailFirst: true });

  const res = await handleRequest(makeRequest({
    whatsapp_meta: { business_id: 'b1', waba_id: 'w1', phone_number_id: 'PHONE123', display_phone_number: '+55 11 90000-0000' },
  }));
  const body = await res.json();
  assertEquals(body.status, 'created'); // recovered — not contingency

  const adsetCalls = calls.filter((c) => c.method === 'POST' && c.url.includes('/adsets'));
  assertEquals(adsetCalls.length, 2); // first (with number) failed, retry (page-only) succeeded
  const first = JSON.parse(adsetCalls[0].body || '{}').promoted_object;
  const retry = JSON.parse(adsetCalls[1].body || '{}').promoted_object;
  assertEquals(first.whatsapp_phone_number_id, 'PHONE123');
  assert(!('whatsapp_phone_number_id' in retry), 'retry must drop the rejected number and use page default');
  assertEquals(retry.page_id, 'page1');
});

// ---------------------------------------------------------------------------------------------
// audit CMP-01/03/05/06/08 — validações antes de tocar na Meta + idempotência
// ---------------------------------------------------------------------------------------------
scc('S9 no selected_locations → 422 NO_LOCATION, nothing created on Meta', async () => {
  const cfg = baseConfig();
  __setSupabaseFactoryForTests(() => makeSupabase(cfg));
  const calls = installFetch({});
  const res = await handleRequest(makeRequest({ selected_locations: [] }));
  const body = await res.json();
  assertEquals(res.status, 422);
  assertEquals(body.code, 'NO_LOCATION');
  assert(!calls.some((c) => c.method === 'POST' && c.url.includes('/campaigns')), 'no campaign may be created');
});

scc('S10 page not owned by the user → 422 PAGE_NOT_ALLOWED', async () => {
  const cfg = baseConfig();
  __setSupabaseFactoryForTests(() => makeSupabase(cfg));
  const calls = installFetch({ myPages: ['page1', 'page2'] });
  const res = await handleRequest(makeRequest({ fanpage: 'someone_elses_page' }));
  const body = await res.json();
  assertEquals(res.status, 422);
  assertEquals(body.code, 'PAGE_NOT_ALLOWED');
  assert(!calls.some((c) => c.method === 'POST' && c.url.includes('/campaigns')));
});

scc('S11 selected Page B (owned, not stored) → ad set + creative use Page B', async () => {
  const cfg = baseConfig();
  __setSupabaseFactoryForTests(() => makeSupabase(cfg));
  const calls = installFetch({ myPages: ['page1', 'pageB'] });
  const res = await handleRequest(makeRequest({ fanpage: 'pageB' }));
  const body = await res.json();
  assertEquals(body.status, 'created');
  const adset = JSON.parse(calls.find((c) => c.method === 'POST' && c.url.includes('/adsets'))!.body || '{}');
  assertEquals(adset.promoted_object.page_id, 'pageB');
  const creative = JSON.parse(calls.find((c) => c.method === 'POST' && c.url.includes('/adcreatives'))!.body || '{}');
  assertEquals(creative.object_story_spec.page_id, 'pageB');
  assertEquals((cfg.campaignInserts![0] as any).facebook_page, 'pageB');
});

scc('S12 invalid WhatsApp number → 422 INVALID_WHATSAPP; valid one is normalised', async () => {
  const cfg = baseConfig();
  __setSupabaseFactoryForTests(() => makeSupabase(cfg));
  installFetch({});
  const bad = await handleRequest(makeRequest({ whatsappLink: '123' }));
  assertEquals(bad.status, 422);
  assertEquals((await bad.json()).code, 'INVALID_WHATSAPP');

  const calls = installFetch({});
  const ok = await handleRequest(makeRequest({ whatsappLink: '(11) 91234-5678' }));
  assertEquals((await ok.json()).status, 'created');
  const creative = JSON.parse(calls.find((c) => c.method === 'POST' && c.url.includes('/adcreatives'))!.body || '{}');
  assertEquals(creative.object_story_spec.link_data.link, 'https://wa.me/5511912345678');
});

scc('S13 same idempotencyKey twice → one Meta campaign, second call replays', async () => {
  const cfg = baseConfig();
  __setSupabaseFactoryForTests(() => makeSupabase(cfg));
  const calls = installFetch({});
  const first = await (await handleRequest(makeRequest({ idempotencyKey: 'key-12345678' }))).json();
  const second = await handleRequest(makeRequest({ idempotencyKey: 'key-12345678' }));
  assertEquals(second.status, 200);
  assertEquals(await second.json(), first);
  assertEquals(calls.filter((c) => c.method === 'POST' && c.url.includes('/campaigns')).length, 1);
});

scc('S14 idempotencyKey still in progress → 409, no Meta calls', async () => {
  const cfg = baseConfig();
  cfg.requests = new Map([['key-busy-0001', { status: 'in_progress', response: null, updated_at: new Date().toISOString() }]]);
  __setSupabaseFactoryForTests(() => makeSupabase(cfg));
  const calls = installFetch({});
  const res = await handleRequest(makeRequest({ idempotencyKey: 'key-busy-0001' }));
  assertEquals(res.status, 409);
  assertEquals(calls.length, 0);
  assertEquals(cfg.requests.get('key-busy-0001')!.status, 'in_progress'); // registro original intacto
});

scc('S15 dayparting Mon–Fri → lifetime budget for scheduled days only, pacing day_parting, ADVERTISER tz', async () => {
  const cfg = baseConfig();
  __setSupabaseFactoryForTests(() => makeSupabase(cfg));
  const calls = installFetch({});
  // 2026-07-06 (seg) a 2026-07-19 (dom) = 14 dias, 10 úteis
  const res = await handleRequest(makeRequest({
    startDate: '2026-07-06T09:00:00-03:00', endDate: '2026-07-19T23:59:59-03:00', dailyBudget: 30,
    adSchedule: [{ start_minute: 540, end_minute: 1440, days: [1, 2, 3, 4, 5], timezone_type: 'USER' }],
  }));
  assertEquals((await res.json()).status, 'created');
  const adset = JSON.parse(calls.find((c) => c.method === 'POST' && c.url.includes('/adsets'))!.body || '{}');
  assertEquals(adset.lifetime_budget, String(3000 * 10));
  assertEquals(adset.pacing_type, ['day_parting']);
  const sched = JSON.parse(adset.adset_schedule);
  assertEquals(sched[0].timezone_type, 'ADVERTISER');
  assertEquals(sched[0].end_minute, 1440);
});

// audit ADM-02 — conta suspensa pelo admin
scc('S16 suspended account → 403 ACCOUNT_SUSPENDED, no Meta calls, no contingency', async () => {
  const cfg = baseConfig({ profile: { status: 'suspended' } });
  __setSupabaseFactoryForTests(() => makeSupabase(cfg));
  const calls = installFetch({});
  const res = await handleRequest(makeRequest({ idempotencyKey: 'key-suspended-01' }));
  const body = await res.json();
  assertEquals(res.status, 403);
  assertEquals(body.success, false);
  assertEquals(body.code, 'ACCOUNT_SUSPENDED');
  assertEquals(body.userMessage, 'Sua conta está suspensa. Entre em contato com o suporte.');
  assertEquals(calls.length, 0);
  assertEquals(cfg.contingencyInserts.length, 0);
  assertEquals(cfg.campaignInserts!.length, 0);
  assertEquals(cfg.requests!.size, 0); // nem reivindica a chave de idempotência
});
// ---------------------------------------------------------------------------------------------
// audit QA-02 — negative paths: auth failure, foreign ids, deterministic Meta error + rollback
// ---------------------------------------------------------------------------------------------
scc('N1 expired/forged JWT (getUser fails) → 401 UNAUTHENTICATED, no DB writes, no Meta calls', async () => {
  const cfg = baseConfig();
  __setSupabaseFactoryForTests(() => makeSupabase(cfg));
  const calls = installFetch({});
  const req = makeRequest({ idempotencyKey: 'key-badjwt-0001' });
  const forged = new Request(req.url, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer forged.jwt.value', 'Origin': 'https://iacamply.com', 'Content-Type': 'application/json' },
    body: await req.text(),
  });
  const res = await handleRequest(forged);
  const body = await res.json();
  assertEquals(res.status, 401);
  assertEquals(body.success, false);
  assertEquals(body.code, 'UNAUTHENTICATED');
  assertEquals(calls.length, 0);
  assertEquals(cfg.requests!.size, 0);
  assertEquals(cfg.campaignInserts!.length, 0);
  assertEquals(cfg.contingencyInserts.length, 0);
});

scc('N2 "Bearer" with empty token → 401', async () => {
  const cfg = baseConfig();
  __setSupabaseFactoryForTests(() => makeSupabase(cfg));
  const calls = installFetch({});
  const res = await handleRequest(new Request('https://edge.test/simple-campaign-create', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ', 'Origin': 'https://iacamply.com', 'Content-Type': 'application/json' },
    body: '{}',
  }));
  assertEquals(res.status, 401);
  await res.body?.cancel();
  assertEquals(calls.length, 0);
});

scc('N3 only ANOTHER user has a Meta integration → 422 NO_INTEGRATION (eq user_id applied), no Meta calls', async () => {
  const cfg = baseConfig();
  const foreign = { ...cfg.integration, id: 'int2', user_id: 'u2', access_token: 'victim-token', ad_account_id: '999' };
  cfg.integration = { ...cfg.integration, status: 'revoked' }; // caller's own integration is not active
  cfg.otherIntegrations = [foreign];
  __setSupabaseFactoryForTests(() => makeSupabase(cfg));
  const calls = installFetch({});
  const res = await handleRequest(makeRequest());
  const body = await res.json();
  assertEquals(res.status, 422);
  assertEquals(body.code, 'NO_INTEGRATION');
  assertEquals(calls.length, 0);
  // the other user's token must never be used
  assert(!JSON.stringify(calls).includes('victim-token'));
});

scc('N4 another user’s Page id (not in /me/accounts) → 422 PAGE_NOT_ALLOWED, nothing created/saved', async () => {
  const cfg = baseConfig();
  __setSupabaseFactoryForTests(() => makeSupabase(cfg));
  const calls = installFetch({ myPages: ['page1'] });
  const res = await handleRequest(makeRequest({ fanpage: 'victim_page_42' }));
  const body = await res.json();
  assertEquals(res.status, 422);
  assertEquals(body.success, false);
  assertEquals(body.code, 'PAGE_NOT_ALLOWED');
  // only the ownership lookup went to Meta, with the caller's own token
  assert(calls.every((c) => c.method === 'GET'), 'no write call may reach Meta');
  assert(calls.some((c) => c.url.includes('/me/accounts')));
  assertEquals(cfg.campaignInserts!.length, 0);
  assertEquals(cfg.contingencyInserts.length, 0);
});

scc('N5 deterministic Meta error on ad → 422 + rollback DELETE of the created campaign, nothing saved', async () => {
  const cfg = baseConfig();
  __setSupabaseFactoryForTests(() => makeSupabase(cfg));
  const calls = installFetch({ failAds: true });
  const res = await handleRequest(makeRequest({ idempotencyKey: 'key-rollback-01' }));
  const body = await res.json();
  assertEquals(res.status, 422);
  assertEquals(body.status, 'failed');
  assert(body.campaignId == null || body.campaignId !== 'cmp_1', 'a rolled-back campaign id must not be returned as created');
  const deletes = calls.filter((c) => c.method === 'DELETE');
  assert(deletes.length >= 1, 'expected rollback DELETE(s)');
  assert(deletes.some((d) => d.url.includes('/cmp_1')), 'rollback must delete the created campaign');
  // rollback DELETEs are authenticated by header, never by query token
  assert(deletes.every((d) => !d.url.includes('access_token=')));
  assertEquals(cfg.campaignInserts!.length, 0);
  assertEquals(cfg.contingencyInserts.length, 0);
  // the idempotency record is finalised (not left in_progress forever)
  assert(cfg.requests!.get('key-rollback-01')?.status !== 'in_progress');
});

scc('N6 empty JSON body with a valid user → 422 INVALID_PAYLOAD, no Meta calls', async () => {
  const cfg = baseConfig();
  __setSupabaseFactoryForTests(() => makeSupabase(cfg));
  const calls = installFetch({});
  const res = await handleRequest(new Request('https://edge.test/simple-campaign-create', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer testtoken', 'Origin': 'https://iacamply.com', 'Content-Type': 'application/json' },
    body: '{}',
  }));
  const body = await res.json();
  assertEquals(res.status, 422);
  assertEquals(body.code, 'INVALID_PAYLOAD');
  assertEquals(calls.length, 0);
});

Deno.test('globals restored after simple-campaign-create tests', () => {
  assertEquals(globalThis.setTimeout, realSetTimeout);
  assertEquals(globalThis.fetch, realFetch);
});
