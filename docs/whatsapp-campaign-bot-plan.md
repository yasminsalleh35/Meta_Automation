# Camply — Creating campaigns over WhatsApp: implementation plan

> Status: **F1–F3 code built, tested and deployed with the bot OFF (2026-11-19)** — waiting for the client's Meta setup (§9) · Written 2026-11-10 · Requested by Jefte on 2026-10-29
> Scope of the quote: the **MVP** in §2. Version 2 items (§14) are out of scope.
> Prerequisite: the audit fixes, which were closed and re-verified on 2026-11-10 (`docs/audit-fix-plan.md`).

---

## Implementation status (2026-11-19, review fixes 2026-11-20)

| Part | State |
|---|---|
| §5.1 shared creation/activation core | **Done, deployed.** `simple-campaign-create/core.ts` (`createSimpleCampaign`) and `simple-campaign-activate/core.ts` (`activateCampaignForUser`); the HTTP entry points are thin wrappers with the same responses. |
| §5.2–§5.7 bot backend | **Done, deployed.** `_shared/whatsapp.ts`, `_shared/waBot/{parse,messages,engine,runtime,flags}.ts`, `_shared/aiCopy.ts`, functions `wa-bot-webhook`, `wa-bot-worker`, `wa-bot-link`. |
| §6 data model | **Applied:** `20261119000001_wa_bot_tables.sql`, sweep cron `20261119000002_wa_bot_sweep_cron.sql`. LGPD export includes the four tables. |
| §7.4 Instagram post by link | **Done** (engine + runtime). |
| §10 web app | **Done:** Settings → WhatsApp tab (`?tab=whatsapp`), "via WhatsApp" badge on the campaign card. Hidden while the bot is off. |
| §11 tests | **Done:** 95 new Deno tests (units, engine, runtime with fake DB, activation core, core entry point); probe gained explicit bot checks. |
| §9 Meta setup | **Waiting for the client** (Stage A). Secrets already set: `WA_BOT_MODE=off`, `WA_BOT_NUMBER`, `WA_BOT_MAX_DAILY_BUDGET=200`, `WA_VERIFY_TOKEN`. Missing: `WA_ACCESS_TOKEN`, `WA_PHONE_NUMBER_ID`. |
| F4 manual QA on real devices, beta, launch | **Pending** (needs the Meta setup). |

**Where the build differs from the text below** (the text was written before the code; these win):
- The shared cores live next to their functions (`simple-campaign-create/core.ts`,
  `simple-campaign-activate/core.ts`) instead of `_shared/campaign/` — no file moves, so every existing
  test import still works.
- The link code is **8 digits** (not 6), with **5 failed attempts per number per hour** and a **global limit of
  1000 failures/hour**; anyone who guessed a pending code would otherwise link *their* WhatsApp to someone
  else's account.
- The worker lock is `wa_bot_claim_session(p_wa_id, p_token, p_lock_seconds)` / `wa_bot_extend_session` /
  `wa_bot_release_session(p_id, p_token)` (one session row per number, owner token, renewed per message;
  migration `20261120000001`) instead of `claim_wa_bot_messages`.
- Activation needs the **button tap**; a typed "sim"/"ok" is not enough. The summary lists budget, place,
  duration and "pausada" **before** the ad text; texts over 400 chars are sent in full just before it.
- The sweep also re-delivers finished job results to conversations still waiting in CREATING/ACTIVATING,
  so no conversation can stay stuck on "criando…".
- Media is accepted up to **50 MB** (not 100 MB): the edge function holds the file in memory.
- Activation now also blocks suspended / pending-deletion accounts — for the web endpoint too (the
  audit had fixed creation but not activation, which is the step that spends money).

## 0. Summary

A Camply user sends messages to **Camply's official WhatsApp number**, answers a short guided
chat (media → location → radius → budget → duration), checks a summary written by the AI, taps
**Confirmar**, and gets a **paused** Click-to-WhatsApp campaign in their own Meta ad account. A
second tap, **Ativar**, starts spending. They can also ask "como estão minhas campanhas?" in the
same chat.

Most of the engine already exists. The chat reuses the same creation code as the web wizard
(`simple-campaign-create`), the same activation code (`_shared/metaCascade.ts`), the same AI
configuration (`ai_configurations` plus `consume_ai_quota`) and the same metrics
(`_shared/metrics.ts`). What is new:

1. A WhatsApp Cloud API number and webhook.
2. Linking a phone number to a Camply account.
3. A conversation state machine.
4. Media download from WhatsApp.
5. A refactor so the creation code can run without a browser session.

**Effort:** about 21 developer days, roughly 4–5 calendar weeks (§12), including the Instagram-post option. Meta's setup steps (§9) run in
parallel and are usually the slowest part, because they depend on Meta's reviews.

---

## 1. Goals and non-goals

**Goals**
- A user can go from "oi" to a paused campaign in **under 3 minutes**, without opening the web app.
- **No money is spent by accident.** It takes two explicit taps, a server-side budget cap, and nothing
  that acts on a message from an unknown number.
- **Honest outcomes.** The user is told the real result: created, failed with a reason, or queued for the team.
- The audit guarantees still hold: CI green, the security probe at 0 FAIL, and no tokens in the
  browser or the logs.

**Non-goals (MVP)**
- Open-ended "ask me anything" chat. Meta's Business Solution terms have banned general-purpose AI
  assistants since 2026-01-15, so the bot stays a task assistant for Camply only.
- Advantage+ campaigns, dayparting and interest targeting by chat. The
  bot uses the same defaults the web wizard uses.
- Proactive alerts (they need paid templates). Pause/resume, budget changes and AI copy variations
  are Version 2 (§14).
- Languages other than pt-BR.

---

## 2. MVP scope (what gets delivered)

