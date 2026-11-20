// wa-bot-link — the Settings card's API (user JWT). Plan §5.5.
//   POST {action:'status'}  → { available, linked, phoneMasked, linkedAt, pending, botNumber }
//   POST {action:'start'}   → { code, waLink, expiresAt }  (8 digits, 10 min; only the hash is stored)
//   POST {action:'unlink'}  → { ok }
import { authErrorResponse, inactiveAccountReason, requireUser, serviceClient } from '../_shared/auth.ts';
import { corsHeadersFor, handlePreflight } from '../_shared/cors.ts';
import { sendMessage, sha256Hex, waConfig } from '../_shared/whatsapp.ts';
import { isUserAllowed } from '../_shared/waBot/flags.ts';
import { T } from '../_shared/waBot/messages.ts';

export const CODE_TTL_MS = 10 * 60_000;

/** Uniform 8-digit code (rejection sampling: no modulo bias). */
export function newLinkCode(): string {
  const buf = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buf);
    if (buf[0] < 4_200_000_000) return String(buf[0] % 100_000_000).padStart(8, '0');
  }
}

export async function handleLink(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return handlePreflight(req);
  const headers = { ...corsHeadersFor(req.headers.get('Origin')), 'Content-Type': 'application/json' };
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  let userId: string;
  try {
    const { user } = await requireUser(req);
    userId = user.id;
  } catch (e) {
    return authErrorResponse(e, headers) ?? json({ error: 'unauthorized' }, 401);
  }

  const db = serviceClient();
  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? 'status');
  const botNumber = (Deno.env.get('WA_BOT_NUMBER') ?? '').replace(/\D/g, '');
  const available = isUserAllowed(userId) && !!waConfig() && !!botNumber;

  const { data: rows } = await db.from('wa_bot_links')
    .select('id, status, wa_id, phone_masked, linked_at, code_expires_at')
    .eq('user_id', userId).in('status', ['pending', 'active']);
  const active = rows?.find((r) => r.status === 'active') ?? null;
  const pending = rows?.find((r) => r.status === 'pending' && r.code_expires_at && new Date(r.code_expires_at) > new Date()) ?? null;

  if (action === 'status') {
    return json({
      available,
      linked: !!active,
      phoneMasked: active?.phone_masked ?? null,
      linkedAt: active?.linked_at ?? null,
      pending: pending ? { expiresAt: pending.code_expires_at } : null,
      botNumber: available ? botNumber : null,
    });
  }

  if (action === 'start') {
    if (!available) return json({ error: 'not_available' }, 403);
    const inactive = await inactiveAccountReason(userId, db);
    if (inactive) return json({ error: inactive.code, message: inactive.message }, 403);
    if (active) return json({ error: 'already_linked', phoneMasked: active.phone_masked }, 409);

    const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();
    for (let attempt = 0; attempt < 3; attempt++) {
      const code = newLinkCode();
      const hash = await sha256Hex(code);
      // reuse the existing pending row (one open link per account), or create it
      const { error } = rows?.some((r) => r.status === 'pending')
        ? await db.from('wa_bot_links').update({ code_hash: hash, code_expires_at: expiresAt, updated_at: new Date().toISOString() })
          .eq('user_id', userId).eq('status', 'pending')
        : await db.from('wa_bot_links').insert({ user_id: userId, status: 'pending', code_hash: hash, code_expires_at: expiresAt });
      if (error?.code === '23505') continue; // hash collision with another pending code → new code
      if (error) return json({ error: 'internal' }, 500);
      const pretty = `${code.slice(0, 4)} ${code.slice(4)}`;
      return json({ code: pretty, expiresAt, waLink: `https://wa.me/${botNumber}?text=${encodeURIComponent(`VINCULAR ${pretty}`)}` });
    }
    return json({ error: 'internal' }, 500);
  }

  if (action === 'unlink') {
    await db.from('wa_bot_links').update({ status: 'revoked', code_hash: null, updated_at: new Date().toISOString() })
      .eq('user_id', userId).in('status', ['pending', 'active']);
    // Cancel anything queued from WhatsApp that hasn't started (runJob also re-checks the link).
    await db.from('wa_bot_jobs').update({ status: 'failed', result: { error: 'unlinked' }, finished_at: new Date().toISOString() })
      .eq('user_id', userId).eq('status', 'pending');
    if (active?.wa_id) {
      await db.from('wa_bot_sessions').update({ state: 'IDLE', draft: {}, user_id: null, updated_at: new Date().toISOString() }).eq('wa_id', active.wa_id);
      const cfg = waConfig();
      if (cfg) await sendMessage(cfg, active.wa_id, { kind: 'text', text: T.unlinked() }); // best effort (24 h window)
    }
    return json({ ok: true });
  }

  return json({ error: 'bad request' }, 400);
}

if (!Deno.env.get('WA_DISABLE_SERVE')) Deno.serve(handleLink);
