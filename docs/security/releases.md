# Audit remediation — release log

Record of what the audit remediation (`docs/audit-fix-plan.md`) has shipped to production, per
release, with the edge functions deployed and the migrations applied. Requested by section 12 of the
plan. **No secret values belong in this file.**

How this list was built: from `git show --stat` / `--name-status` of each commit. "Functions deployed"
is every function directory the commit added or changed; "migrations applied" is every new file in
`supabase/migrations/`. Where a deploy note recorded more (Phases 1–2), it is quoted from
`docs/security/remediation-deploy-checklist.md`. `_shared/` is bundled into each function at deploy
time; if you are not sure a function in production matches its commit, redeploy it from that commit.

Git tags (`audit-r1` …) suggested by the plan have **not** been created yet. Use the commit SHAs below.

Deploy process for every release: migrations with `psql -1 -f <file>` + insert into
`supabase_migrations.schema_migrations` (never `supabase db push`); functions with
`supabase functions deploy <fn> --project-ref <ref> --use-api`; frontend by pushing to `main` (Netlify).
See `docs/deployment-guide.md`.

---

## Summary

| Release | Date | Commits | Audit tasks | Backup taken before |
|---|---|---|---|---|
| R1 + R2 | 2026-11-03 | `8ed37e5`, `3fa32a5`, `d3051ce` (+ docs `3698f58`) | SEC-01…06, SEC-10…17 (Phases 1–2) | `prod_2026-11-03_pre-remediation.dump` |
| Phase 4 | 2026-11-08 | `92a867f`, `4072657` | CMP-01…16 | not recorded |
| Phase 5 | 2026-11-08/09 | `b3e6e71`, `9734b75`, `650cc27` (part) | DATA-01…07, ADM-01…05, SEC-12 completion | `prod_2026-11-08_pre-phase5.dump` |
| Phase 6 | 2026-11-09 | `650cc27` (part), `b85678a` | LGL-01…06 (client sign-off pending) | `prod_2026-11-09_pre-phase6.dump` |

