#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read
// =============================================================================================
// Camply security probe (audit QA-03). Run after every deploy:
//
//   SUPABASE_URL=https://<ref>.supabase.co SUPABASE_ANON_KEY=<anon key> \
//     deno run --allow-net --allow-env --allow-read scripts/security-probe.ts
//
// Optional (cross-user checks, needs two real test accounts — NEVER production customers):
//   PROBE_USER_A_JWT=<access token of test user A>  PROBE_USER_B_ID=<uuid of test user B>
// Optional: PROBE_JSON=1 prints the raw results as JSON at the end.
//
// It is NON-DESTRUCTIVE by design:
//   • Edge functions get `POST {}` (never a valid payload). Functions whose name suggests a side
//     effect (emails, account creation, charging, webhooks, purges, Meta object creation, paid AI)
//     only get OPTIONS + a POST with an obviously invalid, non-JSON body. Functions with no auth
//     guard in their source are not POSTed with the anon key at all — they are reported instead.
//   • RPCs are called with GET, which PostgREST runs in a READ ONLY transaction: a function that
//     tries to write fails with SQLSTATE 25006 (we report that as "anon can EXECUTE a writer").
//   • Tables are read with `select=*&limit=1`.
//
// The anon key cannot read the PostgREST OpenAPI spec on current Supabase projects (service_role
// only), so tables and RPCs are enumerated from the generated types
// (src/integrations/supabase/types.ts) plus every `create function/table` in supabase/migrations.
//
// Exit code 1 when anything unexpected is found.
// =============================================================================================

const SUPABASE_URL = (Deno.env.get('SUPABASE_URL') ?? '').replace(/\/+$/, '');
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const USER_A_JWT = Deno.env.get('PROBE_USER_A_JWT') ?? '';
const USER_B_ID = Deno.env.get('PROBE_USER_B_ID') ?? '';
const PRINT_JSON = Deno.env.get('PROBE_JSON') === '1';

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('SUPABASE_URL and SUPABASE_ANON_KEY must be set (env). Nothing is hard-coded.');
  Deno.exit(2);
}

const ROOT = new URL('..', import.meta.url);
const FUNCTIONS_DIR = new URL('supabase/functions/', ROOT);
const MIGRATIONS_DIR = new URL('supabase/migrations/', ROOT);
const TYPES_FILE = new URL('src/integrations/supabase/types.ts', ROOT);
const CONFIG_TOML = new URL('supabase/config.toml', ROOT);

// ---------------------------------------------------------------------------------------------
// Allowlists — every entry must say WHY it is public.
// ---------------------------------------------------------------------------------------------

/** RPCs the anon role may execute successfully (2xx). */
const PUBLIC_RPCS: Record<string, string> = {
  get_payment_setting: 'public checkout reads which payment provider is enabled (no secrets)',
  get_ai_status: 'landing/wizard shows whether AI features are on (boolean)',
  get_sector_categories: 'public sector picker on onboarding/quiz',
  get_sector_specializations: 'public sector picker on onboarding/quiz',
  get_sector_categories_with_specializations: 'sector getter (public sector picker); reference data only',
  get_pagarme_config_public: 'public checkout needs the Pagar.me PUBLIC key for card tokenization; secrets are only exposed as has_* booleans',
  is_admin_user: 'RLS helper: policies evaluated for anon call it, so anon needs EXECUTE; returns false for anon',
  is_admin_or_super_admin: 'RLS helper: policies evaluated for anon call it, so anon needs EXECUTE; returns false for anon',
};

/** Tables whose rows the anon role may read. */
const PUBLIC_TABLES: Record<string, string> = {
  sector_categories: 'public sector picker',
  sector_specializations: 'public sector picker',
  quizzes: 'public quiz page /quizz/:slug (keep RLS limited to is_active = true)',
  quiz_steps: 'public quiz page /quizz/:slug renders the steps of an active quiz',
  subscription_pricing: 'public plan prices',
};

