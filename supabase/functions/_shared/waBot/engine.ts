// Conversation engine for the WhatsApp campaign bot (plan §7). All I/O goes through `Deps`, so every
// path is unit-tested with fakes (_tests/waBot.engine.test.ts). The engine never spends money:
// it only enqueues jobs after an explicit Confirmar / Ativar.
import type { Choice, InboundMessage, OutMessage } from '../whatsapp.ts';
import {
  brl, buildCampaignName, endDateIso, norm, parseCommand, parseDuration, parseInstagramLink, parseKm,
  parseMoneyBRL, parseYesNo, splitUserCopy,
} from './parse.ts';
import { STATUS_LABEL, T } from './messages.ts';

export type State =
  | 'IDLE' | 'ASK_PAGE' | 'ASK_MEDIA' | 'IG_POST_CONFIRM' | 'ASK_LOCATION' | 'PICK_CITY' | 'ASK_RADIUS'
  | 'ASK_BUDGET' | 'ASK_DURATION' | 'REVIEW' | 'EDIT_COPY' | 'CREATING' | 'CREATED' | 'ACTIVATING';

export type Creative =
  | { type: 'upload'; url: string; fileType: string; filename: string; kind: 'image' | 'video' }
  | { type: 'post'; igMediaId: string; igUserId: string; igUsername: string | null; caption: string; thumbnailUrl: string | null };

export interface IgPost {
  igMediaId: string; igUserId: string; igUsername: string | null; caption: string; thumbnailUrl: string | null;
}

export interface Draft {
  firstName?: string;
  businessName?: string | null;
  pageId?: string;
  pageName?: string;
  pages?: Array<{ id: string; name: string }>;
  creative?: Creative;
  igCandidate?: IgPost;
  copyPref?: 'ai' | 'caption';
  location?: { type: 'pin'; latitude: number; longitude: number; label: string } | { type: 'city'; key: string; name: string; region?: string | null };
  cityOptions?: Array<{ key: string; name: string; region?: string | null }>;
  radius?: number;
  budget?: number;
  duration?: 0 | 7 | 30;
  copy?: { title: string; text: string; source: 'ai' | 'caption' | 'user' | 'template' };
  maxDailyBudget?: number;
  created?: { metaCampaignId: string; name: string; budget: number };
}

export interface Session {
  state: State;
  draft: Draft;
  draftVersion: number;
  retries: number;
  updatedAt: Date;
}

export interface UserContext {
  firstName: string;
  businessName: string | null;
  /** user message when the account can't create campaigns (suspended / pending deletion) */
  blocked: string | null;
  /** null when there's no active Meta integration with an ad account */
  meta: { pages: Array<{ id: string; name: string }>; defaultPageId: string | null } | null;
  maxDailyBudget: number;
}

export type StoredMedia =
  | { ok: true; url: string; fileType: string; filename: string; kind: 'image' | 'video' }
  | { ok: false; reason: 'unsupported' | 'too_large' | 'error' };

export type IgLookup = { ok: true; post: IgPost } | { ok: false; reason: 'no_ig' | 'not_found' | 'error'; igUsername?: string | null };

export interface CampaignLine { name: string; status: string; spend: number; conversations: number; costPerConversation: number | null }

export interface Deps {
  send(msg: OutMessage): Promise<void>;
  now(): Date;
  userContext(): Promise<UserContext>;
  /** true/false when known; null when Meta couldn't be asked (creation re-checks anyway) */
  pageHasWhatsapp(pageId: string): Promise<boolean | null>;
  storeInboundMedia(media: NonNullable<InboundMessage['media']>): Promise<StoredMedia>;
  searchCities(query: string): Promise<Array<{ key: string; name: string; region?: string | null }>>;
  findInstagramPost(pageId: string, shortcode: string): Promise<IgLookup>;
  generateCopy(input: { businessName: string | null; place: string; mediaKind: string }): Promise<{ title: string; text: string; source: 'ai' | 'template' }>;
  enqueueJob(kind: 'create_campaign' | 'activate_campaign', payload: Record<string, unknown>): Promise<void>;
  campaignStatus(): Promise<CampaignLine[]>;
}

