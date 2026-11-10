# Camply — Deployment Guide

> Last updated: 2026-11-09 (rewritten for audit task PLT-07: secret names, counts, CI, cron and the
> real deploy process). Shipped releases and rollback steps: `docs/security/releases.md`.
> **Never write secret values or keys into this file or any other file in the repo.**

## Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Netlify CDN    │     │   Supabase       │     │   Meta Graph     │
│   (Frontend)     │────▶│   Edge Functions │────▶│   API v23.0      │
│   React + Vite   │     │   + PostgreSQL   │     │                  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
                                  │
                                  ├──── Pagar.me / Asaas / Stripe (legacy)
                                  ├──── OpenAI / DeepSeek
                                  ├──── Resend (emails)
                                  └──── pg_cron + pg_net (scheduled jobs)
```

- Frontend: `https://camplyia.netlify.app`. `iacamply.com` is the intended custom domain; on
  2026-11-03 it did not resolve in DNS, so `SITE_URL` points to the Netlify domain until it does.
- Backend: one Supabase project (production). There is no staging project yet.

---

## Prerequisites

- Node.js 20+ and npm
- Supabase CLI (`npx supabase`), logged in with a personal access token that is **not** stored in the repo
- `psql` / `pg_restore` (PostgreSQL client 15+) and the database connection string (pooler host), kept outside the repo
- Deno 2.x (only to run the edge-function tests locally)

---

## Repository facts (2026-11-09)

| Item | Count | How to recount |
|---|---|---|
| Edge functions | 72 (plus `_shared/` and `_tests/`) | `ls supabase/functions` (exclude names starting with `_`) |
| SQL migrations | 155 files (plus `rollback/`) | `ls supabase/migrations/*.sql \| wc -l` |

---

## CI

GitHub Actions, `.github/workflows/ci.yml`, on every push and pull request:

1. `tsc` type-check
2. `vitest` (frontend unit tests)
3. `deno test` (edge-function tests in `supabase/functions/_tests`)
4. `vite build`
5. bundle-size budget on the built JS
6. `npm audit --omit=dev`

CI does **not** deploy anything. Deploys are the manual steps below.

---

## Frontend deployment (Netlify)

**Process:** merge/push to `main` → Netlify runs `npm run build` and publishes `dist/`.

`netlify.toml` holds:
- the SPA redirect (`/*` → `/index.html`, 200);
- security headers (HSTS, `X-Frame-Options`, `nosniff`, Referrer/Permissions policy) and the CSP,
  currently `Content-Security-Policy-Report-Only` (audit SEC-17: switch to enforcing after a clean
  observation window and remove the `<meta>` CSP from `index.html`);
- caching: `immutable` for 1 year only on Vite's hashed `/assets/*.js` and `/assets/*.css`;
  `public/assets/images/*` (not hashed) get `max-age=86400, must-revalidate`.

Frontend build variables (Netlify → Site settings → Environment variables): `VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`, optional `VITE_FEATURE_ADVANCED_ANALYTICS`.

**Rollback:** Netlify → Deploys → pick the previous good deploy → "Publish deploy".

---

## Edge functions

Deploy one function at a time, from a clean checkout of the commit you are releasing:

```bash
npx supabase functions deploy <function-name> --project-ref <PROJECT_REF> --use-api
```

- `--use-api` bundles on Supabase's side (no local Docker needed).
- `_shared/` is bundled into each function. When a `_shared/` module changes, redeploy every function
  that imports it (`grep -rl "_shared/<module>" supabase/functions`).
- Per-function settings (for example `verify_jwt`) are in `supabase/config.toml`.
- Removing a function from the repo does not remove it from production: also run
  `npx supabase functions delete <name> --project-ref <PROJECT_REF>`.
- Record every function you deploy in `docs/security/releases.md`.

**Rollback:** `git checkout <previous-good-sha> -- supabase/functions/<fn> supabase/functions/_shared`
(or a worktree at that commit), then deploy that function again.

### Function secrets

Set with `npx supabase secrets set NAME=<value> --project-ref <PROJECT_REF>` (values are entered by
hand, never committed). List with `npx supabase secrets list --project-ref <PROJECT_REF>`.

This list comes from every `Deno.env.get(...)` in `supabase/functions` (2026-11-09).

