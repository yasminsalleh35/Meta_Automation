// Conversation engine tests with fake dependencies (plan §11). No network, no DB.
import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import type { InboundMessage, OutMessage } from '../_shared/whatsapp.ts';
import {
  buildCreatePayload, type Deps, handleJobResult, handleMessage, type IgLookup, newSession, type Session, SESSION_TTL_MS,
  type StoredMedia, type UserContext,
} from '../_shared/waBot/engine.ts';

const NOW = new Date('2026-11-19T15:00:00Z');

interface Fake {
  deps: Deps;
  sent: OutMessage[];
  jobs: Array<{ kind: string; payload: Record<string, unknown> }>;
  set: (o: Partial<FakeOpts>) => void;
}
interface FakeOpts {
  ctx: UserContext;
  pageWa: boolean | null;
  media: StoredMedia;
  cities: Array<{ key: string; name: string; region?: string | null }>;
  citiesThrow: boolean;
  ig: IgLookup;
  now: Date;
}

function fake(over: Partial<FakeOpts> = {}): Fake {
  const o: FakeOpts = {
    ctx: { firstName: 'Ana', businessName: 'Clínica Sorriso', blocked: null, meta: { pages: [{ id: 'P1', name: 'Clínica Sorriso' }], defaultPageId: 'P1' }, maxDailyBudget: 200 },
    pageWa: true,
    media: { ok: true, url: 'https://cdn/x.jpg', fileType: 'image/jpeg', filename: 'x.jpg', kind: 'image' },
    cities: [{ key: '2525', name: 'Governador Valadares', region: 'Minas Gerais' }, { key: '2526', name: 'Valadares', region: 'MG' }],
    citiesThrow: false,
    ig: { ok: true, post: { igMediaId: 'IGM1', igUserId: 'IGU1', igUsername: 'clinica', caption: 'Legenda do post', thumbnailUrl: 'https://cdn/t.jpg' } },
    now: NOW,
    ...over,
  };
  const sent: OutMessage[] = [];
  const jobs: Fake['jobs'] = [];
  const deps: Deps = {
    send: async (m) => { sent.push(m); },
    now: () => o.now,
    userContext: async () => o.ctx,
    pageHasWhatsapp: async () => o.pageWa,
    storeInboundMedia: async () => o.media,
    searchCities: async () => { if (o.citiesThrow) throw new Error('x'); return o.cities; },
    findInstagramPost: async () => o.ig,
    generateCopy: async () => ({ title: 'Seu sorriso novo', text: 'Agende pelo WhatsApp.', source: 'ai' }),
    enqueueJob: async (kind, payload) => { jobs.push({ kind, payload }); },
    campaignStatus: async () => [
      { name: 'Camp A', status: 'active', spend: 184.2, conversations: 13, costPerConversation: 14.17 },
      { name: 'Camp B', status: 'paused', spend: 0, conversations: 0, costPerConversation: null },
    ],
  };
  return { deps, sent, jobs, set: (x) => Object.assign(o, x) };
}

let n = 0;
const txt = (text: string): InboundMessage => ({ wamid: `w${++n}`, waId: '5533', timestamp: NOW, type: 'text', rawType: 'text', text });
const btn = (replyId: string): InboundMessage => ({ wamid: `w${++n}`, waId: '5533', timestamp: NOW, type: 'button', rawType: 'interactive', replyId });
const lst = (replyId: string): InboundMessage => ({ wamid: `w${++n}`, waId: '5533', timestamp: NOW, type: 'list', rawType: 'interactive', replyId });
const img = (): InboundMessage => ({ wamid: `w${++n}`, waId: '5533', timestamp: NOW, type: 'image', rawType: 'image', media: { id: 'M1', mimeType: 'image/jpeg' } });
const audio = (): InboundMessage => ({ wamid: `w${++n}`, waId: '5533', timestamp: NOW, type: 'other', rawType: 'audio' });
const pin = (): InboundMessage => ({ wamid: `w${++n}`, waId: '5533', timestamp: NOW, type: 'location', rawType: 'location', location: { latitude: -18.85, longitude: -41.95, name: 'Loja Centro' } });

