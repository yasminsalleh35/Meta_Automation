// Runtime for the WhatsApp bot: real dependencies (DB, Meta Graph, Storage, AI) and the worker
// pipeline (link codes, opt-out, rate limits, per-number ordering, jobs, sweep). Plan §5.4–§5.6, §8.
import { GRAPH_BASE } from '../meta.ts';
import { inactiveAccountReason } from '../auth.ts';
import { costPerConversation } from '../metrics.ts';
import { generateAdCopy } from '../aiCopy.ts';
import {
  type InboundMessage, type OutMessage, type WaConfig,
  downloadMedia, getMediaInfo, markRead, maskPhone, sendMessage, sha256Hex, sniffMediaKind,
} from '../whatsapp.ts';
import { looksLikeLinkAttempt, parseCommand, parseLinkCode } from './parse.ts';
import { T } from './messages.ts';
import {
  type CampaignLine, type Deps, type IgLookup, type JobOutcome, type Session, type StoredMedia, type UserContext,
  handleJobResult, handleMessage, newSession,
} from './engine.ts';
import { botMode, isUserAllowed, kickWorker } from './flags.ts';
import { createSimpleCampaign } from '../../simple-campaign-create/core.ts';
import { activateCampaignForUser } from '../../simple-campaign-activate/core.ts';

// deno-lint-ignore no-explicit-any
type Db = any;

export const MAX_MEDIA_BYTES = 50 * 1024 * 1024;
export const INBOUND_PER_MINUTE = 30;
export const LINK_FAILS_PER_HOUR_PER_NUMBER = 5;
export const LINK_FAILS_PER_HOUR_GLOBAL = 100;
const DEFAULT_MAX_DAILY_BUDGET = 200;

// ------------------------------------------------------------------------------------------------
// Session persistence
// ------------------------------------------------------------------------------------------------
interface SessionRow {
  id: string; wa_id: string; user_id: string | null; state: string; draft: Record<string, unknown>;
  draft_version: number; retries: number; updated_at: string; last_unknown_reply_at: string | null;
}

function toSession(r: SessionRow): Session {
  return {
    state: (r.state || 'IDLE') as Session['state'],
    draft: (r.draft ?? {}) as Session['draft'],
    draftVersion: r.draft_version ?? 0,
    retries: r.retries ?? 0,
    updatedAt: new Date(r.updated_at ?? Date.now()),
  };
}

async function saveSession(db: Db, id: string, s: Session, userId: string | null) {
  await db.from('wa_bot_sessions').update({
    state: s.state, draft: s.draft, draft_version: s.draftVersion, retries: s.retries,
    updated_at: s.updatedAt.toISOString(), user_id: userId,
  }).eq('id', id);
}

/** Lock the number's session (creating it). Retries for up to ~`waitMs` while another run holds it. */
export async function claimSession(db: Db, waId: string, waitMs = 0): Promise<string | null> {
  const deadline = Date.now() + waitMs;
  for (;;) {
    const { data, error } = await db.rpc('wa_bot_claim_session', { p_wa_id: waId, p_lock_seconds: 180 });
    if (error) throw new Error(`claim: ${error.message}`);
    if (data) return String(data);
    if (Date.now() >= deadline) return null;
    await new Promise((r) => setTimeout(r, 1000));
  }
}

async function releaseSession(db: Db, id: string) {
  await db.rpc('wa_bot_release_session', { p_id: id });
}

// ------------------------------------------------------------------------------------------------
// Outbound with logging (no tokens, text clipped)
// ------------------------------------------------------------------------------------------------
function makeSender(db: Db, cfg: WaConfig, waId: string, userId: string | null) {
  return async (msg: OutMessage) => {
    const r = await sendMessage(cfg, waId, msg);
    const text = 'text' in msg ? msg.text : ('caption' in msg ? msg.caption ?? '' : '');
    await db.from('wa_bot_messages').insert({
      wamid: r.wamid ?? null, direction: 'out', wa_id: waId, user_id: userId, msg_type: msg.kind,
      body: { text: String(text).slice(0, 500) }, status: r.ok ? 'sent' : 'failed', error: r.ok ? null : String(r.error ?? '').slice(0, 300),
      processed_at: new Date().toISOString(),
    });
    if (!r.ok) console.warn('[wa-bot] send failed', { to: maskPhone(waId), status: r.status, code: r.code });
  };
}

