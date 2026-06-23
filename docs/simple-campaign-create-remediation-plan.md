# Remediation Plan — `simple-campaign-create` Edge Function

> Scope: `supabase/functions/simple-campaign-create/` (the CTWA campaign engine)
> Author: Engineering analysis
> Status: Implemented — pending staging deploy + smoke test (see §3)
> Last updated: 2026-06-23

---

## 0. Context

`simple-campaign-create` is the single most important and most complex edge function in
Camply. It transforms a wizard payload into a **paused** Click-to-WhatsApp (CTWA) campaign on
the Meta Marketing API v23 by sequentially creating four objects: Campaign → Ad Set → Creative
→ Ad, then persisting a row in the `campaigns` table.

The directory is 6 files / ~3,297 lines, but the real implementation is one 2,125-line
`index.ts`. A deep review surfaced a mix of genuinely strong resilience logic and several
structural liabilities. This document is the remediation plan and progress tracker.

### Design constraints we must preserve

1. **Never hard-fail the client.** Product decision: on failure the function persists a
   `campaign_contingency` row, fires an async retry, and returns HTTP 200 so the user sees
   *"campaign in processing"* rather than an error. We keep this behavior but make it honest
   (see D2/D3) — failures must be **distinguishable** and must not cause Meta/DB drift.
2. **Everything is created `PAUSED`.** Nothing goes live without `simple-campaign-activate`.
3. **CTWA contract (Meta v23):** campaign objective `OUTCOME_ENGAGEMENT`; ad set
   `optimization_goal=CONVERSATIONS` + `destination_type=WHATSAPP` + `promoted_object={page_id}`.
   These are correct and must not change.
4. The function already has `verify_jwt = true` in `config.toml`, so the platform validates the
   JWT before our handler runs.

### What we are NOT doing in this pass

- We are **not** rewriting the monolith into the abandoned `CampaignProcessor` class shape
  (that class is a non-functional stub). We delete it instead.
- We are **not** converting video processing to a fully async job queue (large, separate effort).
  We only bound the in-request wait so it cannot outlive the function (C1).

---

## 1. Findings → Fix mapping

| # | Severity | Finding | Fix phase |
|---|----------|---------|-----------|
| F1 | 🟡 Maint | ~924 lines of dead/stub code (`campaign-processor.ts` returns mock IDs; `diagnostic-logger.ts`, `helpers.ts`, `types.ts` unreferenced); inline `sanitizeInterests` shadowed/unused | **A** |
| F2 | 🟡 Sec | Wildcard `Access-Control-Allow-Origin: *` instead of shared allow-list module | **B** |
| F3 | 🟠 Sec | `access_token` passed in query strings (6×) and URLs logged (`fetchWithBackoff`) → token leakage into logs | **B** |
| F4 | 🔴 Rel | `waitVideoReady` polls up to **300 s**, can exceed the edge-function wall-clock limit → killed mid-flight, orphaned Meta objects | **C** |
| F5 | 🟠 Rel | Misleading creative CTA "fallback": the `continue` never actually switches `WHATSAPP_MESSAGE` → `LEARN_MORE` because `ctaType` is recomputed from `config.includeCTA` each iteration | **C** |
| F6 | 🟡 Maint | `uploadMediaToMeta` has a dead `apiVersion` param (defaults `"v20.0"`, ignored — URLs hardcode v23.0) | **C** |
| F7 | 🔴 Integrity | No rollback of partially-created Meta objects on failure → orphaned paused campaigns; retries can duplicate | **D** |
| F8 | 🔴 Integrity | Happy-path DB insert failure is swallowed and the function still returns `success` → Meta/local drift (campaign exists on Meta, absent from dashboard) | **D** |
| F9 | 🟠 Contract | Frontend cannot reliably distinguish true success from contingency; response shape inconsistent | **D** |
| F10 | 🟡 Types | `SimpleCampaignPayload` interface omits fields the handler reads (`useAISuggestions`, `aiTargeting`, `interests`, location `source`, targeting `flexible_spec`) | **E** |