const lastText = (f: Fake) => {
  const m = f.sent[f.sent.length - 1];
  return m && 'text' in m ? m.text : '';
};
const lastButtons = (f: Fake) => {
  const m = f.sent[f.sent.length - 1];
  return m?.kind === 'buttons' ? m.buttons.map((b) => b.id) : [];
};

async function run(f: Fake, s: Session, ...msgs: InboundMessage[]): Promise<Session> {
  for (const m of msgs) s = await handleMessage(s, m, f.deps);
  return s;
}

/** Drives a full image flow up to REVIEW. */
async function toReview(f: Fake): Promise<Session> {
  return await run(f, newSession(NOW), btn('menu:create'), img(), pin(), btn('radius:10'), btn('budget:50'), btn('dur:7'));
}

// ---------------- entry & menu ----------------
Deno.test('E1 any first message → menu with 3 buttons', async () => {
  const f = fake();
  const s = await run(f, newSession(NOW), txt('oi'));
  assertEquals(s.state, 'IDLE');
  assertEquals(lastButtons(f), ['menu:create', 'menu:status', 'menu:help']);
  assert(lastText(f).includes('Ana'));
});
Deno.test('E2 ajuda → help text', async () => {
  const f = fake();
  await run(f, newSession(NOW), txt('ajuda'));
  assert(lastText(f).includes('Criar campanha'));
});
Deno.test('E3 status lists campaigns with spend and cost per conversation', async () => {
  const f = fake();
  const s = await run(f, newSession(NOW), btn('menu:status'));
  assertEquals(s.state, 'IDLE');
  const t = lastText(f);
  assert(t.includes('Camp A') && t.includes('ativa') && t.includes('R$ 184,20') && t.includes('13 conversas') && t.includes('R$ 14,17/conversa'), t);
  assert(t.includes('Camp B') && t.includes('pausada'));
});
Deno.test('E4 status with no campaigns → invitation to create', async () => {
  const f = fake();
  f.deps.campaignStatus = async () => [];
  await run(f, newSession(NOW), txt('minhas campanhas'));
  assertEquals(lastButtons(f), ['menu:create']);
});

// ---------------- pre-checks ----------------
Deno.test('P1 suspended account → blocked message, back to IDLE, nothing asked', async () => {
  const f = fake();
  f.set({ ctx: { firstName: 'Ana', businessName: null, blocked: 'Sua conta está suspensa.', meta: { pages: [{ id: 'P1', name: 'X' }], defaultPageId: 'P1' }, maxDailyBudget: 200 } });
  const s = await run(f, newSession(NOW), btn('menu:create'));
  assertEquals(s.state, 'IDLE');
  assertEquals(lastText(f), 'Sua conta está suspensa.');
});
Deno.test('P2 no Meta integration → connect link', async () => {
  const f = fake();
  f.set({ ctx: { firstName: 'Ana', businessName: null, blocked: null, meta: null, maxDailyBudget: 200 } });
  const s = await run(f, newSession(NOW), btn('menu:create'));
  assertEquals(s.state, 'IDLE');
  assert(lastText(f).includes('/dashboard/integrations'));
});
Deno.test('P3 Page without WhatsApp → explained, IDLE', async () => {
  const f = fake({ pageWa: false });
  const s = await run(f, newSession(NOW), btn('menu:create'));
  assertEquals(s.state, 'IDLE');
  assert(lastText(f).includes('não tem um WhatsApp conectado'));
});
Deno.test('P4 unknown WhatsApp status (Graph down) → continues (creation re-checks)', async () => {
  const f = fake({ pageWa: null });
  const s = await run(f, newSession(NOW), btn('menu:create'));
  assertEquals(s.state, 'ASK_MEDIA');
});
Deno.test('P5 several Pages → picker (default first), then media', async () => {
  const f = fake();
  f.set({ ctx: { firstName: 'Ana', businessName: 'B', blocked: null, meta: { pages: [{ id: 'P1', name: 'Um' }, { id: 'P2', name: 'Dois' }], defaultPageId: 'P2' }, maxDailyBudget: 200 } });
  let s = await run(f, newSession(NOW), btn('menu:create'));
  assertEquals(s.state, 'ASK_PAGE');
  const list = f.sent[f.sent.length - 1];
  assert(list.kind === 'list' && list.rows[0].id === 'page:P2');
  s = await run(f, s, lst('page:P9'));
  assertEquals(s.state, 'ASK_PAGE');
  s = await run(f, s, lst('page:P1'));
  assertEquals(s.state, 'ASK_MEDIA');
  assertEquals(s.draft.pageId, 'P1');
  assertEquals(s.draft.pageName, 'Um');
});

