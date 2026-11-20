// WhatsApp Cloud API helpers for the campaign bot (docs/whatsapp-campaign-bot-plan.md §5.2).
// Pure parts (signature, webhook parsing, payload building, masking) are unit-tested in
// _tests/whatsapp.test.ts. Network parts take the token as an argument and never log it.
import { GRAPH_BASE } from './meta.ts';
import { timingSafeEqual } from './auth.ts';

export interface WaConfig {
  token: string;
  phoneNumberId: string;
}

/** Bot config from Supabase secrets; null when the bot isn't configured yet. */
export function waConfig(): WaConfig | null {
  const token = Deno.env.get('WA_ACCESS_TOKEN') ?? '';
  const phoneNumberId = Deno.env.get('WA_PHONE_NUMBER_ID') ?? '';
  return token && phoneNumberId ? { token, phoneNumberId } : null;
}

// ---------------------------------------------------------------------------------------------
// Signature (X-Hub-Signature-256 = "sha256=" + hex(HMAC_SHA256(appSecret, rawBody)))
// ---------------------------------------------------------------------------------------------
export async function hmacSha256Hex(secret: string, data: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, new Uint8Array(data)));
  return [...sig].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifySignature(rawBody: Uint8Array, header: string | null, appSecret: string): Promise<boolean> {
  if (!header || !appSecret || !header.startsWith('sha256=')) return false;
  const expected = await hmacSha256Hex(appSecret, rawBody);
  return timingSafeEqual(header.slice(7).toLowerCase(), expected);
}

