// Feature flag + worker kick for the WhatsApp bot. Kept tiny so wa-bot-webhook / wa-bot-link stay light.

// ------------------------------------------------------------------------------------------------
// Feature flag
// ------------------------------------------------------------------------------------------------
export type BotMode = 'off' | 'beta' | 'on';
export function botMode(): BotMode {
  const m = (Deno.env.get('WA_BOT_MODE') ?? 'off').toLowerCase();
  return m === 'on' || m === 'beta' ? m : 'off';
}
export function isUserAllowed(userId: string): boolean {
  const mode = botMode();
  if (mode === 'on') return true;
  if (mode === 'off') return false;
  const list = (Deno.env.get('WA_BOT_BETA_USER_IDS') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  return list.includes(userId);
}

// ------------------------------------------------------------------------------------------------
// Kick another worker run (fresh time budget). Fire-and-forget; the cron sweep is the safety net.
// ------------------------------------------------------------------------------------------------
export function kickWorker(body: Record<string, unknown>) {
  const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/wa-bot-worker`;
  const p = fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => r.body?.cancel()).catch((e) => console.warn('[wa-bot] kick failed', String(e)));
  // deno-lint-ignore no-explicit-any
  const rt = (globalThis as any).EdgeRuntime;
  if (rt?.waitUntil) rt.waitUntil(p);
}

