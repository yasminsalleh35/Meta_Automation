// Runtime tests (plan §11): linking, unknown numbers, opt-out, beta flag, rate limit, jobs, sweep.
// Supabase is an in-memory fake that supports the query-builder calls runtime.ts uses; Meta/WhatsApp
// HTTP goes through a fetch mock. No network.
import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { processNumber, runJob, sweep } from '../_shared/waBot/runtime.ts';
import { sha256Hex, type WaConfig } from '../_shared/whatsapp.ts';

// deno-lint-ignore no-explicit-any
type Row = Record<string, any>;

class FakeDb {
  tables: Record<string, Row[]> = {};
  seq = 1;
  t(name: string) { return (this.tables[name] ??= []); }

  rpc(name: string, args: Row) {
    if (name === 'wa_bot_claim_session') {
      let s = this.t('wa_bot_sessions').find((r) => r.wa_id === args.p_wa_id);
      if (!s) { s = { id: crypto.randomUUID(), wa_id: args.p_wa_id, user_id: null, state: 'IDLE', draft: {}, draft_version: 0, retries: 0, updated_at: new Date().toISOString(), locked_until: null, last_unknown_reply_at: null }; this.t('wa_bot_sessions').push(s); }
      if (s.locked_until && new Date(s.locked_until) > new Date()) return Promise.resolve({ data: null, error: null });
      s.locked_until = new Date(Date.now() + 180_000).toISOString();
      s.lock_token = args.p_token ?? 'test-holder';
      return Promise.resolve({ data: s.id, error: null });
    }
    if (name === 'wa_bot_extend_session') {
      const s = this.t('wa_bot_sessions').find((r) => r.id === args.p_id && r.lock_token === args.p_token);
      if (s) s.locked_until = new Date(Date.now() + 180_000).toISOString();
      return Promise.resolve({ data: !!s, error: null });
    }
    if (name === 'wa_bot_release_session') {
      const s = this.t('wa_bot_sessions').find((r) => r.id === args.p_id && r.lock_token === args.p_token);
      if (s) { s.locked_until = null; s.lock_token = null; }
      return Promise.resolve({ data: null, error: null });
    }
    if (name === 'consume_ai_quota') return Promise.resolve({ data: true, error: null });
    return Promise.resolve({ data: null, error: { message: `unknown rpc ${name}` } });
  }

  storage = {
    from: (_b: string) => ({
      upload: async (_p: string) => ({ data: {}, error: null }),
      getPublicUrl: (p: string) => ({ data: { publicUrl: `https://cdn.test/${p}` } }),
    }),
  };

  from(table: string) {
    const db = this;
    const filters: Array<(r: Row) => boolean> = [];
    let op: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
    let values: Row | Row[] = {};
    let count = false, head = false, returning = false, lim = Infinity;
    const rows = () => db.t(table).filter((r) => filters.every((f) => f(r)));
    const exec = () => {
      if (op === 'insert' || op === 'upsert') {
        const list = (Array.isArray(values) ? values : [values]).map((v) => ({ id: v.id ?? (table === 'wa_bot_messages' ? db.seq++ : crypto.randomUUID()), received_at: new Date().toISOString(), created_at: new Date().toISOString(), ...v }));
        for (const r of list) {
          if (table === 'wa_bot_messages' && r.wamid && db.t(table).some((x) => x.wamid === r.wamid)) continue;
          db.t(table).push(r);
        }
        return { data: returning ? list : null, error: null };
      }
      if (op === 'update') {
        const hit = rows();
        // emulate the partial unique index wa_bot_links_waid_active
        if (table === 'wa_bot_links' && (values as Row).status === 'active') {
          const clash = db.t(table).some((x) => x.status === 'active' && x.wa_id === (values as Row).wa_id && !hit.includes(x));
          if (clash) return { data: null, error: { code: '23505', message: 'duplicate' } };
        }
        hit.forEach((r) => Object.assign(r, values));
        return { data: returning ? hit : null, error: null };
      }
      if (op === 'delete') {
        const keep = db.t(table).filter((r) => !filters.every((f) => f(r)));
        db.tables[table] = keep;
        return { data: null, error: null };
      }
      const found = rows().slice(0, lim);
      return count ? { data: head ? null : found, count: found.length, error: null } : { data: found, error: null };
    };
    // deno-lint-ignore no-explicit-any
    const api: any = {
      select(_c?: string, o?: { count?: string; head?: boolean }) { if (op !== 'select') returning = true; if (o?.count) { count = true; head = !!o.head; } return api; },
      insert(v: Row | Row[]) { op = 'insert'; values = v; return api; },
      upsert(v: Row | Row[]) { op = 'upsert'; values = v; return api; },
      update(v: Row) { op = 'update'; values = v; return api; },
      delete() { op = 'delete'; return api; },
      eq(c: string, v: unknown) { filters.push((r) => String(r[c]) === String(v)); return api; },
      is(c: string, v: unknown) { filters.push((r) => (v === null ? r[c] == null : r[c] === v)); return api; },
      not(c: string, _o: string, _v: unknown) { filters.push((r) => r[c] != null); return api; },
      in(c: string, vs: unknown[]) { filters.push((r) => vs.map(String).includes(String(r[c]))); return api; },
      gt(c: string, v: string) { filters.push((r) => r[c] != null && r[c] > v); return api; },
      gte(c: string, v: string) { filters.push((r) => r[c] != null && r[c] >= v); return api; },
      lt(c: string, v: string) { filters.push((r) => r[c] != null && r[c] < v); return api; },
      order() { return api; },
      limit(n: number) { lim = n; return api; },
      maybeSingle() { const r = exec(); return Promise.resolve({ data: Array.isArray(r.data) ? r.data[0] ?? null : r.data, error: r.error }); },
      single() { const r = exec(); const d = Array.isArray(r.data) ? r.data[0] ?? null : r.data; return Promise.resolve({ data: d, error: r.error ?? (d ? null : { message: 'no rows' }) }); },
      then(f: (x: unknown) => unknown, rj: (e: unknown) => unknown) { return Promise.resolve(exec()).then(f, rj); },
    };
    return api;
  }
}