// ------------------------------------------------------------------------------------------------
// Real dependencies for one (user, number)
// ------------------------------------------------------------------------------------------------
interface IntegrationRow {
  access_token: string | null; ad_account_id: string | null; page_id: string | null;
  selected_page_ids: string[] | null; selected_whatsapp_phone_id: string | null;
  meta_assets: { facebookPages?: Array<{ id: string; name?: string }> } | null;
}

async function loadIntegration(db: Db, userId: string): Promise<IntegrationRow | null> {
  const { data } = await db.from('integrations')
    .select('access_token, ad_account_id, page_id, selected_page_ids, selected_whatsapp_phone_id, meta_assets')
    .eq('user_id', userId).eq('provider', 'meta_ads').eq('status', 'active').maybeSingle();
  return data?.access_token && data?.ad_account_id ? data as IntegrationRow : null;
}

export function pagesFromIntegration(i: IntegrationRow): Array<{ id: string; name: string }> {
  const ids = [...new Set([i.page_id, ...(i.selected_page_ids ?? [])].filter(Boolean).map(String))];
  const names = new Map((i.meta_assets?.facebookPages ?? []).map((p) => [String(p.id), String(p.name ?? '')]));
  return ids.map((id) => ({ id, name: names.get(id) || `Página ${id.slice(-4)}` }));
}

