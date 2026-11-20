// Unit tests: WhatsApp helpers, parsers, AI copy validation, link code. Plan §11.
import { assert, assertEquals, assertThrows } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {
  buildPayload, hmacSha256Hex, LIMITS, maskPhone, parseWebhook, sniffMediaKind, verifySignature,
} from '../_shared/whatsapp.ts';
import {
  buildCampaignName, endDateIso, parseCommand, parseDuration, parseInstagramLink, parseKm, parseLinkCode,
  parseMoneyBRL, parseYesNo, splitUserCopy, ymdSaoPaulo,
} from '../_shared/waBot/parse.ts';
import { templateCopy, validateAiCopy } from '../_shared/aiCopy.ts';

Deno.env.set('WA_DISABLE_SERVE', '1');
const { newLinkCode, handleLink } = await import('../wa-bot-link/index.ts');
const { handleWebhook } = await import('../wa-bot-webhook/index.ts');
const { handleWorker } = await import('../wa-bot-worker/index.ts');

const enc = (s: string) => new TextEncoder().encode(s);

// ---------------- signature ----------------
Deno.test('sig: valid signature accepted', async () => {
  const body = enc('{"a":1}');
  const sig = 'sha256=' + await hmacSha256Hex('secret', body);
  assert(await verifySignature(body, sig, 'secret'));
});
Deno.test('sig: tampered body / wrong secret / missing or malformed header rejected', async () => {
  const body = enc('{"a":1}');
  const sig = 'sha256=' + await hmacSha256Hex('secret', body);
  assertEquals(await verifySignature(enc('{"a":2}'), sig, 'secret'), false);
  assertEquals(await verifySignature(body, sig, 'other'), false);
  assertEquals(await verifySignature(body, null, 'secret'), false);
  assertEquals(await verifySignature(body, sig.slice(7), 'secret'), false);
  assertEquals(await verifySignature(body, sig, ''), false);
});
Deno.test('sig: uppercase hex accepted', async () => {
  const body = enc('x');
  assert(await verifySignature(body, 'sha256=' + (await hmacSha256Hex('k', body)).toUpperCase(), 'k'));
});

// ---------------- webhook parsing ----------------
const hook = (messages: unknown[], extra: Record<string, unknown> = {}) => ({
  object: 'whatsapp_business_account',
  entry: [{ changes: [{ field: 'messages', value: { metadata: { phone_number_id: 'PNID' }, contacts: [{ wa_id: '553312345678', profile: { name: 'Ana' } }], messages, ...extra } }] }],
});
Deno.test('parse: text, buttons, list, location, media, statuses', () => {
  const p = parseWebhook(hook([
    { id: 'w1', from: '553312345678', timestamp: '1790000000', type: 'text', text: { body: 'oi' } },
    { id: 'w2', from: '553312345678', timestamp: '1790000001', type: 'interactive', interactive: { type: 'button_reply', button_reply: { id: 'menu:create', title: 'Criar campanha' } } },
    { id: 'w3', from: '553312345678', timestamp: '1790000002', type: 'interactive', interactive: { type: 'list_reply', list_reply: { id: 'city:0', title: 'X' } } },
    { id: 'w4', from: '553312345678', timestamp: '1790000003', type: 'location', location: { latitude: -18.85, longitude: -41.95, name: 'Loja' } },
    { id: 'w5', from: '553312345678', timestamp: '1790000004', type: 'document', document: { id: 'M1', mime_type: 'video/mp4', filename: 'v.mp4', caption: 'cap' } },
    { id: 'w6', from: '553312345678', timestamp: '1790000005', type: 'sticker', sticker: { id: 'S' } },
  ], { statuses: [{ id: 'o1', status: 'failed', recipient_id: '553312345678', errors: [{ title: 'x' }] }] }));
  assertEquals(p.messages.map((m) => m.type), ['text', 'button', 'list', 'location', 'document', 'other']);
  assertEquals(p.messages[0].text, 'oi');
  assertEquals(p.messages[0].profileName, 'Ana');
  assertEquals(p.messages[0].phoneNumberId, 'PNID');
  assertEquals(p.messages[1].replyId, 'menu:create');
  assertEquals(p.messages[2].replyId, 'city:0');
  assertEquals(p.messages[3].location?.latitude, -18.85);
  assertEquals(p.messages[4].media, { id: 'M1', mimeType: 'video/mp4', filename: 'v.mp4', sha256: undefined });
  assertEquals(p.messages[4].text, 'cap');
  assertEquals(p.statuses[0], { wamid: 'o1', status: 'failed', recipientId: '553312345678', errorTitle: 'x' });
});
Deno.test('parse: ignores other objects/fields and malformed entries', () => {
  assertEquals(parseWebhook({ object: 'page', entry: [] }).messages.length, 0);
  assertEquals(parseWebhook(null).messages.length, 0);
  assertEquals(parseWebhook({ object: 'whatsapp_business_account', entry: [{ changes: [{ field: 'account_update', value: {} }] }] }).messages.length, 0);
  assertEquals(parseWebhook(hook([{ type: 'text' }])).messages.length, 0);
});