const cfg: WaConfig = { token: 'bot_token', phoneNumberId: 'PNID' };
const realFetch = globalThis.fetch;

/** Captures WhatsApp sends; answers Graph GETs/POSTs used by activation. */
function installFetch(effective = 'ACTIVE') {
  const sends: Row[] = [];
  globalThis.fetch = (async (input: Request | URL | string, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.includes('/functions/v1/wa-bot-worker')) return new Response('{}');
    if (url.endsWith('/PNID/messages')) {
      const b = JSON.parse(String(init?.body ?? '{}'));
      if (b.type) sends.push(b);
      return new Response(JSON.stringify({ messages: [{ id: `out_${sends.length}` }] }));
    }
    if ((init?.method ?? 'GET') === 'POST') return new Response('{"success":true}');
    return new Response(JSON.stringify({ id: 'x', effective_status: effective }));
  }) as typeof fetch;
  return sends;
}
const sentText = (s: Row) => s.text?.body ?? s.interactive?.body?.text ?? '';

function inbound(db: FakeDb, waId: string, text: string) {
  db.t('wa_bot_messages').push({ id: db.seq++, wamid: `in_${db.seq}`, direction: 'in', wa_id: waId, msg_type: 'text', body: { text }, wa_timestamp: new Date().toISOString(), received_at: new Date().toISOString(), processed_at: null });
}

function t(name: string, fn: () => Promise<void>) {
  Deno.test({ name, sanitizeOps: false, sanitizeResources: false, async fn() {
    Deno.env.set('WA_BOT_MODE', 'on');
    Deno.env.set('SUPABASE_URL', 'http://127.0.0.1:9');
    Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'srk');
    try { await fn(); } finally { globalThis.fetch = realFetch; }
  } });
}

async function pendingLink(db: FakeDb, userId: string, code: string, expiresInMs = 600_000) {
  db.t('wa_bot_links').push({ id: crypto.randomUUID(), user_id: userId, status: 'pending', code_hash: await sha256Hex(code), code_expires_at: new Date(Date.now() + expiresInMs).toISOString(), wa_id: null, opted_out_at: null, max_daily_budget: null });
}
function activeLink(db: FakeDb, userId: string, waId: string) {
  db.t('wa_bot_links').push({ id: crypto.randomUUID(), user_id: userId, status: 'active', wa_id: waId, phone_masked: 'x', opted_out_at: null, max_daily_budget: null });
}