// ---------------- media ----------------
Deno.test('M1 photo → location question', async () => {
  const f = fake();
  const s = await run(f, newSession(NOW), btn('menu:create'), img());
  assertEquals(s.state, 'ASK_LOCATION');
  assertEquals(s.draft.creative?.type, 'upload');
  assertEquals(f.sent[f.sent.length - 1].kind, 'location_request');
});
Deno.test('M2 photo sent from IDLE starts the flow with it', async () => {
  const f = fake();
  const s = await run(f, newSession(NOW), img());
  assertEquals(s.state, 'ASK_LOCATION');
});
Deno.test('M3 unsupported / too large / error media → stays, explains', async () => {
  for (const [reason, word] of [['unsupported', 'foto'], ['too_large', '50 MB'], ['error', 'enviar de novo']] as const) {
    const f = fake({ media: { ok: false, reason } });
    const s = await run(f, newSession(NOW), btn('menu:create'), img());
    assertEquals(s.state, 'ASK_MEDIA', reason);
    assert(lastText(f).includes(word), `${reason}: ${lastText(f)}`);
  }
});
Deno.test('M4 audio → asks for photo/video', async () => {
  const f = fake();
  const s = await run(f, newSession(NOW), btn('menu:create'), audio());
  assertEquals(s.state, 'ASK_MEDIA');
  assert(lastText(f).includes('foto'));
});
Deno.test('M5 retries counter adds the "menu" hint on the 3rd failure', async () => {
  const f = fake();
  const s = await run(f, newSession(NOW), btn('menu:create'), txt('hã?'), txt('hã?'), txt('hã?'));
  assertEquals(s.retries, 3);
  assert(lastText(f).includes('digite *menu*'));
});

// ---------------- Instagram post ----------------
Deno.test('I1 IG link → preview with caption/AI/other; caption chosen → copy is the caption', async () => {
  const f = fake();
  let s = await run(f, newSession(NOW), btn('menu:create'), txt('https://www.instagram.com/p/Cabc12345/'));
  assertEquals(s.state, 'IG_POST_CONFIRM');
  assertEquals(lastButtons(f), ['ig:caption', 'ig:ai', 'ig:other']);
  s = await run(f, s, btn('ig:caption'), pin(), btn('radius:5'), btn('budget:30'), btn('dur:0'));
  assertEquals(s.state, 'REVIEW');
  assertEquals(s.draft.copy, { title: 'Clínica Sorriso', text: 'Legenda do post', source: 'caption' });
  const p = buildCreatePayload(s.draft, s.draftVersion, NOW);
  assertEquals(p.creativeType, 'post');
  assertEquals(p.selectedInstagramPostId, 'IGM1');
  assertEquals(p.instagramUserId, 'IGU1');
  assertEquals(p.selectedMediaMeta, null);
});
Deno.test('I2 IG post without caption → [Usar este post][Outro post]; AI writes the copy', async () => {
  const f = fake({ ig: { ok: true, post: { igMediaId: 'M', igUserId: 'U', igUsername: null, caption: '', thumbnailUrl: null } } });
  let s = await run(f, newSession(NOW), btn('menu:create'), txt('instagram.com/reel/DAbc12345'));
  assertEquals(lastButtons(f), ['ig:use', 'ig:other']);
  s = await run(f, s, btn('ig:use'), pin(), btn('radius:5'), btn('budget:30'), btn('dur:0'));
  assertEquals(s.draft.copy?.source, 'ai');
});
Deno.test('I3 IG not found / no IG / story → explained, still asking media', async () => {
  for (const [ig, word] of [
    [{ ok: false, reason: 'not_found', igUsername: 'loja' }, '@loja'],
    [{ ok: false, reason: 'no_ig' }, 'não tem uma conta do Instagram'],
  ] as Array<[IgLookup, string]>) {
    const f = fake({ ig });
    const s = await run(f, newSession(NOW), btn('menu:create'), txt('https://instagram.com/p/Cabc12345'));
    assertEquals(s.state, 'ASK_MEDIA');
    assert(lastText(f).includes(word), lastText(f));
  }
  const f = fake();
  const s = await run(f, newSession(NOW), btn('menu:create'), txt('https://instagram.com/stories/loja/1/'));
  assertEquals(s.state, 'ASK_MEDIA');
  assert(lastText(f).includes('Story'));
});
Deno.test('I4 "Outro post" goes back to the media question', async () => {
  const f = fake();
  const s = await run(f, newSession(NOW), btn('menu:create'), txt('https://instagram.com/p/Cabc12345'), btn('ig:other'));
  assertEquals(s.state, 'ASK_MEDIA');
  assertEquals(s.draft.igCandidate, undefined);
});