/** Edge functions that may legitimately return 2xx to an unauthenticated `POST {}`. */
const PUBLIC_FUNCTIONS_2XX: Record<string, string> = {
  // intentionally empty: every public endpoint (quiz/lead submit, public checkout) must 400 on {}
};

/**
 * Public-by-design endpoints whose source validates the body BEFORE any side effect, so `POST {}`
 * is safe and must return 4xx (checked by reading each index.ts):
 *   asaas-public-checkout → 400 "planCode deve ser…";  lead-quiz-submit → 400 (no whatsapp);
 *   quiz-submit → 400 (no quiz_id);  pagarme-subscribe → 422 (no card token).
 */
const PUBLIC_BY_DESIGN = new Set(['asaas-public-checkout', 'lead-quiz-submit', 'quiz-submit', 'pagarme-subscribe']);

/** Name patterns for functions with side effects: OPTIONS + invalid body only. */
const SENSITIVE_FN = /^send-|create-guest-user|subscribe|checkout|payment|purge|user-account-delete|webhook|^test-(meta|wa)-|quiz-lead-scoring|campaign-create|^duplicate-campaign|edge-log-persist|quiz-submit/;

/** Source markers that show a function authenticates its caller. */
const GUARD_MARKERS = /getUser\(|requireUser|requireAdmin|requireAuth|requireServiceRole|requireServiceOrAdmin|isServiceRole|requireCron|isCron|x-cron-secret|CRON_SECRET|verifyWebhookSignature|Asaas-Signature|asaas-access-token|stripe-signature|constructEvent/;

/** Read-only, user-scoped functions used for the cross-user (A reads B) check. */
const CROSS_USER_READ_FUNCTIONS = [
  'user-data-export', 'check-subscription', 'check-pagarme-subscription', 'meta-campaigns-cached',
  'simple-campaign-list', 'meta-assets-cached', 'account-insights-read', 'meta-campaign-daily-insights',
  'simple-campaign-assets', 'meta-selection',
];

// ---------------------------------------------------------------------------------------------
type Verdict = 'PASS' | 'FAIL' | 'WARN' | 'INFO';
interface Row { area: string; target: string; mode: string; status: string; verdict: Verdict; note: string }
const rows: Row[] = [];
const add = (r: Row) => rows.push(r);

async function readText(url: URL): Promise<string> {
  try { return await Deno.readTextFile(url); } catch { return ''; }
}

async function http(path: string, init: RequestInit & { timeoutMs?: number } = {}) {
  const url = path.startsWith('http') ? path : `${SUPABASE_URL}${path}`;
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(init.timeoutMs ?? 20_000), redirect: 'manual' });
    const text = await res.text();
    let json: unknown = undefined;
    try { json = JSON.parse(text); } catch { /* not json */ }
    return { status: res.status, text, json };
  } catch (e) {
    return { status: 0, text: String(e), json: undefined };
  }
}

const anonHeaders = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };
const userHeaders = USER_A_JWT ? { apikey: ANON_KEY, Authorization: `Bearer ${USER_A_JWT}` } : null;
const short = (s: string, n = 90) => s.replace(/\s+/g, ' ').slice(0, n);

// ---------------------------------------------------------------------------------------------
// Enumeration
// ---------------------------------------------------------------------------------------------
async function listFunctions(): Promise<string[]> {
  const out: string[] = [];
  for await (const e of Deno.readDir(FUNCTIONS_DIR)) {
    if (!e.isDirectory || e.name.startsWith('_')) continue;
    try { await Deno.stat(new URL(`${e.name}/index.ts`, FUNCTIONS_DIR)); out.push(e.name); } catch { /* no index */ }
  }
  return out.sort();
}

function verifyJwtMap(toml: string): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  const re = /\[functions\.([\w-]+)\][^[]*?verify_jwt\s*=\s*(true|false)/g;
  for (const m of toml.matchAll(re)) map[m[1]] = m[2] === 'true';
  return map;
}

interface RpcArg { name: string; type: string; optional: boolean }
interface Schema { tables: Map<string, string[]>; rpcs: Map<string, RpcArg[] | null> }