t('RT1 valid code links the sending number to the account and shows the menu', async () => {
  const db = new FakeDb(); const sends = installFetch();
  await pendingLink(db, 'U1', '12345678');
  inbound(db, '553399990000', 'VINCULAR 1234 5678');
  await processNumber(db, cfg, '553399990000');
  const link = db.t('wa_bot_links')[0];
  assertEquals([link.status, link.wa_id, link.code_hash], ['active', '553399990000', null]);
  assertEquals(link.phone_masked, '+55 •• •••• 0000');
  assert(sentText(sends[0]).includes('foi conectado'));
  assertEquals(db.t('wa_bot_sessions')[0].user_id, 'U1');
  assertEquals(db.t('wa_bot_sessions')[0].locked_until, null);
  assert(db.t('wa_bot_messages').filter((m) => m.direction === 'in').every((m) => m.processed_at));
});

t('RT2 wrong code → invalid; 6th failure in the hour → rate-limited', async () => {
  const db = new FakeDb(); const sends = installFetch();
  await pendingLink(db, 'U1', '12345678');
  for (let i = 0; i < 6; i++) inbound(db, '5533111', `VINCULAR 0000 000${i}`);
  await processNumber(db, cfg, '5533111');
  assertEquals(db.t('wa_bot_links')[0].status, 'pending');
  assertEquals(sends.filter((s) => sentText(s).includes('não é válido')).length, 5);
  assert(sentText(sends[5]).includes('Muitas tentativas'));
  // even the right code is refused while limited
  inbound(db, '5533111', 'VINCULAR 1234 5678');
  await processNumber(db, cfg, '5533111');
  assertEquals(db.t('wa_bot_links')[0].status, 'pending');
});

t('RT3 expired code is refused', async () => {
  const db = new FakeDb(); const sends = installFetch();
  await pendingLink(db, 'U1', '12345678', -1000);
  inbound(db, '5533222', 'vincular 12345678');
  await processNumber(db, cfg, '5533222');
  assertEquals(db.t('wa_bot_links')[0].status, 'pending');
  assert(sentText(sends[0]).includes('não é válido'));
});

t('RT4 number already active on another account cannot take a second account', async () => {
  const db = new FakeDb(); const sends = installFetch();
  activeLink(db, 'U1', '5533333');
  await pendingLink(db, 'U2', '87654321');
  inbound(db, '5533333', 'VINCULAR 8765 4321');
  await processNumber(db, cfg, '5533333');
  assertEquals(db.t('wa_bot_links').find((l) => l.user_id === 'U2')!.status, 'pending');
  assert(sentText(sends[0]).includes('outra conta'));
});

t('RT5 unknown number: one generic reply per day, content not kept', async () => {
  const db = new FakeDb(); const sends = installFetch();
  inbound(db, '5533444', 'quero anunciar');
  inbound(db, '5533444', 'oi?');
  await processNumber(db, cfg, '5533444');
  assertEquals(sends.length, 1);
  assert(sentText(sends[0]).includes('/dashboard/settings'));
  assert(db.t('wa_bot_messages').filter((m) => m.direction === 'in').every((m) => m.body === null));
});

t('RT6 beta mode: a linked user outside the beta list is treated as unknown', async () => {
  const db = new FakeDb(); const sends = installFetch();
  Deno.env.set('WA_BOT_MODE', 'beta');
  Deno.env.set('WA_BOT_BETA_USER_IDS', 'U9');
  activeLink(db, 'U1', '5533555');
  inbound(db, '5533555', 'oi');
  await processNumber(db, cfg, '5533555');
  assert(sentText(sends[0]).includes('conecte este número'));
});

t('RT7 "parar" silences the bot until "voltar"', async () => {
  const db = new FakeDb(); const sends = installFetch();
  activeLink(db, 'U1', '5533666');
  db.t('profiles').push({ id: 'U1', name: 'Ana Souza', status: 'active' });
  inbound(db, '5533666', 'parar');
  await processNumber(db, cfg, '5533666');
  assert(db.t('wa_bot_links')[0].opted_out_at);
  inbound(db, '5533666', 'oi');
  await processNumber(db, cfg, '5533666');
  assertEquals(sends.length, 1);
  inbound(db, '5533666', 'voltar');
  await processNumber(db, cfg, '5533666');
  assertEquals(db.t('wa_bot_links')[0].opted_out_at, null);
  assert(sends.some((s) => sentText(s).includes('Oi, Ana')));
});

t('RT8 linked user: "oi" → menu with name; session saved and released', async () => {
  const db = new FakeDb(); const sends = installFetch();
  activeLink(db, 'U1', '5533777');
  db.t('profiles').push({ id: 'U1', name: 'Ana Souza', status: 'active' });
  inbound(db, '5533777', 'oi');
  await processNumber(db, cfg, '5533777');
  assert(sentText(sends[0]).includes('Oi, Ana'));
  assertEquals(sends[0].interactive.action.buttons.length, 3);
  const s = db.t('wa_bot_sessions')[0];
  assertEquals([s.state, s.user_id, s.locked_until], ['IDLE', 'U1', null]);
});

