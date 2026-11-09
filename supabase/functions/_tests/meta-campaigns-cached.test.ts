// Tests for meta-campaigns-cached budget accuracy + ad-set resolution.
// The card must show the REAL ad-set daily_budget from Meta (cents→reais), overriding the DB
// `budget_daily` default (R$50), AND resolve the ad set id from the campaign so imported campaigns
// (no meta_adset_id stored) can still display the real value and enable inline editing.
// Run: deno test -A supabase/functions/_tests/meta-campaigns-cached.test.ts
import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
Deno.env.set('MCC_DISABLE_SERVE', '1');
const { handleRequest, __setTestDeps } = await import('../meta-campaigns-cached/index.ts');

const testOpts = { sanitizeOps: false, sanitizeResources: false } as const;
const realFetch = globalThis.fetch; // restored by the last test in this file

function jsonResp(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });
}

// `.eq()` filters are APPLIED to the rows (so a missing user_id/ad_account_id filter would leak
// other users' campaigns), and getUser fails for any token other than the valid one.
function makeAdmin(campaigns: any[], opts: { validToken?: string; userId?: string } = {}) {
  const validToken = opts.validToken ?? 't';
  const userId = opts.userId ?? 'u1';
  return {
    auth: {
      getUser: async (token: string) => token === validToken
        ? { data: { user: { id: userId } }, error: null }
        : { data: { user: null }, error: { status: 401, message: 'invalid JWT' } },
    },
    from() {
      const eqs: Record<string, unknown> = {};
      const builder: any = {
        select() { return builder; },
        eq(col: string, val: unknown) { eqs[col] = val; return builder; },
        not() { return builder; },
        ilike() { return builder; },
        range() { return builder; },
        order() { return builder; },
        then(onF: any, onR: any) {
          const rows = campaigns.filter((r) => Object.entries(eqs).every(([k, v]) => String(r[k]) === String(v)));
          return Promise.resolve({ data: rows, error: null, count: rows.length }).then(onF, onR);
        },
      };
      return builder;
    },
  };
}

