# Audit remediation: deploy checklist (Phases 1–2)

Code changed locally on 2026-11-02. **Nothing has been deployed.** Run everything on staging first, then production.

## 0. Before anything
- [ ] Revoke the old Supabase personal access token (Dashboard → Account → Access Tokens).
- [ ] Take a production backup: `supabase db dump --linked -f prod_<date>.sql`.
- [ ] Run the Appendix A queries in `docs/audit-fix-plan.md` and save the output.

## 1. Secrets (Supabase → Edge Functions → Secrets)
- [ ] `CRON_SECRET`: a long random value.
- [ ] `SITE_URL=https://camplyia.netlify.app`. On 2026-11-03 `iacamply.com` did not resolve in DNS. Switch back once the domain is live again.
- [ ] Auth → URL Configuration: add `https://camplyia.netlify.app/**` to the redirect URLs. Production `site_url` is `https://iacamply.com`, so every auth email currently links to a dead domain.
- [ ] `PAGARME_ENV=live`, or `test` on staging.
- [ ] Optional: `AI_QUOTA_PER_HOUR` (default 20) and `AI_QUOTA_PER_DAY` (default 100).
- [ ] Do **not** set `ALLOW_LOCALHOST_ORIGINS` in production.
- [ ] Vault, from the SQL editor:
  ```sql
  select vault.create_secret('<same CRON_SECRET>', 'cron_secret');
  select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
  ```

## 2. Migrations, in order
**Do not run `supabase db push`.** Production's migration history was recorded with different timestamps, so `db push` would re-run all 127 files. Apply each file on its own, inside a transaction, then insert its version into `supabase_migrations.schema_migrations`.

Production is also missing 3 earlier migrations (checked 2026-11-02). Apply these first:
- `20260317000000_add_campaign_scheduling.sql`
- `20260317100000_add_subscription_lifecycle.sql` (the grace-period cron job needs it)
- `20260321000000_add_edge_function_logs.sql` (`edge-log-persist` needs it)

| File | What it does | Risk |
|---|---|---|
| `20261102000001_security_containment.sql` | Locks the secret-returning functions to the service role; drops the open policies; scopes `user-media` reads to the owner | **Ship together with the frontend (step 4).** Rollback: `rollback/20261102000001_down.sql` |
| `20261102000002_campaigns_unique_per_user.sql` | Makes campaigns unique per `(user_id, meta_campaign_id)` | Aborts by itself if duplicates exist |
| `20261102000003_integrations_dedupe_unique.sql` | **Deletes** duplicate integration rows (keeps the newest), then adds `UNIQUE(user_id, provider)` | Checked on production 2026-11-02: no duplicates (13 rows), so nothing is deleted |
| `20261102000004_ai_usage_quota.sql` | Adds the AI usage table and the `consume_ai_quota` function | Low |
| `20261102000005_cron_jobs.sql` | Enables `pg_cron` and `pg_net` and schedules 6 jobs. Replaces the old `meta-campaign-auto-sync-job`, which called with the anon key | Needs the Vault secrets from step 1. Run it in the same window as the function deploy |
| `20261102000006_integrations_clear_app_secret.sql` | Clears the per-user `integrations.app_secret` copies | Low; no code reads that column |
| `20261102000007_oauth_states.sql` | Adds the OAuth CSRF state table | **Ship together with the frontend.** Without the new frontend, connecting Meta fails |
| `20261102000008_url_columns_http_only.sql` | Adds a `NOT VALID` CHECK so `leads.website` only accepts http(s) | Low |

## 3. Edge functions
Deploy every function that changed, plus `_shared` (it's bundled into each one):
`ai-suggestions`, `ai-evaluate-metrics`, `ai-generate-profile`, `apply-optimization`, `asaas-test-connection`, `auto-verify-ad-sets`, `account-insights-read`, `contingency-auto-retry-walink`, `create-guest-user`, `edge-log-persist`, `meta-campaign-auto-sync`, `meta-campaigns-discover`, `meta-oauth-exchange`, `meta-validation`, `metrics-cache-refresh`, `pagarme-customer-portal`, `pagarme-subscriptions-cancel`, `pagarme-subscriptions-reactivate`, `pagarme-subscriptions-update-card`, `pagarme-test-connection`, `pagarme-webhook`, `quiz-lead-scoring`, `save-asset-selection`, `send-account-creation`, `send-confirmation-email`, `send-payment-confirmation`, `simple-campaign-create`, `subscription-sync`, `test-meta-ad-create`, `test-meta-adset-create`, `test-meta-campaign-create`, `test-meta-creative-create`, `test-wa-link-campaign-create`, `verify-and-correct-ad-set`.

The code for these functions has been **deleted from the repo** because nothing calls them. **They keep running in production until you delete them there:**
```
supabase functions delete setup-password guest-checkout create-checkout customer-portal create-payment-intent \
  business-settings get-campaigns meta-campaign-insights meta-campaign-management meta-campaigns-enhanced \
  meta-campaigns-list meta-discovery-diff meta-discovery-initial meta-unified-assets simple-campaign-create-lite \
  pagarme-plans-sync pagarme-transactions-create simple-campaign-insights pagarme-calc pagarme-init \
  pagarme-public-config pagarme-guest-subscription-create get-user-role security-monitor security-audit
```
Check 30 days of function logs first, if you can. `admin/create-test-user` was never deployable.

## 4. Frontend (Netlify)
- [ ] Deploy in the same window as migrations 1 and 7.
- [ ] Watch the browser console for `Content-Security-Policy-Report-Only` violations for 3 days. Then switch the header to `Content-Security-Policy` and remove the `<meta>` CSP from `index.html`.

## 5. Smoke tests after deploy
- [ ] A non-admin connects Meta end to end: popup, then asset selection.
- [ ] An admin saves Meta Ads settings without retyping the secret.
- [ ] The anon key against `/rest/v1/rpc/get_meta_ads_config` returns `permission denied`.
- [ ] The anon key against `/functions/v1/send-account-creation`, `subscription-sync`, `ai-suggestions` and `test-meta-ad-create` returns 401 or 403.
- [ ] Creating a campaign works (wizard to Meta).
- [ ] Log out as user A, log in as user B: B sees none of A's pages or accounts.
- [ ] `select * from cron.job_run_details order by start_time desc limit 20;` shows successful runs.

## Known open items (later phases)
- **SEC-12, part 2:** about 111 frontend files still read the Meta token and call `graph.facebook.com` from the browser. This needs PLT-01 (dead-code removal) first, then moving the live paths into edge functions. After that, revoke browser access to `integrations.access_token`.
- **SEC-17 CORS:** 55 of the 71 functions still use a fixed `Access-Control-Allow-Origin: *`. With Bearer auth and no cookies this is low risk. Migrate them to `_shared/cors.ts` once Deno is installed and they can be type-checked.
- **Captcha on public forms** (`pagarme-subscribe`, `asaas-public-checkout`, `lead-quiz-submit`, `quiz-submit`): needs a Cloudflare Turnstile site key from the client.