export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
export const MIN_DAILY_BUDGET = 30;
const PIN_RADIUS = { min: 1, max: 80 };
const CITY_RADIUS = { min: 17, max: 80 };

const MENU_BUTTONS: Choice[] = [
  { id: 'menu:create', title: 'Criar campanha' },
  { id: 'menu:status', title: 'Minhas campanhas' },
  { id: 'menu:help', title: 'Ajuda' },
];

export function newSession(now: Date): Session {
  return { state: 'IDLE', draft: {}, draftVersion: 0, retries: 0, updatedAt: now };
}

/** Ad text shown inside the summary; longer texts are sent in full just before it. */
export const REVIEW_TEXT_MAX = 400;
const DURATION_BUTTONS = [
  { id: 'dur:0', title: 'Sem data de término' }, { id: 'dur:7', title: '7 dias' }, { id: 'dur:30', title: '30 dias' }];

const reset = (s: Session, now: Date): Session => ({ state: 'IDLE', draft: {}, draftVersion: s.draftVersion + 1, retries: 0, updatedAt: now });
const goto = (s: Session, state: State, draft: Draft, now: Date): Session => ({ ...s, state, draft, retries: 0, updatedAt: now });
const retry = (s: Session, now: Date): Session => ({ ...s, retries: s.retries + 1, updatedAt: now });

function placeLabel(d: Draft): string {
  if (!d.location) return '';
  return d.location.type === 'city' ? d.location.name : d.location.label;
}

async function sendMenu(deps: Deps, name: string, prefix?: string) {
  await deps.send({ kind: 'buttons', text: (prefix ? prefix + '\n\n' : '') + T.menu(name), buttons: MENU_BUTTONS });
}

// ------------------------------------------------------------------------------------------------
// Prompts per state
// ------------------------------------------------------------------------------------------------
async function promptState(state: State, d: Draft, deps: Deps, retries = 0): Promise<void> {
  const r = (t: string) => T.retry(t, retries);
  switch (state) {
    case 'ASK_PAGE':
      await deps.send({ kind: 'list', text: r(T.askPage()), button: 'Escolher Página', rows: (d.pages ?? []).slice(0, 10).map((p) => ({ id: `page:${p.id}`, title: p.name })) });
      return;
    case 'ASK_MEDIA':
      await deps.send({ kind: 'text', text: r(T.askMedia()) });
      return;
    case 'ASK_LOCATION':
      await deps.send({ kind: 'location_request', text: r(T.askLocation()) });
      return;
    case 'ASK_RADIUS':
      if (d.location?.type === 'city') {
        await deps.send({ kind: 'buttons', text: r(T.askRadiusCity()), buttons: [
          { id: 'radius:17', title: '17 km (só a cidade)' }, { id: 'radius:30', title: '30 km' }, { id: 'radius:50', title: '50 km' }] });
      } else {
        await deps.send({ kind: 'buttons', text: r(T.askRadiusPin()), buttons: [
          { id: 'radius:5', title: '5 km' }, { id: 'radius:10', title: '10 km' }, { id: 'radius:20', title: '20 km' }] });
      }
      return;
    case 'ASK_BUDGET':
      await deps.send({ kind: 'buttons', text: r(T.askBudget()), footer: 'Ou digite outro valor', buttons: [
        { id: 'budget:30', title: 'R$ 30' }, { id: 'budget:50', title: 'R$ 50' }, { id: 'budget:100', title: 'R$ 100' }] });
      return;
    case 'ASK_DURATION':
      await deps.send({ kind: 'buttons', text: r(T.askDuration()), buttons: DURATION_BUTTONS });
      return;
    case 'REVIEW': {
      const c = d.creative!;
      const creativeLabel = c.type === 'post'
        ? `Post do Instagram${c.igUsername ? ` @${c.igUsername}` : ''}`
        : (c.kind === 'video' ? 'Vídeo enviado' : 'Foto enviada');
      const imageUrl = c.type === 'upload' ? (c.kind === 'image' ? c.url : undefined) : (c.thumbnailUrl ?? undefined);
      const fullText = d.copy!.text;
      let shownText = fullText;
      if (fullText.length > REVIEW_TEXT_MAX) {
        await deps.send({ kind: 'text', text: T.fullCopy(d.copy!.title, fullText) });
        shownText = fullText.slice(0, REVIEW_TEXT_MAX).trimEnd() + T.copyContinued();
      }
      await deps.send({
        kind: 'buttons',
        imageUrl,
        text: T.review({
          title: d.copy!.title, text: shownText, place: placeLabel(d), radius: d.radius!, budget: d.budget!,
          duration: d.duration ?? 0, page: d.pageName ?? d.pageId ?? '', creative: creativeLabel,
        }),
        buttons: [{ id: 'review:confirm', title: 'Confirmar' }, { id: 'review:edit', title: 'Editar texto' }, { id: 'review:cancel', title: 'Cancelar' }],
      });
      return;
    }
    case 'EDIT_COPY':
      await deps.send({ kind: 'text', text: r(T.askEditCopy()) });
      return;
    default:
      return;
  }
}

