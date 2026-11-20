// wa-bot-webhook — public endpoint called only by Meta (WhatsApp Cloud API). Plan §5.3.
// GET: verification handshake. POST: verify X-Hub-Signature-256, store messages (deduped by wamid),
// answer 200 at once, then hand the work to wa-bot-worker. verify_jwt=false (Meta sends no JWT).
import { serviceClient, timingSafeEqual } from '../_shared/auth.ts';
import { maskPhone, parseWebhook, verifySignature } from '../_shared/whatsapp.ts';
import { botMode, kickWorker } from '../_shared/waBot/flags.ts';

let secretCache: { value: string; at: number } | null = null;

// deno-lint-ignore no-explicit-any
async function appSecret(db: any): Promise<string> {
  const override = Deno.env.get('WA_APP_SECRET');
  if (override) return override;
  if (secretCache && Date.now() - secretCache.at < 5 * 60_000) return secretCache.value;
  const { data, error } = await db.rpc('get_meta_ads_config');
  const value = !error && Array.isArray(data) && data[0]?.app_secret ? String(data[0].app_secret) : '';
  if (value) secretCache = { value, at: Date.now() };
  return value;
}

const text = (body: string, status: number) => new Response(body, { status, headers: { 'Content-Type': 'text/plain' } });

export async function handleWebhook(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (req.method === 'GET') {
    const verify = Deno.env.get('WA_VERIFY_TOKEN') ?? '';
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token') ?? '';
    const challenge = url.searchParams.get('hub.challenge') ?? '';
    if (mode === 'subscribe' && verify && timingSafeEqual(token, verify) && /^[A-Za-z0-9_-]{1,128}$/.test(challenge)) {
      return text(challenge, 200);
    }
    return text('forbidden', 403);
  }
  if (req.method !== 'POST') return text('method not allowed', 405);

  const raw = new Uint8Array(await req.arrayBuffer());
  const db = serviceClient();
  const secret = await appSecret(db);
  if (!secret) {
    console.error('[wa-bot-webhook] app secret unavailable');
    return text('unavailable', 503); // Meta retries later
  }
  if (!(await verifySignature(raw, req.headers.get('X-Hub-Signature-256'), secret))) {
    return text('invalid signature', 401);
  }

  // deno-lint-ignore no-explicit-any
  let body: any;
  try { body = JSON.parse(new TextDecoder().decode(raw)); } catch { return text('bad json', 400); }

  if (botMode() === 'off') return text('ok', 200); // accepted, intentionally ignored

  const parsed = parseWebhook(body);
  const ownNumber = Deno.env.get('WA_PHONE_NUMBER_ID');
  const messages = parsed.messages.filter((m) => !ownNumber || !m.phoneNumberId || m.phoneNumberId === ownNumber);

  if (messages.length) {
    const rows = messages.map((m) => ({
      wamid: m.wamid, direction: 'in', wa_id: m.waId, msg_type: m.type, wa_timestamp: m.timestamp.toISOString(),
      body: {
        rawType: m.rawType,
        ...(m.text != null ? { text: m.text.slice(0, 4096) } : {}),
        ...(m.replyId ? { replyId: m.replyId, replyTitle: m.replyTitle } : {}),
        ...(m.location ? { location: m.location } : {}),
        ...(m.media ? { media: m.media } : {}),
        ...(m.profileName ? { profileName: m.profileName.slice(0, 80) } : {}),
      },
    }));
    const { error } = await db.from('wa_bot_messages').upsert(rows, { onConflict: 'wamid', ignoreDuplicates: true });
    if (error) {
      console.error('[wa-bot-webhook] store failed', { error: error.message });
      return text('store failed', 500); // Meta retries; wamid dedupe makes that safe
    }
  }
  for (const s of parsed.statuses) {
    await db.from('wa_bot_messages').update({ status: s.status, ...(s.errorTitle ? { error: s.errorTitle.slice(0, 300) } : {}) })
      .eq('wamid', s.wamid).eq('direction', 'out');
  }

  for (const waId of new Set(messages.map((m) => m.waId))) {
    kickWorker({ mode: 'conversation', wa_id: waId });
  }
  if (messages.length) console.log('[wa-bot-webhook] stored', { count: messages.length, from: [...new Set(messages.map((m) => maskPhone(m.waId)))] });
  return text('ok', 200);
}

if (!Deno.env.get('WA_DISABLE_SERVE')) Deno.serve(handleWebhook);