function parseArgs(src: string): RpcArg[] {
  const args: RpcArg[] = [];
  for (const m of src.matchAll(/(\w+)(\?)?:\s*([^;\n}]+)/g)) {
    args.push({ name: m[1], optional: !!m[2], type: m[3].trim() });
  }
  return args;
}

async function loadSchema(): Promise<Schema> {
  const tables = new Map<string, string[]>();
  const rpcs = new Map<string, RpcArg[] | null>();
  const types = await readText(TYPES_FILE);
  // Only the `public` schema block (the first `Tables:` / `Functions:` after `public: {`).
  const pub = types.slice(Math.max(0, types.indexOf('  public: {')));
  const block = (name: string) => {
    const start = pub.indexOf(`    ${name}: {`);
    if (start < 0) return '';
    const end = pub.indexOf('\n    }', start);
    return pub.slice(start, end);
  };
  const tBlock = block('Tables');
  for (const m of tBlock.matchAll(/\n {6}(\w+): \{\n {8}Row: \{([\s\S]*?)\n {8}\}/g)) {
    tables.set(m[1], [...m[2].matchAll(/\n {10}(\w+)\??:/g)].map((c) => c[1]));
  }
  const vBlock = block('Views');
  for (const m of vBlock.matchAll(/\n {6}(\w+): \{\n {8}Row: \{([\s\S]*?)\n {8}\}/g)) {
    tables.set(m[1], [...m[2].matchAll(/\n {10}(\w+)\??:/g)].map((c) => c[1]));
  }
  const fBlock = block('Functions');
  const entries = [...fBlock.matchAll(/\n {6}(\w+): \{/g)];
  entries.forEach((m, i) => {
    const body = fBlock.slice(m.index!, i + 1 < entries.length ? entries[i + 1].index : undefined);
    const argsMatch = body.match(/Args:\s*(never|\{[\s\S]*?\}|\|[\s\S]*?\})/);
    if (!argsMatch || argsMatch[1] === 'never') rpcs.set(m[1], []);
    else rpcs.set(m[1], parseArgs(argsMatch[1].replace(/^\|\s*/, '').split(/\}\s*\|/)[0]));
  });
  // Migrations: catch objects the (possibly stale) generated types miss. Args unknown.
  try {
    for await (const e of Deno.readDir(MIGRATIONS_DIR)) {
      if (!e.name.endsWith('.sql')) continue;
      const sql = await readText(new URL(e.name, MIGRATIONS_DIR));
      for (const m of sql.matchAll(/create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?"?(\w+)"?\s*\(/gi)) {
        const n = m[1].toLowerCase();
        if (!rpcs.has(n)) rpcs.set(n, null);
      }
      for (const m of sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?"?(\w+)"?\s*\(/gi)) {
        const n = m[1].toLowerCase();
        if (!tables.has(n)) tables.set(n, []);
      }
      for (const m of sql.matchAll(/drop\s+function\s+(?:if\s+exists\s+)?(?:public\.)?"?(\w+)"?/gi)) {
        // keep: a later migration may recreate it; the probe just gets 404 PGRST202 if gone
        void m;
      }
    }
  } catch { /* no migrations dir */ }
  // internal trigger functions are not callable through PostgREST — drop obvious ones
  for (const n of [...rpcs.keys()]) if (/^(handle_|trg_|tg_|trigger_|on_)|_trigger$/.test(n)) rpcs.delete(n);
  return { tables, rpcs };
}

// ---------------------------------------------------------------------------------------------
// Probes
// ---------------------------------------------------------------------------------------------
async function probeFunctions(fns: string[], verifyJwt: Record<string, boolean>) {
  for (const fn of fns) {
    const path = `/functions/v1/${fn}`;
    const src = await readText(new URL(`${fn}/index.ts`, FUNCTIONS_DIR));
    const guarded = GUARD_MARKERS.test(src);
    const publicByDesign = PUBLIC_BY_DESIGN.has(fn);
    const sensitive = SENSITIVE_FN.test(fn) && !publicByDesign;
    const jwt = verifyJwt[fn];

    const opt = await http(path, { method: 'OPTIONS', headers: { Origin: 'https://iacamply.com', 'Access-Control-Request-Method': 'POST' } });
    add({ area: 'function', target: fn, mode: 'OPTIONS', status: String(opt.status), verdict: opt.status === 404 ? 'WARN' : 'INFO', note: opt.status === 404 ? 'not deployed?' : '' });
    if (opt.status === 404) continue;

    const invalidBody = { body: 'probe-not-json', headers: { 'Content-Type': 'text/plain' } };
    const emptyBody = { body: '{}', headers: { 'Content-Type': 'application/json' } };

    for (const mode of ['no-auth', 'anon-key'] as const) {
      // Never POST an unguarded side-effect function with the anon key; with no auth, only if the
      // gateway (verify_jwt=true) stops the request before the code runs.
      if (sensitive && !guarded && !(mode === 'no-auth' && jwt === true)) {
        add({ area: 'function', target: fn, mode, status: '-', verdict: 'WARN', note: 'side-effect fn with NO auth guard in source; not called — review manually' });
        continue;
      }
      const b = sensitive ? invalidBody : emptyBody;
      const headers: Record<string, string> = { ...b.headers, Origin: 'https://iacamply.com' };
      if (mode === 'anon-key') Object.assign(headers, anonHeaders);
      const r = await http(path, { method: 'POST', body: b.body, headers, timeoutMs: 30_000 });
      const ok2xx = r.status >= 200 && r.status < 300;
      let verdict: Verdict = 'PASS';
      let note = short(r.text);
      if (ok2xx && !PUBLIC_FUNCTIONS_2XX[fn]) { verdict = 'FAIL'; note = `UNEXPECTED 2xx: ${note}`; }
      else if (r.status === 0) { verdict = 'WARN'; note = `network/timeout: ${note}`; }
      else if (r.status >= 500) { verdict = 'WARN'; note = `5xx on ${sensitive ? 'invalid' : 'empty'} body (should be 4xx): ${note}`; }
      add({ area: 'function', target: fn, mode: `${mode}${sensitive ? ' (invalid body)' : ''}`, status: String(r.status), verdict, note });
    }
    if (!guarded && !sensitive && !publicByDesign) {
      add({ area: 'function', target: fn, mode: 'static', status: '-', verdict: 'WARN', note: 'no auth-guard marker found in source' });
    }
  }
}

function dummyFor(arg: RpcArg, idValue: string): string | null {
  const t = arg.type.replace(/\s*\|\s*null/, '');
  if (/\[\]|Json|\{/.test(t)) return null;
  if (t === 'number') return '0';
  if (t === 'boolean') return 'false';
  if (/(^|_)(id|uuid)$|_id_|user/.test(arg.name)) return idValue;
  return 'probe';
}

function isEmptyResult(j: unknown): boolean {
  return j === null || j === false || j === '' || (Array.isArray(j) && j.length === 0) ||
    (typeof j === 'object' && j !== null && !Array.isArray(j) && Object.keys(j).length === 0);
}

function classifyRpc(r: { status: number; text: string; json: unknown }) {
  const code = (r.json as any)?.code ?? '';
  if (r.status >= 200 && r.status < 300) return { kind: 'executed', code };
  if (code === '25006') return { kind: 'writer-executed', code };
  if (code === 'PGRST202') return { kind: 'no-match', code };
  if (code === '42501' || r.status === 401 || r.status === 403) return { kind: 'denied', code };
  return { kind: 'error', code };
}

async function probeRpcs(schema: Schema, mode: 'anon-key' | 'user-A→B') {
  const headers = mode === 'anon-key' ? anonHeaders : userHeaders!;
  const zero = '00000000-0000-0000-0000-000000000000';
  for (const [name, args] of [...schema.rpcs.entries()].sort()) {
    if (mode === 'user-A→B' && !(args ?? []).some((a) => /user/.test(a.name))) continue;
    const idValue = mode === 'anon-key' ? zero : USER_B_ID;
    // 1) empty args (GET → READ ONLY transaction)
    let r = await http(`/rest/v1/rpc/${name}`, { method: 'GET', headers });
    let c = classifyRpc(r);
    let how = 'GET {}';
    // 2) if no zero-arg overload, retry with dummy args (still GET/read-only)
    if ((c.kind === 'no-match' || mode === 'user-A→B') && args && args.length) {
      const qs = new URLSearchParams();
      let complete = true;
      for (const a of args) {
        const v = dummyFor(a, idValue);
        if (v === null) { if (!a.optional) complete = false; continue; }
        qs.set(a.name, v);
      }
      if (complete) {
        r = await http(`/rest/v1/rpc/${name}?${qs}`, { method: 'GET', headers });
        c = classifyRpc(r);
        how = `GET ${qs}`;
      }
    }
    let verdict: Verdict = 'PASS';
    let note = `${how} → ${c.kind} ${c.code} ${short(r.text, 70)}`;
    if (c.kind === 'executed') {
      if (mode === 'anon-key') verdict = PUBLIC_RPCS[name] ? 'PASS' : 'FAIL';
      else verdict = r.text.includes(USER_B_ID) || (Array.isArray(r.json) && r.json.length > 0) ? 'FAIL' : 'WARN';
      if (PUBLIC_RPCS[name] && mode === 'anon-key') note = `allowlisted: ${PUBLIC_RPCS[name]}`;
      else if (mode === 'anon-key' && isEmptyResult(r.json)) note = `anon can EXECUTE (returned ${short(r.text, 20)} — probably an internal guard; REVOKE EXECUTE FROM anon) ${how}`;
      else if (mode === 'anon-key') note = `ANON GETS DATA: ${short(r.text, 80)}`;
    } else if (c.kind === 'writer-executed') {
      verdict = 'FAIL';
      note = `${mode} can EXECUTE a function that WRITES (stopped only by the read-only GET; a POST would run it). ${how}`;
    } else if (c.kind === 'no-match' || r.status === 404) {
      verdict = 'INFO';
      note = `not callable with probe args (${c.code || r.status}) — check grants in SQL`;
    } else if (r.status >= 500) {
      verdict = 'WARN';
    }
    add({ area: 'rpc', target: name, mode, status: String(r.status), verdict, note });
  }
}

async function probeTables(schema: Schema) {
  for (const [table] of [...schema.tables.entries()].sort()) {
    const r = await http(`/rest/v1/${table}?select=*&limit=1`, { method: 'GET', headers: anonHeaders });
    const hasRows = Array.isArray(r.json) && r.json.length > 0;
    let verdict: Verdict = 'PASS';
    let note = r.status === 200 ? (hasRows ? 'ROWS READABLE BY ANON' : 'empty (RLS)') : short(r.text, 70);
    if (hasRows) {
      verdict = PUBLIC_TABLES[table] ? 'PASS' : 'FAIL';
      if (PUBLIC_TABLES[table]) note = `allowlisted: ${PUBLIC_TABLES[table]}`;
      else note += ` — columns: ${Object.keys((r.json as any[])[0]).slice(0, 8).join(',')}`;
    }
    if (r.status === 404) verdict = 'INFO';
    add({ area: 'table', target: table, mode: 'anon-key', status: String(r.status), verdict, note });
  }
}

async function probeCrossUserTables(schema: Schema) {
  for (const [table, cols] of [...schema.tables.entries()].sort()) {
    if (!cols.includes('user_id')) continue;
    const r = await http(`/rest/v1/${table}?select=*&user_id=eq.${USER_B_ID}&limit=1`, { method: 'GET', headers: userHeaders! });
    const leak = Array.isArray(r.json) && r.json.length > 0;
    add({ area: 'table', target: table, mode: 'user-A→B', status: String(r.status), verdict: leak ? 'FAIL' : 'PASS', note: leak ? "USER A CAN READ USER B'S ROWS" : short(r.text, 50) });
  }
}

async function probeCrossUserFunctions(fns: string[]) {
  for (const fn of CROSS_USER_READ_FUNCTIONS.filter((f) => fns.includes(f))) {
    const body = JSON.stringify({ user_id: USER_B_ID, userId: USER_B_ID, target_user_id: USER_B_ID, p_user_id: USER_B_ID });
    const r = await http(`/functions/v1/${fn}`, { method: 'POST', body, headers: { ...userHeaders!, 'Content-Type': 'application/json' } });
    const leak = r.status >= 200 && r.status < 300 && r.text.includes(USER_B_ID);
    add({ area: 'function', target: fn, mode: 'user-A→B', status: String(r.status), verdict: leak ? 'FAIL' : 'PASS', note: leak ? "response contains user B's id" : short(r.text, 60) });
  }
}

// ---------------------------------------------------------------------------------------------
function printTable(list: Row[]) {
  const cols: Array<keyof Row> = ['verdict', 'area', 'target', 'mode', 'status', 'note'];
  const width = (k: keyof Row) => Math.min(k === 'note' ? 110 : 40, Math.max(k.length, ...list.map((r) => String(r[k]).length)));
  const w = Object.fromEntries(cols.map((k) => [k, width(k)])) as Record<keyof Row, number>;
  const line = (r: Record<string, string>) => cols.map((k) => String(r[k]).slice(0, w[k]).padEnd(w[k])).join(' | ');
  console.log(line(Object.fromEntries(cols.map((k) => [k, k.toUpperCase()]))));
  console.log(cols.map((k) => '-'.repeat(w[k])).join('-+-'));
  for (const r of list) console.log(line(r as unknown as Record<string, string>));
}

const fns = await listFunctions();
const verifyJwt = verifyJwtMap(await readText(CONFIG_TOML));
const schema = await loadSchema();
console.log(`Probing ${SUPABASE_URL}: ${fns.length} functions, ${schema.rpcs.size} RPCs, ${schema.tables.size} tables` +
  (userHeaders && USER_B_ID ? ' + cross-user (A→B)' : ' (cross-user skipped: PROBE_USER_A_JWT/PROBE_USER_B_ID not set)'));

const openapi = await http('/rest/v1/', { headers: anonHeaders });
add({ area: 'rest', target: '/rest/v1/ (OpenAPI)', mode: 'anon-key', status: String(openapi.status), verdict: openapi.status === 200 ? 'WARN' : 'PASS', note: openapi.status === 200 ? 'schema is public to anon' : 'not exposed to anon (enumerated from local types/migrations)' });

await probeFunctions(fns, verifyJwt);
await probeRpcs(schema, 'anon-key');
await probeTables(schema);
if (userHeaders && USER_B_ID) {
  await probeRpcs(schema, 'user-A→B');
  await probeCrossUserTables(schema);
  await probeCrossUserFunctions(fns);
}

const order: Record<Verdict, number> = { FAIL: 0, WARN: 1, INFO: 2, PASS: 3 };
const interesting = rows.filter((r) => r.verdict === 'FAIL' || r.verdict === 'WARN').sort((a, b) => order[a.verdict] - order[b.verdict]);
console.log('\n=== Findings (FAIL / WARN) ===');
printTable(interesting.length ? interesting : [{ verdict: 'PASS', area: '-', target: '-', mode: '-', status: '-', note: 'nothing unexpected' }]);
const count = (v: Verdict) => rows.filter((r) => r.verdict === v).length;
console.log(`\nTotals: ${rows.length} checks — FAIL ${count('FAIL')}, WARN ${count('WARN')}, INFO ${count('INFO')}, PASS ${count('PASS')}`);
if (Deno.env.get('PROBE_VERBOSE') === '1') { console.log('\n=== All checks ==='); printTable(rows); }
if (PRINT_JSON) console.log(JSON.stringify(rows, null, 2));
Deno.exit(count('FAIL') > 0 ? 1 : 0);
