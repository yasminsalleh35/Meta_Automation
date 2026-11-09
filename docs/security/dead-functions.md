# Dead edge functions (audit PLT-01, functions part)

Generated 2026-11-09 from the local repo. Remote functions were **not** deleted; use the exact names below.

## How callers were searched

For each folder in `supabase/functions/` (except `_shared`, `_tests`):

- **Frontend:** `grep -rE "['\"\`/]<name>['\"\`?/]" src` (covers `supabase.functions.invoke('<name>'` and `` `${VITE_SUPABASE_URL}/functions/v1/<name>` ``). Route paths with the same name (e.g. `/dashboard/simple-campaign-list`) were excluded by hand.
- **Other functions:** the same grep in `supabase/functions` (`invoke('<name>'` and `/functions/v1/<name>`), excluding the function itself and `_tests`.
- **pg_cron:** `grep -rhoE "invoke_cron_function\('[a-z0-9-]+'|functions/v1/[a-z0-9-]+" supabase/migrations` → only `auto-verify-ad-sets`, `meta-campaign-auto-sync`, `metrics-cache-refresh`, `purge-deleted-accounts`, `subscription-sync`.
- **External:** anything named `*webhook*`, `*callback*`, `*oauth*` is kept.
- **Scripts / netlify / public:** no references.

Shallow orphan check: for every function, at least one frontend caller file is imported by some other `src` file (one level). Transitive orphan analysis of `src` (knip) belongs to the frontend PLT-01 PR; if that PR deletes a hook, re-run the grep above.

## Verdicts

| Function | Callers found | Verdict |
|---|---|---|
| `send-confirmation-email` | none. `src`: 0, functions: 0, migrations: 0, tests: 0. Only mentioned in `docs/audit-fix-plan.md` / `remediation-deploy-checklist.md`. Since SEC-06 it only accepts the service role, and its payload `{email,name,confirmationUrl,token}` is not a Supabase Auth "send email" hook payload, so the dashboard can't be calling it either. | **Dead, deleted locally** (folder incl. `_templates/email-confirmation.tsx`). It had no `[functions.*]` block in `config.toml`. **Delete remotely.** |
| `create-guest-user` | none in code (`src/pages/checkout/Success.tsx:19` is only a comment). | Kept: payments/checkout, out of scope. Probably dead; decide with the payments owner. |
| `send-payment-confirmation` | none (`src` 0, functions 0, migrations 0). | Kept: payments, out of scope. Probably dead; decide with the payments owner. |
| `pagarme-webhook` | none in code (called by Pagar.me). | Kept: webhook. |
| `stripe-webhook` | none in code (called by Stripe). | Kept: webhook (and payments). |
| `send-account-creation` | `asaas-webhook/index.ts:377`, `pagarme-subscribe/index.ts:998` | Live (internal). |
| `purge-deleted-accounts` | pg_cron (`invoke_cron_function`) | Live (cron). |
| `quiz-lead-scoring` | `quiz-submit/index.ts:109` (its `src` caller `useQuizLeads.ts` isn't imported) | Live (internal). |
| `simple-campaign-list` | `src/hooks/useSimpleCampaignList.ts:45` (fetch `/functions/v1/simple-campaign-list`) | Live. |
| All other functions | at least one `invoke`/`fetch` caller in an imported `src` file, or a cron job | Live. |

### Notes for the remaining functions

- `test-meta-*` (4) and `test-wa-link-campaign-create` are still called from the admin "Meta Test Lab" (`src/components/admin/meta-test-lab/*`). They are live as long as that page exists. SEC-09 already gates them.
- `meta-dynamic-assets` is called from `useDynamicMetaAssets`, which is marked DEPRECATED but is still imported by `src/components/integrations/MetaAssetsSelector.tsx`. If the frontend PR removes that component, the function becomes dead.
- `advantage-campaign-create` is called from `useAdvantageCampaignCreation`. It depends on `facebook-nodejs-business-sdk`, which PLT-02 wants to remove. Its creative now sends `instagram_user_id` (PLT-03).
- `check-subscription` (Stripe) is called from `useStripeSetup`/`useTrialPeriod`. Kept: payments.

## Remote delete list (exact names)

```
send-confirmation-email
```