t('RT9 a locked number is skipped (another run is processing it)', async () => {
  const db = new FakeDb(); const sends = installFetch();
  activeLink(db, 'U1', '5533888');
  await db.rpc('wa_bot_claim_session', { p_wa_id: '5533888' });
  inbound(db, '5533888', 'oi');
  await processNumber(db, cfg, '5533888');
  assertEquals(sends.length, 0);
  assertEquals(db.t('wa_bot_messages')[0].processed_at, null);
});

t('RT10 activation job runs the shared core and tells the user the real Meta status', async () => {
  const db = new FakeDb(); const sends = installFetch('IN_PROCESS');
  activeLink(db, 'U1', '5533999');
  db.t('profiles').push({ id: 'U1', name: 'Ana', status: 'active' });
  db.t('integrations').push({ user_id: 'U1', provider: 'meta_ads', status: 'active', access_token: 'tok', ad_account_id: '1' });
  db.t('campaigns').push({ id: crypto.randomUUID(), user_id: 'U1', meta_campaign_id: '120200000001', meta_adset_id: '2', meta_ad_id: '3' });
  await db.rpc('wa_bot_claim_session', { p_wa_id: '5533999' });
  const sess = db.t('wa_bot_sessions')[0]; sess.locked_until = null; sess.state = 'ACTIVATING'; sess.user_id = 'U1';
  db.t('wa_bot_jobs').push({ id: 'J1', session_id: sess.id, user_id: 'U1', wa_id: '5533999', kind: 'activate_campaign', status: 'pending', attempts: 0, payload: { metaCampaignId: '120200000001' } });
  await runJob(db, cfg, 'J1');
  const job = db.t('wa_bot_jobs')[0];
  assertEquals(job.status, 'done');
  assertEquals(db.t('campaigns')[0].status, 'pending_review');
  assert(sentText(sends[sends.length - 1]).includes('em análise'));
  assertEquals(db.t('wa_bot_sessions')[0].state, 'IDLE');
  // a job can only run once
  await runJob(db, cfg, 'J1');
  assertEquals(db.t('wa_bot_jobs')[0].attempts, 1);
});

t('RT11 sweep: job stuck > 10 min → failed_unknown + honest message; never re-run', async () => {
  const db = new FakeDb(); const sends = installFetch();
  activeLink(db, 'U1', '5533000');
  await db.rpc('wa_bot_claim_session', { p_wa_id: '5533000' });
  const sess = db.t('wa_bot_sessions')[0]; sess.locked_until = null; sess.state = 'CREATING'; sess.user_id = 'U1';
  db.t('wa_bot_jobs').push({ id: 'J2', session_id: sess.id, user_id: 'U1', wa_id: '5533000', kind: 'create_campaign', status: 'running', started_at: new Date(Date.now() - 11 * 60_000).toISOString(), payload: {} });
  const stats = await sweep(db, cfg);
  assertEquals(stats.jobsStuck, 1);
  assertEquals(db.t('wa_bot_jobs')[0].status, 'failed_unknown');
  assert(sentText(sends[0]).includes('Não consegui confirmar'));
  assertEquals(db.t('wa_bot_sessions')[0].state, 'IDLE');
});

t('RT12 sweep retention: unknown-number messages > 7 days deleted, expired codes removed', async () => {
  const db = new FakeDb(); installFetch();
  const old = new Date(Date.now() - 8 * 86_400_000).toISOString();
  db.t('wa_bot_messages').push({ id: 1, wamid: 'a', direction: 'in', wa_id: '1', user_id: null, received_at: old, processed_at: old, body: null });
  db.t('wa_bot_messages').push({ id: 2, wamid: 'b', direction: 'in', wa_id: '2', user_id: 'U1', received_at: old, processed_at: old, body: { text: 'x' } });
  db.t('wa_bot_links').push({ id: 'L', user_id: 'U1', status: 'pending', code_expires_at: new Date(Date.now() - 2 * 86_400_000).toISOString() });
  await sweep(db, cfg);
  assertEquals(db.t('wa_bot_messages').map((m) => m.wamid), ['b']);
  assertEquals(db.t('wa_bot_links').length, 0);
});