// Meta mock: batch expansion (?ids=...&fields=adsets{...}) + per-campaign fallback (/{cid}/adsets).
function installMetaFetch(cfg: { batch?: (ids: string[]) => Response; perCampaign?: (cid: string) => Response }) {
  const calls: string[] = [];
  (globalThis as any).fetch = async (input: any) => {
    const url = typeof input === 'string' ? input : input.url;
    calls.push(url);
    if (url.includes('/?ids=')) {
      const ids = (new URL(url).searchParams.get('ids') || '').split(',');
      return cfg.batch ? cfg.batch(ids) : jsonResp({}, 500);
    }
    const m = url.match(/\/v23\.0\/([^/?]+)\/adsets/);
    if (m) return cfg.perCampaign ? cfg.perCampaign(m[1]) : jsonResp({}, 500);
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

// Default: an IMPORTED campaign — has meta_campaign_id but NO meta_adset_id, DB budget = R$50 default.
const dbCampaign = (over: any = {}) => ({
  id: 'c1', user_id: 'u1', ad_account_id: 'act_1', name: 'CAMP', objective: 'OUTCOME_ENGAGEMENT', status: 'active',
  meta_campaign_id: 'cmp1', meta_adset_id: null, budget_daily: 50,
  metrics: {}, created_at: '2026-01-01', meta_data: {}, ...over,
});
const batchAdsets = (data: any[]) => jsonResp({ cmp1: { id: 'cmp1', adsets: { data } } });

// 1 — Imported campaign: resolves the ad set from Meta → real budget R$30 AND edit gets enabled.
Deno.test({ ...testOpts, name: '1 imported campaign → real budget R$30 + resolved metaAdsetId (edit enabled)' }, async () => {
  __setTestDeps({ adminFactory: () => makeAdmin([dbCampaign()]), resolveIntegration: async () => ({ access_token: 'tok' }) });
  installMetaFetch({ batch: () => batchAdsets([{ id: 'as_1', daily_budget: '3000' }]) });
  const body = await (await handleRequest(req())).json();
  assertEquals(body.items[0].budgetDaily, 30);        // real, not the R$50 default
  assertEquals(body.items[0].metaAdsetId, 'as_1');    // resolved → pencil becomes clickable
});

// 2 — Meta unavailable → falls back to DB budget, no crash.
Deno.test({ ...testOpts, name: '2 Meta unavailable → DB budget (R$50), metaAdsetId null' }, async () => {
  __setTestDeps({ adminFactory: () => makeAdmin([dbCampaign()]), resolveIntegration: async () => ({ access_token: 'tok' }) });
  installMetaFetch({ batch: () => jsonResp({ error: 'x' }, 500), perCampaign: () => jsonResp({ error: 'x' }, 500) });
  const body = await (await handleRequest(req())).json();
  assertEquals(body.items[0].budgetDaily, 50);
  assertEquals(body.items[0].metaAdsetId, null);
});

// 3 — Batch fails → per-campaign fallback resolves the ad set + real budget (3500 → R$35).
Deno.test({ ...testOpts, name: '3 batch fails → per-campaign fallback (R$35 + resolved id)' }, async () => {
  __setTestDeps({ adminFactory: () => makeAdmin([dbCampaign()]), resolveIntegration: async () => ({ access_token: 'tok' }) });
  const calls = installMetaFetch({
    batch: () => jsonResp({ error: { message: 'Invalid parameter', code: 100 } }, 400),
    perCampaign: (cid) => (cid === 'cmp1' ? jsonResp({ data: [{ id: 'as_1', daily_budget: '3500' }] }) : jsonResp({ data: [] })),
  });
  const body = await (await handleRequest(req())).json();
  assertEquals(body.items[0].budgetDaily, 35);
  assertEquals(body.items[0].metaAdsetId, 'as_1');
  assert(calls.some((u) => u.includes('/cmp1/adsets')), 'expected a per-campaign fallback call');
});

// 4 — Stored meta_adset_id is preferred over the resolved one; budget still from Meta.
Deno.test({ ...testOpts, name: '4 stored meta_adset_id preferred; budget from Meta (R$40)' }, async () => {
  __setTestDeps({
    adminFactory: () => makeAdmin([dbCampaign({ meta_adset_id: 'as_db' })]),
    resolveIntegration: async () => ({ access_token: 'tok' }),
  });
  installMetaFetch({ batch: () => batchAdsets([{ id: 'as_meta', daily_budget: '4000' }]) });
  const body = await (await handleRequest(req())).json();
  assertEquals(body.items[0].budgetDaily, 40);
  assertEquals(body.items[0].metaAdsetId, 'as_db');
});

// 5 — Multiple ad sets → budget = sum (R$30); no single id → edit stays disabled (honest).
Deno.test({ ...testOpts, name: '5 multi ad set → summed budget R$30, metaAdsetId null' }, async () => {
  __setTestDeps({ adminFactory: () => makeAdmin([dbCampaign()]), resolveIntegration: async () => ({ access_token: 'tok' }) });
  installMetaFetch({ batch: () => batchAdsets([{ id: 'a1', daily_budget: '2000' }, { id: 'a2', daily_budget: '1000' }]) });
  const body = await (await handleRequest(req())).json();
  assertEquals(body.items[0].budgetDaily, 30);
  assertEquals(body.items[0].metaAdsetId, null);
});

// 6 — No Meta integration/token → best-effort skips the read, DB value shown.
Deno.test({ ...testOpts, name: '6 no integration token → DB value (R$50), metaAdsetId null' }, async () => {
  __setTestDeps({ adminFactory: () => makeAdmin([dbCampaign()]), resolveIntegration: async () => null });
  installMetaFetch({ batch: () => batchAdsets([{ id: 'as_1', daily_budget: '3000' }]) });
  const body = await (await handleRequest(req())).json();
  assertEquals(body.items[0].budgetDaily, 50);
  assertEquals(body.items[0].metaAdsetId, null);
});

// audit QA-02 — negative paths
Deno.test({ ...testOpts, name: '7 invalid JWT (getUser fails) → 401, no DB rows, no Meta calls' }, async () => {
  __setTestDeps({ adminFactory: () => makeAdmin([dbCampaign()]), resolveIntegration: async () => ({ access_token: 'tok' }) });
  const calls = installMetaFetch({ batch: () => batchAdsets([]) });
  const res = await handleRequest(new Request('https://edge.test/meta-campaigns-cached', {
    method: 'POST',
    headers: { Authorization: 'Bearer forged', 'Content-Type': 'application/json' },
    body: JSON.stringify({ ad_account_id: 'act_1' }),
  }));
  assertEquals(res.status, 401);
  const body = await res.json();
  assert(!('items' in body));
  assertEquals(calls.length, 0);
});

Deno.test({ ...testOpts, name: '8 another user’s campaigns / ad account are never returned' }, async () => {
  const foreign = dbCampaign({ id: 'c_victim', user_id: 'u2', name: 'VICTIM' });
  const otherAccount = dbCampaign({ id: 'c_other_acct', ad_account_id: 'act_999', name: 'OTHER_ACCT' });
  __setTestDeps({ adminFactory: () => makeAdmin([dbCampaign(), foreign, otherAccount]), resolveIntegration: async () => null });
  installMetaFetch({});
  const body = await (await handleRequest(req())).json();
  const names = (body.items ?? []).map((i: any) => i.name);
  assertEquals(names, ['CAMP']);
});

Deno.test('restore global fetch', () => {
  globalThis.fetch = realFetch;
  assertEquals(globalThis.fetch, realFetch);
});