const graphGet = async (path: string, token: string): Promise<{ ok: boolean; body: Record<string, unknown> }> => {
  const res = await fetch(`${GRAPH_BASE}/${path}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10_000) });
  return { ok: res.ok, body: await res.json().catch(() => ({})) };
};

export function makeDeps(db: Db, cfg: WaConfig, waId: string, userId: string, maxBudgetOverride: number | null, sessionId: string): Deps {
  let ctxCache: UserContext | null = null;
  let integration: IntegrationRow | null | undefined;
  const getIntegration = async () => (integration === undefined ? (integration = await loadIntegration(db, userId)) : integration);

  return {
    send: makeSender(db, cfg, waId, userId),
    now: () => new Date(),

    async userContext() {
      if (ctxCache) return ctxCache;
      const [{ data: profile }, { data: biz }, blocked, integ] = await Promise.all([
        db.from('profiles').select('name').eq('id', userId).maybeSingle(),
        db.from('business_settings').select('business_name').eq('user_id', userId).maybeSingle(),
        inactiveAccountReason(userId, db),
        getIntegration(),
      ]);
      const envMax = Number(Deno.env.get('WA_BOT_MAX_DAILY_BUDGET') ?? DEFAULT_MAX_DAILY_BUDGET) || DEFAULT_MAX_DAILY_BUDGET;
      ctxCache = {
        firstName: String(profile?.name ?? '').trim().split(/\s+/)[0] ?? '',
        businessName: biz?.business_name ?? null,
        blocked: blocked?.message ?? null,
        meta: integ ? { pages: pagesFromIntegration(integ), defaultPageId: integ.page_id } : null,
        maxDailyBudget: maxBudgetOverride ?? envMax,
      };
      return ctxCache;
    },

    async pageHasWhatsapp(pageId) {
      const integ = await getIntegration();
      if (!integ?.access_token) return null;
      if (integ.selected_whatsapp_phone_id) return true; // same rule as simple-campaign-create
      try {
        const r = await graphGet(`${encodeURIComponent(pageId)}?fields=whatsapp_number{display_phone_number}`, integ.access_token);
        if (!r.ok) return null;
        return !!r.body.whatsapp_number;
      } catch { return null; }
    },

    async storeInboundMedia(media): Promise<StoredMedia> {
      try {
        const info = await getMediaInfo(cfg, media.id);
        if (info.fileSize > MAX_MEDIA_BYTES) return { ok: false, reason: 'too_large' };
        const bytes = await downloadMedia(cfg, info.url, MAX_MEDIA_BYTES);
        const kind = sniffMediaKind(bytes);
        if (!kind) return { ok: false, reason: 'unsupported' };
        const safeId = media.id.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 80);
        const path = `${userId}/whatsapp/${safeId}.${kind.ext}`;
        const filename = `whatsapp-${safeId}.${kind.ext}`;
        const up = await db.storage.from('user-media').upload(path, bytes, { contentType: kind.mime, upsert: true });
        if (up.error) throw new Error(up.error.message);
        const { data: pub } = db.storage.from('user-media').getPublicUrl(path);
        await db.from('media_files').insert({
          user_id: userId, filename, file_path: path, storage_path: path, file_type: kind.mime,
          file_size: bytes.byteLength, public_url: pub.publicUrl, source: 'whatsapp',
        });
        return { ok: true, url: pub.publicUrl, fileType: kind.mime, filename, kind: kind.kind };
      } catch (e) {
        if (e instanceof Error && e.message === 'media too large') return { ok: false, reason: 'too_large' };
        console.error('[wa-bot] media store failed', { error: e instanceof Error ? e.message : String(e) });
        return { ok: false, reason: 'error' };
      }
    },

    async searchCities(query) {
      const integ = await getIntegration();
      if (!integ?.access_token) throw new Error('no integration');
      const params = new URLSearchParams({ type: 'adgeolocation', q: query, limit: '10', location_types: JSON.stringify(['city']), country_code: 'BR' });
      const r = await graphGet(`search?${params}`, integ.access_token);
      if (!r.ok) throw new Error('geo search failed');
      // deno-lint-ignore no-explicit-any
      return ((r.body.data as any[]) ?? [])
        .filter((x) => x?.key && x?.name)
        .map((x) => ({ key: String(x.key), name: String(x.name), region: x.region ? String(x.region) : null }));
    },

    async findInstagramPost(pageId, shortcode): Promise<IgLookup> {
      const integ = await getIntegration();
      if (!integ?.access_token) return { ok: false, reason: 'error' };
      try {
        const page = await graphGet(`${encodeURIComponent(pageId)}?fields=instagram_business_account{id,username},connected_instagram_account{id,username}`, integ.access_token);
        // deno-lint-ignore no-explicit-any
        const ig = (page.body.instagram_business_account ?? page.body.connected_instagram_account) as any;
        if (!page.ok) return { ok: false, reason: 'error' };
        if (!ig?.id) return { ok: false, reason: 'no_ig' };
        let path: string | null = `${ig.id}/media?fields=id,shortcode,permalink,caption,media_type,media_url,thumbnail_url&limit=25`;
        for (let i = 0; path && i < 8; i++) {
          const r = await graphGet(path, integ.access_token);
          if (!r.ok) return { ok: false, reason: 'error' };
          // deno-lint-ignore no-explicit-any
          const items = (r.body.data as any[]) ?? [];
          const hit = items.find((m) => m?.shortcode === shortcode || String(m?.permalink ?? '').includes(`/${shortcode}/`));
          if (hit) {
            return { ok: true, post: {
              igMediaId: String(hit.id), igUserId: String(ig.id), igUsername: ig.username ?? null,
              caption: String(hit.caption ?? ''), thumbnailUrl: hit.thumbnail_url ?? hit.media_url ?? null,
            } };
          }
          // deno-lint-ignore no-explicit-any
          const next = (r.body.paging as any)?.next as string | undefined;
          path = next ? next.replace(/^https:\/\/graph\.facebook\.com\/v[\d.]+\//, '') : null;
        }
        return { ok: false, reason: 'not_found', igUsername: ig.username ?? null };
      } catch {
        return { ok: false, reason: 'error' };
      }
    },

    async generateCopy(input) {
      const { data: biz } = await db.from('business_settings')
        .select('business_name, main_product, business_description, target_audience').eq('user_id', userId).maybeSingle();
      return await generateAdCopy(db, userId, {
        businessName: biz?.business_name ?? input.businessName, mainProduct: biz?.main_product, description: biz?.business_description,
        targetAudience: biz?.target_audience, place: input.place, mediaKind: input.mediaKind,
      });
    },

    async enqueueJob(kind, payload) {
      const body = { ...payload };
      if (kind === 'create_campaign') {
        // Idempotency: one key per draft version → a double tap or a retried job never makes two campaigns.
        (body.payload as Record<string, unknown>).idempotencyKey = `wa:${sessionId}:${payload.draftVersion}`;
      }
      const { data, error } = await db.from('wa_bot_jobs')
        .insert({ session_id: sessionId, user_id: userId, wa_id: waId, kind, payload: body }).select('id').single();
      if (error) throw new Error(`enqueue: ${error.message}`);
      kickWorker({ mode: 'job', id: data.id });
    },

    async campaignStatus(): Promise<CampaignLine[]> {
      const { data: rows, error } = await db.from('campaigns')
        .select('name, status, meta_campaign_id, updated_at')
        .eq('user_id', userId).not('meta_campaign_id', 'is', null)
        .in('status', ['active', 'pending_review', 'paused', 'error'])
        .order('updated_at', { ascending: false }).limit(5);
      if (error) throw new Error(error.message);
      const ids = (rows ?? []).map((r: { meta_campaign_id: string }) => r.meta_campaign_id);
      const { data: cache } = ids.length
        ? await db.from('campaign_metrics_cache').select('campaign_id, metrics').eq('user_id', userId).eq('date_preset', 'last_7d').in('campaign_id', ids)
        : { data: [] };
      const byId = new Map((cache ?? []).map((c: { campaign_id: string; metrics: Record<string, number> }) => [c.campaign_id, c.metrics]));
      return (rows ?? []).map((r: { name: string; status: string; meta_campaign_id: string }) => {
        const m = (byId.get(r.meta_campaign_id) ?? {}) as Record<string, number>;
        const spend = Number(m.spend ?? 0), conv = Number(m.conversations ?? 0);
        return { name: r.name, status: r.status, spend, conversations: conv, costPerConversation: costPerConversation(spend, conv) };
      });
    },
  };
}

// ------------------------------------------------------------------------------------------------
// Conversation processing for one WhatsApp number
// ------------------------------------------------------------------------------------------------
interface LinkRow { id: string; user_id: string; wa_id: string | null; status: string; opted_out_at: string | null; max_daily_budget: number | null }

// deno-lint-ignore no-explicit-any
function rowToInbound(r: any): InboundMessage {
  const b = r.body ?? {};
  return {
    wamid: r.wamid, waId: r.wa_id, timestamp: new Date(r.wa_timestamp ?? r.received_at), type: r.msg_type, rawType: b.rawType ?? r.msg_type,
    text: b.text, replyId: b.replyId, replyTitle: b.replyTitle, location: b.location, media: b.media, profileName: b.profileName,
  };
}

async function countSince(db: Db, filter: (q: Db) => Db, sinceMs: number): Promise<number> {
  const q = db.from('wa_bot_messages').select('id', { count: 'exact', head: true }).gte('received_at', new Date(Date.now() - sinceMs).toISOString());
  const { count } = await filter(q);
  return count ?? 0;
}

export async function processNumber(db: Db, cfg: WaConfig, waId: string): Promise<void> {
  const sessionId = await claimSession(db, waId);
  if (!sessionId) return; // another run holds this number; it re-checks for new messages before releasing
  try {
    for (let round = 0; round < 10; round++) {
      const { data: pending } = await db.from('wa_bot_messages').select('*')
        .eq('wa_id', waId).eq('direction', 'in').is('processed_at', null)
        .order('wa_timestamp', { ascending: true }).order('id', { ascending: true }).limit(20);
      if (!pending?.length) break;
      for (const row of pending) {
        try {
          await processOne(db, cfg, sessionId, rowToInbound(row), row.id);
        } catch (e) {
          console.error('[wa-bot] message failed', { to: maskPhone(waId), error: e instanceof Error ? e.message : String(e) });
          await db.from('wa_bot_messages').update({ processed_at: new Date().toISOString(), error: String(e).slice(0, 300) }).eq('id', row.id);
        }
      }
    }
  } finally {
    await releaseSession(db, sessionId);
  }
}

async function processOne(db: Db, cfg: WaConfig, sessionId: string, msg: InboundMessage, rowId: number) {
  const done = (extra: Record<string, unknown> = {}) =>
    db.from('wa_bot_messages').update({ processed_at: new Date().toISOString(), ...extra }).eq('id', rowId);
  const waId = msg.waId;
  const { data: link } = await db.from('wa_bot_links').select('id, user_id, wa_id, status, opted_out_at, max_daily_budget')
    .eq('wa_id', waId).eq('status', 'active').maybeSingle() as { data: LinkRow | null };
  const userId = link && isUserAllowed(link.user_id) ? link.user_id : null;
  const send = makeSender(db, cfg, waId, userId);
  await markRead(cfg, msg.wamid, false);

  // 1) Link code (works for linked and unlinked numbers)
  const code = msg.type === 'text' ? parseLinkCode(msg.text) : null;
  if (code || (msg.type === 'text' && looksLikeLinkAttempt(msg.text))) {
    const failsHere = await countSince(db, (q) => q.eq('wa_id', waId).eq('error', 'link_failed'), 3600_000);
    const failsAll = await countSince(db, (q) => q.eq('error', 'link_failed'), 3600_000);
    if (failsHere >= LINK_FAILS_PER_HOUR_PER_NUMBER || failsAll >= LINK_FAILS_PER_HOUR_GLOBAL) {
      if (failsAll >= LINK_FAILS_PER_HOUR_GLOBAL) console.error('[wa-bot] global link-failure limit reached');
      await send({ kind: 'text', text: T.linkTooMany() });
      return await done({ error: 'link_rate_limited' });
    }
    const hash = code ? await sha256Hex(code) : null;
    const { data: pend } = hash
      ? await db.from('wa_bot_links').select('id, user_id').eq('status', 'pending').eq('code_hash', hash).gt('code_expires_at', new Date().toISOString()).maybeSingle()
      : { data: null };
    if (!pend || !isUserAllowed(pend.user_id)) {
      await send({ kind: 'text', text: T.linkInvalid() });
      return await done({ error: 'link_failed' });
    }
    if (link && link.user_id !== pend.user_id) {
      await send({ kind: 'text', text: T.linkAlreadyOther() });
      return await done({ error: 'link_conflict' });
    }
    const masked = maskPhone(waId);
    const { error: upErr } = await db.from('wa_bot_links').update({
      status: 'active', wa_id: waId, phone_masked: masked, linked_at: new Date().toISOString(),
      code_hash: null, code_expires_at: null, opted_out_at: null, updated_at: new Date().toISOString(),
    }).eq('id', pend.id).eq('status', 'pending');
    if (upErr) {
      await send({ kind: 'text', text: T.linkAlreadyOther() });
      return await done({ error: 'link_conflict' });
    }
    if (link && link.id !== pend.id) {
      await db.from('wa_bot_links').update({ status: 'revoked', updated_at: new Date().toISOString() }).eq('id', link.id);
    }
    await db.from('wa_bot_sessions').update({ user_id: pend.user_id, state: 'IDLE', draft: {}, retries: 0, updated_at: new Date().toISOString() }).eq('id', sessionId);
    const userSend = makeSender(db, cfg, waId, pend.user_id);
    await userSend({ kind: 'buttons', text: `${T.linked(masked)}\n\n${T.menu('')}`, buttons: [
      { id: 'menu:create', title: 'Criar campanha' }, { id: 'menu:status', title: 'Minhas campanhas' }, { id: 'menu:help', title: 'Ajuda' }] });
    return await done({ user_id: pend.user_id });
  }

  // 2) Unknown (or not-yet-allowed) number: one generic reply per day, nothing stored but type/time.
  if (!userId) {
    const { data: sess } = await db.from('wa_bot_sessions').select('last_unknown_reply_at').eq('id', sessionId).maybeSingle();
    const last = sess?.last_unknown_reply_at ? new Date(sess.last_unknown_reply_at).getTime() : 0;
    if (Date.now() - last > 86_400_000) {
      await send({ kind: 'text', text: T.unknownNumber() });
      await db.from('wa_bot_sessions').update({ last_unknown_reply_at: new Date().toISOString() }).eq('id', sessionId);
    }
    return await done({ body: null });
  }

  // 3) Opt-out / opt-in
  const cmd = msg.type === 'text' ? parseCommand(msg.text) : null;
  if (link!.opted_out_at) {
    if (cmd === 'voltar') {
      await db.from('wa_bot_links').update({ opted_out_at: null, updated_at: new Date().toISOString() }).eq('id', link!.id);
      await send({ kind: 'text', text: T.optedIn() });
    } else {
      return await done({ user_id: userId });
    }
  } else if (cmd === 'parar') {
    await db.from('wa_bot_links').update({ opted_out_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', link!.id);
    await send({ kind: 'text', text: T.optedOut() });
    return await done({ user_id: userId });
  }

  // 4) Flood control
  const lastMinute = await countSince(db, (q) => q.eq('wa_id', waId).eq('direction', 'in'), 60_000);
  if (lastMinute > INBOUND_PER_MINUTE) return await done({ user_id: userId, error: 'rate_limited' });

  // 5) Conversation
  const { data: row } = await db.from('wa_bot_sessions').select('*').eq('id', sessionId).single();
  let session = toSession(row as SessionRow);
  if ((row as SessionRow).user_id && (row as SessionRow).user_id !== userId) session = newSession(new Date()); // number moved to another account
  await db.from('wa_bot_sessions').update({ last_inbound_at: new Date().toISOString() }).eq('id', sessionId);
  const deps = makeDeps(db, cfg, waId, userId, link!.max_daily_budget != null ? Number(link!.max_daily_budget) : null, sessionId);
  const next = await handleMessage(session, msg, deps);
  await saveSession(db, sessionId, next, userId);
  await done({ user_id: userId });
}

// ------------------------------------------------------------------------------------------------
// Jobs
// ------------------------------------------------------------------------------------------------
export async function runJob(db: Db, cfg: WaConfig, jobId: string): Promise<void> {
  const { data: job } = await db.from('wa_bot_jobs')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', jobId).eq('status', 'pending').select('*').maybeSingle();
  if (!job) return; // already taken by another run

  await db.from('wa_bot_jobs').update({ attempts: (job.attempts ?? 0) + 1 }).eq('id', jobId);
  let result: JobOutcome['result'] = null;
  try {
    if (!isUserAllowed(job.user_id)) throw new Error('bot disabled for user');
    if (job.kind === 'create_campaign') {
      result = await createSimpleCampaign(db, job.user_id, job.payload?.payload ?? null, { source: 'whatsapp' });
    } else {
      result = await activateCampaignForUser(db, job.user_id, job.payload?.metaCampaignId);
    }
    await db.from('wa_bot_jobs').update({
      status: result.status < 300 || result.status === 202 ? 'done' : 'failed',
      result: { status: result.status, body: result.body }, finished_at: new Date().toISOString(),
    }).eq('id', jobId);
  } catch (e) {
    console.error('[wa-bot] job failed', { jobId, kind: job.kind, error: e instanceof Error ? e.message : String(e) });
    await db.from('wa_bot_jobs').update({ status: 'failed_unknown', result: { error: String(e).slice(0, 300) }, finished_at: new Date().toISOString() }).eq('id', jobId);
    result = null;
  }
  await deliverJobResult(db, cfg, job, { kind: job.kind, result });
}

// deno-lint-ignore no-explicit-any
async function deliverJobResult(db: Db, cfg: WaConfig, job: any, outcome: JobOutcome) {
  const sessionId = await claimSession(db, job.wa_id, 60_000);
  if (!sessionId) { console.error('[wa-bot] could not lock session to deliver job result', { jobId: job.id }); return; }
  try {
    const { data: row } = await db.from('wa_bot_sessions').select('*').eq('id', sessionId).single();
    const { data: link } = await db.from('wa_bot_links').select('max_daily_budget').eq('user_id', job.user_id).eq('status', 'active').maybeSingle();
    const deps = makeDeps(db, cfg, job.wa_id, job.user_id, link?.max_daily_budget != null ? Number(link.max_daily_budget) : null, sessionId);
    const next = await handleJobResult(toSession(row as SessionRow), outcome, deps);
    await saveSession(db, sessionId, next, job.user_id);
  } finally {
    await releaseSession(db, sessionId);
  }
}

// ------------------------------------------------------------------------------------------------
// Sweep (cron, every minute): safety net + retention
// ------------------------------------------------------------------------------------------------
export async function sweep(db: Db, cfg: WaConfig): Promise<Record<string, number>> {
  const now = Date.now();
  const iso = (ms: number) => new Date(now - ms).toISOString();
  const stats: Record<string, number> = { numbers: 0, jobsKicked: 0, jobsStuck: 0 };

  // Messages that weren't processed within 60 s (kick lost / worker died)
  const { data: stale } = await db.from('wa_bot_messages').select('wa_id')
    .eq('direction', 'in').is('processed_at', null).lt('received_at', iso(60_000)).limit(200);
  for (const waId of new Set((stale ?? []).map((r: { wa_id: string }) => r.wa_id))) {
    await processNumber(db, cfg, waId as string);
    stats.numbers++;
  }

  // Jobs never started (kick lost)
  const { data: pendingJobs } = await db.from('wa_bot_jobs').select('id').eq('status', 'pending').lt('created_at', iso(60_000)).limit(20);
  for (const j of pendingJobs ?? []) { kickWorker({ mode: 'job', id: j.id }); stats.jobsKicked++; }

  // Jobs stuck running > 10 min: never re-run a create (not idempotent at Meta) — tell the user honestly.
  const { data: stuck } = await db.from('wa_bot_jobs').select('*').eq('status', 'running').lt('started_at', iso(10 * 60_000)).limit(20);
  for (const j of stuck ?? []) {
    const { data: upd } = await db.from('wa_bot_jobs').update({ status: 'failed_unknown', finished_at: new Date().toISOString() })
      .eq('id', j.id).eq('status', 'running').select('id').maybeSingle();
    if (upd) { await deliverJobResult(db, cfg, j, { kind: j.kind, result: null }); stats.jobsStuck++; }
  }

  // Retention (plan §6.3): bodies 90 days; unknown numbers 7 days; expired link codes 1 day.
  await db.from('wa_bot_messages').update({ body: null }).lt('received_at', iso(90 * 86_400_000)).not('body', 'is', null);
  await db.from('wa_bot_messages').delete().is('user_id', null).lt('received_at', iso(7 * 86_400_000));
  await db.from('wa_bot_links').delete().eq('status', 'pending').lt('code_expires_at', iso(86_400_000));
  return stats;
}