// ---------------- location & radius ----------------
Deno.test('L1 typed city → list → pick → city radius buttons (17/30/50)', async () => {
  const f = fake();
  let s = await run(f, newSession(NOW), btn('menu:create'), img(), txt('valadares'));
  assertEquals(s.state, 'PICK_CITY');
  s = await run(f, s, lst('city:0'));
  assertEquals(s.state, 'ASK_RADIUS');
  assertEquals(s.draft.location, { type: 'city', key: '2525', name: 'Governador Valadares', region: 'Minas Gerais' });
  assertEquals(lastButtons(f), ['radius:17', 'radius:30', 'radius:50']);
});
Deno.test('L2 city radius below 17 km → explained; 25 typed → accepted', async () => {
  const f = fake();
  let s = await run(f, newSession(NOW), btn('menu:create'), img(), txt('valadares'), lst('city:0'), txt('10 km'));
  assertEquals(s.state, 'ASK_RADIUS');
  assert(lastText(f).includes('17 km'));
  s = await run(f, s, txt('25km'));
  assertEquals(s.state, 'ASK_BUDGET');
  assertEquals(s.draft.radius, 25);
});
Deno.test('L3 pin → pin radius buttons (5/10/20); 81 km rejected', async () => {
  const f = fake();
  let s = await run(f, newSession(NOW), btn('menu:create'), img(), pin());
  assertEquals(lastButtons(f), ['radius:5', 'radius:10', 'radius:20']);
  s = await run(f, s, txt('81'));
  assertEquals(s.state, 'ASK_RADIUS');
  s = await run(f, s, txt('3'));
  assertEquals(s.draft.radius, 3);
});
Deno.test('L4 city not found / search error → stays asking', async () => {
  const f = fake({ cities: [] });
  const s = await run(f, newSession(NOW), btn('menu:create'), img(), txt('Xyzabc'));
  assertEquals(s.state, 'ASK_LOCATION');
  assert(lastText(f).includes('Não encontrei'));
  const g = fake({ citiesThrow: true });
  const s2 = await run(g, newSession(NOW), btn('menu:create'), img(), txt('Ipatinga'));
  assertEquals(s2.state, 'ASK_LOCATION');
});
Deno.test('L5 a pin is accepted while picking a city', async () => {
  const f = fake();
  const s = await run(f, newSession(NOW), btn('menu:create'), img(), txt('valadares'), pin());
  assertEquals(s.state, 'ASK_RADIUS');
  assertEquals(s.draft.location?.type, 'pin');
  assertEquals(s.draft.cityOptions, undefined);
});