Phase 3 (PAY-01…16) has **not** shipped: it is blocked on client decisions (Appendix C #1–4).

---

## R1 + R2 — Phases 1–2: containment and access control (2026-11-03)

Commits: `8ed37e5` security: audit remediation phases 1-2 (SEC-01..SEC-17); `3fa32a5` cron_jobs
tolerates existing pg_cron and the foreign-owned legacy job; `d3051ce` cron timeout 150 s;
`3698f58` docs (client smoke tests passed 2026-11-04).

**Secrets / Vault set:** `CRON_SECRET`, `SITE_URL`, `PAGARME_ENV`; Vault `cron_secret`, `project_url`.

**Migrations applied** (in this order):
- Previously missing on production: `20260317000000_add_campaign_scheduling`,
  `20260317100000_add_subscription_lifecycle`, `20260321000000_add_edge_function_logs`
- `20261102000001_security_containment` (down-file: `rollback/20261102000001_down.sql`)
- `20261102000002_campaigns_unique_per_user`
- `20261102000003_integrations_dedupe_unique`
- `20261102000004_ai_usage_quota`
- `20261102000005_cron_jobs` (as amended by `3fa32a5`)
- `20261102000006_integrations_clear_app_secret`
- `20261102000007_oauth_states`
- `20261102000008_url_columns_http_only`
- `20261102000009_cron_timeout` (`d3051ce`)

`20251007161324_…` was edited in the repo (committed Pagar.me keys removed, SEC-03); it
was not re-run on production.

**Functions deployed (34):** `account-insights-read`, `ai-evaluate-metrics`, `ai-generate-profile`,
`ai-suggestions`, `apply-optimization`, `asaas-test-connection`, `auto-verify-ad-sets`,
`contingency-auto-retry-walink`, `create-guest-user`, `edge-log-persist`, `meta-campaign-auto-sync`,
`meta-campaigns-discover`, `meta-oauth-exchange`, `meta-validation`, `metrics-cache-refresh`,
`pagarme-customer-portal`, `pagarme-subscriptions-cancel`, `pagarme-subscriptions-reactivate`,
`pagarme-subscriptions-update-card`, `pagarme-test-connection`, `pagarme-webhook`, `quiz-lead-scoring`,
`save-asset-selection`, `send-account-creation`, `send-confirmation-email`, `send-payment-confirmation`,
`simple-campaign-create`, `subscription-sync`, `test-meta-ad-create`, `test-meta-adset-create`,
`test-meta-campaign-create`, `test-meta-creative-create`, `test-wa-link-campaign-create`,
`verify-and-correct-ad-set`. New `_shared` modules: `aiQuota.ts`, `auth.ts`, `pagarme.ts`.

**Functions deleted (25):** `setup-password`, `guest-checkout`, `create-checkout`, `customer-portal`,
`create-payment-intent`, `business-settings`, `get-campaigns`, `meta-campaign-insights`,
`meta-campaign-management`, `meta-campaigns-enhanced`, `meta-campaigns-list`, `meta-discovery-diff`,
`meta-discovery-initial`, `meta-unified-assets`, `simple-campaign-create-lite`, `pagarme-plans-sync`,
`pagarme-transactions-create`, `simple-campaign-insights`, `pagarme-calc`, `pagarme-init`,
`pagarme-public-config`, `pagarme-guest-subscription-create`, `get-user-role`, `security-monitor`,
`security-audit`. (`admin/create-test-user` was removed from the repo; it was never deployable.)

**Frontend:** Netlify deploy of `8ed37e5` in the same window as migrations `…001` and `…007`.

---

## Phase 4 — campaign engine (2026-11-08)

Commits: `92a867f` audit Phase 4 campaign engine (CMP-01..CMP-16); `4072657` Phase 4 close-out.

**Migrations applied:** `20261108000002_campaign_create_idempotency`.

**Functions deployed (`92a867f`):** `advantage-campaign-create`, `ai-evaluate-metrics`,
`ai-generate-profile`, `ai-suggestions`, `contingency-manual-sync`, `meta-ads-account-pages`,
`meta-assets`, `meta-assets-cached`, `meta-campaign-bulk-operations`, `meta-campaign-refresh-one`,
`meta-dynamic-assets`, `meta-oauth-exchange`, `meta-sync-actives`, `meta-whatsapp-assets`,
`quiz-lead-scoring`, `simple-campaign-activate`, `simple-campaign-create`, `simple-campaign-list`.
New `_shared` modules: `metaCascade.ts`, `metaPaging.ts`, `phone.ts`, `status.ts`.

**Functions deployed (`4072657`):** `lead-quiz-submit`, `meta-campaign-bulk-operations`.

**Function deleted:** `contingency-auto-retry-walink` (the auto-retry that built a different campaign
type; CMP-02). Its `verify_jwt` entry was removed from `supabase/config.toml`.

**Frontend:** shipped with the push of these commits to `main`.

---

## Phase 5 — data, admin, analytics (2026-11-08 → 2026-11-09)

Commits: `b3e6e71` audit Phase 5 (DATA-01..07, ADM-01..05); `9734b75` Phase 5 re-verification;
`650cc27` Phase 5 completion (SEC-12 token columns, ADM-03 pagination) together with Phase 6.

**Migrations applied:**
- `b3e6e71`: `20261108000010_campaigns_status_check`, `…011_campaigns_jsonb_unstringify`,
  `…012_campaign_metrics_cache_unique_per_user`, `…013_profiles_protect_columns`,
  `…014_handle_new_user_email_verified`, `…015_definer_rpcs_service_role_only`,
  `…016_anonymize_old_leads` (schedules `camply_anonymize_old_leads`), `…017_rls_remaining_hits`,
  `…020_admin_dashboard_stats`, `…021_admin_set_user_status`, `…022_admin_client_data_access`,
  `…023_notify_admins_support_ticket`, `…024_admin_disconnect_integration`,
  `…025_ai_configuration_set_active`
- `9734b75`: `20261108000026_expected_ad_set_orphans`, `20261108000029_user_roles_super_admin_only`
- `650cc27`: `20261108000027_integrations_secret_columns`, `20261108000028_admin_list_subscriptions`

`20250912144423_…` and `20251017204329_…` were edited in the repo only (history replay); not re-run on
production.

**Functions deployed:**
- `b3e6e71`: `account-insights-read`, `account-insights-refresh`, `ai-evaluate-metrics`,
  `duplicate-campaign`, `meta-campaign-auto-sync`, `meta-campaigns-insights`, `meta-oauth-exchange`,
  `meta-sync-actives`, `metrics-cache-refresh`, `save-campaign`, `simple-campaign-create`.
  New `_shared/metrics.ts`.
- `9734b75`: `verify-and-correct-ad-set` (fixes the hourly `auto-verify-ad-sets` cron 401).
- `650cc27` (Phase 5 part): `meta-targeting-search`, `simple-campaign-create`, `test-meta-ad-create`,
  `test-meta-adset-create`, `test-meta-campaign-create`, `test-meta-creative-create`,
  `test-wa-link-campaign-create` (`_shared/metaIntegration.ts` changed: server-side token reads).

**Frontend:** shipped with the push of these commits to `main`.

---

## Phase 6 — legal / LGPD (2026-11-09; client sign-off pending)

Commits: `650cc27` (Phase 6 part), `b85678a` purge Storage files of deleted accounts.

**Migrations applied:**
- `650cc27`: `20261109000001_profiles_deletion_requested_at`, `…002_profiles_marketing_consent`,
  `…003_hard_delete_pending_accounts`, `…010_cookie_consents`
- `b85678a`: `20261109000004_purge_deleted_accounts_cron` (re-points `camply_hard_delete_accounts`
  to the `purge-deleted-accounts` function, daily 04:00 UTC)

**Functions deployed:**
- `650cc27`: `user-data-export` (new), `user-account-delete` (new), `quiz-submit`.
  New `_shared/dataSubject.ts`. `verify_jwt = true` for both new functions in `supabase/config.toml`.
- `b85678a`: `purge-deleted-accounts` (new, `verify_jwt = false`, guarded by `x-cron-secret`).

**Frontend:** shipped with the push of these commits to `main`.

---

## How to roll back

Roll back the smallest piece that fixes the problem, in this order: frontend, then function, then
database.

### Frontend (Netlify)

Netlify → Deploys → choose the last good deploy → **Publish deploy**. This is instant and does not
touch git. Then revert the commit on `main` (`git revert <sha>`) so the next push does not
re-publish the bad build.

### An edge function

Redeploy the function from the previous good commit:

```bash
git worktree add ../camply-rollback <previous-good-sha>
cd ../camply-rollback
npx supabase functions deploy <fn> --project-ref <PROJECT_REF> --use-api
cd - && git worktree remove ../camply-rollback
```

`_shared/` is bundled at deploy time, so deploying from the old commit also restores the old shared
code for that function. A deleted function can be restored the same way from the last commit that had
it (for R1/R2 deletions: `8ed37e5^`). Re-check that the restored version does not reopen an audit
finding before doing this.

### Database

1. Prefer a forward fix or the migration's down-file (`supabase/migrations/rollback/`), applied with
   `psql -1 -f`, then delete the version row from `supabase_migrations.schema_migrations`.
2. Full restore only as a last resort. Backups are in `db_backups/`, **outside the repo**:
   - `prod_2026-11-03_pre-remediation.dump` (before R1/R2)
   - `prod_2026-11-08_pre-phase5.dump` (before Phase 5)
   - `prod_2026-11-09_pre-phase6.dump` (before Phase 6)

   Restore into a scratch database first, check it, then restore to production in a maintenance window:

   ```bash
   pg_restore --clean --if-exists --no-owner -d "$TARGET_DATABASE_URL" db_backups/<file>.dump
   ```

   A full restore loses every write since the dump (signups, payments, campaigns, leads). Prefer
   restoring single tables (`pg_restore -t <table>`) when possible.

### Cron jobs

To stop a misbehaving job without a migration: `select cron.unschedule('<jobname>');` and, for the Meta
auto-sync, set the function secret `PAUSE_AUTO_SYNC=true`. Re-create the job by re-running the
migration that scheduled it.