// ------------------------------------------------------------------------------------------------
// Entry point for one inbound message (link/opt-out/unknown numbers are handled before, in the worker)
// ------------------------------------------------------------------------------------------------
export async function handleMessage(session: Session, msg: InboundMessage, deps: Deps): Promise<Session> {
  const now = deps.now();
  let s = session;

  // Expire stale flows (but never interrupt work already sent to Meta).
  if (s.state !== 'IDLE' && s.state !== 'CREATING' && s.state !== 'ACTIVATING' && now.getTime() - s.updatedAt.getTime() > SESSION_TTL_MS) {
    s = reset(s, now);
    await deps.send({ kind: 'text', text: T.expired() });
  }

  const cmd = msg.type === 'text' ? parseCommand(msg.text) : null;
  const reply = msg.replyId ?? '';

  if (cmd === 'cancelar' || reply === 'review:cancel') {
    if (s.state === 'CREATING' || s.state === 'ACTIVATING') { await deps.send({ kind: 'text', text: T.cantCancelNow() }); return s; }
    const hadDraft = s.state !== 'IDLE';
    const ctx = await deps.userContext();
    await sendMenu(deps, ctx.firstName, hadDraft ? T.cancelled() : undefined);
    return reset(s, now);
  }
  if (cmd === 'ajuda' || reply === 'menu:help') {
    await deps.send({ kind: 'buttons', text: T.help(), buttons: [MENU_BUTTONS[0], MENU_BUTTONS[1]] });
    return { ...s, updatedAt: now };
  }
  if (cmd === 'menu' || reply === 'menu:menu') {
    if (s.state === 'CREATING' || s.state === 'ACTIVATING') { await deps.send({ kind: 'text', text: s.state === 'CREATING' ? T.stillCreating() : T.stillActivating() }); return s; }
    const ctx = await deps.userContext();
    await sendMenu(deps, ctx.firstName);
    return reset(s, now);
  }
  if (reply === 'menu:status' || (s.state === 'IDLE' && /^(minhas campanhas|status|campanhas)$/.test(norm(msg.text)))) {
    if (s.state === 'CREATING' || s.state === 'ACTIVATING') { await deps.send({ kind: 'text', text: s.state === 'CREATING' ? T.stillCreating() : T.stillActivating() }); return s; }
    await sendStatus(deps);
    return s.state === 'IDLE' ? { ...s, updatedAt: now } : s;
  }
  if (reply === 'menu:create') {
    if (s.state === 'CREATING' || s.state === 'ACTIVATING') { await deps.send({ kind: 'text', text: s.state === 'CREATING' ? T.stillCreating() : T.stillActivating() }); return s; }
    return await startCreate(reset(s, now), deps, null);
  }

  switch (s.state) {
    case 'IDLE': {
      // Shortcut: a photo/video/IG link sent from scratch starts the creation flow with it.
      if (msg.media || (msg.type === 'text' && parseInstagramLink(msg.text))) return await startCreate(s, deps, msg);
      const ctx = await deps.userContext();
      await sendMenu(deps, ctx.firstName);
      return { ...s, updatedAt: now };
    }
    case 'ASK_PAGE': {
      const id = reply.startsWith('page:') ? reply.slice(5) : null;
      const page = id ? s.draft.pages?.find((p) => p.id === id) : null;
      if (!page) { await promptState('ASK_PAGE', s.draft, deps, s.retries + 1); return retry(s, now); }
      const okWa = await deps.pageHasWhatsapp(page.id);
      if (okWa === false) { await deps.send({ kind: 'text', text: T.noPageWhatsapp(page.name) }); return reset(s, now); }
      const d = { ...s.draft, pageId: page.id, pageName: page.name };
      await promptState('ASK_MEDIA', d, deps);
      return goto(s, 'ASK_MEDIA', d, now);
    }
    case 'ASK_MEDIA':
      return await handleMedia(s, msg, deps);
    case 'IG_POST_CONFIRM': {
      const cand = s.draft.igCandidate;
      if (reply === 'ig:other' || !cand) { await promptState('ASK_MEDIA', s.draft, deps); return goto(s, 'ASK_MEDIA', { ...s.draft, igCandidate: undefined }, now); }
      let pref: 'ai' | 'caption' | null = null;
      if (reply === 'ig:caption' && cand.caption.trim()) pref = 'caption';
      else if (reply === 'ig:ai' || reply === 'ig:use') pref = 'ai';
      if (!pref) { await sendIgCandidate(cand, deps); return retry(s, now); }
      const d: Draft = { ...s.draft, igCandidate: undefined, copyPref: pref, creative: { type: 'post', ...cand } };
      await promptState('ASK_LOCATION', d, deps);
      return goto(s, 'ASK_LOCATION', d, now);
    }
    case 'ASK_LOCATION':
    case 'PICK_CITY': {
      if (msg.type === 'location' && msg.location) {
        const label = msg.location.name || msg.location.address || 'Ponto enviado';
        const d: Draft = { ...s.draft, cityOptions: undefined, location: { type: 'pin', latitude: msg.location.latitude, longitude: msg.location.longitude, label } };
        await promptState('ASK_RADIUS', d, deps);
        return goto(s, 'ASK_RADIUS', d, now);
      }
      if (s.state === 'PICK_CITY' && reply.startsWith('city:')) {
        const opt = s.draft.cityOptions?.[Number(reply.slice(5))];
        if (opt) {
          const d: Draft = { ...s.draft, cityOptions: undefined, location: { type: 'city', key: opt.key, name: opt.name, region: opt.region ?? null } };
          await promptState('ASK_RADIUS', d, deps);
          return goto(s, 'ASK_RADIUS', d, now);
        }
      }
      const q = msg.type === 'text' ? String(msg.text ?? '').trim() : '';
      if (q.length >= 2 && q.length <= 60 && !parseInstagramLink(q)) {
        let found: Array<{ key: string; name: string; region?: string | null }>;
        try { found = await deps.searchCities(q); } catch { await deps.send({ kind: 'text', text: T.cityError() }); return retry(s, now); }
        if (!found.length) { await deps.send({ kind: 'text', text: T.retry(T.cityNone(q), s.retries + 1) }); return retry(s, now); }
        const options = found.slice(0, 10);
        await deps.send({ kind: 'list', text: T.cityPick(), button: 'Escolher cidade', sectionTitle: 'Cidades', rows: options.map((c, i) => ({ id: `city:${i}`, title: c.name, description: c.region ?? undefined })) });
        return goto(s, 'PICK_CITY', { ...s.draft, cityOptions: options }, now);
      }
      await promptState('ASK_LOCATION', s.draft, deps, s.retries + 1);
      return retry(s, now);
    }
    case 'ASK_RADIUS': {
      const isCity = s.draft.location?.type === 'city';
      const km = reply.startsWith('radius:') ? Number(reply.slice(7)) : parseKm(msg.text);
      const range = isCity ? CITY_RADIUS : PIN_RADIUS;
      if (!km) { await promptState('ASK_RADIUS', s.draft, deps, s.retries + 1); return retry(s, now); }
      if (km < range.min || km > range.max) {
        await deps.send({ kind: 'text', text: isCity ? (km < CITY_RADIUS.min ? T.radiusCityMin() : T.radiusCityRange()) : T.radiusPinRange() });
        return retry(s, now);
      }
      const d = { ...s.draft, radius: km };
      await promptState('ASK_BUDGET', d, deps);
      return goto(s, 'ASK_BUDGET', d, now);
    }
    case 'ASK_BUDGET': {
      const value = reply.startsWith('budget:') ? Number(reply.slice(7)) : parseMoneyBRL(msg.text);
      const max = s.draft.maxDailyBudget ?? 200;
      if (!value) { await deps.send({ kind: 'text', text: T.retry(T.budgetInvalid(), s.retries + 1) }); return retry(s, now); }
      if (value < MIN_DAILY_BUDGET) { await deps.send({ kind: 'text', text: T.budgetMin() }); return retry(s, now); }
      if (value > max) { await deps.send({ kind: 'text', text: T.budgetMax(max) }); return retry(s, now); }
      const d = { ...s.draft, budget: value };
      await promptState('ASK_DURATION', d, deps);
      return goto(s, 'ASK_DURATION', d, now);
    }
    case 'ASK_DURATION': {
      const dur = reply.startsWith('dur:') ? (Number(reply.slice(4)) as 0 | 7 | 30) : parseDuration(msg.text);
      if (dur !== 0 && dur !== 7 && dur !== 30) { await deps.send({ kind: 'buttons', text: T.retry(T.durationInvalid(), s.retries + 1), buttons: DURATION_BUTTONS }); return retry(s, now); }
      const d: Draft = { ...s.draft, duration: dur };
      d.copy = await buildCopy(d, deps);
      await promptState('REVIEW', d, deps);
      return goto(s, 'REVIEW', d, now);
    }
    case 'REVIEW': {
      if (reply === 'review:edit') { await promptState('EDIT_COPY', s.draft, deps); return goto(s, 'EDIT_COPY', s.draft, now); }
      if (reply === 'review:confirm' || (msg.type === 'text' && parseYesNo(msg.text) === 'yes')) {
        await deps.enqueueJob('create_campaign', {
          draftVersion: s.draftVersion,
          payload: buildCreatePayload(s.draft, s.draftVersion, now, deps),
          budget: s.draft.budget,
        });
        await deps.send({ kind: 'text', text: T.creating() });
        return goto(s, 'CREATING', s.draft, now);
      }
      await promptState('REVIEW', s.draft, deps);
      return retry(s, now);
    }
    case 'EDIT_COPY': {
      const raw = msg.type === 'text' ? String(msg.text ?? '') : '';
      if (!raw.trim()) { await promptState('EDIT_COPY', s.draft, deps, s.retries + 1); return retry(s, now); }
      const { title, text } = splitUserCopy(raw);
      if (text.length > 1000) { await deps.send({ kind: 'text', text: T.copyTooLong() }); return retry(s, now); }
      const d: Draft = { ...s.draft, copy: { title: title ?? s.draft.copy?.title ?? (s.draft.businessName || 'Fale com a gente'), text: text || s.draft.copy?.text || '', source: 'user' } };
      await promptState('REVIEW', d, deps);
      return goto(s, 'REVIEW', d, now);
    }
    case 'CREATING':
      await deps.send({ kind: 'text', text: T.stillCreating() });
      return s;
    case 'ACTIVATING':
      await deps.send({ kind: 'text', text: T.stillActivating() });
      return s;
    case 'CREATED': {
      const created = s.draft.created;
      const yn = msg.type === 'text' ? parseYesNo(msg.text) : null;
      // Spending starts only from a tap on the button carrying this campaign's id; a typed "ok"/"sim"
      // is never enough (plan §8).
      if (created && reply === `act:yes:${created.metaCampaignId}`) {
        await deps.enqueueJob('activate_campaign', { metaCampaignId: created.metaCampaignId });
        return goto(s, 'ACTIVATING', s.draft, now);
      }
      if (reply.startsWith('act:no') || yn === 'no' || !created) {
        await deps.send({ kind: 'buttons', text: T.keptPaused(), buttons: [MENU_BUTTONS[0], MENU_BUTTONS[1]] });
        return reset(s, now);
      }
      if (yn === 'yes') await deps.send({ kind: 'text', text: T.activateTapHint() });
      await sendActivateQuestion(created, deps);
      return retry(s, now);
    }
  }
  return s;
}