// ---------------- budget & duration ----------------
Deno.test('B1 budget: typed 70 ok; 29 too low; 201 above the cap; words invalid', async () => {
  const f = fake();
  let s = await run(f, newSession(NOW), btn('menu:create'), img(), pin(), btn('radius:10'));
  s = await run(f, s, txt('29'));
  assertEquals(s.state, 'ASK_BUDGET'); assert(lastText(f).includes('mínimo'));
  s = await run(f, s, txt('R$ 201'));
  assertEquals(s.state, 'ASK_BUDGET'); assert(lastText(f).includes('R$ 200,00'));
  s = await run(f, s, txt('uns cinquenta'));
  assertEquals(s.state, 'ASK_BUDGET');
  s = await run(f, s, txt('R$ 70,00'));
  assertEquals(s.state, 'ASK_DURATION');
  assertEquals(s.draft.budget, 70);
});
Deno.test('B2 per-user cap override is respected', async () => {
  const f = fake();
  f.set({ ctx: { firstName: 'A', businessName: 'B', blocked: null, meta: { pages: [{ id: 'P1', name: 'X' }], defaultPageId: 'P1' }, maxDailyBudget: 500 } });
  const s = await run(f, newSession(NOW), btn('menu:create'), img(), pin(), btn('radius:10'), txt('450'));
  assertEquals(s.draft.budget, 450);
});
Deno.test('D1 duration invalid → asks again; then review with AI copy', async () => {
  const f = fake();
  let s = await run(f, newSession(NOW), btn('menu:create'), img(), pin(), btn('radius:10'), btn('budget:50'), txt('15 dias'));
  assertEquals(s.state, 'ASK_DURATION');
  s = await run(f, s, txt('30 dias'));
  assertEquals(s.state, 'REVIEW');
  assertEquals(s.draft.duration, 30);
  assertEquals(s.draft.copy?.title, 'Seu sorriso novo');
  const review = f.sent[f.sent.length - 1];
  assert(review.kind === 'buttons' && review.imageUrl === 'https://cdn/x.jpg');
  assert(review.text.includes('R$ 50,00') && review.text.includes('30 dias') && review.text.includes('pausada'));
});

// ---------------- review, edit, confirm ----------------
Deno.test('R1 edit copy: first short line becomes the title', async () => {
  const f = fake();
  let s = await toReview(f);
  s = await run(f, s, btn('review:edit'));
  assertEquals(s.state, 'EDIT_COPY');
  s = await run(f, s, txt('Clareamento em promoção\nChame no WhatsApp e agende.'));
  assertEquals(s.state, 'REVIEW');
  assertEquals(s.draft.copy, { title: 'Clareamento em promoção', text: 'Chame no WhatsApp e agende.', source: 'user' });
});
Deno.test('R2 edit copy over 1000 chars rejected', async () => {
  const f = fake();
  let s = await toReview(f);
  s = await run(f, s, btn('review:edit'), txt('x'.repeat(1001)));
  assertEquals(s.state, 'EDIT_COPY');
});
Deno.test('R3 confirm → one create job with the wizard-shaped PAUSED payload', async () => {
  const f = fake();
  let s = await toReview(f);
  s = await run(f, s, btn('review:confirm'));
  assertEquals(s.state, 'CREATING');
  assertEquals(f.jobs.length, 1);
  assertEquals(f.jobs[0].kind, 'create_campaign');
  const p = f.jobs[0].payload.payload as Record<string, unknown>;
  assertEquals(p.status, 'PAUSED');
  assertEquals(p.creativeType, 'upload');
  assertEquals(p.dailyBudget, 50);
  assertEquals(p.fanpage, 'P1');
  assertEquals(p.ageMin, 18);
  assertEquals(p.endDate, '2026-11-26T23:59:59-03:00');
  assertEquals((p.selectedMediaMeta as Record<string, unknown>).public_url, 'https://cdn/x.jpg');
  const loc = (p.selected_locations as Array<Record<string, unknown>>)[0];
  assertEquals([loc.latitude, loc.longitude, loc.radius, loc.key], [-18.85, -41.95, 10, undefined]);
  // while creating: no second job, no cancel
  s = await run(f, s, btn('review:confirm'), txt('cancelar'), btn('menu:create'));
  assertEquals(s.state, 'CREATING');
  assertEquals(f.jobs.length, 1);
});
Deno.test('R4 typed "sim" also confirms; cancel in review discards', async () => {
  const f = fake();
  let s = await toReview(f);
  s = await run(f, s, txt('sim'));
  assertEquals(s.state, 'CREATING');
  const g = fake();
  let t = await toReview(g);
  const v = t.draftVersion;
  t = await run(g, t, btn('review:cancel'));
  assertEquals(t.state, 'IDLE');
  assertEquals(t.draft, {});
  assertEquals(t.draftVersion, v + 1);
  assertEquals(g.jobs.length, 0);
  assert(lastText(g).includes('cancelada'));
});