export async function sha256Hex(text: string): Promise<string> {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
  return [...d].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------------------------------------
// Inbound webhook parsing
// ---------------------------------------------------------------------------------------------
export type InboundType = 'text' | 'button' | 'list' | 'location' | 'image' | 'video' | 'document' | 'other';

export interface InboundMessage {
  wamid: string;
  waId: string;
  timestamp: Date;
  type: InboundType;
  rawType: string;
  profileName?: string;
  text?: string;          // text body (also the caption of media)
  replyId?: string;       // button / list reply id
  replyTitle?: string;
  location?: { latitude: number; longitude: number; name?: string; address?: string };
  media?: { id: string; mimeType: string; filename?: string; sha256?: string };
  phoneNumberId?: string; // which business number received it
}

export interface StatusUpdate {
  wamid: string;
  status: string;          // sent | delivered | read | failed
  recipientId?: string;
  errorTitle?: string;
}

export interface ParsedWebhook {
  messages: InboundMessage[];
  statuses: StatusUpdate[];
}

// deno-lint-ignore no-explicit-any
export function parseWebhook(body: any): ParsedWebhook {
  const out: ParsedWebhook = { messages: [], statuses: [] };
  if (!body || body.object !== 'whatsapp_business_account' || !Array.isArray(body.entry)) return out;
  for (const entry of body.entry) {
    for (const change of entry?.changes ?? []) {
      if (change?.field !== 'messages') continue;
      const value = change.value ?? {};
      const phoneNumberId = value.metadata?.phone_number_id ? String(value.metadata.phone_number_id) : undefined;
      const names = new Map<string, string>();
      for (const c of value.contacts ?? []) if (c?.wa_id) names.set(String(c.wa_id), String(c.profile?.name ?? ''));
      for (const m of value.messages ?? []) {
        if (!m?.id || !m?.from) continue;
        const msg: InboundMessage = {
          wamid: String(m.id),
          waId: String(m.from).replace(/\D/g, ''),
          timestamp: new Date(Number(m.timestamp ?? 0) * 1000 || Date.now()),
          type: 'other',
          rawType: String(m.type ?? 'unknown'),
          profileName: names.get(String(m.from)) || undefined,
          phoneNumberId,
        };
        switch (m.type) {
          case 'text':
            msg.type = 'text'; msg.text = String(m.text?.body ?? '');
            break;
          case 'button': // reply to a template quick-reply button
            msg.type = 'button'; msg.replyId = String(m.button?.payload ?? ''); msg.replyTitle = String(m.button?.text ?? '');
            break;
          case 'interactive':
            if (m.interactive?.type === 'button_reply') {
              msg.type = 'button'; msg.replyId = String(m.interactive.button_reply?.id ?? ''); msg.replyTitle = String(m.interactive.button_reply?.title ?? '');
            } else if (m.interactive?.type === 'list_reply') {
              msg.type = 'list'; msg.replyId = String(m.interactive.list_reply?.id ?? ''); msg.replyTitle = String(m.interactive.list_reply?.title ?? '');
            }
            break;
          case 'location': {
            const lat = Number(m.location?.latitude), lng = Number(m.location?.longitude);
            if (Number.isFinite(lat) && Number.isFinite(lng)) {
              msg.type = 'location';
              msg.location = { latitude: lat, longitude: lng, name: m.location?.name, address: m.location?.address };
            }
            break;
          }
          case 'image': case 'video': case 'document': {
            const media = m[m.type];
            if (media?.id) {
              msg.type = m.type;
              msg.media = { id: String(media.id), mimeType: String(media.mime_type ?? ''), filename: media.filename, sha256: media.sha256 };
              if (media.caption) msg.text = String(media.caption);
            }
            break;
          }
        }
        out.messages.push(msg);
      }
      for (const s of value.statuses ?? []) {
        if (!s?.id) continue;
        out.statuses.push({ wamid: String(s.id), status: String(s.status ?? ''), recipientId: s.recipient_id, errorTitle: s.errors?.[0]?.title });
      }
    }
  }
  return out;
}

/** "+55 •• •••• 1234" — never log or show a full number. */
export function maskPhone(waId: string | null | undefined): string {
  const d = String(waId ?? '').replace(/\D/g, '');
  if (d.length < 4) return '••••';
  const cc = d.length >= 12 ? `+${d.slice(0, 2)} ` : '';
  return `${cc}•• •••• ${d.slice(-4)}`;
}

// ---------------------------------------------------------------------------------------------
// Outbound payloads (Cloud API limits enforced here so callers can't produce a rejected message)
// ---------------------------------------------------------------------------------------------
export interface Choice { id: string; title: string; description?: string }

export type OutMessage =
  | { kind: 'text'; text: string }
  | { kind: 'buttons'; text: string; buttons: Choice[]; imageUrl?: string; footer?: string }
  | { kind: 'list'; text: string; button: string; rows: Choice[]; sectionTitle?: string }
  | { kind: 'location_request'; text: string }
  | { kind: 'image'; url: string; caption?: string };

const clip = (s: string, n: number) => {
  const t = String(s ?? '').trim();
  return t.length <= n ? t : t.slice(0, Math.max(0, n - 1)).trimEnd() + '…';
};

export const LIMITS = {
  text: 4096, interactiveBody: 1024, buttonTitle: 20, maxButtons: 3, listButton: 20,
  rowTitle: 24, rowDescription: 72, maxRows: 10, footer: 60, caption: 1024, id: 256,
} as const;

// deno-lint-ignore no-explicit-any
export function buildPayload(to: string, msg: OutMessage): Record<string, any> {
  const base = { messaging_product: 'whatsapp', recipient_type: 'individual', to };
  switch (msg.kind) {
    case 'text':
      return { ...base, type: 'text', text: { preview_url: false, body: clip(msg.text, LIMITS.text) } };
    case 'buttons': {
      if (!msg.buttons.length) throw new Error('buttons: at least one button');
      return {
        ...base, type: 'interactive',
        interactive: {
          type: 'button',
          ...(msg.imageUrl ? { header: { type: 'image', image: { link: msg.imageUrl } } } : {}),
          body: { text: clip(msg.text, LIMITS.interactiveBody) },
          ...(msg.footer ? { footer: { text: clip(msg.footer, LIMITS.footer) } } : {}),
          action: {
            buttons: msg.buttons.slice(0, LIMITS.maxButtons).map((b) => ({
              type: 'reply', reply: { id: clip(b.id, LIMITS.id), title: clip(b.title, LIMITS.buttonTitle) },
            })),
          },
        },
      };
    }
    case 'list': {
      if (!msg.rows.length) throw new Error('list: at least one row');
      return {
        ...base, type: 'interactive',
        interactive: {
          type: 'list',
          body: { text: clip(msg.text, LIMITS.interactiveBody) },
          action: {
            button: clip(msg.button, LIMITS.listButton),
            sections: [{
              title: clip(msg.sectionTitle ?? 'Opções', LIMITS.rowTitle),
              rows: msg.rows.slice(0, LIMITS.maxRows).map((r) => ({
                id: clip(r.id, LIMITS.id), title: clip(r.title, LIMITS.rowTitle),
                ...(r.description ? { description: clip(r.description, LIMITS.rowDescription) } : {}),
              })),
            }],
          },
        },
      };
    }
    case 'location_request':
      return {
        ...base, type: 'interactive',
        interactive: { type: 'location_request_message', body: { text: clip(msg.text, LIMITS.interactiveBody) }, action: { name: 'send_location' } },
      };
    case 'image':
      return { ...base, type: 'image', image: { link: msg.url, ...(msg.caption ? { caption: clip(msg.caption, LIMITS.caption) } : {}) } };
  }
}

// ---------------------------------------------------------------------------------------------
// Network
// ---------------------------------------------------------------------------------------------
export interface SendResult { ok: boolean; wamid?: string; status?: number; error?: string; code?: number }

export async function sendMessage(cfg: WaConfig, to: string, msg: OutMessage): Promise<SendResult> {
  const payload = buildPayload(to, msg);
  // One retry on 429/5xx only. A message that may already have been accepted is never re-sent
  // after a network error (avoid duplicate bot replies).
  for (let attempt = 0; attempt < 2; attempt++) {
    let res: Response;
    try {
      res = await fetch(`${GRAPH_BASE}/${cfg.phoneNumberId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15_000),
      });
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
    const body = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true, wamid: body?.messages?.[0]?.id, status: res.status };
    if ((res.status === 429 || res.status >= 500) && attempt === 0) {
      await new Promise((r) => setTimeout(r, 800));
      continue;
    }
    return { ok: false, status: res.status, error: body?.error?.message ?? `HTTP ${res.status}`, code: body?.error?.code };
  }
  return { ok: false, error: 'unreachable' };
}

/** Marks the message read and (optionally) shows "digitando…" for up to ~25 s. Best effort. */
export async function markRead(cfg: WaConfig, wamid: string, typing = false): Promise<void> {
  try {
    await fetch(`${GRAPH_BASE}/${cfg.phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp', status: 'read', message_id: wamid,
        ...(typing ? { typing_indicator: { type: 'text' } } : {}),
      }),
      signal: AbortSignal.timeout(8_000),
    });
  } catch { /* best effort */ }
}

