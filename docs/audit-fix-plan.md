# Camply: Audit Remediation Plan

| | |
|---|---|
| **Date** | 2026-10-30 |
| **Source** | The full file-by-file audit from 2026-10-30: 9 partitions, about 1,100 files, 119 migrations, 97 edge functions |
| **Scope** | Every confirmed or plausible finding from that audit, turned into ordered, testable work items |
| **Status** | Not started. Nothing in the repo or in production has been changed yet |
| **Owner** | Camply development |

---

## 0. How to use this document

**Task IDs** use the form `AREA-NN`. The areas are:

| Area | Covers |
|---|---|
| `SEC` | Security |
| `PAY` | Payments and the signup funnel |
| `CMP` | Campaign engine |
| `DATA` | Database, metrics and analytics |
| `ADM` | Admin panel |
| `LGL` | Legal, LGPD and consumer claims |
| `PLT` | Platform and code hygiene |
| `QA` | Tests and verification |

**Severity**

| Level | Meaning |
|---|---|
| 🔴 **P0** | Actively exploitable, or losing money or data now. Fix within 24 h. |
| 🟠 **P1** | A customer-visible break, or a serious security weakness. Fix within 1–2 weeks. |
| 🟡 **P2** | Correctness or quality issue. Fix within the cycle. |
| ⚪ **P3** | Cleanup. Opportunistic. |

**Effort** is in engineering hours for one developer who knows the codebase. It includes testing, not code review.

**Confidence**:
- **C**: confirmed in the code.
- **P**: plausible. It depends on live DB state or on Meta or gateway behaviour, so verify it first.

**Every task has an acceptance check.** A task is done only when its check passes on staging, then on production.

---

## 1. Executive summary

The audit found three classes of problem.

1. **Secrets and data are open to the internet.**
   - A Supabase personal access token sits in a local config file.
   - Live Pagar.me keys are committed to a migration.
   - At least 6 `SECURITY DEFINER` RPCs and one RLS policy return payment, Meta and AI secrets to anyone holding the public anon key.
   - There is account takeover via `setup-password`, OAuth CSRF, cross-tenant writes, and a media bucket readable by every user.
2. **The revenue funnel is broken.**
   - Signups land on an error page.
   - Asaas buyers see a "test checkout" page.
   - Annual Asaas buyers never get an account.
   - Pagar.me cancel and portal always fail.
   - There is no paywall, and prices disagree in about 8 places.
3. **The core product reports false results.**
   - Failed campaign creation is shown as success, and an auto-retry then builds a different campaign type.
   - The selected Page is ignored, and removed locations are still targeted.
   - Step 2 loops forever.
   - Analytics shows fabricated numbers.

### Phase plan

| Phase | Goal | Window | Effort |
|---|---|---|---|
| **0. Prep** | Backups, git, staging, live-state snapshot | Day 0 | ~5 h |
| **1. Containment** | Close every internet-reachable secret and takeover path; rotate secrets | Day 1 | ~10 h |
| **2. Access control** | Auth and ownership on every function; no tokens in the browser; OAuth CSRF; storage | Week 1 | ~38 h |
| **3. Revenue funnel** | Signup → pay → account → cancel works end to end on Asaas and Pagar.me; server-side paywall | Week 2 | ~42 h |
| **4. Campaign engine** | Honest create results; correct page, location, link and schedule; no cross-tenant sync | Weeks 2–3 | ~48 h |
| **5. Data, admin, analytics** | Real numbers only; admin pages work; DB constraints consistent | Weeks 3–4 | ~32 h |
| **6. Legal / LGPD** | Privacy policy, consent, data rights, consistent claims | Parallel; needs client input | ~10 h dev |
| **7. Platform hygiene** | Remove about 40k dead lines; deps; CSP; bundle; docs | Weeks 4–5 | ~30 h |
| **8. Tests & QA** | Tests that import real code; E2E smoke; regression gates | Continuous, plus a final week | ~30 h |
| **Total** | | **About 6 weeks for one developer** | **About 245 h** |

Phases 0–1 are non-negotiable and come first. From Phase 2 on, workstreams can run in parallel if more than one person is available. Order inside each phase is by risk.

---

## 2. Ground rules (change control)