---

## 2. Phased execution (low-risk first)

### Phase A — Dead-code removal (zero runtime risk)

**Goal:** Remove unreachable code so the directory reflects what actually runs.

- Delete `campaign-processor.ts` (535) — imported by nobody; contains stub methods returning
  `'mock_campaign_id'` etc.
- Delete `diagnostic-logger.ts` (209) — only imported by `campaign-processor.ts`.
- Delete `helpers.ts` (106) — imported by nobody (`geocodeCityViaMapbox`, `getValidInstagramUserId`
  are unused; the live geo path is inline in `index.ts`).
- Delete `types.ts` (74) — only imported by `campaign-processor.ts`; `index.ts` declares its own
  inline `SimpleCampaignPayload`.
- Remove the module-level inline `sanitizeInterests` in `index.ts` (line ~92): it is shadowed at
  the only call site by the version imported from `utils.ts`, so it is dead.

**Pre-condition (verified):** `grep` confirms no importer of these files outside the dead cluster;
`utils.ts` remains the live shared module (dynamically imported 3× by `index.ts`).

**Verification:** `grep -rl` for each deleted basename returns nothing; `index.ts` still imports
only `serve`, `createClient`, and `./utils.ts`.

---

### Phase B — CORS + token hygiene

**Goal:** Stop returning a wildcard CORS origin and stop leaking tokens into logs.

- **B1 (CORS):** Replace the local `corsHeaders = { 'Access-Control-Allow-Origin': '*' }` with the
  shared module:
  ```ts
  import { corsHeadersFor, handlePreflight } from '../_shared/cors.ts';
  ```
  - Preflight → `handlePreflight(req)`.
  - Compute `const origin = req.headers.get('Origin');` once; build `const cors = corsHeadersFor(origin);`
    and spread it into every `Response`.
- **B2 (token in URL → header):** For all **GET** Graph calls that currently append
  `?access_token=…` (page WhatsApp check, post media-info, video thumbnails, video status), pass the
  token via `Authorization: Bearer <token>` header instead. Multipart uploads already use the
  header; align the rest.
- **B3 (token in logs):** In `fetchWithBackoff` (and any URL logging) strip the query string before
  logging, e.g. `url.split('?')[0]`. Never log a URL that could contain a token.

**Risk:** Low. Meta Graph accepts `Authorization: Bearer`. CORS allow-list already includes the two
production origins + env override + localhost.

**Verification:** `grep -n "access_token=" index.ts` → only POST bodies remain (in JSON), no GET
query usage; no `'Access-Control-Allow-Origin': '*'` remains; logged URLs contain no `?`.

---

### Phase C — Reliability fixes

- **C1 (video wait budget):** Lower the default `waitVideoReady` timeout from 300 s to a
  function-safe budget and make it configurable via `VIDEO_WAIT_TIMEOUT_MS` (default **120000**).
  Document that the edge function wall-clock limit is the hard ceiling; if the video is not ready in
  the budget, we fall through to the existing contingency path (fast, not a late throw).
- **C2 (creative CTA fallback):** Make the WhatsApp→LEARN_MORE degradation real. Track an explicit
  `dropWhatsAppCta` flag that flips to `true` after a `WHATSAPP_MESSAGE` creative attempt fails, so
  subsequent attempts compute `ctaType = 'LEARN_MORE'`. Fix the now-accurate comment.
- **C3 (apiVersion param):** Make `uploadMediaToMeta` actually honor its `apiVersion` argument
  (default `'v23.0'`) by interpolating it into both the `advideos` and `adimages` URLs, removing the
  misleading dead parameter.

**Risk:** Low–medium. C2 changes retry behavior in a strictly safer direction (it now genuinely
degrades). C1 makes the function fail faster into contingency for slow videos — acceptable and
safer than being killed.