export interface MediaInfo { url: string; mimeType: string; fileSize: number }

export async function getMediaInfo(cfg: WaConfig, mediaId: string): Promise<MediaInfo> {
  const res = await fetch(`${GRAPH_BASE}/${encodeURIComponent(mediaId)}`, {
    headers: { Authorization: `Bearer ${cfg.token}` },
    signal: AbortSignal.timeout(10_000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.url) throw new Error(`media info ${res.status}: ${body?.error?.message ?? 'no url'}`);
  return { url: String(body.url), mimeType: String(body.mime_type ?? ''), fileSize: Number(body.file_size ?? 0) };
}

/** Downloads the media bytes (URL is short-lived and needs the bot token). Enforces maxBytes. */
export async function downloadMedia(cfg: WaConfig, url: string, maxBytes: number): Promise<Uint8Array> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${cfg.token}` }, signal: AbortSignal.timeout(60_000) });
  if (!res.ok || !res.body) throw new Error(`media download ${res.status}`);
  const chunks: Uint8Array[] = [];
  let total = 0;
  const reader = res.body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) { await reader.cancel(); throw new Error('media too large'); }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.byteLength; }
  return out;
}

/** Detects image/video by magic bytes (don't trust the declared MIME of a "document"). */
export function sniffMediaKind(bytes: Uint8Array): { kind: 'image' | 'video'; mime: string; ext: string } | null {
  const b = bytes;
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { kind: 'image', mime: 'image/jpeg', ext: 'jpg' };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { kind: 'image', mime: 'image/png', ext: 'png' };
  // ISO BMFF: "....ftyp" at offset 4 (mp4 / mov / 3gp)
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) {
    const brand = String.fromCharCode(b[8], b[9], b[10], b[11]);
    if (brand.startsWith('3g')) return { kind: 'video', mime: 'video/3gpp', ext: '3gp' };
    if (brand === 'qt  ') return { kind: 'video', mime: 'video/quicktime', ext: 'mov' };
    if (brand.startsWith('hei') || brand.startsWith('mif1') || brand === 'avif') return null; // HEIC/AVIF: not accepted by Meta ads
    return { kind: 'video', mime: 'video/mp4', ext: 'mp4' };
  }
  return null;
}