t('RT13 flood control: > 30 messages in a minute are stored but not answered', async () => {
  const db = new FakeDb(); const sends = installFetch();
  activeLink(db, 'U1', '5533121');
  db.t('profiles').push({ id: 'U1', name: 'Ana', status: 'active' });
  for (let i = 0; i < 31; i++) inbound(db, '5533121', 'oi');
  await processNumber(db, cfg, '5533121');
  assertEquals(sends.length, 0);
  assert(db.t('wa_bot_messages').every((m) => m.error === 'rate_limited'));
});

// ---------------- review fixes (2026-11-20) ----------------
t('RT14 sweep re-delivers a finished job whose result never reached the user (stuck CREATING)', async () => {
  const db = new FakeDb(); const sends = installFetch();
  activeLink(db, 'U1', '5533444');
  await db.rpc('wa_bot_claim_session', { p_wa_id: '5533444', p_token: 'x' });
  const sess = db.t('wa_bot_sessions')[0];
  Object.assign(sess, { locked_until: null, lock_token: null, state: 'CREATING', user_id: 'U1', draft_version: 3,
    draft: { budget: 50, location: { type: 'city', name: 'Ipatinga' } }, updated_at: new Date(Date.now() - 5 * 60_000).toISOString() });
  db.t('wa_bot_jobs').push({ id: 'J3', session_id: sess.id, user_id: 'U1', wa_id: '5533444', kind: 'create_campaign', status: 'done',
    payload: { draftVersion: 3 }, result: { status: 200, body: { status: 'created', metaCampaignId: '120200009' } }, created_at: new Date().toISOString() });
  const stats = await sweep(db, cfg);
  assertEquals(stats.redelivered, 1);
  assertEquals(db.t('wa_bot_sessions')[0].state, 'CREATED');
  assert(sentText(sends[sends.length - 1]).includes('criada (pausada)'));
  // a second sweep does nothing more (state moved on)
  const again = await sweep(db, cfg);
  assertEquals(again.redelivered, 0);
});

t('RT15 stuck CREATING with no job at all → honest "check the panel" message, session freed', async () => {
  const db = new FakeDb(); const sends = installFetch();
  activeLink(db, 'U1', '5533555');
  await db.rpc('wa_bot_claim_session', { p_wa_id: '5533555', p_token: 'x' });
  Object.assign(db.t('wa_bot_sessions')[0], { locked_until: null, lock_token: null, state: 'CREATING', user_id: 'U1', updated_at: new Date(Date.now() - 5 * 60_000).toISOString() });
  await sweep(db, cfg);
  assertEquals(db.t('wa_bot_sessions')[0].state, 'IDLE');
  assert(sentText(sends[0]).includes('Não consegui confirmar'));
});

t('RT16 a queued activation does not run after the number was unlinked', async () => {
  const db = new FakeDb(); const sends = installFetch();
  db.t('wa_bot_links').push({ id: 'L1', user_id: 'U1', status: 'revoked', wa_id: '5533666' });
  db.t('campaigns').push({ id: crypto.randomUUID(), user_id: 'U1', meta_campaign_id: '120200000001' });
  db.t('wa_bot_jobs').push({ id: 'J4', session_id: 'S', user_id: 'U1', wa_id: '5533666', kind: 'activate_campaign', status: 'pending', attempts: 0, payload: { metaCampaignId: '120200000001' } });
  await runJob(db, cfg, 'J4');
  assertEquals(db.t('wa_bot_jobs')[0].status, 'failed');
  assertEquals(db.t('wa_bot_jobs')[0].result, { error: 'link_inactive' });
  assertEquals(db.t('campaigns')[0].status, undefined); // untouched
  assertEquals(sends.length, 0);
});

t('RT17 lock owner: another run cannot release or extend a lock it does not hold', async () => {
  const db = new FakeDb(); installFetch();
  const { data: id } = await db.rpc('wa_bot_claim_session', { p_wa_id: '5533777', p_token: 'A' });
  await db.rpc('wa_bot_release_session', { p_id: id, p_token: 'B' });
  assert(db.t('wa_bot_sessions')[0].locked_until != null);
  assertEquals((await db.rpc('wa_bot_extend_session', { p_id: id, p_token: 'B' })).data, false);
  // and processNumber leaves a foreign lock in place
  inbound(db, '5533777', 'oi');
  await processNumber(db, cfg, '5533777');
  assertEquals(db.t('wa_bot_sessions')[0].lock_token, 'A');
});