// ---------------- payload building ----------------
Deno.test('payload: buttons clipped to 3 and 20 chars, list to 10 rows', () => {
  const b = buildPayload('55', { kind: 'buttons', text: 'x', buttons: [1, 2, 3, 4].map((i) => ({ id: `b${i}`, title: 'Um título muito comprido demais' })) });
  assertEquals(b.interactive.action.buttons.length, 3);
  assert(b.interactive.action.buttons.every((x: { reply: { title: string } }) => x.reply.title.length <= LIMITS.buttonTitle));
  const l = buildPayload('55', { kind: 'list', text: 'x', button: 'Escolher', rows: Array.from({ length: 12 }, (_, i) => ({ id: `r${i}`, title: `Cidade ${i} com nome muito longo`, description: 'd'.repeat(100) })) });
  assertEquals(l.interactive.action.sections[0].rows.length, 10);
  assert(l.interactive.action.sections[0].rows.every((r: { title: string; description: string }) => r.title.length <= 24 && r.description.length <= 72));
});
Deno.test('payload: text, image header, location request; empty buttons throws', () => {
  assertEquals(buildPayload('55', { kind: 'text', text: 'oi' }).text.body, 'oi');
  const h = buildPayload('55', { kind: 'buttons', text: 'x', imageUrl: 'https://i', buttons: [{ id: 'a', title: 'A' }] });
  assertEquals(h.interactive.header, { type: 'image', image: { link: 'https://i' } });
  assertEquals(buildPayload('55', { kind: 'location_request', text: 'x' }).interactive.type, 'location_request_message');
  assertThrows(() => buildPayload('55', { kind: 'buttons', text: 'x', buttons: [] }));
});
Deno.test('maskPhone never shows more than the last 4 digits', () => {
  assertEquals(maskPhone('553398413505'), '+55 •• •••• 3505');
  assertEquals(maskPhone('12'), '••••');
});
Deno.test('sniff: jpeg, png, mp4, 3gp, mov; heic and garbage rejected', () => {
  const pad = (a: number[]) => new Uint8Array([...a, ...new Array(16).fill(0)]);
  assertEquals(sniffMediaKind(pad([0xff, 0xd8, 0xff]))?.mime, 'image/jpeg');
  assertEquals(sniffMediaKind(pad([0x89, 0x50, 0x4e, 0x47]))?.mime, 'image/png');
  const ftyp = (brand: string) => pad([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, ...[...brand].map((c) => c.charCodeAt(0))]);
  assertEquals(sniffMediaKind(ftyp('isom'))?.mime, 'video/mp4');
  assertEquals(sniffMediaKind(ftyp('3gp4'))?.mime, 'video/3gpp');
  assertEquals(sniffMediaKind(ftyp('qt  '))?.mime, 'video/quicktime');
  assertEquals(sniffMediaKind(ftyp('heic')), null);
  assertEquals(sniffMediaKind(pad([0x25, 0x50, 0x44, 0x46])), null); // PDF
});

