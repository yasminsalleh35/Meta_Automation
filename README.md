# Camplyia — Meta Ads Automation SaaS

A production SaaS platform for creating and managing Meta (Facebook/Instagram) ad campaigns, focused on WhatsApp lead generation for Brazilian businesses.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Edge Functions on Deno)
- **Ads API:** Meta Marketing API v23 via `facebook-nodejs-business-sdk`
- **Payments:** Stripe, Pagar.me V5, Asaas
- **Maps:** Mapbox GL
- **AI:** OpenAI API
- **Auth:** Supabase Auth (JWT + OAuth 2.0)

## Local Development

**Requirements:** Node.js 18+ and npm

```sh
# Clone the repo
git clone git@github-yasmin:Camplyia/camply-ai-pilot.git
cd camply-ai-pilot

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in the required values in .env

# Start development server (port 8080)
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and fill in all values. **Never commit `.env` to git.**

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID |

Supabase Edge Function secrets (set via Supabase Dashboard → Edge Functions → Secrets):

| Secret | Description |
|---|---|
| `META_APP_ID` | Meta Developer App ID |
| `META_APP_SECRET` | Meta Developer App Secret |
| `OPENAI_API_KEY` | OpenAI API key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `ASAAS_API_KEY` | Asaas API key |
| `TOKEN_ENCRYPTION_KEY` | Key for encrypting stored OAuth tokens |

## Scripts

```sh
npm run dev        # Development server
npm run build      # Production build
npm run build:dev  # Development build
npm run preview    # Preview production build
npm run lint       # ESLint
```

## Deployment

**Frontend:** Deployed via Vite build — push to `main` triggers auto-deploy via CI/CD.

**Edge Functions:** Deploy manually via Supabase Dashboard or CLI:
```sh
supabase functions deploy <function-name>
```

**Production URL:** https://iacamply.com

## Project Structure

```
src/
  components/     # React UI components
  pages/          # Route-level page components
  hooks/          # 154+ custom React hooks
  services/       # Business logic (MetaAds, payments, analytics)
  contexts/       # React context providers (Auth, I18n, Theme, MetaAssets)
  types/          # TypeScript interfaces and types
  lib/            # Utility libraries
  schemas/        # Zod validation schemas
  routes/         # Route definitions and guards
supabase/
  functions/      # 88 Supabase Edge Functions (Deno runtime)
```
