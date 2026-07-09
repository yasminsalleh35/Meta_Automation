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
globalThis.setTimeout = ((fn: (...a: unknown[]) => void) => {
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
}

function makeSupabase(cfg: MockConfig) {
  // A chainable query-builder whose terminal ops resolve based on table + operation.
  function builder(table: string) {
    const state: { table: string; op: 'select' | 'insert'; payload?: any } = { table, op: 'select' };
    const resolve = async () => {
      if (state.op === 'insert' && table === 'campaigns') {
        return { data: null, error: cfg.campaignsInsertError };
      }
      if (state.op === 'insert' && table === 'campaign_contingency') {
        cfg.contingencyInserts.push(state.payload);
        return { data: { id: 'cont_1' }, error: null };
      }
      if (table === 'integrations') return { data: cfg.integration, error: null };
      if (table === 'business_settings') return { data: null, error: null };
      return { data: null, error: null };
    };
    const api: any = {
      select() { return api; },
      eq() { return api; },
      insert(payload: any) { state.op = 'insert'; state.payload = payload; return api; },
      single() { return resolve(); },
      maybeSingle() { return resolve(); },
      // make the builder itself awaitable (e.g. `await from('campaigns').insert(...)`)
      then(onF: any, onR: any) { return resolve().then(onF, onR); },
    };
    return api;
  }

  return {
    rpc(_name: string) {
      return { single: async () => ({ data: cfg.metaConfig, error: null }) };
    },
    auth: {
      getUser: async (_token: string) => ({ data: { user: cfg.user }, error: null }),
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

function installFetch(opts: { failAds?: boolean; adsetFailFirst?: boolean } = {}) {
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
        return jsonResp({ error: { message: 'Invalid parameter', code: 100, error_subcode: 9999 } }, 400);
      }
      return jsonResp({ id: 'as_1' });
    }
    if (path.endsWith('/adcreatives')) return jsonResp({ id: 'cr_1' });
    if (path.endsWith('/ads')) {
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
    campaignName: 'C', adTitle: 'T', adText: 'X', fanpage: 'fp', instagram: '',
    whatsappLink: 'https://wa.me/5511999999999', dailyBudget: 30,
    startDate: '2026-07-01T00:00:00-0300', city: 'São Paulo', radius: 10,
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

// ---------------------------------------------------------------------------------------------
// Scenario 1 — Happy path: image upload CTWA succeeds end to end
// ---------------------------------------------------------------------------------------------
Deno.test({ ...testOpts, name: 'S1 happy path → status:created, no rollback, token hygiene + CORS' }, async () => {
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
Deno.test({ ...testOpts, name: 'S2 ad failure → rollback DELETE + contingency(rolled_back) + status:contingency' }, async () => {
  const cfg = baseConfig();
  __setSupabaseFactoryForTests(() => makeSupabase(cfg));
  const calls = installFetch({ failAds: true });

  const res = await handleRequest(makeRequest());
  const body = await res.json();

  assertEquals(res.status, 200);
  assertEquals(body.success, true);
  assertEquals(body.status, 'contingency');
  assertEquals(body.contingency_mode, true);
  assertEquals(body.reason, 'campaign_creation_error');
  assertEquals(body.campaignId, 'pending'); // partial campaign was rolled back

  // The partial campaign was deleted on Meta (rollback)
  const del = calls.find((c) => c.method === 'DELETE');
  assert(del, 'expected a rollback DELETE');
  assert(del!.url.includes('/cmp_1'), 'rollback should target the created campaign id');

  // Contingency row recorded with rolled_back=true and cleared partial ids
  assertEquals(cfg.contingencyInserts.length, 1);
  const cont = cfg.contingencyInserts[0] as any;
  assertEquals(cont.campaign_data.rolled_back, true);
  assertEquals(cont.partial_meta_campaign_id, null);
  assertEquals(cont.error_stage, 'campaign_creation_error');
});

// ---------------------------------------------------------------------------------------------
// Scenario 3 — Meta succeeds but DB insert fails → reconcile, NO rollback, real ids kept
// ---------------------------------------------------------------------------------------------
Deno.test({ ...testOpts, name: 'S3 db-save failure → contingency(needs_db_reconcile), no rollback, real ids' }, async () => {
  const cfg = baseConfig({ campaignsInsertError: { message: 'db down', code: '500' } });
  __setSupabaseFactoryForTests(() => makeSupabase(cfg));
  const calls = installFetch({});

  const res = await handleRequest(makeRequest());
  const body = await res.json();

  assertEquals(res.status, 200);
  assertEquals(body.success, true);
  assertEquals(body.status, 'contingency');
  assertEquals(body.reason, 'db_save_error');
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
Deno.test({ ...testOpts, name: 'S4 OPTIONS preflight → 204 with origin-scoped CORS' }, async () => {
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
// Scenario 5 — Auth + payload guards (early failures still flow through contingency 200 / errors)
// ---------------------------------------------------------------------------------------------
Deno.test({ ...testOpts, name: 'S5 missing Authorization → contingency response, no Meta calls' }, async () => {
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
  assertEquals(res.status, 200);
  assertEquals(body.status, 'contingency'); // never a hard 5xx to the client
  // No campaign was created on Meta
  assert(!calls.some((c) => c.url.includes('/campaigns')), 'no Meta campaign should be created without auth');
});

// ---------------------------------------------------------------------------------------------
// Scenario 6 — existing-post VIDEO CTWA dark post (the case from the 26-06 log).
// Regression for Meta error 105/1815630: the WhatsApp CTA must be the BARE
// { type: 'WHATSAPP_MESSAGE' } (no value.link), and the thumbnail must be kept.
// ---------------------------------------------------------------------------------------------
Deno.test({ ...testOpts, name: 'S6 existing-post VIDEO → bare WHATSAPP_MESSAGE CTA (no value.link) + thumbnail' }, async () => {
  const cfg = baseConfig();
  (cfg.integration as any).selected_instagram_ids = ['ig_1'];
  __setSupabaseFactoryForTests(() => makeSupabase(cfg));
  const calls = installFetch({});

  const payload = {
    campaignName: 'C', adTitle: 'T', adText: 'Olá', fanpage: 'fp', instagram: '',
    whatsappLink: '', dailyBudget: 30, startDate: '2026-07-01T00:00:00-0300',
    city: 'São Paulo', radius: 10, campaignType: 'whatsapp', status: 'PAUSED',
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
Deno.test({ ...testOpts, name: 'S7 whatsapp_meta selected → ad set promoted_object pins whatsapp_phone_number_id' }, async () => {
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
Deno.test({ ...testOpts, name: 'S8 pinned WhatsApp rejected → strips it, retries page-only, succeeds' }, async () => {
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