// ---------------- parsers ----------------
Deno.test('parse: commands only as whole messages', () => {
  assertEquals(parseCommand('Cancelar'), 'cancelar');
  assertEquals(parseCommand(' MENU! '), 'menu');
  assertEquals(parseCommand('Início'), 'menu');
  assertEquals(parseCommand('parar'), 'parar');
  assertEquals(parseCommand('quero cancelar a campanha x'), null);
});
Deno.test('parse: link code formats', () => {
  assertEquals(parseLinkCode('VINCULAR 1234 5678'), '12345678');
  assertEquals(parseLinkCode('vincular 12345678'), '12345678');
  assertEquals(parseLinkCode('Vincular: 1234-5678'), '12345678');
  assertEquals(parseLinkCode('vincular 1234567'), null);
  assertEquals(parseLinkCode('12345678'), null);
});
Deno.test('parse: money BRL', () => {
  for (const [i, o] of [['50', 50], ['R$ 50', 50], ['R$50,00', 50], ['50 reais', 50], ['70,5', 70.5], ['1.000', 1000], ['1.000,50', 1000.5], ['70.50', 70.5], ['R$ 80 por dia', 80]] as const) {
    assertEquals(parseMoneyBRL(i), o, i);
  }
  for (const i of ['cinquenta', '50 ou 60', '', '0', 'R$', '-5']) assertEquals(parseMoneyBRL(i), null, i);
});
Deno.test('parse: km, yes/no, duration', () => {
  assertEquals(parseKm('15'), 15);
  assertEquals(parseKm('15km'), 15);
  assertEquals(parseKm('20 quilômetros'), 20);
  assertEquals(parseKm('perto'), null);
  assertEquals(parseYesNo('Sim'), 'yes');
  assertEquals(parseYesNo('confirmar'), 'yes');
  assertEquals(parseYesNo('Não'), 'no');
  assertEquals(parseYesNo('talvez'), null);
  assertEquals(parseDuration('sem data de término'), 0);
  assertEquals(parseDuration('7 dias'), 7);
  assertEquals(parseDuration('30'), 30);
  assertEquals(parseDuration('15 dias'), null);
});
Deno.test('parse: Instagram links', () => {
  assertEquals(parseInstagramLink('https://www.instagram.com/p/C8abc_DEf12/?igsh=MWx'), { kind: 'post', shortcode: 'C8abc_DEf12' });
  assertEquals(parseInstagramLink('olha https://instagram.com/reel/DAbc123xyz/'), { kind: 'post', shortcode: 'DAbc123xyz' });
  assertEquals(parseInstagramLink('instagram.com/minhaloja/p/Cxyz12345/'), { kind: 'post', shortcode: 'Cxyz12345' });
  assertEquals(parseInstagramLink('https://www.instagram.com/stories/loja/123/'), { kind: 'story' });
  assertEquals(parseInstagramLink('https://example.com/p/abcde'), null);
});
Deno.test('dates: São Paulo day and end-of-day like the web wizard', () => {
  const now = new Date('2026-11-20T02:30:00Z'); // 23:30 on the 19th in São Paulo
  assertEquals(ymdSaoPaulo(now), '2026-11-19');
  assertEquals(endDateIso(now, 7), '2026-11-26T23:59:59-03:00');
  assertEquals(endDateIso(now, 0), null);
  assertEquals(buildCampaignName('Clínica Sorriso', 'Governador Valadares', now), 'Clínica Sorriso – Governador Valadares – 19/11 (WhatsApp)');
  assert(buildCampaignName('x'.repeat(200), 'y', now).length <= 100);
});
Deno.test('copy split: title on first line only when short', () => {
  assertEquals(splitUserCopy('Promoção\nTexto do anúncio'), { title: 'Promoção', text: 'Texto do anúncio' });
  assertEquals(splitUserCopy('Só um texto'), { title: null, text: 'Só um texto' });
  assertEquals(splitUserCopy('x'.repeat(50) + '\nresto').title, null);
});

// ---------------- AI copy ----------------
Deno.test('aiCopy: valid JSON accepted, forbidden claims / links / long text rejected', () => {
  assertEquals(validateAiCopy('{"title":"Sorriso novo","text":"Agende sua avaliação no WhatsApp."}'), { title: 'Sorriso novo', text: 'Agende sua avaliação no WhatsApp.' });
  assertEquals(validateAiCopy('Claro! {"title":"A","text":"B"} pronto'), { title: 'A', text: 'B' });
  assertEquals(validateAiCopy('{"title":"Resultado garantido","text":"x"}'), null);
  assertEquals(validateAiCopy('{"title":"A","text":"Sem risco nenhum"}'), null);
  assertEquals(validateAiCopy('{"title":"A","text":"veja https://x.com"}'), null);
  assertEquals(validateAiCopy('{"title":"A","text":"ligue 33 98413-5052"}'), null);
  assertEquals(validateAiCopy(`{"title":"A","text":"${'x'.repeat(301)}"}`), null);
  assertEquals(validateAiCopy('not json'), null);
});
Deno.test('aiCopy: template never empty and within limits', () => {
  const t = templateCopy({ businessName: null, place: '', mediaKind: 'image' });
  assert(t.title && t.text && t.title.length <= 40 && t.text.length <= 300);
  assertEquals(templateCopy({ businessName: 'Loja X', mainProduct: 'Móveis', place: 'Ipatinga', mediaKind: 'video' }).text.startsWith('Móveis em Ipatinga.'), true);
});