**Verification:** read-through; ensure `ctaType` is derived from the flag; ensure both upload URLs
use `apiVersion`; ensure timeout reads env with a numeric fallback.

---

### Phase D — Data integrity & honest contract (highest value)

- **D1 (Meta rollback):** Add `rollbackMetaObjects({ campaignId, accessToken, adAccountId })` that
  best-effort `DELETE`s the campaign on Graph (Meta cascades the delete to ad set / ad / creative).
  Call it from the `catch` block **before** `saveToContingency` whenever a partial `campaignResult.id`
  exists. Record the rollback outcome on the contingency row (`rolled_back: true|false`) so the async
  retry never duplicates a half-built campaign. Rollback must never throw (it is cleanup).
- **D2 (DB-save integrity):** On the happy path, if all four Meta objects are created but the
  `campaigns` INSERT fails, do **not** silently return success. Persist a contingency row carrying the
  **real Meta IDs** plus a `needs_db_reconcile` marker, and return a response that is flagged as
  contingency (so an operator/cron can reconcile the local row) — Meta objects are intentionally kept
  (the ads exist and are valid), only the local mirror is missing.
- **D3 (honest response):** Standardize the response discriminator without breaking the "always 200"
  contract:
  - Success path → `{ success: true, status: 'created', contingency_mode: false, campaignId, adSetId, adId, creativeId }`.
  - Contingency path → `{ success: true, status: 'contingency', contingency_mode: true, reason, campaignId: <real-or-'pending'> }`.
  The frontend keys off `contingency_mode` / `status`, not HTTP code.

**Risk:** Medium. D1 issues a real DELETE — gated strictly on "a campaign id exists AND we are in the
failure path", best-effort, fully logged. D2/D3 only add fields and a branch; existing clients that
read `success`/`campaignId` keep working.

**DB note:** D1/D2 set optional columns (`rolled_back`, `needs_db_reconcile`) inside the existing
`campaign_data` JSON of `campaign_contingency` to avoid a schema migration; if dedicated columns are
preferred later, add them in a follow-up migration.

**Verification:** trace both failure branches; confirm rollback is best-effort and logged; confirm
no code path returns `success: true, contingency_mode:false` when the DB insert failed.

---

### Phase E — Type safety

- **E1:** Extend `SimpleCampaignPayload` to include the fields the handler actually reads:
  `useAISuggestions?: boolean`, `aiTargeting?: { interests?: {id:string;name:string}[]; ageMin?: number; ageMax?: number; genders?: 'all'|'male'|'female' }`, `interests?: any[]`, and add `source?: string`
  to `selected_locations[]`. Introduce a small `Targeting` type (or `Record<string, any>`) so
  `flexible_spec`, `targeting_automation`, `languages` are typed rather than `as any` casts.

**Risk:** None at runtime (Deno does not type-check); improves correctness and editor safety.

---

## 3. Rollout & validation

- These are Deno edge functions; there is no local unit harness for them in-repo. Validation is by
  careful read-through + the existing `src/__tests__/meta-api-helpers.test.ts` / `campaign-validation.test.ts`
  where applicable, plus a staging deploy + a live test campaign (image, video, existing-post) before
  production.
- Suggested manual smoke matrix after deploy:
  1. Image upload CTWA (auto WhatsApp from page).
  2. Video upload CTWA (validates C1 budget + thumbnail).
  3. Existing Instagram post CTWA (dark-post path).
  4. Forced failure (bad interest IDs / no WhatsApp on page) → confirm rollback + contingency row +
     no orphaned campaign in the ad account.

## 4. Progress log

- [x] **A — dead code removed.** Deleted `campaign-processor.ts`, `diagnostic-logger.ts`,
  `helpers.ts`, `types.ts`; removed the shadowed inline `sanitizeInterests` from `index.ts`.
  Directory is now `index.ts` + `utils.ts`.