async function startCreate(s: Session, deps: Deps, first: InboundMessage | null): Promise<Session> {
  const now = deps.now();
  const ctx = await deps.userContext();
  if (ctx.blocked) { await deps.send({ kind: 'text', text: T.accountBlocked(ctx.blocked) }); return reset(s, now); }
  if (!ctx.meta || !ctx.meta.pages.length) { await deps.send({ kind: 'text', text: T.noMeta() }); return reset(s, now); }

  const base: Draft = { firstName: ctx.firstName, businessName: ctx.businessName, maxDailyBudget: ctx.maxDailyBudget, pages: ctx.meta.pages };
  const pages = ctx.meta.pages;
  if (pages.length > 1) {
    // Default Page first; the user picks (the first message, if any, is dropped: they re-send after choosing).
    const ordered = [...pages].sort((a, b) => (a.id === ctx.meta!.defaultPageId ? -1 : b.id === ctx.meta!.defaultPageId ? 1 : 0));
    const d = { ...base, pages: ordered };
    await promptState('ASK_PAGE', d, deps);
    return goto(s, 'ASK_PAGE', d, now);
  }
  const page = pages[0];
  const okWa = await deps.pageHasWhatsapp(page.id);
  if (okWa === false) { await deps.send({ kind: 'text', text: T.noPageWhatsapp(page.name) }); return reset(s, now); }
  const d: Draft = { ...base, pageId: page.id, pageName: page.name };
  const next = goto(s, 'ASK_MEDIA', d, now);
  if (first) return await handleMedia(next, first, deps);
  await promptState('ASK_MEDIA', d, deps);
  return next;
}

