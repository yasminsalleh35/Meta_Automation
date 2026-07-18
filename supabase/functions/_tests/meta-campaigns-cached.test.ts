// Tests for meta-campaigns-cached budget accuracy: the card must show the REAL ad-set daily_budget
// from Meta (cents→reais), overriding the DB `budget_daily` default (R$50), with safe fallbacks.
// Run: deno test -A supabase/functions/_tests/meta-campaigns-cached.test.ts
import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
Deno.env.set('MCC_DISABLE_SERVE', '1');
const { handleRequest, __setTestDeps } = await import('../meta-campaigns-cached/index.ts');

const testOpts = { sanitizeOps: false, sanitizeResources: false } as const;

function jsonResp(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });
}

// Mock service-role client: auth + the campaigns query chain.
function makeAdmin(campaigns: any[]) {
  const builder: any = {
    select() { return builder; },
    eq() { return builder; },
    not() { return builder; },
    ilike() { return builder; },
    range() { return builder; },
    order() { return builder; },
    then(onF: any, onR: any) {
      return Promise.resolve({ data: campaigns, error: null, count: campaigns.length }).then(onF, onR);
    },
  };
  return {
    auth: { getUser: async () => ({ data: { user: { id: 'u1' } }, error: null }) },
    from() { return builder; },
  };
}

// Configurable Meta fetch: batch (?ids=) and per-id responders.
function installMetaFetch(cfg: { batch?: (ids: string[]) => Response; perId?: (id: string) => Response }) {
  const calls: string[] = [];
  (globalThis as any).fetch = async (input: any) => {
    const url = typeof input === 'string' ? input : input.url;
    calls.push(url);
    if (url.includes('/?ids=')) {
      const ids = (new URL(url).searchParams.get('ids') || '').split(',');
      return cfg.batch ? cfg.batch(ids) : jsonResp({}, 500);
    }
    const m = url.match(/\/v23\.0\/([^/?]+)\?fields=daily_budget/);
    if (m) return cfg.perId ? cfg.perId(m[1]) : jsonResp({}, 500);
    return jsonResp({});
  };
  return calls;
}

function req() {
  return new Request('https://edge.test/meta-campaigns-cached', {
    method: 'POST',
    headers: { Authorization: 'Bearer t', 'Content-Type': 'application/json' },
    body: JSON.stringify({ ad_account_id: 'act_1' }),
  });
}

const dbCampaign = (over: any = {}) => ({
  id: 'c1', name: 'CAMP', objective: 'OUTCOME_ENGAGEMENT', status: 'active',
  meta_campaign_id: 'cmp1', meta_adset_id: 'as_1', budget_daily: 50, // DB default
  metrics: {}, created_at: '2026-01-01', meta_data: {}, ...over,
});

// 1 — Real Meta budget (R$30) overrides the DB default (R$50).
Deno.test({ ...testOpts, name: '1 real ad-set budget overrides DB default (3000 cents → R$30)' }, async () => {
  __setTestDeps({ adminFactory: () => makeAdmin([dbCampaign()]), resolveIntegration: async () => ({ access_token: 'tok' }) });
  installMetaFetch({ batch: () => jsonResp({ as_1: { daily_budget: '3000', id: 'as_1' } }) });
  const body = await (await handleRequest(req())).json();
  assertEquals(body.items[0].budgetDaily, 30); // NOT 50
});

// 2 — Meta unavailable (batch + per-id fail) → fall back to the DB value.
Deno.test({ ...testOpts, name: '2 Meta unavailable → falls back to DB budget (R$50)' }, async () => {
  __setTestDeps({ adminFactory: () => makeAdmin([dbCampaign()]), resolveIntegration: async () => ({ access_token: 'tok' }) });
  installMetaFetch({ batch: () => jsonResp({ error: 'x' }, 500), perId: () => jsonResp({ error: 'x' }, 500) });
  const body = await (await handleRequest(req())).json();
  assertEquals(body.items[0].budgetDaily, 50);
});

// 3 — Batch 400 (one stale id) → per-id fallback still resolves the real budget.
Deno.test({ ...testOpts, name: '3 batch fails → per-id fallback resolves real budget (3500 → R$35)' }, async () => {
  __setTestDeps({ adminFactory: () => makeAdmin([dbCampaign()]), resolveIntegration: async () => ({ access_token: 'tok' }) });
  const calls = installMetaFetch({
    batch: () => jsonResp({ error: { message: 'Invalid parameter', code: 100 } }, 400),
    perId: (id) => (id === 'as_1' ? jsonResp({ daily_budget: '3500', id }) : jsonResp({}, 400)),
  });
  const body = await (await handleRequest(req())).json();
  assertEquals(body.items[0].budgetDaily, 35);
  assert(calls.some((u) => u.includes('/as_1?fields=daily_budget')), 'expected a per-id fallback call');
});

// 4 — Campaign without an ad set → keeps the DB value, no Meta call needed.
Deno.test({ ...testOpts, name: '4 no meta_adset_id → uses DB value (R$40), no crash' }, async () => {
  __setTestDeps({
    adminFactory: () => makeAdmin([dbCampaign({ meta_adset_id: null, budget_daily: 40 })]),
    resolveIntegration: async () => ({ access_token: 'tok' }),
  });
  installMetaFetch({ batch: () => jsonResp({}) });
  const body = await (await handleRequest(req())).json();
  assertEquals(body.items[0].budgetDaily, 40);
  assertEquals(body.items[0].metaAdsetId, null);
});

// 5 — No Meta integration/token → best-effort skips the live read, DB value shown.
Deno.test({ ...testOpts, name: '5 no integration token → DB value (R$50)' }, async () => {
  __setTestDeps({ adminFactory: () => makeAdmin([dbCampaign()]), resolveIntegration: async () => null });
  installMetaFetch({ batch: () => jsonResp({ as_1: { daily_budget: '3000' } }) });
  const body = await (await handleRequest(req())).json();
  assertEquals(body.items[0].budgetDaily, 50); // no token → no override
});