| # | Capability | Done when |
|---|---|---|
| M1 | **Link a phone number** to a Camply account (dashboard → code → user sends the code to the bot) | Linked in under 1 minute; one number per account; unlinking works from both sides |
| M2 | **Create a campaign by chat**: photo or video, location (shared pin or typed city), radius, daily budget, duration, AI-written copy, edit copy | The campaign appears **paused** in Meta and in Camply's list with the "via WhatsApp" badge |
| M2b | **Use an existing Instagram post** by pasting its link (or sharing it from Instagram to the bot); requested by Jefte on 2026-11-10 | A link to a post or Reel from the Instagram account linked to the user's Page becomes the creative (§7.4) |
| M3 | **Confirmar → Ativar** with two taps | Activation goes through the same cascade as the web app, and the real Meta status is reported |
| M4 | **"Minhas campanhas" status** | Up to 5 campaigns with status, spend, conversations and cost per conversation (last 7 days) |
| M5 | **Commands**: `menu`, `cancelar`, `ajuda`, `parar` (stop messaging) | All of them work at any point in the flow |
| M6 | **Safety and compliance**: budget cap, suspended accounts blocked, LGPD export/delete, log masking, probe checks | Probe and tests green |
| M7 | **Beta rollout** behind a feature flag (allow-list first, then everyone) | Flag switches without a deploy |

---

## 3. What already exists, and the gaps (verified in the code on 2026-11-10)