async function handleMedia(s: Session, msg: InboundMessage, deps: Deps): Promise<Session> {
  const now = deps.now();
  if (msg.media && (msg.type === 'image' || msg.type === 'video' || msg.type === 'document')) {
    if (msg.type !== 'image') await deps.send({ kind: 'text', text: T.mediaReceiving() });
    const stored = await deps.storeInboundMedia(msg.media);
    if (!stored.ok) {
      const text = stored.reason === 'unsupported' ? T.mediaUnsupported() : stored.reason === 'too_large' ? T.mediaTooLarge() : T.mediaError();
      await deps.send({ kind: 'text', text });
      return retry(s, now);
    }
    const d: Draft = { ...s.draft, copyPref: 'ai', creative: { type: 'upload', url: stored.url, fileType: stored.fileType, filename: stored.filename, kind: stored.kind } };
    await promptState('ASK_LOCATION', d, deps);
    return goto(s, 'ASK_LOCATION', d, now);
  }
  const link = msg.type === 'text' ? parseInstagramLink(msg.text) : null;
  if (link?.kind === 'story') { await deps.send({ kind: 'text', text: T.igStory() }); return retry(s, now); }
  if (link?.kind === 'post') {
    const found = await deps.findInstagramPost(s.draft.pageId!, link.shortcode);
    if (!found.ok) {
      const text = found.reason === 'no_ig' ? T.igNoAccount() : found.reason === 'not_found' ? T.igNotFound(found.igUsername ?? null) : T.igError();
      await deps.send({ kind: 'text', text });
      return retry(s, now);
    }
    await sendIgCandidate(found.post, deps);
    return goto(s, 'IG_POST_CONFIRM', { ...s.draft, igCandidate: found.post }, now);
  }
  if (msg.type !== 'text' && msg.type !== 'button' && msg.type !== 'list') {
    await deps.send({ kind: 'text', text: T.mediaUnsupported() });
    return retry(s, now);
  }
  await promptState('ASK_MEDIA', s.draft, deps, s.retries + 1);
  return retry(s, now);
}

