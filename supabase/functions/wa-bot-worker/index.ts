// wa-bot-worker — internal only (service role or cron secret). Plan §5.4.
//   {mode:'conversation', wa_id}  process that number's pending messages in order
//   {mode:'job', id}              run one create/activate job (fresh time budget)
//   {mode:'sweep'}                cron safety net + retention
import { HttpError, requireCron, serviceClient } from '../_shared/auth.ts';
import { waConfig } from '../_shared/whatsapp.ts';
import { processNumber, runJob, sweep } from '../_shared/waBot/runtime.ts';
import { botMode } from '../_shared/waBot/flags.ts';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export async function handleWorker(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);
  try {
    requireCron(req); // x-cron-secret or service role
  } catch (e) {
    if (e instanceof HttpError) return json({ error: 'forbidden' }, 401);
    throw e;
  }
  const cfg = waConfig();
  if (!cfg || botMode() === 'off') return json({ skipped: true, reason: !cfg ? 'not_configured' : 'off' });

  const body = await req.json().catch(() => ({}));
  const db = serviceClient();
  try {
    if (body.mode === 'conversation' && /^\d{8,15}$/.test(String(body.wa_id ?? ''))) {
      await processNumber(db, cfg, String(body.wa_id));
      return json({ ok: true });
    }
    if (body.mode === 'job' && /^[0-9a-f-]{36}$/i.test(String(body.id ?? ''))) {
      await runJob(db, cfg, String(body.id));
      return json({ ok: true });
    }
    if (body.mode === 'sweep' || !body.mode) {
      return json({ ok: true, ...(await sweep(db, cfg)) });
    }
    return json({ error: 'bad request' }, 400);
  } catch (e) {
    console.error('[wa-bot-worker] failed', { mode: body.mode, error: e instanceof Error ? e.message : String(e) });
    return json({ error: 'internal' }, 500);
  }
}

if (!Deno.env.get('WA_DISABLE_SERVE')) Deno.serve(handleWorker);