// ---------------- job results & activation ----------------
Deno.test('J1 created → activate question; Ativar → activate job; result → active message', async () => {
  const f = fake();
  let s = await run(f, await toReview(f), btn('review:confirm'));
  s = await handleJobResult(s, { kind: 'create_campaign', result: { status: 200, body: { success: true, status: 'created', metaCampaignId: '120200001' } } }, f.deps);
  assertEquals(s.state, 'CREATED');
  assertEquals(lastButtons(f), ['act:yes:120200001', 'act:no']);
  assert(lastText(f).includes('R$ 50,00'));
  s = await run(f, s, btn('act:yes:999')); // stale button for another campaign → re-ask, no job
  assertEquals(f.jobs.length, 1);
  s = await run(f, s, btn('act:yes:120200001'));
  assertEquals(s.state, 'ACTIVATING');
  assertEquals(f.jobs[1], { kind: 'activate_campaign', payload: { metaCampaignId: '120200001' } });
  s = await handleJobResult(s, { kind: 'activate_campaign', result: { status: 200, body: { success: true, details: { campaignStatus: 'IN_PROCESS' } } } }, f.deps);
  assertEquals(s.state, 'IDLE');
  assert(lastText(f).includes('em análise'));
});
Deno.test('J2 "Deixar pausada" → no activation job', async () => {
  const f = fake();
  let s = await run(f, await toReview(f), btn('review:confirm'));
  s = await handleJobResult(s, { kind: 'create_campaign', result: { status: 200, body: { status: 'created', metaCampaignId: '1202' } } }, f.deps);
  s = await run(f, s, btn('act:no'));
  assertEquals(s.state, 'IDLE');
  assertEquals(f.jobs.length, 1);
  assert(lastText(f).includes('pausada'));
});
Deno.test('J3 failed → honest message, back to REVIEW with a NEW draft version (new idempotency key)', async () => {
  const f = fake();
  let s = await run(f, await toReview(f), btn('review:confirm'));
  const v = s.draftVersion;
  s = await handleJobResult(s, { kind: 'create_campaign', result: { status: 422, body: { status: 'failed', userMessage: 'A imagem é pequena demais.' } } }, f.deps);
  assertEquals(s.state, 'REVIEW');
  assertEquals(s.draftVersion, v + 1);
  assert(f.sent.some((m) => 'text' in m && m.text.includes('A imagem é pequena demais.')));
  s = await run(f, s, btn('review:confirm'));
  assertEquals(f.jobs[1].payload.draftVersion, v + 1);
});
Deno.test('J4 queued → team message, IDLE; unknown (run died) → check-the-panel message', async () => {
  const f = fake();
  let s = await run(f, await toReview(f), btn('review:confirm'));
  s = await handleJobResult(s, { kind: 'create_campaign', result: { status: 202, body: { status: 'queued', userMessage: 'Nossa equipe vai finalizar.' } } }, f.deps);
  assertEquals(s.state, 'IDLE');
  assert(lastText(f).includes('Nossa equipe'));
  const g = fake();
  let t = await run(g, await toReview(g), btn('review:confirm'));
  t = await handleJobResult(t, { kind: 'create_campaign', result: null }, g.deps);
  assertEquals(t.state, 'IDLE');
  assert(lastText(g).includes('/dashboard/campaigns'));
});
Deno.test('J5 activation refused → error text, IDLE', async () => {
  const f = fake();
  const s = await handleJobResult({ ...newSession(NOW), state: 'ACTIVATING' }, { kind: 'activate_campaign', result: { status: 400, body: { success: false, error: 'Não foi possível ativar: DISAPPROVED.' } } }, f.deps);
  assertEquals(s.state, 'IDLE');
  assert(lastText(f).includes('DISAPPROVED'));
});