| Secret | Required | Used by / purpose |
|---|---|---|
| `CRON_SECRET` | **Yes** | `_shared/auth.ts`: scheduled calls must send it in `x-cron-secret`. The same value must be in Vault as `cron_secret` (see Cron) |
| `SITE_URL` | **Yes** | Links in auth emails and redirects (`send-account-creation`, `create-guest-user`, `pagarme-webhook`, `pagarme-customer-portal`). Currently `https://camplyia.netlify.app` |
| `PAGARME_ENV` | **Yes** | `live` in production, `test` elsewhere. Picks which Pagar.me key/webhook secret is used |
| `PAGARME_SECRET_KEY_LIVE` / `PAGARME_SECRET_KEY_TEST` | Recommended | `_shared/pagarme.ts`. Overrides the key stored in `pagarme_config` |
| `RESEND_API_KEY` | **Yes** (for email) | Transactional email via Resend |
| `EMAIL_FROM`, `EMAIL_REPLY_TO` | Optional | Sender/reply-to for emails (default sender `Camply <noreply@iacamply.com>`) |
| `ALLOWED_ORIGINS` | Optional | Extra CORS origins, comma-separated, added to the defaults in `_shared/cors.ts` |
| `ALLOW_LOCALHOST_ORIGINS` | **Never in production** | Allows `http://localhost` origins for local development |
| `OPENAI_API_KEY` / `DEEPSEEK_API_KEY` | Optional | Fallback AI keys for `ai-evaluate-metrics` when not configured in `ai_configurations` |
| `AI_QUOTA_PER_HOUR`, `AI_QUOTA_PER_DAY` | Optional | Per-user AI quota (defaults 20 / 100) |
| `META_API_VERSION` | Optional | Overrides the Graph API version from `_shared` (default `v23.0`) |
| `META_SYSTEM_USER_TOKEN` | Optional | `ai-generate-profile` interest lookup |
| `STRIPE_SECRET_KEY` | Legacy | Only `check-subscription` (Stripe is legacy) |
| `PAUSE_AUTO_SYNC` | Optional | `true` makes `meta-campaign-auto-sync` a no-op (kill switch) |
| `VIDEO_WAIT_TIMEOUT_MS` | Optional | How long `simple-campaign-create` waits for Meta video processing |
| `MCC_DISABLE_SERVE`, `SCC_DISABLE_SERVE` | Tests only | Stop `meta-campaigns-cached` / `simple-campaign-create` from serving when imported by tests. Never set in production |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Provided | Injected by Supabase; do not set |

**Not function secrets:** the Meta app ID/secret, Asaas, Pagar.me and Stripe API keys and webhook
secrets, and the AI provider keys/models are stored in the database by admins (admin panel) and read
by functions through service-role-only RPCs (`get_meta_ads_config`, `get_asaas_config_for_functions`,
`get_pagarme_config_for_functions`, `get_stripe_config_for_functions`) or the `ai_configurations`
table. Older docs listed `META_APP_ID`, `META_APP_SECRET`, `ASAAS_API_KEY`, `TOKEN_ENCRYPTION_KEY`,
`PAGARME_API_KEY` and `STRIPE_WEBHOOK_SECRET` as secrets; no function reads them.

---

## Database migrations

> **Never run `supabase db push`.** The production migration history (`supabase_migrations.schema_migrations`)
> was recorded with timestamps that do not match the local file names, so `db push` would try to re-run
> every migration.

Process for each new migration file, in file-name order:

1. Take a backup first (see Backups).
2. Apply the file on its own, in one transaction:
   ```bash
   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -1 -f supabase/migrations/<version>_<name>.sql
   ```
   Migration files do not contain `begin`/`commit`; `-1` wraps the file in a single transaction.
3. Record it:
   ```sql
   insert into supabase_migrations.schema_migrations (version, name)
   values ('<version>', '<name>');
   ```
4. Run the acceptance check from `docs/audit-fix-plan.md` for that task.

`DATABASE_URL` is the production connection string (pooler host). Keep it in your shell or a password
manager, never in the repo. Some migrations have a down-file in `supabase/migrations/rollback/`.

### Backups

Before each release:

```bash
pg_dump "$DATABASE_URL" -Fc -f db_backups/prod_<date>_<label>.dump
```

`db_backups/` lives **outside the repo**. Restore (into a scratch database first):

