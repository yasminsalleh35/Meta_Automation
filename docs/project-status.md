# Camply — Project Status & Implementation Analysis

> Last updated: 2026-03-17
> Project: Camply — Meta Ads Automation SaaS
> Production URL: https://iacamply.com

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Codebase Scale](#3-codebase-scale)
4. [Architecture](#4-architecture)
5. [Feature Status — What's Implemented](#5-feature-status--whats-implemented)
6. [Feature Status — What's Missing](#6-feature-status--whats-missing)
7. [Edge Functions Inventory](#7-edge-functions-inventory)
8. [Database Schema](#8-database-schema)
9. [Routing Structure](#9-routing-structure)
10. [Security Posture](#10-security-posture)
11. [Known Issues & Risks](#11-known-issues--risks)

---

## 1. Project Overview

Camply is a production SaaS platform for creating and managing Meta (Facebook/Instagram) ad campaigns, focused on **WhatsApp lead generation** for Brazilian businesses. The platform provides:

- A 4-step campaign creation wizard (Info → Media → Budget → Location)
- Meta OAuth 2.0 integration for ad account management
- Sector-based campaign profiles with AI-driven targeting suggestions
- Multi-gateway payment processing (Stripe, Pagar.me, Asaas)
- Admin panel for sectors, categories, profiles, and user management
- AI-powered campaign optimization with bounded suggestions
- Bilingual support (Portuguese/English)

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + SWC |
| UI | Tailwind CSS + shadcn/ui (Radix primitives) |
| State | TanStack Query v5 (server) + React Context (global) |
| Backend | Supabase (PostgreSQL + Edge Functions on Deno) |
| Ads API | Meta Marketing API v23.0 |
| AI | OpenAI / Deepseek (configurable via `ai_configurations` table) |
| Payments | Stripe + Pagar.me V5 + Asaas |
| Maps | Mapbox GL |
| Auth | Supabase Auth (JWT + OAuth 2.0) |
| Hosting | Netlify (frontend) + Supabase (backend) |
| i18n | Custom PT/EN implementation |

---

## 3. Codebase Scale

| Metric | Count |
|--------|-------|
| Total Source Files | 755+ |
| Components | 411 |
| Custom Hooks | 154 |
| Pages | 104 |
| Services | 48 |
| Edge Functions | 92 |
| SQL Migrations | 112 |
| Type Files | 21 |
| Utility Files | 21 |
| Contexts | 7 |

### Component Breakdown

| Directory | Files | Purpose |
|-----------|-------|---------|
| campaign/ | 98 | Campaign creation, editing, wizards, verification |
| admin/ | 54 | Admin management interfaces |
| ui/ | 53 | Reusable UI components (shadcn/ui) |
| integrations/ | 23 | Payment and Meta Ads integration UIs |
| dashboard/ | 21 | Dashboard pages and layouts |
| landing/ | 15 | Landing page components |
| business/ | 15 | Business profile and settings |
| ia/ | 13 | AI-related components |
| quiz/ | 12 | Quiz builder components |
| checkout/ | 12 | Checkout flow UIs |
| analytics/ | 11 | Analytics dashboard, charts |

---

## 4. Architecture

### Data Flow

```
User → React Frontend → Supabase Edge Function → Meta Marketing API
                     ↓                        ↑
              Supabase DB ←────────────────────┘
                     ↓
            OpenAI/Deepseek (AI features)
```

### Layered Pattern

**Components → Hooks → Services → Edge Functions → External APIs**

- **Components** (411): UI rendering, organized by domain
- **Hooks** (154): Data fetching & state logic (`useMetaAds*`, `useCampaign*`, `useSubscription*`, `useAI*`)
- **Services** (48): Business logic, especially `metaAds/` with 36 files
- **Contexts** (7): `AuthContext`, `I18nContext`, `MetaAssetsContext`, `ThemeContext`, `DemoModeContext`, `MapboxContext`, `PagarmeCheckoutContext`
- **Edge Functions** (92): Server-side logic on Supabase Deno runtime

### Key Design Principles

1. **AI suggests, user decides** — AI never makes autonomous changes
2. **Bounded optimizations** — AI suggestions capped (e.g., ±30% budget)
3. **Audit trail** — All changes logged with before/after state
4. **Rate limit awareness** — Cache Meta API responses, throttle when needed
5. **Graceful degradation** — Core features work even if Meta API or AI is down

---

## 5. Feature Status — What's Implemented

### Core Campaign Features ✅
- Campaign creation wizard (4-step: Info → Media → Budget → Location)
- WhatsApp CTWA campaigns with `phone_number_id` in `promoted_object`
- Instagram post as ad with dark post fallback (`object_story_id` support)
- Post picker component (fetches via `/me/media`, filters IMAGE/CAROUSEL_ALBUM)
- Campaign duplication (copies all fields, resets start_date, clears Meta IDs)
- Campaign activate/pause with cascade (Campaign → AdSet → Ad with rollback)
- Campaign scheduling with start/end dates
- Campaign scheduling with dayparting (hour-of-day selection for ad delivery)
- Location targeting with Mapbox integration
- International location support (country code selection)

### Meta Ads Integration ✅
- Meta OAuth 2.0 flow (token exchange, refresh, storage)
- Campaign profile system (sector-based targeting)
- Meta API v23.0 campaign creation (OUTCOME_ENGAGEMENT + CONVERSATIONS)
- Ad creative management (image upload, video, existing posts)
- Campaign insights and metrics retrieval
- Bulk operations on campaigns
- Campaign sync between local DB and Meta API

### AI Features ✅
- AI audience generation from MyBusiness data (`ai-suggestions` edge function)
- AI metric evaluation with bounded suggestions (`ai-evaluate-metrics`)
- One-click optimization actions (`apply-optimization`)
- `optimization_suggestions` table with RLS, indexes, 7-day expiration
- `optimization_logs` table for audit trail
- Configurable AI provider (OpenAI/Deepseek via `ai_configurations` table)
- Rule-based fallback when AI API key unavailable

### Payment Processing ✅
- 3 payment gateways: Stripe, Pagar.me V5, Asaas
- HMAC-SHA256 webhook signature verification on all 3 gateways
- Idempotency via event log tables (`stripe_event_log`, `pagarme_events`, `asaas_webhook_events`)
- Guest checkout with automatic user creation
- Subscription management (active/canceled states)
- Subscription reactivation (Pagar.me)

### Auth & Admin ✅
- Supabase Auth (JWT + OAuth 2.0)
- Protected routes with `ProtectedRoute` component
- Admin route protection with `AdminRoute`
- 20+ admin pages (sectors, categories, profiles, users, subscriptions)
- Admin AI monitoring dashboard

### Other ✅
- i18n (Portuguese/English)
- Business profile (MyBusiness) data collection
- Quiz builder and lead capture
- Landing pages (dentist vertical)
- Legal pages (terms, privacy, contract)

---

## 6. Feature Status — What's Missing

### Security Gaps 🔴
- **Token encryption**: Meta access tokens stored in plaintext in `integrations` table. Client-side encryption is disabled (returns plaintext with deprecation warning). No `TOKEN_ENCRYPTION_KEY` usage found.
- **CORS inconsistency**: `simple-campaign-create` and `meta-campaign-management` use `Access-Control-Allow-Origin: *` instead of shared CORS module

### Subscription Lifecycle ⚠️
- `past_due`, `trialing`, `paused` states not handled in webhooks
- No grace period logic for failed payments
- No dunning management (retry for failed payments)
- No payment provider fallback between Stripe/Pagar.me/Asaas
- No periodic subscription sync (relies entirely on webhooks)

### Monitoring & Caching ⚠️
- No database-level `campaign_metrics_cache` table
- No background refresh job for campaign metrics
- No per-user per-hour Meta API call tracking
- No user-facing monitoring dashboard (`/dashboard/monitoring`)
- No anomaly alerts (CTR drops, budget depletion)
- No code splitting / `React.lazy()` for performance

### Infrastructure ⚠️
- No staging/production environment separation
- No structured error logging (`edge_function_logs` table missing)
- No Sentry or error tracking integration
- No standardized error response format across edge functions

### Documentation ⚠️
- No API documentation (`docs/api.md`)
- No user guide (`docs/user-guide.md`)
- No admin guide (`docs/admin-guide.md`)
- No deployment guide (`docs/deployment.md`)

### Testing ❌
- No unit tests
- No integration tests
- No end-to-end tests

---

## 7. Edge Functions Inventory

### By Category

| Category | Count | Key Functions |
|----------|-------|--------------|
| Campaign Creation & Management | 8 | `simple-campaign-create` (1936 lines), `advantage-campaign-create`, `duplicate-campaign` |
| Meta OAuth & Integration | 13 | `meta-oauth-exchange` (479 lines), `meta-validation`, `meta-unified-assets` |
| Meta Campaign Operations | 16 | `meta-campaign-management`, `meta-campaigns-insights`, `meta-campaign-bulk-operations` |
| Campaign Insights & Analytics | 4 | `account-insights-read`, `simple-campaign-insights` |
| AI/ML | 4 | `ai-suggestions`, `ai-evaluate-metrics`, `apply-optimization`, `strategy-report` |
| Stripe | 4 | `stripe-webhook` (308 lines), `create-checkout`, `customer-portal` |
| Pagar.me | 12 | `pagarme-webhook`, `pagarme-subscribe`, `pagarme-create-plans` |
| Asaas | 4 | `asaas-webhook`, `asaas-public-checkout` |
| Subscription Management | 4 | `check-subscription`, `check-pagarme-subscription` |
| User & Auth | 6 | `create-guest-user`, `send-account-creation`, `setup-password` |
| Lead Capture | 4 | `lead-quiz-submit`, `quiz-lead-scoring` |
| Security | 3 | `security-audit`, `security-monitor` |
| Contingency & Sync | 2 | `contingency-manual-sync`, `contingency-auto-retry-walink` |

### Shared Utilities (`_shared/`)

| File | Purpose |
|------|---------|
| `cors.ts` | CORS header management (allowed origins: `iacamply.com`, `camplyia.netlify.app`) |
| `errors.ts` | Error conversion utilities (`toMessage()`, `toObject()`) |
| `rateLimit.ts` | In-memory rate limiting with Retry-After headers |
| `metaIntegration.ts` | Meta integration resolver (access_token, ad_account_id, page_id) |
| `metaSelection.ts` | Meta asset selection helpers |
| `emailClient.ts` | Email sending client |

---

## 8. Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `subscribers` | Subscription tracking (Stripe/Pagar.me customer IDs, plan status) |
| `campaigns` | Full campaign data (location, audience, budget, creative, social, Meta IDs) |
| `media_files` | Uploaded images/videos with AI generation prompts |
| `business_settings` | MyBusiness profile data (name, category, target audience) |
| `integrations` | OAuth tokens and provider management |
| `optimization_suggestions` | AI-generated optimization suggestions with severity/status |
| `optimization_logs` | Audit trail for applied changes (before/after state) |
| `ai_configurations` | AI provider config (OpenAI/Deepseek, model, API key) |
| `stripe_event_log` | Stripe webhook idempotency tracking |
| `pagarme_events` | Pagar.me webhook idempotency tracking |
| `asaas_webhook_events` | Asaas webhook idempotency tracking |

### Total Migrations: 112

---

## 9. Routing Structure

### Public Routes
- `/` — Landing page
- `/auth/*` — Login, register, forgot/reset password, Meta OAuth callbacks
- `/assinatura/*` — Subscription plans, checkout, success/cancel
- `/checkout/*` — Payment checkout flow
- `/plano-mensal`, `/plano-anual` — Plan pages
- `/quizz/:slug` — Public quiz
- `/ia` — AI page
- `/legal/*` — Terms, privacy, contract

### Private Routes (behind `ProtectedRoute` + `AppShell`)
- `/dashboard/*` — Main dashboard, campaigns, analytics, settings, tutorials
- `/onboarding/*` — Welcome, plan selection, trial
- `/admin/*` — 20+ admin pages (behind `AdminRoute`)

---

## 10. Security Posture

| Area | Status | Details |
|------|--------|---------|
| Auth | ✅ Strong | Supabase JWT + OAuth, session management, recovery flow |
| Webhook Verification | ✅ Strong | HMAC-SHA256 on all 3 payment gateways |
| Idempotency | ✅ Strong | Event deduplication via log tables |
| RLS | ✅ Strong | Row-level security on all user-scoped tables |
| CSP | ✅ Good | Comprehensive Content-Security-Policy in index.html |
| Rate Limiting | ⚠️ Partial | In-memory per-runtime, not persistent per-user |
| Token Storage | 🔴 Weak | Meta access tokens stored in plaintext |
| CORS | ⚠️ Partial | Shared module good but 2 legacy functions use `origin: *` |

---

## 11. Known Issues & Risks

| Issue | Severity | Impact |
|-------|----------|--------|
| Meta tokens in plaintext | 🔴 Critical | OAuth token compromise risk |
| CORS `*` on campaign create | 🔴 High | Cross-origin request vulnerability |
| No subscription sync | 🟡 Medium | Status drift if webhooks missed |
| No metrics cache DB table | 🟡 Medium | Meta API rate limit risk at scale |
| Meta API version mismatch | 🟡 Medium | Some services use v19.0, others v23.0 |
| No test suite | 🟡 Medium | Regression risk on changes |
| `dist/` in git repo | 🟢 Low | Bloated repo size |
| 755+ source files | 🟢 Low | Maintenance complexity |