- [x] **B — CORS + token hygiene.** Adopted `_shared/cors.ts` (`corsHeadersFor` + `handlePreflight`),
  origin-aware responses; moved all 6 `access_token` query-string usages to `Authorization: Bearer`
  via `metaAuthHeaders()`; URL logging now stripped via `safeUrlForLog()`.
- [x] **C — reliability.** `waitVideoReady` bounded by `VIDEO_WAIT_TIMEOUT_MS` (default 120 s, was
  300 s) and clamped; creative CTA degradation made real via `dropWhatsAppCta` flag;
  `uploadMediaToMeta` now honors its `apiVersion` param (default `v23.0`) in both upload URLs.
- [x] **D — rollback + DB integrity + honest response.** Added best-effort `rollbackMetaObjects()`
  (campaign DELETE cascades to ad set/ad), invoked in the catch before contingency; partial IDs
  cleared on successful rollback. DB-save failure on the happy path no longer returns silent
  success — it writes a `needs_db_reconcile` contingency row with the real Meta IDs and returns a
  `status:'contingency'` response. Response shape standardized: success →
  `status:'created', contingency_mode:false`; failure → `status:'contingency', contingency_mode:true, reason`.
  Recovery flags (`rolled_back`, `needs_db_reconcile`) stored in `campaign_contingency.campaign_data`
  (no migration required).
- [x] **E — payload types.** `SimpleCampaignPayload` extended with `useAISuggestions`, `aiTargeting`,
  `interests`, and location `source`; `targeting` typed as `Record<string, any>` so dynamic Meta
  fields no longer need `as any`.

### Verification performed (executed)
- **`deno check` (TypeScript 6.0.3 via Deno 2.8.3): PASS, 0 errors** on `index.ts`, `utils.ts`, and
  both test files. While getting it clean it surfaced and fixed a **pre-existing strict-null defect**
  (`'payload' is possibly null` ×80) — resolved with a single narrowing guard after `req.json()`.
- **Deep E2E suite (`deno test`): 13 passed / 0 failed.** The real `handleRequest` is driven
  end-to-end with mocked Meta (`fetch`) + injected mock Supabase. Scenarios:
  - **S1 happy path** → `status:'created'`, no rollback, CORS echoes the request origin (not `*`),
    no `access_token=` in any outgoing URL, `/adimages` upload carries `Authorization: Bearer`.
  - **S2 ad-creation failure** → rollback `DELETE /…/cmp_1` fires, contingency row written with
    `rolled_back:true` and partial IDs cleared, response `status:'contingency'`.
  - **S3 DB-save failure** → contingency row `needs_db_reconcile:true` with the **real** Meta IDs,
    **no** rollback (valid Meta objects preserved), response carries the real `campaignId`.
  - **S4 OPTIONS preflight** → `204` with origin-scoped CORS.
  - **S5 missing auth** → never a hard 5xx (contingency 200), no Meta campaign created.
  - 8 pure-helper unit tests (`toAccountPath`, `extractInvalidInterestIds`,
    `normalizeSpecialAdCategories`, `safeUrlForLog`, `metaAuthHeaders`, `sanitizeInterests`,
    `mapGenders`, `clampAge`).
- **Bug found by E2E and fixed:** `toAccountPath('act_act_123')` returned `act_act_123` despite its
  comment promising `→ 123`; the regex `^act_+` only stripped one segment. Changed to `^(act_)+`.