```bash
pg_restore --clean --if-exists --no-owner -d "$TARGET_DATABASE_URL" db_backups/prod_<date>_<label>.dump
```

---

## Scheduled jobs (pg_cron)

Created by migrations, not by hand. They call edge functions through `public.invoke_cron_function()`
(`20261102000005_cron_jobs.sql`, timeout raised to 150 s in `20261102000009_cron_timeout.sql`), which
reads two Vault secrets and sends `x-cron-secret`:

```sql
-- one-time setup (values typed by hand, not committed)
select vault.create_secret('<same value as CRON_SECRET>', 'cron_secret');
select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
```

Schedules are UTC.

| Job | Schedule | Calls |
|---|---|---|
| `camply_meta_campaign_auto_sync` | `*/10 * * * *` (every 10 min) | `meta-campaign-auto-sync` |
| `camply_subscription_sync_all` | `0 */6 * * *` (every 6 h) | `subscription-sync` `{"mode":"sync_all"}` |
| `camply_subscription_expire_grace` | `30 */6 * * *` (every 6 h, at :30) | `subscription-sync` `{"mode":"expire_grace"}` |
| `camply_metrics_refresh_all` | `*/15 * * * *` (every 15 min) | `metrics-cache-refresh` `{"mode":"refresh_all"}` |
| `camply_metrics_check_alerts` | `5 * * * *` (hourly, at :05) | `metrics-cache-refresh` `{"mode":"check_alerts"}` |
| `camply_auto_verify_ad_sets` | `10 * * * *` (hourly, at :10) | `auto-verify-ad-sets` |
| `camply_anonymize_old_leads` | `0 3 1 * *` (monthly, 1st at 03:00) | SQL `public.anonymize_old_leads()` (`20261108000016`) |
| `camply_hard_delete_accounts` | `0 4 * * *` (daily 04:00) | `purge-deleted-accounts` (removes Storage files, then `hard_delete_pending_accounts()`; `20261109000004`) |

There is **no** scheduled clean-up of `edge_function_logs`; the example in
`20260321000000_add_edge_function_logs.sql` is commented out.

Legacy job `meta-campaign-auto-sync-job` (id 1) is still present. It belongs to
`supabase_read_only_user` and cannot be removed without Supabase support. It fails with 401 every
10 minutes and is harmless.

Check runs:

```sql
select jobid, jobname, schedule from cron.job order by jobname;
select * from cron.job_run_details order by start_time desc limit 20;
```

---

## Meta app configuration

1. [developers.facebook.com](https://developers.facebook.com) → the Camply app.
2. App Review for: `pages_show_list`, `pages_read_engagement`, `instagram_basic`, `ads_management`,
   `business_management`, `whatsapp_business_management`.
3. Live mode.
4. Put the app ID/secret in the admin panel (Meta Ads settings), not in function secrets.

### Webhook endpoints

- Pagar.me: `https://<PROJECT_REF>.supabase.co/functions/v1/pagarme-webhook`
- Asaas: `https://<PROJECT_REF>.supabase.co/functions/v1/asaas-webhook`
- Stripe (legacy): `https://<PROJECT_REF>.supabase.co/functions/v1/stripe-webhook`

Webhook secrets are stored in the gateway config tables via the admin panel.

---

## Release checklist

1. CI green on the commit.
2. Backup (`pg_dump`, see Backups).
3. Apply new migrations one by one (psql `-1` + `schema_migrations` insert).
4. Deploy changed functions (`--use-api`); delete removed ones.
5. Push to `main` → Netlify deploy. Ship frontend and migrations together when a migration changes
   what the browser may read.
6. Smoke tests (anon key against protected functions → 401/403; log in; create a campaign; switch users).
7. Record the release in `docs/security/releases.md`.

---

## Testing

```bash
npm test                                  # vitest
npx tsc --noEmit -p tsconfig.app.json     # type-check
npm run lint                              # ESLint
deno test supabase/functions/_tests       # edge-function tests (needs Deno)
```

---

## Monitoring in production

- Supabase Dashboard → Logs → Edge Functions
- Admin panel → Logs de Sistema (`/admin/edge-logs`), backed by `edge_function_logs`
- `cron.job_run_details` for scheduled jobs
- Dashboard → Monitoramento (`/dashboard/monitoring`): active campaigns, alerts, API usage