async function sendIgCandidate(post: IgPost, deps: Deps) {
  const hasCaption = !!post.caption.trim();
  const buttons: Choice[] = hasCaption
    ? [{ id: 'ig:caption', title: 'Usar a legenda' }, { id: 'ig:ai', title: 'Texto novo (IA)' }, { id: 'ig:other', title: 'Outro post' }]
    : [{ id: 'ig:use', title: 'Usar este post' }, { id: 'ig:other', title: 'Outro post' }];
  await deps.send({ kind: 'buttons', imageUrl: post.thumbnailUrl ?? undefined, text: T.igFound(post.igUsername, hasCaption), buttons });
}

async function buildCopy(d: Draft, deps: Deps): Promise<NonNullable<Draft['copy']>> {
  const fallbackTitle = (d.businessName || 'Fale com a gente').slice(0, 40);
  if (d.creative?.type === 'post' && d.copyPref === 'caption' && d.creative.caption.trim()) {
    return { title: fallbackTitle, text: d.creative.caption.trim().slice(0, 1000), source: 'caption' };
  }
  await deps.send({ kind: 'text', text: T.writingCopy() });
  const mediaKind = d.creative?.type === 'upload' ? d.creative.kind : 'post';
  const c = await deps.generateCopy({ businessName: d.businessName ?? null, place: placeLabel(d), mediaKind });
  return { title: c.title, text: c.text, source: c.source };
}

