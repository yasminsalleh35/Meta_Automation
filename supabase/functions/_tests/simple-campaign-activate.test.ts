// Tests for the shared activation core (simple-campaign-activate/core.ts), used by the web endpoint
// and by the WhatsApp bot. Meta Graph is mocked through global fetch; Supabase through a tiny builder.
import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { activateCampaignForUser } from '../simple-campaign-activate/core.ts';

const realFetch = globalThis.fetch;
const CAMPAIGN_UUID = '11111111-2222-4333-8444-555555555555';

interface Db {
  profileStatus: string;
  campaigns: Array<Record<string, unknown>>;
  integration: Record<string, unknown> | null;
  updates: Array<{ table: string; values: Record<string, unknown>; eqs: Record<string, unknown> }>;
  inserts: Array<{ table: string; values: Record<string, unknown> }>;
}

function makeDb(db: Db) {
  return {
    from(table: string) {
      const eqs: Record<string, unknown> = {};
      let op: 'select' | 'update' | 'insert' = 'select';
      let values: Record<string, unknown> = {};
      const rows = (): Array<Record<string, unknown>> => {
        if (table === 'profiles') return [{ id: 'u1', status: db.profileStatus }];
        if (table === 'campaigns') return db.campaigns;
        if (table === 'integrations') return db.integration ? [db.integration] : [];
        return [];
      };
      const match = () => rows().find((r) => Object.entries(eqs).every(([k, v]) => String(r[k]) === String(v))) ?? null;
      const resolve = async () => {
        if (op === 'update') { db.updates.push({ table, values, eqs: { ...eqs } }); return { data: null, error: null }; }
        if (op === 'insert') { db.inserts.push({ table, values }); return { data: null, error: null }; }
        const row = match();
        return row ? { data: row, error: null } : { data: null, error: { message: 'not found' } };
      };
      // deno-lint-ignore no-explicit-any
      const api: any = {
        select() { return api; },
        eq(c: string, v: unknown) { eqs[c] = v; return api; },
        update(v: Record<string, unknown>) { op = 'update'; values = v; return api; },
        insert(v: Record<string, unknown>) { op = 'insert'; values = v; return api; },
        single: resolve, maybeSingle: resolve,
        then(f: (x: unknown) => unknown, r: (e: unknown) => unknown) { return resolve().then(f, r); },
      };
      return api;
    },
  };
}

function baseDb(over: Partial<Db> = {}): Db {
  return {
    profileStatus: 'active',
    campaigns: [{ id: CAMPAIGN_UUID, user_id: 'u1', meta_campaign_id: '1201', meta_adset_id: '1202', meta_ad_id: '1203' }],
    integration: { user_id: 'u1', provider: 'meta_ads', status: 'active', access_token: 'tok' },
    updates: [], inserts: [],
    ...over,
  };
}

// Graph mock: POST status changes succeed (or fail for `failId`); GET effective_status returns `effective`.
function installGraph(effective: string, failId?: string) {
  const calls: Array<{ method: string; url: string; body?: string }> = [];
  globalThis.fetch = (async (input: Request | URL | string, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    const method = (init?.method || 'GET').toUpperCase();
    calls.push({ method, url, body: init?.body as string | undefined });
    if (method === 'POST') {
      if (failId && url.endsWith(`/${failId}`) && String(init?.body).includes('ACTIVE')) {
        return new Response(JSON.stringify({ error: { message: 'boom' } }), { status: 400 });
      }
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    return new Response(JSON.stringify({ id: 'x', status: 'ACTIVE', effective_status: effective }), { status: 200 });
  }) as typeof fetch;
  return calls;
}

function t(name: string, fn: () => Promise<void>) {
  Deno.test({ name, sanitizeOps: false, sanitizeResources: false, async fn() {
    try { await fn(); } finally { globalThis.fetch = realFetch; }
  } });
}

t('A1 activates campaign → adset → ad and marks it active', async () => {
  const db = baseDb();
  const calls = installGraph('ACTIVE');
  const r = await activateCampaignForUser(makeDb(db), 'u1', CAMPAIGN_UUID);
  assertEquals(r.status, 200);
  assertEquals(r.body.success, true);
  const posts = calls.filter((c) => c.method === 'POST').map((c) => c.url.split('/').pop());
  assertEquals(posts, ['1201', '1202', '1203']);
  const upd = db.updates.find((u) => u.table === 'campaigns')!;
  assertEquals(upd.values.status, 'active');
  assertEquals(upd.eqs.id, CAMPAIGN_UUID);
  assert(db.inserts.some((i) => i.table === 'campaign_sync_queue'));
});

t('A2 lookup by Meta campaign id; under review → status pending_review', async () => {
  const db = baseDb({ campaigns: [{ id: CAMPAIGN_UUID, user_id: 'u1', meta_campaign_id: '120212345678', meta_adset_id: '1202', meta_ad_id: '1203' }] });
  installGraph('IN_PROCESS');
  const r = await activateCampaignForUser(makeDb(db), 'u1', '120212345678');
  assertEquals(r.status, 200);
  assertEquals(db.updates.find((u) => u.table === 'campaigns')!.values.status, 'pending_review');
});

t('A3 suspended account → 403 and no Meta call', async () => {
  const db = baseDb({ profileStatus: 'suspended' });
  const calls = installGraph('ACTIVE');
  const r = await activateCampaignForUser(makeDb(db), 'u1', CAMPAIGN_UUID);
  assertEquals(r.status, 403);
  assertEquals(r.body.code, 'ACCOUNT_SUSPENDED');
  assertEquals(calls.length, 0);
});

t('A4 another user’s campaign → 404 and no Meta call', async () => {
  const db = baseDb();
  const calls = installGraph('ACTIVE');
  const r = await activateCampaignForUser(makeDb(db), 'u2', CAMPAIGN_UUID);
  assertEquals(r.status, 404);
  assertEquals(calls.length, 0);
});

t('A5 Meta reports DISAPPROVED → paused again, 400, DB kept paused', async () => {
  const db = baseDb();
  const calls = installGraph('DISAPPROVED');
  const r = await activateCampaignForUser(makeDb(db), 'u1', CAMPAIGN_UUID);
  assertEquals(r.status, 400);
  assertEquals(r.body.success, false);
  assert(calls.some((c) => c.method === 'POST' && String(c.body).includes('PAUSED')));
  assertEquals(db.updates.find((u) => u.table === 'campaigns')!.values.status, 'paused');
});

t('A6 ad activation fails → earlier levels paused, error returned', async () => {
  const db = baseDb();
  const calls = installGraph('ACTIVE', '1203');
  const r = await activateCampaignForUser(makeDb(db), 'u1', CAMPAIGN_UUID);
  assertEquals(r.status, 500);
  assertEquals(r.body.success, false);
  const paused = calls.filter((c) => c.method === 'POST' && String(c.body).includes('PAUSED')).map((c) => c.url.split('/').pop());
  assertEquals(paused, ['1202', '1201']);
  assertEquals(db.updates.length, 0);
});

t('A7 bad id → 400', async () => {
  installGraph('ACTIVE');
  const r = await activateCampaignForUser(makeDb(baseDb()), 'u1', 'abc');
  assertEquals(r.status, 400);
});