1. **No change goes to production without a backup taken the same day.** Take a `pg_dump` before every migration batch (Phase 0).
2. **Staging first.** Build a staging Supabase project from the live schema (not from the migrations: they contain destructive statements and can't be replayed safely; see `DATA-06`). Apply every migration and function deploy there first.
3. **One PR per task ID**, or per small group of related IDs. The PR description quotes the task's acceptance check and its result.
4. **Migrations are additive and idempotent.** Use `IF EXISTS` / `IF NOT EXISTS` and `CREATE OR REPLACE`. Never edit an applied migration except to strip secrets (`SEC-03`).
5. **Each risky deploy has a rollback written before it ships**: the previous function version tag, or a reverse SQL file.
6. **Freeze feature work in the touched areas** until Phase 3 is done, including the WhatsApp chat feature.
7. **Communicate before customer-visible changes.** That includes forcing a reconnect to Meta after the app-secret rotation, a new paywall, and price changes. The client (Jefte) approves the wording.
8. **Remove the debug logging you touch.** Never log tokens, keys, full form data or PII.

---

## 3. Phase 0: Preparation (Day 0, ~5 h)

| ID | Task | Effort |
|---|---|---|
| PRE-01 | **Get git working locally.** Install it, put it on PATH, and clone `yasminsalleh35/Meta_Automation`. Diff the clone against this working folder and reconcile before any change. Create the branch `fix/audit-2026-10`. | 1 h |
| PRE-02 | **Check secret exposure in git history.** Run `git log -p -S "sk_" -- supabase/migrations` and `git log --all -- .claude/`. If the repo is or was public or shared, treat every leaked value as public. Enable GitHub secret scanning and push protection. | 0.5 h |
| PRE-03 | **Back up production.** `supabase db dump --linked -f prod_2026-10-30.sql`, plus `--data-only` for the critical tables (`subscribers`, `campaigns`, `integrations`, `pagarme_*`, `asaas_*`, `quiz_leads`). Store it encrypted, outside the repo. | 0.5 h |
| PRE-04 | **Snapshot the live security state.** Run the queries in [Appendix A](#appendix-a-live-state-discovery-queries) and save the output as `docs/security/live-state-2026-10-30.md`. This is the real baseline; the repo migrations may differ from production. | 1 h |
| PRE-05 | **Create the staging project.** Restore the schema dump without customer data; seed one test user and one admin. Point a Netlify branch deploy at it with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for staging. | 1.5 h |
| PRE-06 | **Build a secrets inventory**: every secret, where it lives (DB table, Supabase function secrets, Netlify env, localStorage) and who consumes it. This drives `SEC-02`. | 0.5 h |

**Exit criteria:**
- Backup verified, by restoring it to staging.
- Live-state snapshot committed.
- Staging reachable.

---

## 4. Phase 1: Containment (Day 1, ~10 h) 🔴

The order matters. **Close the read paths first, then rotate.** Rotating while the RPCs are still open just leaks the new secrets.

### SEC-01 · Revoke the leaked Supabase personal access token 🔴 P0 · C · 0.5 h
- **Where:** `D:\work\Meta_Ads_Automation\.claude\settings.local.json`, lines 16, 22, 24 and 25 (`sbp_f430…`).
- **Steps:**
  1. Revoke the token in Supabase Dashboard → Account → Access Tokens.
  2. Check the organisation audit log for its use: deploys, SQL, secret reads.
  3. Remove the four allow-rule entries that contain it.
  4. Remove the over-broad allow rules from the same file: `Bash(npx supabase:*)`, `git push:*`, `echo $SUPABASE_ACCESS_TOKEN`, `rm -rf …`, and the loop fragments `for file:*`, `do if:*`, `fi` and `done`.
  5. From now on, use `supabase login` interactively. Never paste a token into a command.
- **If the audit log shows any use you can't account for:** rotate the project's JWT secret and service-role key too, and update every function secret and Netlify env value.
- **Accept:** the old token returns 401 against `api.supabase.com/v1/projects`, and `grep -r "sbp_" .` returns nothing.

### SEC-02 · Lock down the secret-returning RPCs and the open policies 🔴 P0 · C · 3 h
- **Where:** a new migration, `supabase/migrations/20261030000001_security_containment.sql`.
- **Why it is safe:** every edge function that calls these RPCs already uses `SUPABASE_SERVICE_ROLE_KEY`. The audit checked `stripe-webhook`, `subscription-sync`, `simple-campaign-create`, `meta-oauth-exchange`, `asaas-*`, `pagarme-subscribe`, `pagarme-create-plans` and `pagarme-test-connection`. Two functions use the anon key: `pagarme-public-config` (dead) and `pagarme-customer-portal` (already broken, fixed in `PAY-07`).
- **The browser callers that will break**, and are fixed in `SEC-04` on the same day:
  - `src/hooks/useGlobalMetaConfig.ts:20`
  - `src/hooks/useMetaAdsAdmin.ts:93,128`
  - `src/components/checkout/PagarmeCheckoutSection.tsx:34` (orphan)

```sql
begin;

-- 0. Admin helper (no user-id argument, so it can't be used to probe other users)
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('admin','super_admin')
  );
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

-- 1. Secret / IDOR / catalog RPCs: service_role only (all overloads)
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and (p.proname in (
            'get_stripe_config_for_functions','get_pagarme_config_for_functions',
            'get_asaas_config_for_functions','get_active_pagarme_config',
            'get_pagarme_config_public','get_meta_ads_config','upsert_meta_ads_config',
            'get_global_setting','get_user_subscription_with_plan',
            'check_user_limit','increment_usage','anonymize_old_leads')
           or p.proname ~ '^(create|update|delete)_sector_')
  loop
    execute format('revoke all on function %s from public, anon, authenticated', r.sig);
    execute format('grant execute on function %s to service_role', r.sig);
  end loop;
end $$;

-- 2. Browser-safe replacements
create or replace function public.get_meta_app_public_config()
returns table(app_id text, business_manager_id text)
language sql stable security definer set search_path = public as $$
  select app_id, business_manager_id from public.meta_ads_config limit 1;
$$;
revoke all on function public.get_meta_app_public_config() from public, anon;
grant execute on function public.get_meta_app_public_config() to authenticated;

create or replace function public.admin_get_meta_ads_config()
returns table(app_id text, app_secret_set boolean, business_manager_id text, updated_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query select c.app_id, (c.app_secret is not null and c.app_secret <> ''),
                      c.business_manager_id, c.updated_at
               from public.meta_ads_config c limit 1;
end $$;
revoke all on function public.admin_get_meta_ads_config() from public, anon;
grant execute on function public.admin_get_meta_ads_config() to authenticated;

create or replace function public.admin_upsert_meta_ads_config(
  p_app_id text, p_app_secret text default null, p_business_manager_id text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select id into v_id from public.meta_ads_config limit 1;
  if v_id is null then
    insert into public.meta_ads_config (app_id, app_secret, business_manager_id)
    values (p_app_id, p_app_secret, p_business_manager_id) returning id into v_id;
  else
    update public.meta_ads_config
       set app_id = p_app_id,
           app_secret = coalesce(nullif(p_app_secret, ''), app_secret),  -- blank = keep
           business_manager_id = p_business_manager_id,
           updated_at = now()
     where id = v_id;
  end if;
  return v_id;
end $$;
revoke all on function public.admin_upsert_meta_ads_config(text,text,text) from public, anon;
grant execute on function public.admin_upsert_meta_ads_config(text,text,text) to authenticated;

-- 3. Policies that expose secrets or allow cross-tenant writes
drop policy if exists pagarme_public_settings_v_select_public on public.pagarme_settings;
drop policy if exists "update_own_subscription"            on public.subscribers;
drop policy if exists "insert_subscription"                on public.subscribers;
drop policy if exists "System can update sync queue"       on public.campaign_sync_queue;
drop policy if exists "System can delete from sync queue"  on public.campaign_sync_queue;
drop policy if exists cp_select_all                        on public.campaign_profiles;
drop policy if exists "Service role can insert suggestions" on public.optimization_suggestions;
drop policy if exists "Users can update own suggestions"   on public.optimization_suggestions;
drop policy if exists "System can insert contingencies"    on public.campaign_contingency;
drop policy if exists "system_insert_pagarme_config_audit" on public.pagarme_config_audit;
drop policy if exists "Users can manage their own rate limits" on public.rate_limits;
drop policy if exists "rate_limit_edge_function_access"    on public.lead_rate_limit;
-- service_role bypasses RLS, so edge functions keep working without these.
-- Add here every other row from Appendix A query 1 that shows USING/WITH CHECK (true)
-- or "auth.uid() IS NULL" on a non-public table (payment_audit_log, quiz_leads, ...).

-- campaign_profiles: owner or shared (non-auto) profiles only
create policy cp_select_scoped on public.campaign_profiles for select to authenticated
  using (owner_user_id = auth.uid() or coalesce(is_auto_generated,false) = false or public.is_admin());

-- 4. Storage: each user reads only their own folder in user-media
drop policy if exists "Users can view media in user-media bucket" on storage.objects;
create policy "user_media_select_own" on storage.objects for select to authenticated
  using (bucket_id = 'user-media' and (storage.foldername(name))[1] = auth.uid()::text);

commit;
```

- **Also on Day 1:**
  - Run `select id, public from storage.buckets where id = 'user-media';`. If `public = true`, decide with the client: switch to private plus signed URLs (`CMP-16`), or accept that the URLs are public but unguessable. A public bucket bypasses the SELECT policy.
  - Meta needs to fetch creative media by URL. For upload creatives, `simple-campaign-create` already uploads the bytes server-side, so a private bucket works.
- **Accept:** all four tests below pass on staging, then production.
  1. Each RPC in the loop, called with the anon key, returns `42501 permission denied`:
     `curl -X POST "$URL/rest/v1/rpc/get_meta_ads_config" -H "apikey: $ANON" -H "Authorization: Bearer $ANON"`
  2. `GET /rest/v1/pagarme_settings?select=*` with the anon key returns `[]`.
  3. As user A, listing user B's folder in `user-media` returns nothing.
  4. A full campaign creation still succeeds on staging. That proves the service-role paths are intact.
- **Rollback:** `supabase/migrations/rollback/20261030000001_down.sql`, which re-grants. Use it only if production campaign creation breaks.

### SEC-03 · Rotate every exposed secret 🔴 P0 · C · 3 h
Do this **after** SEC-02 is live. Update each new value wherever PRE-06 says it lives.

| Secret | How to rotate | Then update |
|---|---|---|
| Pagar.me live and test secret keys, webhook secret | Pagar.me dashboard → Configurações → Chaves | `pagarme_config` and `pagarme_settings` rows, function secrets `PAGARME_SECRET_KEY_LIVE/TEST` |
| Asaas API key, webhook auth token | Asaas → Integrações | `asaas_config`, webhook config in the Asaas panel |
| Stripe secret key, webhook secret | Stripe → Developers. If Stripe is retired (Appendix C #1, `SEC-05`), **roll them and leave them unused** | `stripe_config` |
| Meta app secret | Meta App Dashboard → Settings → Basic → Reset. **Check Meta's current docs for what a reset invalidates.** Do it off-peak, and be ready for users to reconnect | `meta_ads_config.app_secret` via `admin_upsert_meta_ads_config` |
| OpenAI and DeepSeek keys | Provider consoles. Set a monthly spend cap while you're there | `global_settings('ai_configuration')`, function secrets `OPENAI_API_KEY` and `DEEPSEEK_API_KEY` |
| Mapbox token | Public by design. **Restrict it to the URLs** `iacamply.com` and `*.netlify.app` | No change needed |

- **Strip committed values:** edit `supabase/migrations/20251007161324_…sql:42` so the keys become `'<redacted>'`. That migration is already applied, so editing it is safe. Rotation is the real fix; rewriting history with `git filter-repo` is optional.
- **Accept:** the old keys fail against each provider's API (spot-check with curl), and a test payment and a test campaign succeed with the new keys on production.

### SEC-04 · Stop shipping the Meta app secret to the browser 🔴 P0 · C · 2.5 h (same day as SEC-02)
- `src/hooks/useGlobalMetaConfig.ts`: call `get_meta_app_public_config` and drop `appSecret` from the returned type.
- `src/lib/metaTokenValidator.ts:104-108`: stop sending `appId` and `appSecret`.
- `supabase/functions/meta-validation/index.ts:102`:
  - Load the app id and secret server-side with the service role.
  - Remove the `/me` fallback that returns a hard-coded `isValid:true, hasEssentialPermissions:true`. Failure must be failure.
- Remove the `appSecret` gates in `MetaAdsIntegration.tsx:149` and in `FacebookLogin.tsx:21`. FacebookLogin.tsx is an orphan: delete it.
- `src/hooks/useMetaAdsAdmin.ts`:
  - Switch to `admin_get_meta_ads_config` / `admin_upsert_meta_ads_config`. Make the secret field write-only, so a blank field keeps the current value.
  - Delete the logs at `:100` and `:126`.
  - Delete the fake 2-second "Integração configurada!" at `:197-205`.
- **Accept:**
  - No `app_secret` or `appSecret` appears in any network response or JS bundle: `grep -r appSecret dist/` returns 0 hits.
  - A non-admin can connect Meta end to end.
  - An admin can update the App ID without retyping the secret.

### SEC-05 · Disable account takeover via `setup-password` 🔴 P0 · C · 0.5 h
- `supabase/functions/setup-password` accepts any Stripe `session_id`, never checks payment, and sets the password of whichever user has that email (`index.ts:151`). It pairs with the public `guest-checkout`.
- **Steps:**
  1. Delete the function: `supabase functions delete setup-password`.
  2. Delete `guest-checkout`, `create-checkout`, `customer-portal` and `create-payment-intent` too. They are the Stripe paths with no callers.
  3. Remove their `config.toml` entries.
- **Accept:** each of those endpoints returns 404.

### SEC-06 · Close the open endpoints that cost money or send email 🔴 P0 · C · 1 h (stopgap)
Ship these as a stopgap until the auth sweep in `SEC-10` lands. Set an env flag check at the top of each function and return `403` unless the caller is the service role or an admin:
- **Email relays:** `send-account-creation`, `send-confirmation-email`, `send-payment-confirmation`. These are phishing relays from `noreply@iacamply.com`.
- **Open Graph proxies:** `test-meta-*` (4) and `test-wa-link-campaign-create`.
- **Fallback builder:** `contingency-auto-retry-walink`. Disable it; see `CMP-02`.
- **Paid AI:** `ai-suggestions`, `quiz-lead-scoring`. Require a logged-in user now; rate limits come in `SEC-10`.
- **Service-role writers:** `subscription-sync`, `auto-verify-ad-sets`, `metrics-cache-refresh` (all modes), `meta-campaign-auto-sync`. Require the `x-cron-secret` header.

**Accept:** each one, called with only the anon key, returns 401 or 403.

**Phase 1 exit criteria:**
- Appendix A queries 1 and 2 show no secret path and no `true` policy on private tables.
- All old secrets are dead.
- Production campaign creation and checkout still work.

---

## 5. Phase 2: Access control and tenant isolation (Week 1, ~38 h) 🟠

### SEC-10 · One shared auth guard; apply it to every function · 12 h
Create `supabase/functions/_shared/auth.ts`. Use the same supabase-js import URL the other functions use.

```ts
export class HttpError extends Error {
  constructor(public status: number, public code: string) { super(code); }
}

export function serviceClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } });
}

// The anon key is a valid JWT but has no user, so getUser() rejects it. That is the point.
export async function requireUser(req: Request) {
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jwt) throw new HttpError(401, "missing_token");
  const db = serviceClient();
  const { data, error } = await db.auth.getUser(jwt);
  if (error || !data.user) throw new HttpError(401, "invalid_token");
  return { user: data.user, db };
}

export async function requireAdmin(req: Request) {
  const ctx = await requireUser(req);
  const { data } = await ctx.db.from("user_roles").select("role").eq("user_id", ctx.user.id); // no .single(): users can hold 2 roles
  if (!data?.some((r) => r.role === "admin" || r.role === "super_admin")) throw new HttpError(403, "forbidden");
  return ctx;
}

function timingSafeEqual(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export function requireCron(req: Request) {
  const want = Deno.env.get("CRON_SECRET"), got = req.headers.get("x-cron-secret");
  if (!want || !got || !timingSafeEqual(want, got)) throw new HttpError(401, "forbidden");
}
```

**Rule:** a function that takes a `user_id`, `campaign_id`, `subscription_id` or `integration_id` from the body must load that row with `.eq('user_id', user.id)`, or check that the caller is an admin. `verify_jwt = true` in `config.toml` is **not** protection on its own.

**Function matrix.** Every function gets exactly one row.

| Guard | Functions |
|---|---|
| **Delete** (no callers; confirm with grep and 30 days of function logs) | `setup-password`, `guest-checkout`, `create-checkout`, `customer-portal`, `create-payment-intent`, `check-subscription` (once Stripe is retired), `simple-campaign-create-lite`, `simple-campaign-insights` (410 stub), `meta-campaign-insights`, `meta-campaign-management`, `meta-campaigns-enhanced`, `meta-campaigns-list`, `meta-discovery-initial`, `meta-discovery-diff`, `meta-unified-assets`, `get-campaigns`, `business-settings`, `manage-snapshots`, `pagarme-plans-sync` (V4 API), `pagarme-transactions-create`, `pagarme-calc`, `pagarme-public-config`, `pagarme-init`, `pagarme-guest-subscription-create`, `admin/create-test-user` (nested, undeployable) |
| **Public, with signature or provider verification** | `stripe-webhook` (until retired), `pagarme-webhook`, `asaas-webhook` (see `PAY-10`) |
| **Public, rate-limited, with captcha** (Cloudflare Turnstile) | `pagarme-subscribe`, `asaas-public-checkout`, `lead-quiz-submit`, `quiz-submit` |
| **Cron only** (`requireCron`) | `subscription-sync` modes `sync_all` and `expire_grace`; `auto-verify-ad-sets`; `meta-campaign-auto-sync`; `metrics-cache-refresh` mode `all` |
| **Admin only** (`requireAdmin`) | `security-monitor`, `security-audit`, `asaas-test-connection`, `asaas-create-checkout`, `pagarme-test-connection`, `pagarme-create-plans`, `contingency-manual-sync`, `campaign-external-sync`, `meta-targeting-search`, `test-meta-*`, `test-wa-link-campaign-create`, `quiz-lead-scoring`, `edge-log-persist` read mode (check `user_roles`, **not** `user_metadata.role`) |
| **Internal only** (service-role bearer, called from other functions) | `send-account-creation`, `send-confirmation-email`, `send-payment-confirmation`, `create-guest-user` |
| **User, own data only** (`requireUser` plus an ownership filter) | Everything else, including:<br>• `ai-suggestions`, `ai-evaluate-metrics`, `ai-generate-profile`, `apply-optimization`<br>• `edge-log-persist` write (force `user_id = caller`)<br>• `get-user-role` (self, unless admin)<br>• `pagarme-subscriptions-cancel/-reactivate/-update-card`, `pagarme-customer-portal`<br>• `subscription-sync` mode `sync_user` (self only)<br>• `metrics-cache-refresh` (self)<br>• `verify-and-correct-ad-set`, all `meta-*` and `simple-campaign-*`<br>• `save-asset-selection`, `save-campaign`, `duplicate-campaign`, `update-campaign-budget`, `strategy-report`<br>• `account-insights-*`, `meta-validation` |

**Per-user rate limits** on paid AI (`ai-*`): 20/hour and 100/day. Store the counters in a table, keyed by `user_id`. The current `_shared/rateLimit.ts` is in-memory and per-isolate.

**Accept:**
- `QA-03` runs an anon-key probe script against every deployed function. Expected results: 401 or 403, or a 4xx validation error for the public ones.
- A second test user can't read or modify the first user's campaign, subscription or integration through any function.

### SEC-11 · Schedule the cron jobs properly · 2 h
- Store `CRON_SECRET` in Supabase Vault.
- Create `pg_cron` jobs that call each cron function through `pg_net.http_post`, passing the `x-cron-secret` header.
  - `subscription-sync sync_all` and `expire_grace`: every 6 h.
  - `metrics-cache-refresh all`: every 15 min.
  - `auto-verify-ad-sets`: hourly.
  - `meta-campaign-auto-sync`: hourly, **after** `DATA-04` fixes its zero-overwrite and makes it batch per user.
- Remove the frontend triggers: `useAutoVerificationCron`, and the `subscription-sync` call in `useSubscription.ts:100`.
- **Accept:** `select * from cron.job_run_details order by start_time desc` shows successful runs.

### SEC-12 · Stop returning Meta tokens to the browser · 5 h
- `save-asset-selection/index.ts:145-150,230-234`: return only `{ id, ad_account_id, page_id, selected_* }`, never `.select()` with `*`.
- Hooks running `select('*')` on `integrations`:
  - `useMetaAdsIntegrationManager.ts:34` (it also logs the row)
  - `useMetaAdsAdmin.ts:64-67`
  - `useMetaCampaignManagement.ts:13`
  - `useMetaAdsCredentialValidator.ts:185`

  Fix: list explicit non-secret columns. Better: create a view `integrations_public` without `access_token` and `app_secret`, and REVOKE SELECT on those columns from `authenticated`.
- **Browser → graph.facebook.com calls:** route them through edge functions, or delete them with the legacy wizard (`CMP-12`, `PLT-01`). The live non-legacy paths are:
  - `MetaAdsInsightsService`, which also logs the URL with the token at `:50`
  - `CampaignSyncService` via `useMetaCampaignSync`
  - `MetaAdsAccountService`
  - `InstagramIdResolutionService`
- **Accept:** in a full user session in devtools, no response body and no request URL from the app contains `EAA` (the Meta token prefix).

### SEC-13 · Clear and scope client-side caches on logout · 3 h
- In `AuthContext.logout` (`:203-224`), and also on the `SIGNED_OUT` event:

  ```ts
  await supabase.auth.signOut();
  queryClient.clear();
  metaCache.clear();
  clearRoleCache();
  for (const k of ['camply_meta_assets_cache','camply_manual_whatsapp','camply_business_data',
                   'selected_specialization','camply_auto_discover_at','camply_ai_config'])
    localStorage.removeItem(k);
  ```
- Prefix every remaining cache key with `user.id`: the `metaCache` `unified-assets` entry, and the React Query keys `['meta-selection']`, `['campaigns-cache']`, `['account-metrics']` and `['whatsapp-numbers']`.
- Never store `pageAccessToken` in localStorage; strip it before caching in `useMetaAdsAssets.ts`.
- **Accept:** on one browser, log in as A, open the wizard, log out, then log in as B. B sees none of A's accounts, pages or business name, and localStorage holds no `EAA` token.

### SEC-14 · Meta OAuth CSRF protection · 3 h
1. Before opening the popup, generate `state = crypto.randomUUID()`. Store it in `sessionStorage`, plus server-side in a table `oauth_states(user_id, state, created_at)` with a TTL.
2. `MetaCallback.tsx` refuses to proceed unless the `state` in the URL equals the stored one **and** `window.opener` exists.
3. `meta-oauth-exchange` requires `requireUser`. It deletes the `oauth_states` row for `(user.id, state)` and rejects the request if no row was deleted.
4. Remove the regex-only check in `MetaCallbackGeneral:66` and the predictable `meta_ads_oauth_<level>_<ts>` state in `useMetaAdsCredentialValidator:79`.
5. Also fix `meta-oauth-exchange:374-393`:
   - Handle `selErr`.
   - Upsert on `user_id` so reconnects can't create duplicates.
   - Run a one-off dedupe of existing duplicate `integrations` rows.
- **Accept:** a callback URL with a valid `code` and a missing or foreign `state` is rejected, and reconnecting twice leaves exactly one `integrations` row.

### SEC-15 · Cross-tenant writes in campaign functions · 4 h
- **`meta-campaigns-discover:171-178`:** change the upsert to `onConflict: 'user_id,meta_campaign_id'`. The migration is in `DATA-03`. Apply the same change in `meta-oauth-exchange:423`, and delete the dead discovery-* functions.
- **`verify-and-correct-ad-set:145-161`:**
  - Load the caller's own integration: `provider = 'meta_ads'`, with `.eq('user_id', user.id)`.
  - Remove the non-existent `spend` field from the Graph call.
- **`meta-campaign-auto-sync`:** cron only (`SEC-10`), and never return other tenants' ids.
- **`apply-optimization`:**
  - Re-read the current budget from Meta.
  - Clamp the new value to ±30% of **that** number, not the model-supplied `current_value`.
  - Allow only `field ∈ {daily_budget, status}`.
  - Check that `meta_object_id` belongs to one of the caller's campaigns.
- **Accept:** in a two-user test on a shared ad account, each user keeps their own rows. A forged suggestion with a 10× budget is rejected.

### SEC-16 · Stored XSS through `javascript:` URLs · 2 h
- Add `src/lib/safeUrl.ts`. It returns the URL only if the protocol is `http:`, `https:`, `mailto:` or `tel:`; otherwise it returns `'#'`.
- Use it at every URL sink the audit found:
  - `AdminContingency.tsx:836`, `:845-848`
  - `ContingencyCampaignDetails.tsx:182`, `:387`
  - `LeadDrawer.tsx:324`
  - `QuizPublic` → `thank_you_config.ctaUrl`
  - `mapboxUtils.addMarker:116` (use `setText`, or escape the HTML)
- Validate those URLs server-side when they are saved, too.
- **Accept:** a lead with `website = "javascript:alert(1)"` does nothing when clicked.

### SEC-17 · CORS, CSP and logging · 4 h
- **CORS:** replace `Access-Control-Allow-Origin: *` in the 79 functions with `_shared/cors.ts`. Remove its `http://localhost` reflection in production (gate it on `ENV !== 'production'`). Add CORS headers to the 429 responses.
- **CSP:** move it from the `<meta>` tag in `index.html:24` to a Netlify `[[headers]]` block. Remove `'unsafe-eval'`. Allow:
  - `worker-src blob:` and `child-src blob:` for Mapbox
  - `https://www.youtube.com` in `script-src` and `frame-src`
  - `assets.pagar.me` only if `PAY-12` keeps the CDN SDK

  Ship it as `Content-Security-Policy-Report-Only` for 3 days, then enforce.
- **Logging:**
  - Delete the logs that print secrets or PII. These include:
    - `AISuggestionsCard.tsx:64-92` (AI key)
    - `AdminOpenAI.tsx:139`, `AdminPagarme.tsx:169`
    - `Quiz.tsx:151` (lead PII)
    - `EmailConfirmation:47` (OTP hash), `Login:38`
    - `MetaCallbackGeneral` (`code`)
    - `account-insights-read:96`
    - `pagarme-test-connection` (key prefix)
  - Add an ESLint `no-console` rule with an allow-list for `warn` and `error`.
- **Accept:** securityheaders.com grade A− or better, and `grep -rE "apiKey|access_token|secret" src | grep console` returns 0.

---

## 6. Phase 3: Revenue funnel (Week 2, ~42 h) 🟠

**Decide first, with the client (see [Appendix C](#appendix-c-decisions-needed-from-the-client)):**
- Which gateway is canonical. Asaas is what's live today.
- Whether Stripe and the second Pagar.me config store are retired.
- Whether a free trial exists.

The tasks below assume **Asaas as primary, Pagar.me kept for existing subscribers, and Stripe retired.**

### PAY-01 · Signup confirmation flow · 3 h
- **`Register.tsx:61`:** navigate to `/auth/email-confirmation?sent=1&email=…`.
- **`EmailConfirmation.tsx:37-43`:** support two modes.
  - Waiting mode (`sent=1`): show "check your inbox" and a resend button wired to `resendConfirmation`.
  - Verification mode (`token_hash` and `type`).
- **`AuthContext:191`:** set `emailRedirectTo` to `${origin}/auth/email-confirmation`. On success, go to `/onboarding/welcome`.
- **Accept:** a fresh signup sees the inbox screen, the email link lands in onboarding, and resend works.

### PAY-02 · Asaas success and cancel pages · 2 h
- **`CheckoutSuccess.tsx:16-83`:** remove every test and admin string and the "Voltar para Admin Asaas" button. For `provider=asaas`, show "Pagamento recebido" and "check your email to create your password", then poll `check-subscription-status` for up to 60 s.
- **Cancel route:** add `/checkout/cancelado`, or change `cancelUrl` in `asaas-public-checkout` to `/checkout/erro?reason=canceled`.
- **Accept:** a real Asaas sandbox purchase shows customer-facing copy only. The cancel URL renders a page.

### PAY-03 · Asaas annual and installment buyers get an account · 4 h
- In `asaas-webhook`, handle `PAYMENT_CONFIRMED` / `PAYMENT_RECEIVED` for one-off and installment charges, not only subscriptions:
  1. Create or link the user.
  2. Upsert `subscribers` with `plan_type = 'annual'` and `plan_expires_at = +12 months`.
  3. Send the password-setup email.
- Normalise `plan_type` values: monthly buyers currently get `'basic'`, while every other path writes `'premium'`.
- Handle `PAYMENT_REFUNDED`, `PAYMENT_CHARGEBACK_*` and `SUBSCRIPTION_DELETED` / `SUBSCRIPTION_INACTIVATED`. **Verify the exact event names in Asaas's docs.**
- **Accept:** an annual sandbox purchase creates a user who can log in. A refund revokes access.

### PAY-04 · Replace the `listUsers()` email lookups · 2 h
- Every buyer-to-user match calls `auth.admin.listUsers()` with no paging, so it misses everyone after the first 50 users.
- Add a `SECURITY DEFINER` RPC, `get_user_id_by_email(text)`, granted to `service_role` only. Use it everywhere (`grep -r listUsers supabase/functions`).
- **Accept:** matching works for a user created after 60 others on staging.

### PAY-05 · Pagar.me config RPC returns a list · 2 h
- **Affected callers:**
  - `pagarme-subscriptions-cancel:36`
  - `pagarme-subscriptions-reactivate:36`
  - `pagarme-subscriptions-update-card:40`
  - `pagarme-customer-portal:70`
  - plus `plans-sync` and `transactions-create`, which are deleted in `SEC-10`
- **Fix:** call `rpc('get_pagarme_config_for_functions', { p_environment: 'live' }).single()`. Pass the environment that matches the subscription row.
- **Drop the ambiguous no-argument overload** (the 20251007151655 version):
  `drop function if exists public.get_pagarme_config_for_functions();`
- **Accept:** cancelling a sandbox subscription succeeds and reflects in Pagar.me.

### PAY-06 · Link existing users to Pagar.me subscriptions; revoke access on cancel or refund · 4 h
- **Write `user_id` for existing users:**
  - `pagarme-subscribe:954-991` and `pagarme-webhook:318-320` must write `user_id` back to `pagarme_subscriptions` for existing users too.
  - Backfill: `update pagarme_subscriptions ps set user_id = u.id from auth.users u where ps.user_id is null and lower(ps.customer_email) = lower(u.email);`. Check the column name against the live schema first.
- **Revoke on cancel:** `processSubscriptionEvent` (`:185-193`) also updates `subscribers.is_active`, `subscription_status` and `user_entitlements`.
- **Refunds:** in Pagar.me V5 they arrive as charge status `canceled`. Check for that, not `refunded` (`:231`).
- **Accept:** an existing user who subscribes shows as subscribed. Cancelling or refunding removes access within one webhook.

### PAY-07 · Pagar.me management endpoints · 3 h
- **Ownership:** cancel, reactivate and update-card currently act on any subscription id. Require `requireUser` and match `pagarme_subscriptions.user_id = user.id`.
- **`pagarme-customer-portal:26-52`:** use the service client with an ownership filter. The anon client returns 404 every time.
- **V5 semantics:**
  - Update-card should send a `card_token` from the V5 tokenizer, not a V4 `card_hash`.
  - Reactivate: V5 can't reactivate a canceled subscription, so create a new one instead. **Verify against current V5 docs.**
- **Accept:** a user can cancel and update a card; another user's id returns 403.

### PAY-08 · Admin Payments save wipes the Pagar.me secrets · 1 h
- **Where:** `PagarmeAdminConfig.tsx:139-140` always sends `secret_key: null` and `webhook_secret: null`.
- **Fix:**
  - Omit secret fields from the update payload unless the admin typed a new value.
  - In `usePagarmeConfig.ts:128-134`, whitelist the updatable columns.
- **Consolidate onto one config table:** `pagarme_config` is the one most functions read. Migrate any needed `pagarme_settings` values into it, then drop `pagarme_settings` and remove the `AdminPagarme` page writes (`ADM-06`).
- **Accept:** saving the page leaves `secret_key` unchanged (compare its hash before and after).

### PAY-09 · Webhook idempotency and retry · 3 h
- **Current bug:** each webhook inserts the event *before* processing, so a failed event is skipped as a duplicate on retry (`pagarme-webhook:125-134`). The same pattern exists for Stripe and Asaas.
- **New pattern** for every gateway, using a unique constraint on `(provider, event_id)`:
  ```sql
  insert into webhook_events(provider, event_id, status) values ($1,$2,'processing')
  on conflict (provider, event_id) do update set attempts = webhook_events.attempts + 1
    where webhook_events.status <> 'processed'
  returning status;
  ```
  - If no row comes back, the event was already processed: return 200.
  - Otherwise process it, then set `status = 'processed'`. On error set `'failed'` and return 500, so the gateway retries.
- **Accept:** if you force a throw on the first delivery, the retry processes the event.

### PAY-10 · Webhook authenticity: fail closed · 3 h
- **Pagar.me:**
  - Reject the request if no secret is configured.
  - Pick the environment from the URL (`?env=live`, set in the dashboard), never from `event.account.test` in the body.
  - Use the authentication mechanism Pagar.me V5 actually provides (**check current docs**).
  - **Also re-fetch the order, charge or subscription by id from the Pagar.me API before acting.** That makes a forged body harmless.
- **Asaas:**
  - Compare the `asaas-access-token` header with the configured token in constant time. Asaas sends that header; it does not send an HMAC `Asaas-Signature`.
  - Reject the request if the token isn't configured.
  - Re-fetch the payment by id.
- **Stripe:** keep SDK verification until the integration is retired.
- **Accept:** an unsigned or forged body gets 401, and a real sandbox event is processed.

### PAY-11 · Welcome email import path · 0.25 h
- **Where:** `pagarme-webhook:390`.
- **Fix:** change `'./_shared/emailClient.ts'` to a static top-level `import` from `'../_shared/emailClient.ts'`. Then a bad path fails the deploy instead of silently skipping the email.
- **Accept:** a sandbox purchase sends the email.

### PAY-12 · `/checkout` and `/checkout/parcelado` · 5 h
- **Decision:** if Asaas is the primary gateway, **remove both Pagar.me checkout UIs** and point every "Assinar" CTA (`SubscriptionPlans:85`, `PlanSelection`, `GuestCheckoutModal:161`) at the Asaas flow. That is the recommended option.
- **If Pagar.me card checkout must stay:**
  - Replace the vendored `public/vendor/pagarme-js/4.10/pagarme.min.js`. It is a 4.35 CommonJS build that can't run in a browser. Use V5 tokenization (`tokenizecard.js`, or the `/tokens` API with the public key).
  - Render the installments and card modals.
  - Send `buyer.document` and `buyer.address` (`usePagarmeCheckout.ts:57-66`).
  - Pass `plan_id` correctly.
  - Mount `PagarmeCheckoutProvider` for every user, not only admins (`ProvidersPrivados:34`).
  - Never read the amount from `?amount`.
- **Accept:** every plan CTA reaches a working payment page, and no route crashes for non-admins.

### PAY-13 · Post-payment password setup and `must_change_password` · 3 h
- **`/checkout/success`:** move it out of the private `/*` block, so guests can see `PasswordSetupModal`.
- **`PasswordSetupModal.tsx:59-66`:**
  - Fix the stale-closure retry: use a ref counter, max 3 attempts.
  - Keep the button disabled while a retry is pending.
- **`create-guest-user/index.ts:136`:** fix the broken template literal. It should be ``redirectTo: `${SITE_URL}/auth/set-password` ``.
- **`SetPassword.tsx`:**
  - Use the same 8-character complexity policy as Register.
  - Call `set_must_change_password(false)` on success.
- **ProtectedRoute and HomeRouterGate:** send flagged users to `/auth/set-password`, not to `/auth/reset-password` without a hash.
- **`checkout/Success.tsx:95-104`:** remove the claims built from URL parameters, and the `?subscription=active` banner trigger. Show only what the server confirms.
- **Accept:** a guest buyer sets a password once and logs in. The flag is cleared.

### PAY-14 · Server-side paywall · 5 h
- **One source of truth:** add a SQL function `has_active_access(uid)` that covers active, trialing (if trials exist) and within-grace, across all providers.
- **Remove the client write paths:**
  - `subscribers` self-insert and update, already dropped in `SEC-02`.
  - Users editing `profiles.status`.
- **Enforce on the server:**
  - Paid edge functions check it: `simple-campaign-create`, `simple-campaign-activate`, `apply-optimization`, `ai-*`, `metrics-cache-refresh`.
  - They return `402 { code: 'SUBSCRIPTION_REQUIRED' }`.
- **Frontend:** a `RequireSubscription` route wrapper. Unify `useSubscription` and `useTrialPeriod` into one `useAccess()` hook that calls a `get_my_access` RPC.
- **Fix Stripe `past_due` flip-flop** (`stripe-webhook:202-203` vs `subscription-sync:172`) if Stripe stays; otherwise it goes away with Stripe.
- **Accept:**
  - A user with no subscription can browse but gets a paywall on create, and a 402 if they call the function directly.
  - A paid user is unaffected.

### PAY-15 · Single price source · 3 h
- **The current prices disagree:** R$249, 349,99 and 397,99 per month; R$2.000, 2.499, 2.499,99 and 2.999 per year.
- **Fix:**
  - Expose `asaas_plans` (or a `plans_public` view) and render every price from it.
  - Remove the hard-coded prices from `AsaasCheckoutSection.tsx:45,88-95`, `ComparisonTable.tsx:29`, `IAEconomySection.tsx:72`, `DentistComparisonCarousel.tsx:25`, `SubscriptionPlans.tsx:15,29,37`, `PlanSelector.tsx:37`, `AnnualPlanPage`, `DentistLandingPage` and `UsageContract`.
  - Compute the "economize" figures, or delete them.
- **Installment display:** use the gateway's real installment schedule, not compound `amount*(1+r)^n` (`InstallmentsPicker.tsx:57`, `InstallmentsModal.tsx:53`).
- **Accept:** a test asserts that every rendered price equals the DB plan price.

### PAY-16 · Trial · 1 h dev (decision in Appendix C)
- **If there is no trial:** remove "14 dias grátis / 7 dias" from `Welcome.tsx:85-104`, Register, `Cancel.tsx`, `TrialStarted` and the user guide.
- **If there is a trial:** implement it in `has_active_access`, with `trial_ends_at` set at signup.
- **Accept:** the copy matches the behaviour.

---

## 7. Phase 4: Campaign engine (Weeks 2–3, ~48 h) 🟠

### CMP-01 · Honest create results (new response contract) · 5 h
- **Where:** `supabase/functions/simple-campaign-create/index.ts:2252-2332`, `src/hooks/useSimpleCampaignWizard.ts:342-348,547-551` and `SimpleCampaignWizard/index.tsx:44-58`.
- **Contract:**

| Outcome | HTTP | Body |
|---|---|---|
| Created | 200 | `{ success:true, status:'created', campaignId, metaCampaignId }` |
| Deterministic failure (validation, page has no WhatsApp, IG media missing, insufficient funds, Meta 4xx) | 422 | `{ success:false, status:'failed', code, userMessage, metaError? }` (after rollback) |
| Transient Meta failure after rollback (5xx, rate limit) | 202 | `{ success:false, status:'queued', contingencyId, userMessage }` (contingency row for the admin team) |
| Not paid | 402 | `{ code:'SUBSCRIPTION_REQUIRED' }` |

- **Client side:**
  - `supabase.functions.invoke` turns non-2xx into a `FunctionsHttpError`. Read the body with `await error.context.json()` and show `userMessage`. This also replaces today's useless "non-2xx" message.
  - Treat `202 queued` as "Recebemos seu pedido, nossa equipe vai concluir em até X h", **never** as success.
- **Classify errors:** start with codes `PAGE_NO_WHATSAPP` (`:1334`), `IG_MEDIA_MISSING` (`:1834`), `META_PERMISSION`, `META_FUNDS`, `META_INVALID_PARAM`, `META_TRANSIENT` and `INTERNAL`.
- **Update `_tests/e2e`:** S5 currently asserts that an unauthenticated request gets 200.
- **Accept:** a page with no WhatsApp shows the specific pt-BR error and creates nothing on Meta. A forced 500 from Meta shows the "queued" message.

### CMP-02 · Retire the automatic fallback campaign · 1 h
- **Why:** `contingency-auto-retry-walink` builds an OUTCOME_TRAFFIC / LINK_CLICKS campaign the user never asked for, and its build is broken in several places:
  - URL sent as `bytes` (`:444`)
  - `video_id` inside `link_data` (`:490`)
  - missing `advantage_audience`
  - geo with no `key`
  - no rollback
- **Fix:**
  - Delete the function and its trigger or caller.
  - Contingency rows stay for **manual** admin handling (`contingency-manual-sync`).
- **Clean up existing orphans:** list the PAUSED campaigns it created on customer accounts (`campaign_contingency` rows where `status = 'auto_retry_*'`). Delete them via the Graph API with each owner's token, after notifying the client.
- **Accept:** no code path creates a campaign other than the one the user configured.

### CMP-03 · Use the Page and Instagram account the user selected · 3 h
- **Where:** `simple-campaign-create/index.ts:1261,1818-1821`, plus `:226` and `:2175`.
- **Fix:**
  - Use `payload.fanpage` for `promoted_object.page_id` and the creative.
  - Validate it server-side: the page must be in the integration's page list, so call `/me/accounts` with the user's token or use the cached list.
  - Use `payload.instagram` first, falling back to the integration's account.
  - Reject the request (422 `PAGE_NOT_ALLOWED`) if the page doesn't belong to the user.
- **Also:** `InstagramIdResolutionService.ts:199-216` falls back to `accounts[0]`, which is another page's Instagram account. Remove that fallback: no IG account means a Facebook-only placement.
- **Accept:** choosing Page B produces an ad on Page B, and the DB row matches Meta.

### CMP-04 · Step 2 infinite render loop · 1.5 h
- **Where:** `useSimpleCampaignWizard.ts:132` and `Step2_Midia.tsx:165-186`.

  ```ts
  const updateFormData = useCallback(
    (patch: Partial<SimpleCampaignFormData>) => setFormData(prev => ({ ...prev, ...patch })), []);
  // Step2: only write when the value actually changes
  useEffect(() => {
    if (!formData.whatsappNumber) return;
    const link = buildWhatsappLink(formData.whatsappNumber);
    if (link !== formData.whatsappLink) updateFormData({ whatsappLink: link });
  }, [formData.whatsappNumber, formData.whatsappLink, updateFormData]);
  ```
- **Also:**
  - Move `validateCurrentStep()` out of render, into a `useMemo` (`index.tsx:202,211`).
  - Delete the per-render `console.log` of the whole formData (`hook:156-157`).
- **Accept:** React Profiler shows fewer than 5 renders after entering Step 2 with a prefilled number. The console is quiet.

### CMP-05 · Locations: removed ones still targeted, 0,0 coordinates, invalid keys · 5 h
- **`Step4_Local.tsx`:**
  - Removing chips (`:449-461`) and "Limpar todas" (`:464-476`) must also clear `city`, `cityCoordinates` and `radius`.
  - Never store `{latitude: 0, longitude: 0}`; Meta state results have `center: [0,0]` (`:377-383`). Store `{type: 'region', key}` instead.
  - Call `setSelectedCity`, so the radius slider appears (`:660-691`).
  - Deduplicate by `key` (or by lat/lng), not by name.
- **Server (`index.ts:1609-1614,1649`):**
  - Meta city keys go to `geo_locations.cities: [{key, radius, distance_unit: 'kilometer'}]`. Regions go to `regions`, and only lat/lng entries go to `custom_locations`.
  - Remove the legacy single-city fallback. **No `selected_locations` means 422 `NO_LOCATION`**, never a silent default.
  - Validate radius bounds: Meta's ranges for city and custom radii are roughly 17–80 km and 1–80 km. **Verify the current limits.**
- **Hook:** step 4 validation requires at least one entry in `selected_locations`.
- **Accept:**
  - Add 2 cities, remove 1: the ad set targets exactly 1.
  - A state selection targets the region key.
  - Clearing everything blocks Next.

### CMP-06 · WhatsApp link and number normalisation · 2 h
- **Add one shared helper**, `normalizeBrPhone(input) → '55DDDNNNNNNNN'`. Use it in all four places, which today each normalise differently:
  - `hook:390` (frontend)
  - `simple-campaign-create`
  - `lead-quiz-submit:115-123` (only adds +55 to "11" numbers)
  - `WhatsAppManualConfig.tsx:40-45`
- **Rules:**
  - Strip non-digits.
  - 10 or 11 digits → prefix `55`.
  - 12 or 13 digits starting with `55` → keep.
  - Anything else → invalid.
- **Use the normalised link** in `hook:390`, not the raw masked number.
- **Delete the fake `https://wa.me/${pageId}`** fallback (`index.ts:772,2067`). If there's no valid number, return 422.
- **Accept:** unit tests for `(11) 91234-5678`, `21987654321`, `5521987654321`, `+55 (33) 3333-3333` and `123`.

### CMP-07 · Ad set payload correctness · 4 h
- **Dayparting** (`index.ts:1472-1494`):
  - Add `pacing_type: ['day_parting']`, alongside `lifetime_budget` and `end_time`.
  - Compute the lifetime budget from the **selected days only** (`:1481`).
  - Use `timezone_type: 'ADVERTISER'` to match the UI text, or change the text to match `'USER'`.
  - Allow an end hour of 24.
- **Age** (`index.ts:1695-1696`, `utils.ts:36-39`):
  - `clampAge(v, lo, hi)` returns a default (18 for min, 65 for max) when `v` is undefined.
  - Enforce `18 ≤ ageMin ≤ ageMax ≤ 65`.
  - Add a `.refine` with the same rule in `schemas/campaignProfiles.ts`.
- **Reels:**
  - Detect them with `media_product_type === 'REELS'`, not `media_type` (`:1903`).
  - Use `waitVideoReady`, not a 3-second delay (`:1911-1928`).
  - Handle `CAROUSEL_ALBUM`.
- **Retries:**
  - `createAdSetWithInterestRetries` (`:503-512`) drops the WhatsApp number only on the specific Meta error subcode, not on any error.
  - Don't retry POST `/advideos` on network errors without a dedupe check (`:884-897`).
- **Dates:**
  - The end date should be the end of the chosen local day: send `23:59:59` in America/Sao_Paulo, not local midnight via `toISOString()` (`Step3:106`, `hook:449`).
  - Compute `startDate` when the wizard opens or resets, not at module load (`hook:19`). Allow today in the calendar (`Step3:75`).
- **Accept:** create a campaign with dayparting Mon–Fri 9–18 and a 30-day end date. It succeeds on Meta, and Meta shows the right schedule, budget and end time.

### CMP-08 · Idempotent create · 2 h
- **Client:** generate `idempotencyKey = crypto.randomUUID()` when the wizard opens and send it with the create request.
- **Server:** check the key with a unique `campaigns.client_request_id`.
  - If the existing row is complete, return it.
  - If it's in progress, return 409.
- **UI:** disable the submit button while in flight.
- **Accept:** a double-click or refresh during creation produces exactly one Meta campaign.

### CMP-09 · Activate, pause and bulk operations · 3 h
- **`meta-campaign-bulk-operations:94-104`:** activate must cascade campaign → ad sets → ads. Reuse the `simple-campaign-activate` logic; that function cascades correctly. Send DELETE with the token in the header, not the JSON body.
- **`simple-campaign-activate:227-236`:** if the effective status is an error, roll back to PAUSED and update the DB.
- **`useMetaCampaignMutation.ts:21-31,154-165`:**
  - Debounce per campaign id, with a `Map<id, timer>`.
  - Make the debounce stable (`useRef`).
  - Set `isLoading` during the debounce window.
- **`useCampaignMetaOperations`:** never update the DB status when the Meta call failed. Dormant today; delete it in `PLT-01`.
- **Accept:** bulk-activate two campaigns and both deliver. Pause A then B within 300 ms and both pause.

### CMP-10 · Status vocabulary · 3 h
- **Canonical set:** `draft | pending_review | active | paused | finished | error | deleted`. Map Meta `effective_status` to it in one shared function (`_shared/status.ts`), used by:
  - `meta-campaign-refresh-one:185`
  - `meta-sync-actives:181`
  - `simple-campaign-list:111-116`
  - `advantage-campaign-create:288`
  - `contingency-manual-sync`
- **`meta-sync-actives:74`:** select `status in ('active','pending_review')`.
- **CHECK constraint:** see `DATA-05`.
- **Accept:** a campaign moving from in_review to active on Meta shows as active within one sync.

### CMP-11 · Asset loading robustness · 4 h
- **`useUnifiedMetaAssets.ts:137-150`:**
  - Bounded retry: 3 attempts with exponential backoff and a ref counter.
  - Clear the timer on unmount.
  - **No retry on 404 "Integration not found"**; show "Conecte sua conta Meta" instead.
- **`meta-assets-cached:145-208`:** don't cache failures; on error, return the error and keep the previous cache.
- **Follow Graph paging** (`paging.next`) for `me/accounts` and `me/adaccounts` in:
  - `meta-assets`
  - `meta-ads-account-pages`
  - `meta-dynamic-assets`
  - `meta-assets-cached`
  - `meta-oauth-exchange`
- **Rate limiting and circuit breakers:**
  - `meta-dynamic-assets:64-70`: key the limit per user, not `'meta-dynamic-assets-global'`.
  - `meta-whatsapp-assets:20,119-126`: per-user circuit breaker. Also read `client_whatsapp_business_accounts`.
- **Accept:**
  - A user with no Meta connection makes 0 repeated calls (check the Network tab).
  - A test account with more than 25 pages sees all of them.

### CMP-12 · Legacy wizard: retire it · 2 h (deletion is in PLT-01)
- **Redirect** `/dashboard/create-campaign` to `/dashboard/simple-campaign-wizard`, and update `QuickActions.tsx:16`.
- **The old wizard causes:**
  - a crash (no `MapboxProvider`)
  - nationwide targeting via `createEmergencyFallback`
  - invented geo keys
  - duplicate rows
  - campaigns built in the browser with the user's token
  - a wrong optimisation goal
  - immutable-creative "repair"
- **Move** `AdvantageCampaignDemo` (`/dashboard/advantage-campaign`) and `AdSetVerificationDashboard` behind `/admin`.
- **Accept:** no user route reaches the old wizard.

### CMP-13 · Routes and dead CTAs · 2 h
- **`CampaignHeader.tsx:82` and `CampaignEmptyState.tsx:30`:** change the link to `/dashboard/simple-campaign-wizard`.
- **`PrivateRoutes.tsx:171`:** replace the literal-path redirect with a component that reads `useParams()` and navigates to `/dashboard/simple-campaign-insights/${id}`. `CampaignPage` is a stub.
- **Add a `*` route** in PrivateRoutes that renders `NotFound`. Today unknown private URLs render blank.
- **Unauthenticated deep links:** keep the original path (`?next=`) through login.
- **Other broken links:**
  - `AdminSidebar.tsx:104`
  - `RecentCampaigns.tsx:46` (ignores the id)
  - `MetaAdsConnectionStep.tsx:45,54` (should point to `/legal/*`)
- **Accept:** a link-crawl test (`QA-05`) finds no blank or 404 internal routes.

### CMP-14 · AI optimisation correctness · 3 h
- **`ai-evaluate-metrics:122-124`:** count CTWA results as `onsite_conversion.messaging_conversation_started_7d`. Use the shared metric definition from `DATA-02`.
- **`ai-evaluate-metrics:141-146`:**
  - Load `ai_configurations` by `is_active`; there is no `user_id` column.
  - Read `model_name`, not `model`.
- **Bound applied changes** to the real budget (`SEC-15`).
- **Add fetch timeouts** to all `ai-*` LLM calls.
- **Guard `JSON.parse`** in `ai-generate-profile:119` and `quiz-submit:119`.
- **Accept:** a working CTWA campaign with conversations is never told to cut its budget for "0 conversions".

### CMP-15 · `ai-suggestions` 500 and the admin-only AI gate · 2 h
- **The 500:** production returns 500 (see `No/erro solicitação ia.txt`). Get the cause from the function logs; the likely causes are a missing or rotated key, or a config read.
  - Fix it.
  - Return a typed error to the client.
  - The client shows "Sugestões indisponíveis no momento" and lets the user continue without AI.
- **The admin-only gate:** `AISuggestionsCard.tsx:64-92` gates on `camply_ai_config` in localStorage, which only exists in an admin's browser.
  - Remove the gate and the key logging.
  - The browser never holds AI keys. Delete the direct provider calls in `openaiService.ts:111,118,157,347`, `imageGenerationService.ts:137` and `AdminOpenAI.tsx:100`.
  - Then remove `api.openai.com` and `api.deepseek.com` from CSP `connect-src`.
- **Accept:** a customer (non-admin) gets suggestions in Step 1, and the bundle contains no provider URLs.

### CMP-16 · Media uploads · 3 h
- **`lib/upload/resumableUpload.ts`:**
  - Read the URL and anon key from env (`:25-26`).
  - Set `chunkSize: 6 * 1024 * 1024` (`:50`).
  - Use `findPreviousUploads()` / `resumeFromPreviousUpload()`.
  - Refresh the bearer token in `onBeforeRequest`.
  - Use signed URLs if the bucket becomes private.
- **`MediaUpload.tsx:31`:** accept `video/quicktime` and `video/x-msvideo`, and honour `maxSize`.
- **`MediaSelector:136,224`:** wire `isUploading` and block closing mid-upload.
- **Storage INSERT policy** (`20251119135422:47-58`): confirm that TUS uploads pass the `metadata->>'size'` check. If they don't, enforce size in the bucket config (`file_size_limit`, `allowed_mime_types`) instead.
- **Accept:** a 300 MB iPhone MOV uploads, survives a network drop with resume, and shows progress.

---

## 8. Phase 5: Data, admin and analytics (Weeks 3–4, ~32 h) 🟡

### DATA-01 · Advanced Analytics shows fabricated data · 5 h
- **The fakes:**
  - `useAdvancedAnalytics.ts:155-281`: hard-coded trends, a static June series, `conversions = clicks*0.15`, `roas = conv*50/spend`.
  - `useBreakdownAnalysis.ts:77-228`: all static.
  - `useExportData.ts:117-160`: the "PDF" and "XLSX" downloads are plain text.
- **Decision:**
  - **Short term (recommended, 1 h):** hide the route and the nav entry behind a feature flag.
  - **Proper fix (4 h):** build the page from `meta-campaign-daily-insights` and real `breakdowns=age,gender,publisher_platform`, with period-over-period from two real windows. Exports use `jspdf` and a real xlsx writer, or ship CSV only.
- **Also:**
  - Fix the dependency array at `useAdvancedAnalytics.ts:186`.
  - Make `usePerformanceAlerts` use real data.
- **Accept:** every number on the page traces to a Meta API field. No literal metrics remain (grep for `12.5`, `8900` and `0.15`).

### DATA-02 · One metric definition for conversations, CPA and CPC · 3 h
- **Add `_shared/metrics.ts`:**
  - `conversations = messaging_conversation_started_7d`, with no summing of overlapping action types.
  - `costPerConversation = spend / conversations`.
  - `cpc = spend / clicks`.
- **Use it in:**
  - `metrics-cache-refresh:236-249`
  - `account-insights-refresh:97-110`
  - `account-insights-read:163`
  - `meta-campaigns-insights:44-47` (stop labelling CPC as CPA)
  - `ai-evaluate-metrics`
- **Fix the insights labels:** the 30-day vs 7-day tooltip, and "—" instead of "R$ 0,00" when there's no data (`SimpleCampaignInsightsStats.tsx:81-83`).
- **Accept:** the dashboard, insights page and monitoring page show the same conversations count for the same campaign and window.

### DATA-03 · Campaign uniqueness per tenant · 1.5 h
- **Why the existing index isn't enough:** a partial unique index can't be targeted by PostgREST `onConflict`. That's why the code still relies on the global constraint.

  ```sql
  -- verify no per-user duplicates first
  select user_id, meta_campaign_id, count(*) from public.campaigns
   where meta_campaign_id is not null group by 1,2 having count(*) > 1;

  alter table public.campaigns drop constraint if exists campaigns_meta_campaign_id_unique;   -- 20251018155059
  drop index if exists public.uq_campaigns_user_meta_campaign;                               -- partial, 20260221
  alter table public.campaigns
    add constraint campaigns_user_meta_campaign_unique unique (user_id, meta_campaign_id);   -- NULLs stay distinct
  ```
- **Code:** change every `onConflict: 'meta_campaign_id'` to `'user_id,meta_campaign_id'`.
- **Accept:** two users can each own a row for the same Meta campaign.

### DATA-04 · `meta-campaign-auto-sync` zeroes metrics and overruns time · 3 h
- **`:260-356`:** only write metrics fields when the insights fetch succeeded in this run. Write status separately.
- **Process one user per invocation:** the cron fans out via a queue table, so later users are no longer starved.
- **`meta-sync-actives:121`:** skip `null` batch items instead of throwing.
- **Accept:** pausing a campaign in Ads Manager keeps its metrics intact after a sync.

### DATA-05 · Constraints vs code · 2 h
- **Make each CHECK constraint match the values the code writes:**
  - `campaigns.status` (20241228): allow the canonical set from `CMP-10`. Normalise existing rows first, including the uppercase `'PAUSED'`.
  - `campaign_contingency.status` (20251111033915:7): add whatever `auto_retry_*` values remain after `CMP-02`, or drop them.
- **`campaign_metrics_cache`:** change `UNIQUE(campaign_id, date_preset)` to `UNIQUE(user_id, campaign_id, date_preset)` (20260320000000:16).
- **`save-campaign:120,163-167`:** stop `JSON.stringify`-ing values into jsonb columns. Backfill the existing string scalars with `update … set x = x::text::jsonb where jsonb_typeof(x) = 'string'`. Fix `duplicate-campaign:108-109` so the end date can't land before the new start.
- **`useVideoProgress.ts:60,85,122`:** add `onConflict: 'user_id,content_id'`.
- **Accept:** the failing writes from the audit succeed. Check the function logs for 23514 (check violation) and 23505 (unique violation).

### DATA-06 · Neutralise destructive migrations · 0.5 h
- **`20251017204329:2`:** a global `DELETE FROM campaigns WHERE ad_account_id IS NULL`.
- **`20250912144423:2`:** an unconditional `DELETE FROM subscription_plans`.
- **Fix:** replace their bodies with a commented no-op, so a replay (staging, `DATA-10`) can't wipe data. Production already ran them, and the edit doesn't change production.
- **Accept:** grepping the migrations for `delete from` without a `where user_id`, `id` or key filter returns nothing.

### DATA-07 · Remaining RLS and RPC IDOR cleanup · 2 h
- **IDOR RPCs** (`get_user_subscription_with_plan`, `check_user_limit`, `increment_usage`): if anything needs them, recreate them without the `user_uuid` argument (always `auth.uid()`). Otherwise leave them service-role only (`SEC-02`).
- **`handle_new_user`** (20250819132306:97): stop copying `email_verified` from `raw_user_meta_data`.
- **Remove the `profiles_self_update` ability to change `status` and `role`-like columns:** either column-level GRANT, or a trigger that rejects changes to them.
- **`anonymize_old_leads`:** include `answers`, `instagram`, `clinic_name` and `city`. Schedule it monthly via `pg_cron`.
- **Re-run [Appendix A](#appendix-a-live-state-discovery-queries)** and fix every remaining hit.
- **Accept:** Appendix A queries 1–3 return only the documented exceptions.

### ADM-01 · Admin dashboard numbers · 3 h
- **The fakes in `adminDataService.ts:180,199-207`:**
  - `spending = campaigns*50`
  - `activeSubscriptions` = count of non-suspended profiles
  - `topPlan = 'basic'`
- **Fix:** add a `SECURITY DEFINER` RPC, `admin_dashboard_stats()`, gated by `is_admin()`. It returns:
  - real active subscriber counts per provider
  - MRR from plan prices
  - churn from cancellations in the last 30 days
  - campaign counts from `count(*)`
- **Accept:** the numbers match direct SQL counts.

### ADM-02 · Suspend and activate users actually work · 2 h
- **Problem:** there is no admin UPDATE policy on `profiles`, so the change hits 0 rows while the UI shows success. And no code checks `'suspended'`.
- **Fix:**
  - Add an admin RPC `admin_set_user_status(uid, status)`.
  - Enforce suspension in `has_active_access` (`PAY-14`) and in `ProtectedRoute`.
  - Optionally use `auth.admin.updateUserById(uid, { ban_duration })` from an admin edge function.
- **Accept:** a suspended user can't create campaigns or log in, depending on the chosen policy.

### ADM-03 · Admin pages that only show the admin's own rows · 3 h
- **Affected pages:** Client Businesses, Client Campaigns and Notifications. They use owner-only RLS.
- **Fix:** add admin-gated RPCs or `is_admin()` SELECT policies. Never return the `integrations` token columns.
- **Also:**
  - Fix the "all" category filter (`AdminClientBusinesses:29`).
  - Fix the `NaN%` (`AdminClientCampaigns:110`).
  - Remove the PostgREST `.or()` injection: escape the search, or use RPC parameters (`useRealBusinessSettings.ts:39`, `useCampaignProfiles.ts:18`).
  - Add server pagination to every list that currently stops at 1,000 rows.
- **Accept:** an admin sees all clients, paginated.

### ADM-04 · Sectors CRUD (the 3 TypeScript errors) · 1 h
- **Where:** `AdminSectors.tsx:39-50`.
- **Fix:**
  - Pass the prop names the tabs expect: `onAddCategory`, `onUpdateCategory`, `onDeleteCategory`, `onAddSpecialization` and the rest.
  - Supply the `onCreateProfile`, `onUpdateProfile` and `onDeleteProfile` handlers.
  - Wire up the TemplatesTab edit and delete buttons.
- **Accept:** `tsc --noEmit` reports 0 errors, and admin create, edit and delete work in all 4 tabs.

### ADM-05 · Smaller admin fixes · 4 h
- **Plans:** the sync calls `pagarme-plans-sync-v5`, which doesn't exist. Point it at the right function or remove the sync button.
- **Campaign Profiles:**
  - Add `type="button"` to the InterestPicker buttons (`:48,136`), and stop Enter from submitting.
  - "Duplicar" inserts a new row with an editable slug (`ProfilesList.tsx:49-59`).
- **Leads CSV:** escape quotes, and prefix `'` to cells starting with `= + - @` (`LeadsHeader.tsx:52`). Fix the specialty filter (`useLeads.ts:177`) and the filter option source (`AdminLeads.tsx:49`).
- **Meta Test Lab:**
  - Send `dailyBudget: 10` (reais), not 1000.
  - Read `campaign_id` (`CampaignTestPanel.tsx:41,108,114`).
  - Keep it admin-only (`SEC-10`).
- **Contingency page:**
  - Use per-card notes (`:740`).
  - Add null guards (`:617`, `:750`).
  - Align `public_url` / `publicUrl`.
  - Remove the dependency on `previousPendingCount` (`:211,235`).
- **Quiz lead detail:** validate `ai_insights` and `opportunities` shapes before `.map` (`AdminQuizLeadDetail.tsx:172`).
- **Destructive actions:** add confirmation dialogs and `onError` handlers. That covers learning delete, notification delete, contingency archive and integration "Desconectar".
- **Support tickets:** insert one admin notification per admin user id (`useSupportTickets.ts:149-153`).
- **AI config:** the deactivate query uses `.neq` AND `.neq` (`AdminOpenAI.tsx:195-196`). Use a single transaction or an RPC.
- **Fake pages** (AI Media, AI Monitoring, Settings): hide them, or label them "em breve".
- **Accept:** each item's action works on staging.

### ADM-06 · One Pagar.me admin page · 1 h
- Delete `AdminPagarme` (it writes to `pagarme_settings`) once `PAY-08` has consolidated the config into `pagarme_config`.
- Remove the unused import in `App.tsx`.
- **Accept:** one admin page, one table.

---

## 9. Phase 6: Legal, LGPD and consumer claims (parallel, ~10 h dev) 🟡

Most items need content from the client or a lawyer (see [Appendix C](#appendix-c-decisions-needed-from-the-client)). The developer implements the mechanisms.

| ID | Task | Effort |
|---|---|---|
| LGL-01 | **Privacy policy rewrite.** It needs: controller name and CNPJ, a DPO (Encarregado) contact on a company domain (not a personal Gmail), the art. 7 legal bases, the processors actually used (Asaas, Pagar.me, Meta, OpenAI/DeepSeek, Supabase, Netlify, Resend, Mapbox), international transfers, AI processing of business data, quiz lead capture, and retention periods. Fix Terms 5.2, which names Stripe. *Content from the client or a lawyer; dev 1 h.* | 1 h |
| LGL-02 | **Cookie consent banner.** Block non-essential scripts until accepted, and store the consent record. | 2 h |
| LGL-03 | **Data-subject rights in Settings.** Add "Exportar meus dados" (an edge function that returns a JSON or ZIP of the user's rows) and "Excluir minha conta" (soft-delete, revoke the Meta token, cancel subscriptions, hard-delete after 30 days). | 4 h |
| LGL-04 | **Marketing emails off by default.** Make the preference save real (`NotificationsSection.tsx:35-46`), and keep a consent timestamp. | 1 h |
| LGL-05 | **Fix the consent link.** `StepReview.tsx:247` links to `/privacy`; it should be `/legal/privacy`. Add the same consent step and a honeypot to QuizPublic. | 0.5 h |
| LGL-06 | **Remove claims that conflict with the contract or CDC.** Covers:<br>• "Garantia de Resultados" (`DentistLandingPage:581`) and "garante resultados" (`MetaCertificationsSection:62`)<br>• "Sem riscos" and "Sem risco de desperdiçar dinheiro"<br>• "Até 80% mais econômico"<br>• "Suporte 24/7" and "Parcelamento sem juros" (unless true)<br>• the invented stats and testimonials, and the "Meta Certified" badges<br>• the fake support number `5511999999999`<br>• "Oferta Limitada – Últimas Vagas"<br>Reconcile the contract (annual-only, early-termination clause) with "cancele quando quiser". *Copy from the client.* | 1.5 h |

**Accept:** the client signs off on each page's text. Consent is stored. Export and delete work end to end on staging.

---

## 10. Phase 7: Platform hygiene (Weeks 4–5, ~30 h) ⚪

| ID | Task | Effort |
|---|---|---|
| PLT-01 | **Delete dead code.** That's 272 unimported frontend files (about 40k lines; regenerate `orphans.txt` with `npx knip` or `ts-prune` first), the legacy wizard tree from `CMP-12`, the duplicate hooks the audit grouped into clusters (keep the canonical one of each), and the deleted functions from `SEC-10`. Do it in 3 PRs (components, hooks/services, functions), each verified with `vite build`, `tsc` and a smoke test. | 8 h |
| PLT-02 | **Dependencies:**<br>• Remove `facebook-nodejs-business-sdk` (Node-only, unused in `src`), `@supabase/auth-helpers-react` and `react-input-mask` (use a small controlled mask).<br>• Move `@types/*` to devDependencies.<br>• Upgrade `jspdf` per `npm audit`.<br>• Align vitest with vite: use vitest 2.x with vite 5, or upgrade vite. Then remove `.npmrc legacy-peer-deps`.<br>• Document Node ≥ 20. | 4 h |
| PLT-03 | **Unify the Graph API version.** Put `META_GRAPH_VERSION = 'v23.0'` in `_shared`. Replace v19/v21/v22 in the 8 functions and any remaining browser services. Replace `instagram_actor_id` with `instagram_user_id`. | 3 h |
| PLT-04 | **Bundle.** Lazy-load the admin, landing, quiz and checkout route groups with `React.lazy`. Add `manualChunks` for mapbox, recharts and jspdf. Target: initial JS under 500 KB gzipped (today it's 1.4 MB). | 4 h |
| PLT-05 | **TypeScript.** Wire in the generated `Database` type: `createClient<Database>`, regenerated from the live DB. Enable `strictNullChecks` per folder, starting with `supabase/functions/_shared` and `src/hooks`. Bring ESLint to 0 errors on changed files (CI gate). | 5 h |
| PLT-06 | **Shared server modules.** Adopt `_shared/errors.ts`, `response.ts` and `logger.ts` (no function imports them today) in every function touched in Phases 2–4. | 2 h |
| PLT-07 | **Docs.** Correct `phase-tracker.md` (the phases are not 100%) and `project-status.md` (RLS and webhooks are not "strong"). Fix README/deployment-guide: secret names, function and migration counts, the CI claim, the cron claim. Mark the API-spec HTML as "proposal, not implemented" and remove the real client's name and handle from it. Add this plan's status table. | 2 h |
| PLT-08 | **Misc.** Add a robots.txt disallow for `/admin` and `/dashboard`. Stop marking the unhashed `public/assets/images` files `immutable` in `netlify.toml`. Fix `.gitignore` versus the tracked `docs/plan.md`, `deno.lock` and `No/`. Remove the hard-coded project URL and anon key from `useAsaasPublicCheckout`, `PasswordSetupModal` and `MetaCallback`. Fix the auth deadlock risk: move the awaited `profiles` query out of `onAuthStateChange` with `setTimeout(…, 0)` (`AuthContext.tsx:103-140`). Give each notifications realtime channel a unique name and a `user_id` filter (`useNotifications.ts:159-195`). | 2 h |

---

## 11. Phase 8: Tests and QA (continuous, ~30 h)

| ID | Task | Effort |
|---|---|---|
| QA-01 | **Replace the 6 vitest files**, which re-implement the logic inline, with tests that **import app code**: `normalizeBrPhone`, `buildWhatsappLink`, `TargetingSpecBuilder`, `budgetUtils`, the price source, `safeUrl`, the status mapper and the metrics definitions. Use a real HMAC (Web Crypto) in the webhook tests. | 6 h |
| QA-02 | **Fix the Deno test mocks** so `.eq()` filters apply and `getUser` can fail. Add negative tests: unauthenticated → 401, foreign id → 403/404, deterministic Meta error → 422 with rollback. Update e2e S5 and S8, and restore the global `setTimeout`. Install Deno in CI. | 6 h |
| QA-03 | **Security probe script** (`scripts/security-probe.ts`): calls every deployed function and every RPC with (a) no auth, (b) the anon key, (c) user A against user B's ids. Fails on any 2xx that shouldn't happen. Run it after every deploy. | 4 h |
| QA-04 | **E2E smoke with Playwright, on staging:**<br>1. signup → confirm → onboarding<br>2. Asaas monthly sandbox purchase → account → login<br>3. connect Meta (test app) → create CTWA campaign → appears in list → activate → pause<br>4. cancel subscription → paywall<br>5. logout → login as another user → no leaked assets | 8 h |
| QA-05 | **Link crawler** over all routes as anon, user and admin. Fails on blank screens, 404s or console errors. | 2 h |
| QA-06 | **CI** (GitHub Actions): `tsc`, `eslint` on changed files, `vitest`, `deno test`, `vite build`, a bundle-size budget and `npm audit --omit=dev`. Block merges on failure. | 4 h |

---

## 12. Release sequence and rollback

| Release | Contents | Rollback |
|---|---|---|
| R1 (Day 1) | SEC-01…06 (SEC-02 migration and SEC-04 frontend ship together) | SQL down-file for SEC-02; Netlify "publish previous deploy" |
| R2 (end of Week 1) | SEC-10…17 | Per-function: `supabase functions deploy <fn>` from the previous tag |
| R3 (mid Week 2) | PAY-01…11, PAY-13 | Function redeploy; webhook events are re-processable thanks to PAY-09 |
| R4 (end of Week 2) | PAY-12, 14, 15, 16. **Paywall: announce 48 h ahead** | Feature flag `PAYWALL_ENFORCED` |
| R5 (Week 3) | CMP-01…10 | Feature flag `CREATE_V2_CONTRACT` keeps the old response shape for one release |
| R6 (Week 3–4) | CMP-11…16, DATA-*, ADM-* | Migrations have down-files |
| R7 (Week 5) | LGL-*, PLT-*, QA-06 | Not needed: cleanup, with the content approved |

Tag every release in git (`audit-r1` … `audit-r7`). Record the function versions deployed in each release in `docs/security/releases.md`.

---

## Appendix A. Live-state discovery queries

Run these in the production SQL editor before and after Phase 1 (`PRE-04`, `DATA-07`).

```sql
-- 1. Permissive or suspicious RLS policies
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname in ('public','storage')
  and ( qual = 'true' or with_check = 'true'
        or qual ilike '%auth.uid() is null%' or 'public' = any(roles) )
order by 1, 2, 3;

-- 2. SECURITY DEFINER functions callable by anon or authenticated
select p.oid::regprocedure as fn,
       has_function_privilege('anon', p.oid, 'execute')          as anon_exec,
       has_function_privilege('authenticated', p.oid, 'execute') as auth_exec,
       pg_get_function_result(p.oid)                              as returns
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef
order by anon_exec desc, auth_exec desc, 1;

-- 3. Public tables without RLS
select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;

-- 4. Column grants on secret columns
select table_name, column_name, grantee, privilege_type
from information_schema.column_privileges
where table_schema = 'public'
  and column_name ~* '(secret|api_key|access_token|password|webhook)'
  and grantee in ('anon','authenticated');

-- 5. Buckets
select id, public, file_size_limit, allowed_mime_types from storage.buckets;

-- 6. Scheduled jobs
select jobid, schedule, command, active from cron.job;

-- 7. Check constraints actually in production (vs repo)
select conrelid::regclass, conname, pg_get_constraintdef(oid)
from pg_constraint where contype = 'c' and connamespace = 'public'::regnamespace;
```

---

## Appendix B. Traceability: audit finding → task

| Audit finding | Task |
|---|---|
| Supabase PAT in `.claude/settings.local.json` | SEC-01 |
| Live Pagar.me keys in migration 20251007161324 | SEC-03 |
| `pagarme_settings` public SELECT | SEC-02 |
| Secret RPCs: stripe/pagarme/asaas/meta config, `get_global_setting`, `get_active_pagarme_config`, `get_pagarme_config_public` | SEC-02, SEC-04 |
| `upsert_meta_ads_config` writable by anon | SEC-02 |
| Meta app secret sent to the browser and to `meta-validation` | SEC-04 |
| `meta-validation` param mismatch and fake `isValid` | SEC-04 |
| IDOR RPCs (`get_user_subscription_with_plan`, `check_user_limit`, `increment_usage`) | SEC-02, DATA-07 |
| Sector CRUD RPCs without a role check | SEC-02 |
| `setup-password` account takeover | SEC-05 |
| Email relays (`send-*`) | SEC-06, SEC-10 |
| Open paid AI (`ai-suggestions`, `quiz-lead-scoring`, `quiz-submit`) | SEC-06, SEC-10 |
| Open service-role functions (`subscription-sync`, `metrics-cache-refresh`, `auto-verify-ad-sets`, `edge-log-persist`, `security-monitor`, `meta-campaign-auto-sync`, `test-*`) | SEC-06, SEC-10, SEC-11 |
| `verify_jwt` treated as protection | SEC-10 |
| No cron jobs defined | SEC-11 |
| Tokens returned or logged (`save-asset-selection`, `select('*')`, InsightsService URL log) | SEC-12 |
| Unscoped localStorage and React Query caches; logout clears nothing | SEC-13 |
| OAuth `state` never validated; duplicate integrations | SEC-14 |
| Cross-tenant: discover upsert, verify-and-correct, auto-sync, apply-optimization | SEC-15, DATA-03 |
| Storage SELECT without an owner check | SEC-02 |
| `javascript:` URL sinks (contingency, leads, quiz CTA, mapbox popup) | SEC-16 |
| CORS `*`, weak CSP, CSP blocking Mapbox, YouTube and Pagar.me | SEC-17 |
| Signup lands on an error page | PAY-01 |
| Asaas success page shows test/admin text; missing cancel route | PAY-02 |
| Asaas annual buyers get no account; `plan_type` mismatch; refunds unhandled | PAY-03 |
| `listUsers()` unpaged | PAY-04 |
| Pagar.me RPC list-vs-row; ambiguous overload | PAY-05 |
| Existing Pagar.me users never linked; cancel/refund keeps access | PAY-06 |
| Pagar.me cancel/reactivate/update-card IDOR; portal always 404; V4 semantics | PAY-07 |
| Admin Payments save wipes secrets; two config stores | PAY-08, ADM-06 |
| Failed webhook never retried; race-prone dedupe | PAY-09 |
| Pagar.me webhook fails open, env from body; Asaas wrong auth | PAY-10 |
| Welcome email import path | PAY-11 |
| `/checkout` never submits; `/parcelado` crashes; SDK unloadable | PAY-12 |
| Password setup unreachable, retry loop, malformed `create-guest-user` link, `must_change_password` dead end | PAY-13 |
| No paywall; self-subscribe; Stripe `past_due` flip-flop | PAY-14 |
| Prices inconsistent; false "Economize"; installment math | PAY-15 |
| Trial promised but nonexistent | PAY-16 |
| Failure shown as success; contingency at 200 | CMP-01 |
| Auto-retry builds a different, broken campaign; orphans | CMP-02 |
| Selected Page/IG ignored; wrong IG fallback | CMP-03 |
| Step 2 infinite loop | CMP-04 |
| Removed locations targeted; 0,0; city keys as custom_locations; fake keys; nationwide fallback | CMP-05, CMP-12 |
| WhatsApp link missing 55; quiz numbers; fake `wa.me/pageId` | CMP-06 |
| Dayparting `pacing_type`; age 13; Reels; dates off by one | CMP-07 |
| No idempotency on create | CMP-08 |
| Bulk activate doesn't cascade; shared debounce | CMP-09 |
| Status vocabulary drift | CMP-10, DATA-05 |
| Asset retry loop; cached failures; no paging; global rate limit/breaker | CMP-11 |
| Legacy wizard crash, duplicates, browser Graph | CMP-12 |
| "Nova Campanha" dead route; `/campaign/:id`; no catch-all | CMP-13 |
| AI optimisation reads CTWA as 0; wrong config columns | CMP-14 |
| `ai-suggestions` 500; admin-only AI gate; AI keys in the browser | CMP-15 |
| TUS chunk size, resume, token expiry; MOV rejected | CMP-16 |
| Fake Advanced Analytics and exports | DATA-01 |
| Conversations double-counted; CPA = CPC | DATA-02 |
| `meta-campaign-auto-sync` zeroes metrics | DATA-04 |
| CHECK constraints, metrics cache key, jsonb strings, video progress upsert | DATA-05 |
| Global DELETE migrations | DATA-06 |
| `email_verified` spoofable; profile self-update; `anonymize_old_leads` | DATA-07 |
| Admin revenue `campaigns × 50` | ADM-01 |
| Suspend affects 0 rows | ADM-02 |
| Admin client pages show only own rows; `.or()` injection; 1,000-row caps | ADM-03 |
| AdminSectors TypeScript errors | ADM-04 |
| Plans sync missing function; InterestPicker; Duplicar; CSV injection; Test Lab budget; contingency bugs; quiz-lead crash | ADM-05 |
| Privacy policy, cookies, data rights, marketing default, `/privacy` link, claims | LGL-01…06 |
| 272 dead files; dependencies; Graph versions; bundle; TS strictness; docs drift | PLT-01…08 |
| Tests don't import app code; mocks always authenticate | QA-01, QA-02 |

---

## Appendix C. Decisions needed from the client

These block or shape specific tasks. Get the answers before the phase that needs them.

| # | Question | Blocks | Recommendation |
|---|---|---|---|
| 1 | Which gateway is canonical for new sales: Asaas, Pagar.me or both? Retire Stripe? | PAY-03, 07, 12, SEC-10 | Asaas for new sales; keep Pagar.me only for existing subscribers; retire Stripe |
| 2 | What are the official prices (monthly, annual, installments) and the annual-plan terms? | PAY-15, LGL-06 | One monthly and one annual price, taken from the DB |
| 3 | Is there a free trial? How long, and does it need a card? | PAY-14, PAY-16 | No trial, or 7 days without a card, enforced on the server |
| 4 | What happens to users without a subscription when the paywall goes live (grandfathering)? | PAY-14 | 7-day notice, then enforce |
| 5 | Private media bucket with signed URLs, or public with unguessable paths? | SEC-02, CMP-16 | Private |
| 6 | Controller identity, CNPJ, DPO contact and retention periods for the privacy policy | LGL-01 | Needs the client or a lawyer |
| 7 | Keep or hide Advanced Analytics until it uses real data? | DATA-01 | Hide now; rebuild later |
| 8 | Approve the customer messages for the Meta reconnect (after the secret rotation) and the paywall launch | SEC-03, PAY-14 | Dev drafts, the client approves |
| 9 | Delete the orphan PAUSED campaigns that the auto-retry created on customer ad accounts? | CMP-02 | Yes, after notifying the affected customers |

---

## Appendix D. Status tracker

Update this table as work lands. One row per task ID; the status values are ⬜ todo, 🟦 in progress, ✅ done and ⏸ blocked.

| Phase | Tasks | Status | Notes |
|---|---|---|---|
| 0 | PRE-01…06 | ⬜ | |
| 1 | SEC-01…06 | ⬜ | |
| 2 | SEC-10…17 | ⬜ | |
| 3 | PAY-01…16 | ⬜ | Blocked on Appendix C #1–4 |
| 4 | CMP-01…16 | ✅ 2026-11-08 | No auto-retry orphans existed in production (CMP-02 clean-up not needed). Storage INSERT is already allowed by "Users can upload their own media". Close-out 2026-11-08: CMP-06 helper also in `lead-quiz-submit`, Quiz and `WhatsAppManualConfig`; CMP-07 profile schema 18–65 with `.refine`; bulk-operations returns 401; `error`/`deleted` added to `LiveCampaign.status`. `campaigns.status` has no CHECK in production (added in DATA-05). Carried to later phases: legacy wizard file deletion (PLT-01), the private bucket decision (Appendix C #5) |
| 5 | DATA-01…07, ADM-01…06 | ✅ 2026-11-09 (ADM-06 deferred) | Migrations 20261108000010–017, 020–029 applied. DATA-01: Advanced Analytics hidden behind `VITE_FEATURE_ADVANCED_ANALYTICS` (rebuild pending); fake breakdown/demo data removed. DATA-04 uses `last_status_sync_at` as a round-robin cursor (full status pass ≈ 1 h). DATA-07 also closed `subscribers` self-write, template RPCs and `user_roles` admin self-promotion (super_admin only). Re-verification fixed the hourly `auto-verify-ad-sets` cron (401 since SEC-10 + 9 orphan test rows). SEC-12 completed: browser can no longer read `integrations.access_token/refresh_token/app_secret` (column grants, 027). ADM-03: every admin list now server-paginated; subscriptions list includes Pagar.me (028). Still open: ADM-06; `useMetaCampaignManagement`/`useMetaCampaignSync` (unreached) and other dead token readers → PLT-01 |
| 6 | LGL-01…06 | ✅ dev 2026-11-09 — client sign-off pending | Export/delete account (30-day grace, `purge-deleted-accounts` daily cron removes Storage files then `hard_delete_pending_accounts()`), marketing opt-in off by default with server-stamped consent, cookie banner + `cookie_consents` (no tracking scripts exist today), privacy/terms factual fixes, quiz consent + honeypot, 21 claims changed. Client must approve `docs/legal/client-legal-checklist.md` and `docs/legal/marketing-claims-changes.md` (Appendix C #6) |
| 7 | PLT-01…08 | ⬜ | |
| 8 | QA-01…06 | ⬜ | |