// ---------------- link code ----------------
Deno.test('link code: always 8 digits, varied', () => {
  const seen = new Set<string>();
  for (let i = 0; i < 2000; i++) { const c = newLinkCode(); assert(/^\d{8}$/.test(c)); seen.add(c); }
  assert(seen.size > 1990);
});

// ---------------- HTTP guards (no DB needed before the guard) ----------------
Deno.test('webhook: GET handshake only with the right verify token', async () => {
  Deno.env.set('WA_VERIFY_TOKEN', 'vt_123');
  const ok = await handleWebhook(new Request('https://x/wa-bot-webhook?hub.mode=subscribe&hub.verify_token=vt_123&hub.challenge=987'));
  assertEquals(ok.status, 200);
  assertEquals(await ok.text(), '987');
  const bad = await handleWebhook(new Request('https://x/wa-bot-webhook?hub.mode=subscribe&hub.verify_token=nope&hub.challenge=987'));
  assertEquals(bad.status, 403);
  await bad.body?.cancel();
});
Deno.test('webhook: POST with missing or bad signature → 401, nothing parsed', async () => {
  Deno.env.set('WA_APP_SECRET', 'app_secret_test');
  Deno.env.set('SUPABASE_URL', 'http://127.0.0.1:9');
  Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'service_key_test');
  const body = JSON.stringify(hook([{ id: 'w1', from: '5533', timestamp: '1', type: 'text', text: { body: 'oi' } }]));
  const r1 = await handleWebhook(new Request('https://x/wa-bot-webhook', { method: 'POST', body }));
  assertEquals(r1.status, 401); await r1.body?.cancel();
  const r2 = await handleWebhook(new Request('https://x/wa-bot-webhook', { method: 'POST', body, headers: { 'X-Hub-Signature-256': 'sha256=' + '0'.repeat(64) } }));
  assertEquals(r2.status, 401); await r2.body?.cancel();
});
Deno.test('worker: refuses calls without service role or cron secret', async () => {
  Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'service_key_test');
  Deno.env.set('CRON_SECRET', 'cron_test');
  const r = await handleWorker(new Request('https://x/wa-bot-worker', { method: 'POST', body: '{"mode":"sweep"}', headers: { Authorization: 'Bearer anon_key' } }));
  assertEquals(r.status, 401); await r.body?.cancel();
  const r2 = await handleWorker(new Request('https://x/wa-bot-worker', { method: 'POST', body: '{}', headers: { 'x-cron-secret': 'wrong' } }));
  assertEquals(r2.status, 401); await r2.body?.cancel();
});
Deno.test('link: refuses calls without a user JWT', async () => {
  const r = await handleLink(new Request('https://x/wa-bot-link', { method: 'POST', body: '{"action":"start"}' }));
  assert(r.status === 401 || r.status === 403, String(r.status));
  await r.body?.cancel();
});

// ---------------- bot texts ----------------
import { T } from '../_shared/waBot/messages.ts';
Deno.test('texts: no unrendered ${…} placeholders, no empty message', () => {
  // deno-lint-ignore no-explicit-any
  for (const [name, fn] of Object.entries(T) as Array<[string, (...a: any[]) => string]>) {
    const out = name === 'review'
      ? fn({ title: 'T', text: 'X', place: 'P', radius: 10, budget: 50, duration: 7, page: 'Pg', creative: 'Foto' })
      : name === 'budgetMax' ? fn(200)
      : name === 'created' ? fn('Camp', 50)
      : fn('x', 2);
    assert(typeof out === 'string' && out.trim().length > 0, name);
    assert(!out.includes('${'), `${name}: ${out}`);
  }
});
