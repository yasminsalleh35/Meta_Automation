# Camplyia — Meta Ads Automation SaaS

A SaaS platform for creating and managing Meta (Facebook/Instagram) ad campaigns, focused on WhatsApp lead generation for Brazilian businesses.

> **Project status:** an audit on 2026-10-30 found serious security, payment and data-quality problems.
> Remediation is in progress. See `docs/audit-fix-plan.md` (Appendix D has the live status table) and
> `docs/security/releases.md` (what has shipped, and how to roll back).

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite, hosted on Netlify
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Edge Functions on Deno)
- **Ads API:** Meta Marketing API v23, called from edge functions (`fetch` against `graph.facebook.com`)
- **Payments:** Pagar.me V5, Asaas, Stripe (legacy)
- **Maps:** Mapbox GL
- **AI:** OpenAI or DeepSeek (provider chosen in the `ai_configurations` table)
- **Auth:** Supabase Auth (JWT) + Meta OAuth 2.0 (with CSRF state)

## Local Development

**Requirements:** Node.js 20+ and npm. Deno 2.x to run the edge-function tests.

```sh
git clone git@github-yasmin:Camplyia/camply-ai-pilot.git
cd camply-ai-pilot

npm install

cp .env.example .env   # then fill in the values (never commit .env)

npm run dev            # http://localhost:8080
```

## Frontend environment variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `VITE_FEATURE_ADVANCED_ANALYTICS` | Optional, default off. Shows the Advanced Analytics page (hidden until rebuilt on real data) |

The browser code must read the Supabase URL and key from these variables (or use the client in
`src/integrations/supabase/client.ts`). Do not hard-code them.

## Edge function secrets

Set with `supabase secrets set NAME=value --project-ref <ref>` or in Dashboard → Edge Functions → Secrets.
The full list, with what each one does, is in `docs/deployment-guide.md`. In short:

- **Required:** `CRON_SECRET`, `SITE_URL`, `PAGARME_ENV`, `RESEND_API_KEY`
- **Usually set:** `PAGARME_SECRET_KEY_LIVE` / `PAGARME_SECRET_KEY_TEST`, `OPENAI_API_KEY` or `DEEPSEEK_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `ALLOWED_ORIGINS`, `STRIPE_SECRET_KEY` (legacy `check-subscription` only), `META_SYSTEM_USER_TOKEN` (`ai-generate-profile` only)
- **Provided by Supabase:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

The Meta app ID/secret, Asaas, Pagar.me and Stripe API keys and webhook secrets are **not** function
secrets: admins store them in the database through the admin panel, and functions read them with
service-role-only RPCs (`get_meta_ads_config`, `get_asaas_config_for_functions`, …).

## Scripts

```sh
npm run dev        # Development server
npm run build      # Production build
npm run build:dev  # Development build
npm run preview    # Preview production build
npm run lint       # ESLint
npm test           # Vitest (frontend unit tests)
deno test supabase/functions/_tests   # Edge-function tests (needs Deno)
```

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on every push and pull request: `tsc` type-check,
`vitest`, `deno test` for the edge functions, `vite build`, a bundle-size budget and
`npm audit --omit=dev`.

## Deployment

Summary (details and the full checklist in `docs/deployment-guide.md`):

- **Frontend:** push to `main` → Netlify builds and publishes (`netlify.toml`).
- **Edge functions:** deployed by hand, one at a time:
  `supabase functions deploy <fn> --project-ref <ref> --use-api`
- **Migrations:** applied by hand with `psql`, one file per transaction, then recorded in
  `supabase_migrations.schema_migrations`. **Never run `supabase db push`**: the production migration
  history uses different timestamps from the local files, so it would re-run everything.

**Production URL:** https://camplyia.netlify.app (`iacamply.com` is the intended custom domain)

## Project Structure

```
src/
  components/     # React UI components
  pages/          # Route-level page components
  hooks/          # Custom React hooks
  services/       # Business logic (Meta Ads, payments, analytics)
  contexts/       # React context providers (Auth, I18n, Theme, MetaAssets, ...)
  integrations/   # Supabase client and generated types
  lib/            # Utility libraries
  routes/         # Route definitions and guards
supabase/
  functions/      # 72 edge functions (Deno) + _shared/ modules + _tests/
  migrations/     # 155 SQL migrations (+ rollback/)
docs/             # Plans, guides, audit remediation and release records
```

Counts are as of 2026-11-09; dead-code removal (audit PLT-01) is still changing them.