/** Same shape the web wizard sends (src/hooks/useSimpleCampaignWizard.ts) — plan §7.3. */
export function buildCreatePayload(d: Draft, _draftVersion: number, now: Date, _deps?: Deps): Record<string, unknown> {
  const loc = d.location!;
  const selected_locations = loc.type === 'city'
    ? [{ key: loc.key, name: loc.name, type: 'city', country_code: 'BR', radius: d.radius, distance_unit: 'kilometer' }]
    : [{ name: loc.label, type: 'city', country_code: 'BR', latitude: loc.latitude, longitude: loc.longitude, radius: d.radius, distance_unit: 'kilometer', source: 'whatsapp_pin' }];
  const c = d.creative!;
  const common = {
    campaignName: buildCampaignName(d.businessName, placeLabel(d), now),
    adTitle: d.copy!.title,
    adText: d.copy!.text,
    fanpage: d.pageId,
    instagram: '',
    whatsappLink: '',
    dailyBudget: d.budget,
    startDate: now.toISOString(),
    endDate: endDateIso(now, d.duration ?? 0),
    city: placeLabel(d),
    cityCoordinates: loc.type === 'pin' ? { latitude: loc.latitude, longitude: loc.longitude, center: [loc.longitude, loc.latitude] } : null,
    radius: d.radius,
    campaignType: 'traffic',
    status: 'PAUSED',
    gender: 'all',
    ageMin: 18,
    ageMax: 65,
    specialCategories: [],
    countryCode: 'BR',
    selected_locations,
    useAISuggestions: false,
    aiTargeting: null,
    selectedWhatsappPhoneId: null,
    whatsapp_meta: null,
    adSchedule: null,
  };
  if (c.type === 'post') {
    return { ...common, creativeType: 'post', selectedInstagramPostId: c.igMediaId, instagramUserId: c.igUserId, useExistingInstagramPost: true, mediaUrl: null, selectedMediaMeta: null };
  }
  return { ...common, creativeType: 'upload', mediaUrl: c.url, selectedMediaMeta: { file_type: c.fileType, public_url: c.url, filename: c.filename }, useExistingInstagramPost: false, selectedInstagramPostId: null };
}

