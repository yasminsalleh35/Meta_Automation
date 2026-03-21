# Camply — Deployment Guide

## Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Netlify CDN    │     │   Supabase       │     │   Meta Graph     │
│   (Frontend)     │────▶│   Edge Functions  │────▶│   API v23.0      │
│   React + Vite   │     │   + PostgreSQL    │     │                  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
        │                         │
        │                         ├──── Stripe / Pagar.me / Asaas
        │                         ├──── OpenAI / DeepSeek
        │                         └──── Resend (emails)
        │
        └──── iacamply.com (custom domain)
```

---

## Prerequisites

- Node.js 18+ and npm
- Supabase CLI (`npx supabase`)
- Netlify CLI (`npx netlify-cli`)
- Git

---

## Frontend Deployment (Netlify)

### Initial Setup
```bash
# Clone the repo
git clone git@github-yasmin:yasminsalleh35/Meta_Automation.git
cd camply

# Install dependencies
npm install

# Build
npm run build
```

### Netlify Configuration
File: `netlify.toml`
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Deploy
```bash
# Link to Netlify site
npx netlify-cli link

# Deploy to production
npx netlify-cli deploy --prod
```

Or: push to `main` branch → Netlify auto-deploys.

### Custom Domain
- Add `iacamply.com` in Netlify → Domain Management
- Configure DNS: CNAME `@` → `camplyia.netlify.app`
- SSL is automatic via Netlify

---

## Backend Deployment (Supabase)

### Edge Functions
```bash
# Deploy all functions
npx supabase functions deploy --project-ref <PROJECT_REF>

# Deploy a specific function
npx supabase functions deploy simple-campaign-create --project-ref <PROJECT_REF>
```

### Database Migrations
```bash
# Push migrations to production
npx supabase db push --project-ref <PROJECT_REF>
```

### Environment Secrets
```bash
# Set secrets (one at a time)
npx supabase secrets set META_APP_ID="your_app_id" --project-ref <PROJECT_REF>
npx supabase secrets set META_APP_SECRET="your_secret" --project-ref <PROJECT_REF>
npx supabase secrets set OPENAI_API_KEY="sk-..." --project-ref <PROJECT_REF>
npx supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_..." --project-ref <PROJECT_REF>
npx supabase secrets set PAGARME_API_KEY="..." --project-ref <PROJECT_REF>
npx supabase secrets set ASAAS_API_KEY="..." --project-ref <PROJECT_REF>
npx supabase secrets set RESEND_API_KEY="re_..." --project-ref <PROJECT_REF>
npx supabase secrets set ALLOWED_ORIGINS="https://iacamply.com,https://camplyia.netlify.app" --project-ref <PROJECT_REF>
```

---

## Environment Variables

### Frontend (.env)
```bash
VITE_SUPABASE_URL=https://<PROJECT_ID>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_MAPBOX_TOKEN=pk.eyJ...
```

### Backend (Supabase Secrets)
See `admin-guide.md` for the full list.

---

## Scheduled Functions (Cron)

Configure in Supabase Dashboard → Database → Extensions → pg_cron:

```sql
-- Refresh metrics cache every 15 minutes
SELECT cron.schedule('refresh-metrics', '*/15 * * * *',
  $$SELECT net.http_post(
    'https://<PROJECT_ID>.supabase.co/functions/v1/metrics-cache-refresh',
    '{"mode":"refresh_all"}'::jsonb,
    '{}'::jsonb,
    headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>", "Content-Type": "application/json"}'::jsonb
  )$$
);

-- Sync stale subscriptions every 6 hours
SELECT cron.schedule('sync-subscriptions', '0 */6 * * *',
  $$SELECT net.http_post(
    'https://<PROJECT_ID>.supabase.co/functions/v1/subscription-sync',
    '{"mode":"sync_stale"}'::jsonb,
    '{}'::jsonb,
    headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>", "Content-Type": "application/json"}'::jsonb
  )$$
);

-- Check performance alerts every 30 minutes
SELECT cron.schedule('check-alerts', '*/30 * * * *',
  $$SELECT net.http_post(
    'https://<PROJECT_ID>.supabase.co/functions/v1/metrics-cache-refresh',
    '{"mode":"check_alerts"}'::jsonb,
    '{}'::jsonb,
    headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>", "Content-Type": "application/json"}'::jsonb
  )$$
);

-- Cleanup old logs daily at 3 AM
SELECT cron.schedule('cleanup-logs', '0 3 * * *',
  $$DELETE FROM edge_function_logs WHERE created_at < now() - interval '30 days'$$
);
```

---

## Meta App Configuration

### Development → Live Mode
1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Select your app
3. Complete **App Review** for these permissions:
   - `pages_show_list`
   - `pages_read_engagement`
   - `instagram_basic`
   - `ads_management`
   - `business_management`
   - `whatsapp_business_management`
4. Switch app to **Live Mode**

### Webhook Configuration
- **Stripe**: Dashboard → Webhooks → endpoint URL: `https://<PROJECT_ID>.supabase.co/functions/v1/stripe-webhook`
- **Pagar.me**: Dashboard → Webhooks → endpoint URL: `https://<PROJECT_ID>.supabase.co/functions/v1/pagarme-webhook`
- **Asaas**: Dashboard → Webhooks → endpoint URL: `https://<PROJECT_ID>.supabase.co/functions/v1/asaas-webhook`

---

## Testing

```bash
# Run unit tests
npm test

# Run in watch mode
npm run test:watch

# TypeScript check
npx tsc --noEmit

# Lint
npm run lint
```

---

## Monitoring in Production

### Logs
- Supabase Dashboard → Logs → Edge Functions
- Admin panel → Logs de Sistema (`/admin/edge-logs`)

### Metrics
- Dashboard → Monitoramento (`/dashboard/monitoring`)
- Shows: active campaigns, alerts, API usage

### Alerts
The system auto-generates alerts for:
- CTR below 0.5%
- CPA above R$50
- Frequency above 3.0
- Zero conversions with spend > R$10