| Need | Already in Camply | Gap |
|---|---|---|
| Create a CTWA campaign | `simple-campaign-create`: auth, suspension check, idempotency (`campaign_create_requests`), Page/IG validation, media upload, rollback, contingency, honest 200/202/4xx | It **only runs on a user JWT** (`auth.getUser(bearer)`), and a bot has no browser session. The core must be extracted (§5.1) |
| Location targeting | `targeting.ts` → `buildGeoLocations` already accepts `{latitude, longitude, radius}` (custom_locations, radius **1–80 km**) and city keys (radius clamped to **17–80 km**, Meta's limit for cities) | None for a shared pin. A typed city goes through Meta's `adgeolocation` search, as in `meta-targeting-search`. The radius buttons depend on the location type (§7.2) |
| Activate / pause | `_shared/metaCascade.ts` (`activateCascade`, `pauseCascade`, `fetchEffectiveStatus`). `simple-campaign-activate` adds the ownership check, reads the true `effective_status` and updates the `campaigns` row | That wrapper also requires a JWT. Its handler body is extracted together with the create core (§5.1) |
| Page / Instagram / WhatsApp destination | `resolveAllowedPage` uses the requested Page, or `integrations.page_id` when none is sent, validated against the user's Pages. The Instagram account comes from the Page. With no number pinned, Meta uses **the WhatsApp number linked to the Page** | None. The bot sends `fanpage` only when the user picks from several Pages and never pins a number, which matches the wizard's default |
| Plan or access gate | **The web wizard has no plan check today** (no route guard and no server check in `simple-campaign-create`) | Decide whether WhatsApp creation should be open to every user or restricted (§16) |
| AI copy | `ai-suggestions` / `ai-generate-profile` read `ai_configurations` (OpenAI/DeepSeek) and use `business_settings` | The prompt logic sits inside the HTTP handlers. A small `_shared/aiCopy.ts` is needed |
| AI cost limit | `_shared/aiQuota.ts` (`consume_ai_quota`, 20/hour, 100/day) | None. It is reused with `fn='wa-bot'` |
| Metrics | `campaign_metrics_cache` plus `_shared/metrics.ts` (`countConversations`, `costPerConversation`) | None |
| Media storage | Bucket `user-media` (1 GB limit) plus the `media_files` table (`source` column) | Download from the WhatsApp Graph media endpoint |
| Account state | `_shared/auth.ts` → `inactiveAccountReason` | None |
| Phone normalization | `_shared/phone.ts` (`normalizeBrPhone`) | Brazil's 9th-digit quirk in `wa_id` (§6.2) |
| Cron and secrets | `pg_cron` jobs, `CRON_SECRET`, `requireCron` | One new job (§5.5) |
| Existing WhatsApp tables | `whatsapp_campaigns`, `whatsapp_numbers`, `meta_whatsapp_numbers`, all empty and legacy | **Not reused**, to avoid confusion. The new tables use the `wa_bot_` prefix |

---

## 4. Architecture

```
User's WhatsApp ──► Camply bot number (WhatsApp Cloud API)
                         │  POST webhook (signed X-Hub-Signature-256)
                         ▼
      ┌──────────────── wa-bot-webhook  (public, verify_jwt=false) ───────────────┐
      │ 1. verify HMAC with the App Secret → 401 if wrong                          │
      │ 2. insert each message into wa_bot_messages (UNIQUE wamid → dedupe)        │
      │ 3. answer 200 at once (Meta retries if it doesn't get a fast 200)          │
      │ 4. EdgeRuntime.waitUntil(kick worker for that wa_id)                       │
      └───────────────────────────────────────────────────────────────────────────┘
                         │
                         ▼
      ┌──────────────── wa-bot-worker  (service role or cron only) ───────────────┐
      │ - claims the oldest unprocessed messages of ONE wa_id (row lock)           │
      │ - loads link + session → runs the state machine (pure reducer)            │
      │ - side effects: download media, AI copy, Meta search, send replies        │
      │ - "create" step → enqueues wa_bot_jobs and starts a separate run           │
      │   (fresh time budget, since a video can take ~2 min at Meta)              │
      └───────────────────────────────────────────────────────────────────────────┘
                         │
                         ▼
      _shared/campaign/createSimpleCampaign.ts  (extracted from simple-campaign-create)
      _shared/metaCascade.ts (activate)   _shared/aiCopy.ts   _shared/whatsapp.ts (send/download)

   cron every minute → wa-bot-worker?mode=sweep  (picks up stuck messages and jobs, expires sessions)

Web app: Settings → "WhatsApp" card → wa-bot-link (user JWT): create code / status / unlink
```

**Why it's split this way**
- Meta wants a fast 200, but a campaign can take up to about 2 minutes. So the webhook only stores
  messages, and the real work happens in background or separate invocations.
- Each `wa_id` is processed in order. Users often send two messages quickly ("50" then "reais"),
  and processing them in parallel would corrupt the session.
- The state machine is a **pure function** (`(session, event) → (session', actions[])`), so every
  path is unit-tested without Meta.

---

## 5. Backend work

### 5.1 Refactor: extract the creation core (the most important step)
`simple-campaign-create/index.ts` (2,284 lines) mixes HTTP, auth and the creation logic.

- Move everything after the auth check in `handleRequest` into
  `supabase/functions/_shared/campaign/createSimpleCampaign.ts`:
  ```ts
  export async function createSimpleCampaign(
    db: SupabaseClient,
    userId: string,
    payload: SimpleCampaignPayload,
    opts: { source: 'web' | 'whatsapp' } = { source: 'web' },
  ): Promise<{ httpStatus: number; body: CreateResult }>
  ```
  It returns the **same** bodies as today (`created`, `failed` plus code, `queued` plus `contingencyId`, `in_progress`).
- `simple-campaign-create/index.ts` becomes a thin wrapper: CORS → JWT → `createSimpleCampaign` → JSON.
  **The HTTP contract does not change**, so the web wizard is untouched.
- `opts.source` is written to `campaigns.meta_data.created_via` (`'simple-wizard'` or `'whatsapp'`)
  and `campaigns.source` stays `'camply'`.
- Move `targeting.ts`, `utils.ts` and `errors.ts` with it, and keep re-exports so the existing tests' imports work.
- **Acceptance:**
  - All 75 existing Deno tests pass unchanged, including the e2e suite (`_tests/simple-campaign-create.e2e.test.ts`).
  - `deno check` passes on all functions.
  - A web campaign is created on production with an identical result.
- Do the same, in smaller form, for activation: `_shared/campaign/activateCampaign.ts(db, userId, campaignId)`,
  moved out of `simple-campaign-activate` (ownership check plus cascade plus status update).
- **Time budget:** the create job runs the same code path that the web call already runs in one
  invocation today, including the 120 s video wait (`VIDEO_WAIT_TIMEOUT_MS`). So running it in a
  dedicated job invocation adds no new timeout risk compared with the web wizard.

### 5.2 `_shared/whatsapp.ts` (new)
- `verifySignature(rawBody, header, appSecret)`: HMAC-SHA256, compared with `timingSafeEqual` from `_shared/auth.ts`.
  `appSecret` comes from `get_meta_ads_config` (the same Meta App), cached per isolate for 5 minutes,
  with `WA_APP_SECRET` as an optional override (§9).
- `sendText`, `sendButtons` (≤3 buttons, titles ≤20 characters), `sendList` (≤10 rows), `sendLocationRequest`
  (the Cloud API `location_request_message`), `markReadWithTyping(wamid)` (shows "digitando…" during long steps).
- `downloadMedia(mediaId)`: `GET /{media-id}` → short-lived URL → fetch with the bot token. Enforce
  the size and MIME rules in §6.4.
- Every call uses `GRAPH_BASE` from `_shared/meta.ts` (v23.0). Retry only on 429/5xx with backoff, and
  **never retry a send that may already have gone out** (dedupe by our outbound `client_ref`).
- Logs mask phone numbers (`+55 •• •••• 1234`).

### 5.3 `wa-bot-webhook` (new, public)
- `GET`: Meta's verification handshake (`hub.mode=subscribe`, `hub.verify_token == WA_VERIFY_TOKEN` → echo `hub.challenge`).
- `POST`:
  1. Read the raw body. A bad or missing signature returns **401**, and nothing is stored.
  2. For each `messages[]` entry, insert into `wa_bot_messages` (`ON CONFLICT (wamid) DO NOTHING`).
  3. For each `statuses[]` entry (sent, delivered, read, failed), update the matching outbound row (useful for debugging).
  4. Return **200** immediately, then `waitUntil` a POST to `wa-bot-worker` with the service role for each distinct `wa_id`.
- `config.toml`: `verify_jwt = false` (as for `pagarme-webhook`). No CORS, because only Meta calls it.

### 5.4 `wa-bot-worker` (new, internal)
- Accepts **only** the service role or the cron secret (`requireServiceRole` / `requireCron`).
- `mode=conversation&wa_id=…`:
  - Run `claim_wa_bot_messages(wa_id)` (an RPC with `FOR UPDATE SKIP LOCKED` on the session row).
  - Process the messages in timestamp order.
  - Release the lock.
- `mode=job&id=…`: run one `create_campaign` or `activate_campaign` job (§5.6).
- `mode=sweep` (cron, every minute):
  - Re-kick messages that stayed unprocessed for more than 60 s.
  - Fail jobs stuck for more than 10 minutes and tell the user honestly.
  - Expire idle sessions after 24 h.
  - Purge message bodies older than 90 days.

### 5.5 `wa-bot-link` (new, user JWT)
- `POST {action:'start'}` → create a 6-digit code (store only its SHA-256, valid for 10 minutes, max 5 tries) and return:
  - `code`;
  - `waLink: https://wa.me/<BOT_NUMBER>?text=VINCULAR%20<code>`;
  - `expiresAt`.
- `GET` → `{ linked, phoneMasked, linkedAt }` for the Settings card. The card polls every 3 s while a code is pending.
- `POST {action:'unlink'}` → `status='revoked'`, and the bot sends a final "Número desvinculado" message.
- It refuses inactive accounts (`inactiveAccountReason`).
- Uses the shared CORS module (`_shared/cors.ts`).

### 5.6 Jobs
`wa_bot_jobs` (`kind` = `create_campaign` | `activate_campaign`, `status`, `attempts`, `payload`, `result`).

- **Create:**
  - Build the `SimpleCampaignPayload` (§7.3).
  - Call `createSimpleCampaign(db, userId, payload, {source:'whatsapp'})` with
    `idempotencyKey = 'wa:' + session.id + ':' + session.draft_version`. A retry or a double tap can
    never make two campaigns, because the existing `campaign_create_requests` returns the first result.
  - Map the result to a message:
    - `created` → "✅ Campanha criada (pausada)" + [Ativar agora] [Deixar pausada]
    - `failed` → the real `userMessage`, plus "Quer tentar de novo?" when it can be fixed (media, location)
    - `queued` → "Recebemos seu pedido… nossa equipe conclui em até 24h úteis" (same promise as the web)
    - `in_progress` → stay silent; the first run will answer
- **Activate:** `activateCampaign(...)`, then `fetchEffectiveStatus`. Report `ACTIVE`, `IN_PROCESS`
  ("em análise pela Meta") or the error honestly.
- **No automatic retry of create on a timeout** (creation at Meta isn't idempotent). The sweep marks
  the job `failed_unknown` and tells the user to check the Campanhas page. The idempotency key then
  returns whatever actually happened if they try again.

### 5.7 `_shared/aiCopy.ts` (new, small)
- `generateAdCopy(db, userId, {businessSettings, mediaKind, city})` → `{ adTitle (≤40), adText (≤300) }`.
- Uses the active `ai_configurations` row (the same as `ai-suggestions`) and calls `consumeAiQuota(db, userId, 'wa-bot')` first.
- Strict JSON output, validated (length, no URLs or phone numbers, no promises such as "garantido"
  or "sem risco"), following the marketing-claims rules from the audit (LGL-06).
- **Fallback** without AI: a template built from `business_settings.business_name` + `main_product` + "Fale com a gente no WhatsApp".
  The flow never blocks on the AI.
- The AI never sees tokens, never chooses the budget, location or status, and never calls tools.

---

## 6. Data model (one migration, applied the usual way: dry-run → apply → record)

### 6.1 Tables
```sql
-- Phone ↔ account link
create table public.wa_bot_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wa_id text,                          -- as Meta sends it (digits only)
  phone_masked text,                   -- '+55 •• •••• 1234' for the UI
  status text not null default 'pending' check (status in ('pending','active','revoked')),
  code_hash text, code_expires_at timestamptz, code_attempts int not null default 0,
  max_daily_budget numeric(10,2),      -- per-user override of the global cap (admin only)
  opted_out_at timestamptz,            -- user sent "parar"
  linked_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now()
);
create unique index wa_bot_links_user_active on public.wa_bot_links(user_id) where status in ('pending','active');
create unique index wa_bot_links_waid_active on public.wa_bot_links(wa_id) where status = 'active';

-- Conversation state (one open session per wa_id)
create table public.wa_bot_sessions (
  id uuid primary key default gen_random_uuid(),
  wa_id text not null, user_id uuid references auth.users(id) on delete cascade,
  state text not null default 'IDLE',
  draft jsonb not null default '{}',   -- media, location, radius, budget, dates, copy
  draft_version int not null default 0,
  last_inbound_at timestamptz,         -- 24 h customer-service window
  locked_until timestamptz,            -- worker lock
  expires_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now()
);
create unique index wa_bot_sessions_open on public.wa_bot_sessions(wa_id) where state <> 'CLOSED';

-- Inbound/outbound log (dedupe + audit; bodies purged after 90 days)
create table public.wa_bot_messages (
  id bigint generated always as identity primary key,
  wamid text unique,                   -- Meta message id (inbound) / returned id (outbound)
  direction text not null check (direction in ('in','out')),
  wa_id text not null, user_id uuid references auth.users(id) on delete set null,
  msg_type text, body jsonb,           -- redacted: no tokens; media referenced by id/path
  received_at timestamptz default now(), processed_at timestamptz,
  status text, error text
);
create index on public.wa_bot_messages(wa_id, processed_at) where processed_at is null;

-- Long-running work
create table public.wa_bot_jobs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.wa_bot_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('create_campaign','activate_campaign')),
  status text not null default 'pending' check (status in ('pending','running','done','failed','failed_unknown')),
  attempts int not null default 0, payload jsonb, result jsonb,
  started_at timestamptz, finished_at timestamptz, created_at timestamptz default now()
);
```
- **RLS** is on for all four tables.
  - The only browser policy is `select` on `wa_bot_links` for `user_id = auth.uid()`, and it does
    **not** expose `code_hash` (a view or column grant returns only status, phone_masked and linked_at).
  - Everything else is service role only. `anon` and `authenticated` get no grants on sessions, messages or jobs.
- RPCs: `claim_wa_bot_messages(p_wa_id)` and `release_wa_bot_session(p_id)`, both `security definer`,
  with `EXECUTE` revoked from `public`, `anon` and `authenticated`.
- `media_files.source = 'whatsapp'` for media the bot saves.

### 6.2 Brazil 9th-digit rule
WhatsApp `wa_id` for many Brazilian mobiles comes **without** the extra 9 (12 digits: `55 DD XXXXXXXX`).
Linking works from the `wa_id` that sent the code, so no matching against a typed number is needed.
`phone_masked` is built from the `wa_id`. **Never** build the reply address from a typed number; always reply to the `wa_id`.

### 6.3 LGPD
- Add `wa_bot_links`, `wa_bot_sessions` and `wa_bot_messages` to `EXPORT_TABLES` in `_shared/dataSubject.ts`.
- The `on delete cascade` from `auth.users` covers the hard-delete job. WhatsApp media sits under
  `user-media/<uid>/whatsapp/…`, which the existing purge already deletes.
- A message from a number that isn't linked is stored for 7 days only, and only the type and timestamp, not the content.
- The privacy policy gets one paragraph on WhatsApp processing. The text is ready to add to `docs/legal/` and needs Jefte's approval.

### 6.4 Media rules
| Received as | Accepted | Notes |
|---|---|---|
| `image` (JPEG/PNG, ≤ 5 MB per WhatsApp) | yes | WhatsApp compresses photos, so suggest "enviar como documento" for best quality |
| `video` (MP4/3GP H.264, ≤ 16 MB per WhatsApp) | yes | Videos are compressed, and longer ones get cut off. Same tip |
| `document` with an image/* or video/* MIME (≤ 100 MB) | yes | Best quality. Check the MIME by magic bytes, not just the header |
| anything else (audio, sticker, PDF) | no | Friendly message asking for a photo or video |

The download goes to `user-media/<uid>/whatsapp/<wamid>.<ext>`, then into `media_files`, and its
URL is used as `selectedMediaMeta.public_url`. **If the media bucket is made private** (the pending
audit decision), use a signed URL valid for 1 h for the Meta upload.

---

## 7. Conversation design

### 7.1 States
```
IDLE ──"oi"/any──► MENU ──[Criar campanha]──► ASK_MEDIA ─photo/video─► ASK_LOCATION
                     │                                                 │ pin → ASK_RADIUS
                     │                                                 │ text → PICK_CITY (list ≤10) → ASK_RADIUS
                     │                                   ASK_RADIUS ─pin: [5][10][20 km] · city: [17][30][50 km] or typed─► ASK_BUDGET
                     │                                   ASK_BUDGET ─[R$30][R$50][R$100] or "70"─► ASK_DURATION
                     │                                   ASK_DURATION ─[Sem data fim][7 dias][30 dias]─► COPY (AI)
                     │                                   REVIEW ─[Confirmar][Editar texto][Cancelar]
                     │                                     └ Editar → EDIT_COPY (user types text) → REVIEW
                     │                                   CREATING (job) ─► CREATED ─[Ativar agora][Deixar pausada]
                     │                                                        └ Ativar → ACTIVATING (job) ─► MENU
                     ├──[Minhas campanhas]──► STATUS (list) ─► MENU
                     └──[Ajuda]──► help text ─► MENU
Global at any state:  "cancelar" → discard draft → MENU · "menu" → MENU · "parar" → opt-out · "ajuda"
```

**Pre-checks when [Criar campanha] is tapped:**
1. The account is active (`inactiveAccountReason`).
2. It has an active `meta_ads` integration with an ad account and a Page.
3. The plan or access rule decided in §16, item 3. The web wizard has none today. If one is added,
   put it in `createSimpleCampaign` so the web and WhatsApp share it, never in the bot alone.
4. The beta flag allows this user.
5. The default Page has a WhatsApp number linked. This is the same Graph check the create function's
   pre-validation does, run early so the user doesn't fill everything first.

If any of these fails, send a clear message with a link to the right dashboard page, and send no money-related prompt.

**More than one Page:**
- If `integrations.selected_page_ids` holds more than one Page, show a list "Qual Página vai anunciar?"
  (≤10, default first). With one Page, send no `fanpage`, and `resolveAllowedPage` falls back to `integrations.page_id`.
- The Instagram account follows the Page (the CMP-03 logic runs inside `createSimpleCampaign`). With no IG, the ad runs on Facebook only.
- The WhatsApp destination is **the number linked to that Page**. The bot never pins a number, which
  matches the wizard's default. If the Page has no WhatsApp linked, the existing pre-validation returns
  a clear error, and the bot relays it with the help link.

### 7.2 Messages (pt-BR, final text to be reviewed with Jefte)
| State | Bot says | Input |
|---|---|---|
| MENU | "Oi, {nome}! 👋 O que você quer fazer?" | Buttons: **Criar campanha** · **Minhas campanhas** · **Ajuda** |
| ASK_MEDIA | "Me envie a **foto ou vídeo** do anúncio (dica: envie como *documento* para manter a qualidade) — ou cole o **link de um post do seu Instagram**." | photo, video, document, or an Instagram link (§7.4) |
| IG_POST_FOUND | Post thumbnail + "Vou usar este post do @{conta}. O texto do anúncio pode ser a legenda do post ou um texto novo." | **Usar a legenda** · **Texto novo (IA)** · **Outro post** |
| ASK_LOCATION | "Onde você quer anunciar? Toque em 📎 → *Localização* para enviar o ponto, ou digite o nome da cidade." | location pin or text |
| PICK_CITY | "Encontrei estas cidades:" | List of up to 10 results from `adgeolocation` (BR first) |
| ASK_RADIUS (pin) | "Qual o raio ao redor desse ponto?" | **5 km** · **10 km** · **20 km** or a typed number from 1 to 80 |
| ASK_RADIUS (city) | "Qual o raio ao redor da cidade?" | **17 km (só a cidade)** · **30 km** · **50 km** or a typed number from 17 to 80. Meta's minimum for a city is 17 km; a smaller value gets "Para cidades o mínimo é 17 km — para um bairro, envie o ponto 📍" |
| ASK_BUDGET | "Quanto quer investir **por dia**?" | **R$ 30** · **R$ 50** · **R$ 100** or a typed value. Minimum R$ 30 (same as the web). Above the cap → "O máximo pelo WhatsApp é R$ X/dia. Para valores maiores use o painel." |
| ASK_DURATION | "Por quanto tempo?" | **Sem data fim** · **7 dias** · **30 dias** |
| COPY | (typing indicator) "Escrevendo o texto do anúncio…" | — |
| REVIEW | Summary: thumbnail, title, text, location + radius, R$/day, duration, Page, "Será criada **pausada**." | **Confirmar** · **Editar texto** · **Cancelar** |
| CREATING | "Criando sua campanha na Meta… vídeos podem levar até 2 minutos. ⏳" | — |
| CREATED | "✅ Campanha **{nome}** criada (pausada). Quer ativar agora? Ela começa a gastar até R$ {x}/dia." | **Ativar agora** · **Deixar pausada** |
| ACTIVATED | "🚀 Ativada! A Meta está revisando o anúncio — normalmente leva até 24h." | — |
| STATUS | One line per campaign: "• {nome} — {status} · R$ {gasto} · {conversas} conversas · R$ {custo}/conversa (7 dias)" | Button: **Menu** |

- Free text is accepted wherever there are buttons, using **deterministic parsers**: "50", "R$50,00",
  "50 reais" → 50; "15km" → 15; "sim"/"confirmar" → confirm.
- An answer that doesn't parse gets the same question again with an example. After 3 failed tries, the bot offers **Menu**.
- The **AI is not used to interpret the conversation in the MVP**. That keeps cost and policy risk low
  and the behaviour predictable. Free-text understanding by AI is a Version 2 item.

### 7.3 Payload sent to `createSimpleCampaign`
It matches what the web wizard sends (`useSimpleCampaignWizard.ts`), so behaviour is identical:
```ts
{
  idempotencyKey: `wa:${session.id}:${session.draft_version}`,
  campaignName: `${businessName} – ${city} – ${dd/MM}`,       // ≤ 100 chars
  adTitle, adText,                                            // from aiCopy or edited by the user
  fanpage: chosenPageId | undefined,                          // undefined → integrations.page_id (validated, CMP-03)
  instagram: '',                                              // resolved from the Page server-side
  whatsappLink: '',                                           // no pin → Meta uses the Page's WhatsApp
  dailyBudget,
  startDate: new Date().toISOString(),                        // same as the wizard's toStartIso() for "today"
  endDate: null | `${ymd(today + 7|30)}T23:59:59-03:00`,      // same as the wizard's toEndIso()
  selected_locations: [{ name, type: 'city', key } | { name, latitude, longitude, radius }],
  radius, campaignType: 'traffic', status: 'PAUSED', gender: 'all', ageMin: 18, ageMax: 65,
  specialCategories: [], countryCode: 'BR',
  creativeType: 'upload', selectedMediaMeta: { file_type, public_url, filename },
  useAISuggestions: false, adSchedule: null
}
// Instagram-post variant (§7.4): the same as the wizard's "post" path
//   creativeType: 'post', selectedInstagramPostId: <IG media id>, instagramUserId: <IG account id>,
//   useExistingInstagramPost: true, selectedMediaMeta: null, mediaUrl: null
```

### 7.4 Existing Instagram post by link (M2b)
**Short answer to Jefte: yes, it's possible.** The web wizard already promotes existing Instagram posts
(`creativeType: 'post'` in `simple-campaign-create`, which handles images, videos, Reels and the first
item of a carousel). The bot only has to turn a **link** into the post's ID.

- **Accepted links:** `instagram.com/p/<code>`, `/reel/<code>`, `/reels/<code>` and `/tv/<code>`, with or without
  `?igsh=…`. This is also what Instagram's "Compartilhar → WhatsApp" sends. The code is extracted with a strict regex.
- **Finding the post:** Meta has no "link → ID" lookup, so the bot lists the posts of the **Instagram account
  linked to the user's Page** (`GET /{ig-user-id}/media?fields=id,shortcode,permalink,media_type,media_product_type,thumbnail_url,caption`,
  the same call `simple-campaign-assets` makes) and matches `shortcode` or `permalink`. The search stops at the
  **most recent 200 posts** (8 pages of 25).
- **Messages when it can't be used:**

  | Case | Bot replies |
  |---|---|
  | Not found (another account's post, or older than the last 200) | "Não achei esse post no Instagram @{conta} ligado à sua Página. Só dá para usar posts da sua própria conta." |
  | No Instagram linked to the Page | "Sua Página não tem Instagram conectado. Envie uma foto ou vídeo." |
  | Story link, or a private or deleted post | "Esse link não é de um post/Reel. Envie o link do post ou uma foto/vídeo." |
  | The post has no downloadable media (Meta hides `media_url` for some content, such as Reels with licensed music) | Create fails with the existing honest error. The bot suggests sending the video file instead |

- **Expectations to set with Jefte:**
  - A Click-to-WhatsApp ad needs the "Enviar mensagem" button, so the existing code creates **a new ad
    using the post's photo or video** (a dark post) rather than boosting the original post.
  - The **likes and comments of the original post are not carried over** to the ad.
  - The ad text is either the post's caption or new AI copy, chosen by the user.
- **Effort:** about 2 developer days (link parser, media lookup with paging, the IG_POST_FOUND step,
  tests). Added to F3.

---

## 8. Security and abuse controls

| Risk | Control |
|---|---|
| A forged webhook creates campaigns | HMAC `X-Hub-Signature-256` with the App Secret. Anything else gets 401 and is not stored |
| Replayed or duplicated delivery | `wamid` UNIQUE, idempotent processing, job idempotency key |
| A stranger's number acts on an account | Only an **active** `wa_bot_links` row maps `wa_id → user_id`. Unknown numbers get one generic reply a day ("Conecte seu WhatsApp em Camply → Configurações") and nothing else |
| Link-code guessing | 6 digits, 10-minute expiry, 5 tries, then the code is invalidated. Only the hash is stored. Per-`wa_id` limit on `VINCULAR` messages |
| Spending by accident | Created **PAUSED**. Activation needs a second tap within 24 h, carrying the campaign id and a nonce. Global cap `WA_BOT_MAX_DAILY_BUDGET` (suggested R$ 200/day) plus a per-user override. The minimum stays R$ 30 |
| Suspended or deleted accounts | `inactiveAccountReason` is checked on every message, and again inside `createSimpleCampaign` |
| Message flooding | DB-based limit of 30 inbound messages per minute per `wa_id` (the existing `rate_limits` table or a counter on the session). Excess messages are stored but ignored |
| AI misuse or prompt injection | The AI only writes copy. Its output is validated and shown to the user before confirming, and it never controls actions. Quota with `fn='wa-bot'` |
| Token or PII leaks | The bot token lives in Supabase secrets only. Logs mask phone numbers. `wa_bot_messages.body` never stores tokens. No CORS on the webhook. The worker is service role or cron only |
| A worker run killed mid-create | The job and idempotency key make the next attempt return the real outcome. The sweep tells the user honestly |
| User opt-out | "parar" sets `opted_out_at`, and the bot stays silent until the user sends "voltar" or relinks |

New checks for the security probe (`npm run probe`):
- An unsigned or bad-signature POST to `wa-bot-webhook` returns 401.
- The `GET` handshake with a wrong token returns 403.
- `wa-bot-worker` without the service role or cron secret returns 401.
- `wa-bot-link` without a JWT returns 401.
- `anon` and `authenticated` cannot read `wa_bot_sessions`, `wa_bot_messages` or `wa_bot_jobs`,
  or `wa_bot_links.code_hash`.
- The RPCs can't be executed by `anon` or `authenticated`.

---

## 9. Meta / WhatsApp setup (done by Jefte, guided by us)

**The developer gets no access to Camply's Meta Business Portfolio or App.** Jefte does every step in
Meta's interface, following a step-by-step guide we send him. He then sends back only the values the
code needs, through a one-time secret link and never as plain chat or email. Anything that can be done
through the API with the token he sends (number registration, PIN, the app's webhook subscription
check) is done by us, so Jefte has fewer screens to go through.

**Stage A: start now (Jefte)**
1. **Check business verification:** Business Settings → Security Center. If it isn't verified, do it now (CNPJ and documents). This is the slowest step.
2. **Get a dedicated phone number.** It must not be registered on the WhatsApp or WhatsApp Business
   apps, or its WhatsApp account must be deleted first. It can be a new SIM or a virtual number, and
   it must receive one SMS or voice code.
3. **Create a new Meta App with the WhatsApp use case** (developers.facebook.com → Create app → use case
   "Connect with customers through WhatsApp" → Camply's business portfolio). This is the flow Meta
   documents (checked 2026-11-20); it leaves the login app untouched. Meta creates a **test number**
   automatically. Because it is a separate app, Jefte also sends its **App Secret** (`WA_APP_SECRET`).
   Publish the app (privacy policy URL `https://camplyia.netlify.app/legal/privacy`, icon, category) before
   going live.
4. **Add up to 5 test recipients** (his own and the team's numbers) on the app's WhatsApp → API Setup page.
5. **Create a system user:** Business Settings → Users → System users → Add, with the Admin role.
   - Assign assets: **the App** (full control) and **the WhatsApp account(s)** (full control).
   - Generate token → choose the app, expiry **Never**, permissions `whatsapp_business_messaging` and
     `whatsapp_business_management`.
6. **Add a payment method** in Billing Hub (`business.facebook.com/latest/billing_hub/payment_methods/`)
   for the WhatsApp account. Since 2026-10-01 service replies are free only for the first **1,000 per
   number per month**; without a payment method Meta stops delivering them after that.
7. **Send us via a one-time link:**
   - the **permanent token**;
   - the **WhatsApp Business Account ID**;
   - the test number's **Phone number ID**.

**Stage B: after we deploy `wa-bot-webhook` (end of F2)**
8. In the app → Use cases → Customize (WhatsApp) → Configuration → Webhook (older apps: WhatsApp → Configuration):
   - **Callback URL:** `https://<project>.supabase.co/functions/v1/wa-bot-webhook`
   - **Verify token:** we generate it and send it to him.
   - Then **Verify and save** → Manage → subscribe to **`messages`**.

   Meta checks the URL live when he saves, which is why this has to wait until the function is deployed.

**Stage C: real number (before F4)**
9. WhatsApp Manager → Phone numbers → **Add phone number**:
   - display name "Camply", category and description;
   - confirm with the SMS or voice code.

   He sends us the new **Phone number ID**. We register it through the API (`/register` with a 6-digit
   two-step PIN that we create and send to him to keep). Display-name approval is Meta's review.
10. If Meta asks for **App Review or Advanced Access** for the WhatsApp permissions, Jefte tells us and we
    prepare the description and screen recording for him to submit. It shouldn't be needed, because the
    number belongs to Camply's own business.

**Secrets** (set by us in Supabase, never in the repo):
- `WA_ACCESS_TOKEN`, `WA_WABA_ID`, `WA_PHONE_NUMBER_ID`, `WA_VERIFY_TOKEN`;
- `WA_BOT_NUMBER` (the public display number for the wa.me link);
- `WA_BOT_MODE` (`off|beta|on`), `WA_BOT_BETA_USER_IDS`, `WA_BOT_MAX_DAILY_BUDGET`.

**App Secret:** the webhook signature uses the App Secret of the app that owns the webhook. With the
separate WhatsApp app (step 3) it must be set as `WA_APP_SECRET`. Without it, the webhook falls back to
the login app's secret (`get_meta_ads_config`), which only matches if WhatsApp lives in that same app.

**Development** runs on the test number (Stage A) until the real number is approved (Stage C).

---

## 10. Web app changes

- **Settings → "WhatsApp" card** (`src/pages/dashboard/Settings.tsx`):
  - Not linked: **Conectar WhatsApp** shows the code, a big **Abrir WhatsApp** button (the wa.me link
    with the text pre-filled) and a countdown. It polls status and shows "Conectado" when done.
  - Linked: `+55 •• •••• 1234`, linked date and a **Desconectar** button.
  - Hidden when `WA_BOT_MODE=off`, or when the user isn't on the beta list in `beta` mode. `wa-bot-link`
    returns `{available:false}`.
- **Campaign list:** a small "via WhatsApp" badge when `meta_data.created_via = 'whatsapp'`.
- **Help/Tutorials:** one short guide, "Criar campanha pelo WhatsApp".
- **Admin (minimal):** a "WhatsApp" tab listing links (masked), the last 50 failed jobs and messages
  with errors, and a button to revoke a link. Read-only otherwise.
- Strict TypeScript and lint-clean on all new files. No `any`.

---

## 11. Testing and QA

**Unit (Deno, run in CI):**
- The state machine reducer: every state × every input type, including global commands, retries
  and expiry. Target **at least 60 cases**.
- The parsers: budget, radius, yes/no, `VINCULAR 123456`.
- `verifySignature`: valid, tampered body, wrong secret, missing header.
- `aiCopy`: output validation and the fallback when the AI fails or the quota runs out.
- Media rules: MIME by magic bytes, size limits, a document carrying a video.

**Integration (Deno, mocked Graph and WhatsApp, the same pattern as `simple-campaign-create.e2e.test.ts`):**
- Full happy path, image: link → menu → … → Confirmar → created → Ativar → active.
- Video path with slow Meta processing: the job finishes after a worker re-run, and no duplicate is created.
- Meta rejects the creative: an honest message, nothing left in the ad account (rollback).
- A transient Meta failure gives `queued` and the 24h message.
- A suspended account mid-flow is blocked at Confirmar.
- Two quick messages are processed in order, and the session isn't corrupted.
- A webhook delivered twice gives one action.

**Refactor regression:** all existing tests unchanged plus `deno check` on every function (72 today,
75 with `wa-bot-webhook`, `wa-bot-worker` and `wa-bot-link`), and one
real web campaign on production (paused) before and after the deploy.

**Probe:** the new checks in §8, keeping 0 FAIL.

**Manual QA on real devices** (Android and iPhone, test number, then the real number). Checklist:
- linking and unlinking;
- each media kind;
- location pin vs typed city;
- each budget path, including over the cap;
- edit copy;
- cancel at every step;
- "parar"/"voltar";
- status with 0, 1 and 5+ campaigns;
- an expired Meta integration, which should give a reconnect message.

---

## 12. Delivery phases and estimate

| Phase | Work | Days | Exit criteria |
|---|---|---|---|
| **F0 — Meta setup** (Jefte, guided, in parallel) | §9 Stage A now; Stage B at the end of F2; Stage C before F4 | calendar time | Stage A values received before F2; test number receives webhooks; real number approved before F4 |
| **F1 — Foundation** | §5.1 refactor (create + activate), migration §6, `wa-bot-link`, Settings card, `_shared/whatsapp.ts` | 5 | Existing tests green; web creation identical in production; linking works end to end with the test number |
| **F2 — Webhook and engine** | `wa-bot-webhook`, `wa-bot-worker` (conversation, sweep), locking RPCs, reducer skeleton, media download, cron | 4 | Signed messages stored and processed in order; menu, cancel and help work; media saved to Storage |
| **F3 — Create, activate, status** | full flow §7, city search, `aiCopy`, jobs, activation, status command, "via WhatsApp" badge, **Instagram post by link (§7.4)** | 7 | Real paused campaign created from WhatsApp on a test ad account; activation reports the true Meta status |
| **F4 — Hardening and beta** | §8 controls, probe checks, LGPD (§6.3), admin tab, help guide, manual QA §11, docs (README / deployment-guide / user-guide / releases) | 4 | CI green, probe 0 FAIL, QA checklist passed; `WA_BOT_MODE=beta` for 3–5 real users |
| **F5 — Launch** | Fix beta feedback, then `WA_BOT_MODE=on` | 1 | 1 week of beta with no failed creations caused by the bot |
| | **Total** | **≈ 21 dev days (~4–5 weeks)** | |

**Release discipline (same as the audit):**
- A DB backup before the migration, and a dry-run inside `begin … rollback`.
- Deploy functions one at a time.
- A tagged release in `docs/security/releases.md` with rollback steps.
- **Rollback:** `WA_BOT_MODE=off` stops the bot instantly. The refactor rolls back by redeploying the previous `simple-campaign-create`.

---

## 13. Running costs (estimates; check before quoting)

| Item | Cost |
|---|---|
| WhatsApp messages in the MVP | Every bot reply goes inside the **24 h service window the user opened** (no templates). Since **2026-10-01** Meta charges service messages beyond a free tier of **1,000 per number per month** (Meta pricing page, checked 2026-11-20). A full campaign chat is ~10–15 replies, so roughly 70–100 campaigns/month fit in the free tier; check the BRL rate card for the rest |
| Proactive alerts (Version 2) | Utility or marketing **templates are paid per message**. Third-party sources quote about R$ 0.04–0.08 (utility) and about R$ 0.38 (marketing) in 2026, but Meta's BRL rate card is the source of truth |
| AI copy | One short completion per campaign, plus one per "Editar texto" regeneration. Negligible, and capped by `consume_ai_quota` |
| Supabase | A few edge invocations per message. Within the current plan for expected volumes |
| Phone number | A SIM or virtual number (owner) |

---

## 14. Version 2 backlog (not in the MVP quote)

- Pause, resume and budget changes by chat: "pausa a campanha X", "aumenta pra R$ 80" (two-tap confirm again).
- Proactive alerts with utility templates: "Sua campanha gerou 12 conversas hoje (R$ 4,10/conversa)",
  "Anúncio reprovado pela Meta", "Conexão com a Meta expirou".
- AI understanding of free text, still only within Camply tasks, and still confirmed with buttons.
- 3 AI copy variations to choose from, and audio messages transcribed into the brief.
- WhatsApp Flows (a native form) for a faster single-screen creation.
- Dayparting by chat.

---

## 15. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Meta approval of the number, display name or permissions takes weeks | Medium | Start F0 on day 1; build everything on the test number |
| The AI-chatbot policy is read strictly | Low | Task-specific bot, no open chat, AI only writes ad copy |
| WhatsApp compresses media and quality drops | High | "Envie como documento" tip; accept documents up to 100 MB |
| Video processing at Meta exceeds the function time limit | Medium | Separate job invocation, idempotency, sweep with an honest message |
| The user's Meta token expires and creation fails | Medium | Detect `NO_INTEGRATION` or OAuth errors and reply with a reconnect link |
| Several Pages or ad accounts confuse the flow | Medium | Page picker list; the ad account comes from the saved selection (same as the web) |
| The chosen Page has no WhatsApp number linked | Medium | The existing pre-validation error is relayed with a link to the guide; checked once at [Criar campanha] so the user doesn't fill everything first |
| The refactor of the 2.3k-line function breaks the web wizard | Medium | Pure move with 75 existing tests plus an e2e check plus a production smoke test before anything else |

---

## 16. Decisions

**Answered by Jefte (2026-11-10)**
- ✅ **Display name:** "Camply".
- ✅ **Business verification:** already done on Meta.
- ✅ **Who can use it:** every customer, as a standard feature. No plan check, the same as the web wizard.
  The beta flag (`WA_BOT_MODE=beta`) is still used for the first week to protect launch quality.
- ✅ **Instagram post by link:** wanted, and added to the MVP (§7.4).
- ✅ **Meta setup:** Jefte does it himself, following our guide (§9). The developer gets no Meta access.
- ✅ **Bot number:** (33) 98413-5052, ready on 2026-11-15 (must not be activated in the WhatsApp apps).
- ✅ **Budget cap and durations** (2026-11-19): at most R$ 200/day per campaign via WhatsApp; durations "Sem data fim" / 7 / 30 dias.

**Still open**
1. **Meta App:** reuse Camply's existing app (recommended: its App Secret is already in the admin panel).
2. **Test numbers** (up to 5) and **beta users** (3–5 real customers for the last week).
3. **Bot copy:** Jefte approves the message texts in §7.2 and the privacy-policy paragraph (§6.3).

---

*References: WhatsApp Cloud API docs (webhooks, messages, media, pricing) at developers.facebook.com;
existing code: `supabase/functions/simple-campaign-create/`, `_shared/metaCascade.ts`, `_shared/aiQuota.ts`,
`_shared/metrics.ts`, `_shared/auth.ts`, `src/hooks/useSimpleCampaignWizard.ts`.*