async function sendActivateQuestion(created: NonNullable<Draft['created']>, deps: Deps) {
  await deps.send({ kind: 'buttons', text: T.created(created.name, created.budget), buttons: [
    { id: `act:yes:${created.metaCampaignId}`, title: 'Ativar agora' }, { id: 'act:no', title: 'Deixar pausada' }] });
}

async function sendStatus(deps: Deps) {
  let lines: CampaignLine[];
  try { lines = await deps.campaignStatus(); } catch { await deps.send({ kind: 'text', text: T.statusError() }); return; }
  if (!lines.length) { await deps.send({ kind: 'buttons', text: T.statusNone(), buttons: [MENU_BUTTONS[0]] }); return; }
  const body = lines.slice(0, 5).map((l) =>
    `• *${l.name}* — ${STATUS_LABEL[l.status] ?? l.status}\n   ${brl(l.spend)} · ${l.conversations} conversa${l.conversations === 1 ? '' : 's'}` +
    (l.costPerConversation != null ? ` · ${brl(l.costPerConversation)}/conversa` : ''),
  ).join('\n');
  await deps.send({ kind: 'buttons', text: `${T.statusHeader()}\n\n${body}`, buttons: [MENU_BUTTONS[0], { id: 'menu:menu', title: 'Menu' }] });
}

// ------------------------------------------------------------------------------------------------
// Job results (called by the worker after a create/activate job finishes)
// ------------------------------------------------------------------------------------------------
export interface JobOutcome {
  kind: 'create_campaign' | 'activate_campaign';
  /** HTTP-like result from createSimpleCampaign / activateCampaignForUser, or null when the run died */
  result: { status: number; body: Record<string, unknown> } | null;
}

export async function handleJobResult(s: Session, outcome: JobOutcome, deps: Deps): Promise<Session> {
  const now = deps.now();
  const body = outcome.result?.body ?? {};
  if (outcome.kind === 'create_campaign') {
    if (!outcome.result) { await deps.send({ kind: 'text', text: T.createUnknown() }); return reset(s, now); }
    const st = String(body.status ?? '');
    if (st === 'created' && body.reconcilePending) {
      // Exists at Meta but not yet in Camply's table: activation would fail until reconciliation.
      await deps.send({ kind: 'buttons', text: T.createdReconciling(), buttons: [MENU_BUTTONS[0], MENU_BUTTONS[1]] });
      return reset(s, now);
    }
    if (st === 'created') {
      const created = { metaCampaignId: String(body.metaCampaignId ?? body.campaignId), name: buildCampaignName(s.draft.businessName, placeLabel(s.draft), now), budget: s.draft.budget ?? 0 };
      await sendActivateQuestion(created, deps);
      return goto(s, 'CREATED', { ...s.draft, created }, now);
    }
    if (st === 'queued') { await deps.send({ kind: 'text', text: T.createQueued(String(body.userMessage ?? '')) }); return reset(s, now); }
    // Same idempotency key already being processed elsewhere: we can't know the outcome here, so never
    // leave the user waiting in CREATING — point them to the panel (same as an unknown result).
    if (st === 'in_progress') { await deps.send({ kind: 'text', text: T.createUnknown() }); return reset(s, now); }
    // failed: back to REVIEW with a new draft version (a new idempotency key for the retry)
    await deps.send({ kind: 'text', text: T.createFailed(String(body.userMessage ?? 'erro desconhecido')) });
    const next: Session = { ...goto(s, 'REVIEW', s.draft, now), draftVersion: s.draftVersion + 1 };
    await promptState('REVIEW', next.draft, deps);
    return next;
  }
  // activate
  if (outcome.result && outcome.result.status === 200 && body.success) {
    const st = String((body.details as Record<string, unknown> | undefined)?.campaignStatus ?? '');
    await deps.send({ kind: 'buttons', text: st === 'IN_PROCESS' || st === 'PENDING_REVIEW' ? T.activatedReview() : T.activated(), buttons: [MENU_BUTTONS[1], MENU_BUTTONS[0]] });
  } else {
    await deps.send({ kind: 'text', text: T.activateFailed(String(body.error ?? 'tente pelo painel da Camply.')) });
  }
  return reset(s, now);
}