// ---------------- session expiry & commands ----------------
Deno.test('S1 a flow idle for more than 24 h restarts', async () => {
  const f = fake();
  const old: Session = { state: 'ASK_BUDGET', draft: { budget: 1 }, draftVersion: 3, retries: 0, updatedAt: new Date(NOW.getTime() - SESSION_TTL_MS - 1000) };
  const s = await run(f, old, txt('50'));
  assertEquals(s.state, 'IDLE');
  assert(f.sent.some((m) => 'text' in m && m.text.includes('expirou')));
});
Deno.test('S2 an old CREATING session is never reset (work is at Meta)', async () => {
  const f = fake();
  const old: Session = { state: 'CREATING', draft: {}, draftVersion: 1, retries: 0, updatedAt: new Date(NOW.getTime() - SESSION_TTL_MS - 1000) };
  const s = await run(f, old, txt('oi'));
  assertEquals(s.state, 'CREATING');
});
Deno.test('S3 "menu" mid-flow discards the draft', async () => {
  const f = fake();
  const s = await run(f, newSession(NOW), btn('menu:create'), img(), txt('menu'));
  assertEquals(s.state, 'IDLE');
  assertEquals(s.draft, {});
});
Deno.test('S4 "Criar campanha" tapped mid-flow restarts cleanly', async () => {
  const f = fake();
  const s = await run(f, newSession(NOW), btn('menu:create'), img(), pin(), btn('menu:create'));
  assertEquals(s.state, 'ASK_MEDIA');
  assertEquals(s.draft.creative, undefined);
});

// ---------------- review fixes (2026-11-20) ----------------
Deno.test('F1 typed "sim"/"ok" after creation never activates; only the Ativar button does', async () => {
  const f = fake();
  let s = await run(f, await toReview(f), btn('review:confirm'));
  s = await handleJobResult(s, { kind: 'create_campaign', result: { status: 200, body: { status: 'created', metaCampaignId: '120200001' } } }, f.deps);
  s = await run(f, s, txt('sim'), txt('ok'), txt('pode'));
  assertEquals(s.state, 'CREATED');
  assertEquals(f.jobs.length, 1); // only the create job
  assert(f.sent.some((m) => 'text' in m && m.text.includes('toque no botão *Ativar*')));
  assertEquals(lastButtons(f), ['act:yes:120200001', 'act:no']);
  s = await run(f, s, btn('act:yes:120200001'));
  assertEquals(s.state, 'ACTIVATING');
});
Deno.test('F2 long ad text: budget/place/"pausada" always inside the summary (≤1024), full text sent before it', async () => {
  const f = fake();
  let s = await toReview(f);
  s = await run(f, s, btn('review:edit'), txt('x'.repeat(990)));
  assertEquals(s.state, 'REVIEW');
  const last = f.sent[f.sent.length - 1] as { text: string };
  assert(last.text.length <= 1024, `summary ${last.text.length} chars`);
  assert(last.text.includes('R$ 50,00 por dia'));
  assert(last.text.includes('*pausada*'));
  assert(last.text.includes('texto completo na mensagem acima'));
  const before = f.sent[f.sent.length - 2] as { text: string };
  assert(before.text.includes('x'.repeat(990)));
});
Deno.test('F3 create "in_progress" result never leaves the user stuck in CREATING', async () => {
  const f = fake();
  let s = await run(f, await toReview(f), btn('review:confirm'));
  s = await handleJobResult(s, { kind: 'create_campaign', result: { status: 409, body: { status: 'in_progress' } } }, f.deps);
  assertEquals(s.state, 'IDLE');
  assert(lastText(f).includes('Não consegui confirmar'));
});
Deno.test('F4 created but pending reconciliation → no Ativar button (it would fail), points to the panel', async () => {
  const f = fake();
  let s = await run(f, await toReview(f), btn('review:confirm'));
  s = await handleJobResult(s, { kind: 'create_campaign', result: { status: 200, body: { status: 'created', metaCampaignId: '1202', reconcilePending: true } } }, f.deps);
  assertEquals(s.state, 'IDLE');
  assert(!lastButtons(f).some((id: string) => id.startsWith('act:yes')));
  assert(lastText(f).includes('/dashboard/campaigns'));
});
Deno.test('F5 invalid duration → one message with the buttons (not two)', async () => {
  const f = fake();
  let s = await toReview(f);
  // walk back: a fresh flow up to ASK_DURATION is long; reuse REVIEW draft by forcing the state
  s = { ...s, state: 'ASK_DURATION' };
  const before = f.sent.length;
  s = await run(f, s, txt('banana'));
  assertEquals(f.sent.length - before, 1);
  assertEquals(lastButtons(f), ['dur:0', 'dur:7', 'dur:30']);
});
