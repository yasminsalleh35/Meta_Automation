# Camply — Project Status & Implementation Analysis

> Last updated: 2026-11-09 (sections 3, 5, 6, 7, 10 and 11 corrected after the 2026-10-30 audit)
> Project: Camply — Meta Ads Automation SaaS
> Production URL: https://iacamply.com (on 2026-11-03 the domain did not resolve; production runs on https://camplyia.netlify.app)
>
> **Status note.** An earlier version of this file rated RLS, webhooks, idempotency and auth as "Strong".
> The 2026-10-30 audit disproved that (anon-readable secrets, cross-tenant writes, account takeover,
> unhandled payment events). Remediation is tracked in `docs/audit-fix-plan.md` (Appendix D) and
> shipped releases are listed in `docs/security/releases.md`.

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
| Total Source Files | 755+ (March 2026; ~270 unimported files being removed in PLT-01) |
| Components | 411 |
| Custom Hooks | 154 |
| Pages | 104 |
| Services | 48 |
| Edge Functions | 72 (2026-11-10; 25 dead functions deleted in Nov 2026) |
| SQL Migrations | 155 files in `supabase/migrations/` (+ `rollback/`), 2026-11-10 |
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
- **Edge Functions** (72): Server-side logic on Supabase Deno runtime

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
- Webhook signature verification on all 3 gateways (the audit found gaps in event handling: PAY-03, PAY-09, PAY-10, not yet fixed)
- Idempotency via event log tables (`stripe_event_log`, `pagarme_events`, `asaas_webhook_events`)
- Guest checkout (`guest-checkout`, `setup-password`) was **removed** in Nov 2026 (account-takeover finding, SEC-01/SEC-10)
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

The March 2026 list that was here is obsolete. Open work as of 2026-11-09 (see `docs/audit-fix-plan.md`):

- **Revenue funnel (PAY-01…16):** not started; waiting for client decisions on prices, plans, trial and grandfathering. No server-side paywall yet.
- **Platform hygiene (PLT-01…08):** dead-code removal, dependency clean-up, bundle splitting, Graph API version unification, docs. In progress.
- **Tests (QA-01…06):** CI workflow being added; unit tests that import real code, Deno negative tests, security probe and staging E2E still to do.
- **Infrastructure:** no staging project; no error tracking (Sentry or similar).
- **Admin:** ADM-06 deferred.
- **Legal:** dev work done; client sign-off on `docs/legal/*` pending.

---

## 7. Edge Functions Inventory

### By Category

The category table from March 2026 listed functions that no longer exist (`setup-password`,
`create-checkout`, `customer-portal`, `meta-campaign-management`, `meta-unified-assets`,
`simple-campaign-insights`, `security-audit`, `security-monitor`, `contingency-auto-retry-walink`, …).
They were deleted in the audit remediation (SEC-10, CMP-02). For the current list run
`ls supabase/functions` (72 functions plus `_shared/` and `_tests/` on 2026-11-10). The deleted set
is recorded in `docs/security/remediation-deploy-checklist.md` and `docs/security/releases.md`.

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

### Total Migrations: 155 (2026-11-10)

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

Re-assessed after the 2026-10-30 audit and the remediation shipped up to 2026-11-09. "Remediated"
means the audit task shipped to production. It does not mean "proven secure": the security probe
(QA-03) and staging E2E (QA-04) are not done yet.

| Area | Status | Details |
|------|--------|---------|
| Secrets exposure | ✅ Remediated (SEC-01…06, SEC-12) | Secret-returning `SECURITY DEFINER` RPCs restricted to the service role; Pagar.me keys removed from migrations; the browser can no longer read the `integrations` token columns (migration `20261108000027`). Rotating the previously exposed secrets is an operational step; confirm it was completed |
| Auth / account takeover | ✅ Remediated (SEC-01, SEC-10) | `setup-password` and other unauthenticated paths deleted; functions require a valid JWT plus ownership, or `x-cron-secret` |
| RLS | 🟡 Improved, not "strong" | Open policies dropped (SEC-02), remaining hits fixed (DATA-07, migration `…017`), `user_roles` self-promotion closed (`…029`). Needs the QA-03 probe to confirm |
| Webhooks | 🟡 Partial | Signatures verified, but payment event handling is incomplete (Asaas one-off/annual, refunds, chargebacks): PAY-03/09/10 not started |
| OAuth | ✅ Remediated | CSRF state table (`oauth_states`) |
| Storage | 🟡 Improved | `user-media` reads scoped to the owner; private-bucket decision pending (Appendix C #5) |
| CSP | 🟡 Report-Only | Netlify header in Report-Only mode without `unsafe-eval`; switch to enforcing after a clean observation window (SEC-17) |
| CORS | 🟡 Partial | Many functions still send `Access-Control-Allow-Origin: *` (low risk with Bearer auth) |
| Rate limiting / abuse | 🟡 Partial | Per-user AI quota (`consume_ai_quota`); no captcha on public forms yet (needs a Turnstile key from the client) |
| Token storage | 🟡 Partial | Meta tokens are server-only now, but still stored unencrypted at rest |

---

## 11. Known Issues & Risks

| Issue | Severity | Tracked as |
|-------|----------|------------|
| Revenue funnel: no paywall, Asaas annual buyers get no account, Pagar.me cancel/portal | 🔴 High | PAY-01…16 (blocked on client decisions) |
| Payment webhooks ignore refunds/chargebacks and some Asaas events | 🟠 High | PAY-03, PAY-09, PAY-10 |
| No staging environment; changes are verified on production | 🟠 Medium | PRE-*, QA-04 |
| Meta Graph API versions mixed (v19/v21/v22/v23) in some code | 🟡 Medium | PLT-03 |
| ~40k lines of dead frontend code | 🟡 Medium | PLT-01 (in progress) |
| Initial JS bundle ~1.4 MB gzipped | 🟡 Medium | PLT-04 (in progress) |
| Meta tokens unencrypted at rest | 🟡 Medium | (none yet) |
| Legacy cron job `meta-campaign-auto-sync-job` (id 1) cannot be removed without Supabase support; harmless 401 every 10 min | 🟢 Low | (none) |