- **Testability seam (additive, non-breaking):** the handler is exported as `handleRequest`, helpers
  are exported, and the Supabase client is built via an injectable factory. Production `serve()` is
  gated by `!SCC_DISABLE_SERVE` (unset in prod → serves exactly as before; tests set it to drive the
  handler without binding a port). `import.meta.main` was deliberately NOT used (it can be `false`
  under Supabase's worker isolate, which would have stopped the server in production).
- `deno lint` reports only pre-existing stylistic findings (`no-explicit-any` etc.) consistent with
  this file's established style and not enforced by the project's ESLint config; the type-checker and
  tests are the authoritative gates.

### Still recommended before production
- Deploy to **staging** and run a live smoke campaign (image / video / existing-post / forced-failure)
  to validate against the real Meta Graph API, since the E2E mocks the Meta boundary.

---

## 5. Production hotfix — Meta v23 `is_adset_budget_sharing_enabled` (subcode 4834011)

**Reported:** 2026-06-22 (client test, "error creating campaign with existing post").

**Symptom (from production logs):** the *campaign* POST itself fails — before any creative/ad work —
so it broke **every** campaign creation, not just existing-post:
```
[CAMPAIGN-CREATION-ERROR] status:400 error_code:100 error_subcode:4834011
error_user_msg: "É necessário especificar True ou False no campo is_adset_budget_sharing_enabled
                 se você não estiver usando o orçamento da campanha…"
```

**Root cause:** Meta Marketing API v23 now **requires** `is_adset_budget_sharing_enabled` to be set
explicitly on a campaign that is **not** using campaign budget optimization (CBO). Camply puts the
budget on the **ad set** (no CBO), so the field is mandatory and was missing.

**Fix:** add `is_adset_budget_sharing_enabled: false` (each ad set uses its own budget — no sharing;
preserves existing behavior) to every campaign-CREATE site that uses ad-set budget. A full sweep
(`grep` for `/campaigns` POST, SDK `createCampaign`, and direct browser calls) found **7** such sites:

| # | Site | Layer | Objective |
|---|------|-------|-----------|
| 1 | `simple-campaign-create` (primary) | edge | `OUTCOME_ENGAGEMENT` |
| 2 | `contingency-auto-retry-walink` (async retry, also 400 in the log) | edge | `OUTCOME_TRAFFIC` |
| 3 | `simple-campaign-create-lite` | edge | `OUTCOME_TRAFFIC` |
| 4 | `advantage-campaign-create` (SDK `createCampaign`; budget is on the ad set, **not** CBO) | edge | `OUTCOME_TRAFFIC` |
| 5 | `test-wa-link-campaign-create` (test lab) | edge | `OUTCOME_TRAFFIC` |
| 6 | `test-meta-campaign-create` (passthrough — injects the flag only when absent **and** no campaign budget, so it never clobbers an explicit value or breaks a CBO test) | edge | caller-supplied |
| 7 | `src/services/metaAds/services/CampaignCreationService.ts` (direct browser → Graph call) | frontend | `OUTCOME_TRAFFIC` |

**Correctly NOT changed:**
- `contingency-manual-sync` — only inserts a row into the `campaigns` table (no Meta call).
- The read paths (`meta-campaigns-discover/enhanced/list`, `meta-discovery-initial/diff`,
  `meta-oauth-exchange`) — these are `GET …/campaigns?fields=…`, not creates.
- No CBO (campaign-budget) creator received the flag — each of the 7 puts the budget on the ad set.

**Verification (executed):**
- The E2E happy-path test asserts the outgoing `/campaigns` body contains
  `is_adset_budget_sharing_enabled: false`.
- `deno check`: all 6 touched edge functions clean; **frontend `tsc --noEmit`: 0 errors.**
- Full Deno suite: **13/13 green.**
- Incidental strict-mode fixes surfaced by `deno check`: 2 `implicit any` params in
  `contingency-auto-retry-walink` and 1 `unknown` catch in `test-meta-campaign-create`.

**Residual risk:** the E2E mocks Meta, so it proves we now *send* the required field on every path; a
**staging create against the live Graph API** is still the definitive confirmation that 4834011 is
resolved (and that no further newly-required field surfaces at the ad-set step).

### Follow-up (out of scope for this pass)
- Consider promoting `rolled_back` / `needs_db_reconcile` to real `campaign_contingency` columns via
  a migration, and teach `contingency-auto-retry-walink` + any reconciliation cron to read them.
- Longer term: move video processing to an async job so creation never blocks on Meta encoding.
