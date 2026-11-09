// supabase/functions/user-account-delete/index.ts
// "Excluir minha conta" (LGPD art. 18 VI) — audit LGL-03.
// 1. exige a palavra de confirmação (DELETE_ACCOUNT_CONFIRMATION_WORD);
// 2. profiles.status = 'pending_deletion' + deletion_requested_at (login passa a ser bloqueado);
// 3. best-effort: pausa as campanhas ativas na Meta, revoga o token (DELETE /me/permissions),
//    limpa as colunas de token e marca as integrações como 'revoked';
// 4. avisa cada admin para cancelar a cobrança manualmente (nenhum provedor de pagamento é chamado aqui);
// 5. encerra as sessões do usuário. O hard delete ocorre após 30 dias (hard_delete_pending_accounts, pg_cron).
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { requireUser, authErrorResponse } from '../_shared/auth.ts';
import { corsHeadersFor, handlePreflight } from '../_shared/cors.ts';
import { pauseCascade } from '../_shared/metaCascade.ts';
import { isDeleteConfirmation, adminDeletionNotice } from '../_shared/dataSubject.ts';
import { GRAPH_BASE } from '../_shared/meta.ts'; // audit PLT-03
import { json as jsonResponse } from '../_shared/response.ts';
import { createLogger } from '../_shared/logger.ts';
import { toMessage } from '../_shared/errors.ts';

// audit PLT-06: logs estruturados + respostas via _shared/response.ts (corpo/status inalterados)
const log = createLogger('user-account-delete');

const GRACE_DAYS = 30;

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const cors = corsHeadersFor(origin);
  const json = (body: unknown, status = 200) => jsonResponse(origin, body, status);

  if (req.method === 'OPTIONS') {
    return handlePreflight(req);
  }

  try {
    const { user, db } = await requireUser(req);
    const input = await req.json().catch(() => ({}));

    if (!isDeleteConfirmation(input?.confirmation)) {
      return json({ success: false, error: 'confirmation_required', message: 'Digite a palavra de confirmação para excluir a conta.' }, 400);
    }

    const { data: profile } = await db
      .from('profiles')
      .select('status, deletion_requested_at')
      .eq('id', user.id)
      .maybeSingle();

    // idempotente: um segundo pedido não reinicia o prazo nem duplica avisos
    if (profile?.status === 'pending_deletion') {
      return json({ success: true, already_pending: true, deletion_requested_at: profile.deletion_requested_at });
    }

    const requestedAt = new Date();
    const { error: updErr } = await db
      .from('profiles')
      .update({ status: 'pending_deletion', deletion_requested_at: requestedAt.toISOString(), updated_at: requestedAt.toISOString() })
      .eq('id', user.id);
    if (updErr) throw new Error(`profile update failed: ${updErr.message}`);

    const report = { campaigns_pause_attempted: 0, meta_tokens_revoked: 0, integrations_revoked: 0, admins_notified: 0 };

    // --- Meta: pausar campanhas ativas + revogar token (best-effort) ---
    const { data: integrations } = await db
      .from('integrations')
      .select('id, provider, status, access_token')
      .eq('user_id', user.id);

    const metaTokens = [...new Set(
      (integrations ?? [])
        .filter((i: any) => (i.provider === 'meta_ads' || i.provider === 'meta') && i.access_token)
        .map((i: any) => String(i.access_token)),
    )];

    if (metaTokens.length) {
      const { data: activeCampaigns } = await db
        .from('campaigns')
        .select('id, meta_campaign_id, meta_adset_id, meta_ad_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .not('meta_campaign_id', 'is', null);

      for (const c of (activeCampaigns ?? []) as any[]) {
        try {
          // pauseCascade nunca lança; usa o token mais recente disponível
          await pauseCascade({ campaignId: c.meta_campaign_id, adsetId: c.meta_adset_id, adId: c.meta_ad_id }, metaTokens[0]);
          await db.from('campaigns')
            .update({ status: 'paused', status_at_sync: 'PAUSED', updated_at: new Date().toISOString() })
            .eq('id', c.id)
            .eq('user_id', user.id);
          report.campaigns_pause_attempted++;
        } catch (e) {
          log.warn('meta', 'pause failed', { campaign_id: c.id, error: toMessage(e) });
        }
      }

      for (const token of metaTokens) {
        try {
          const res = await fetch(`${GRAPH_BASE}/me/permissions?access_token=${encodeURIComponent(token)}`, { method: 'DELETE' });
          if (res.ok) report.meta_tokens_revoked++;
          else log.warn('meta', 'Meta revoke returned', { status: res.status });
        } catch (e) {
          log.warn('meta', 'Meta revoke failed', { error: toMessage(e) });
        }
      }
    }

    if ((integrations ?? []).length) {
      const { data: revoked, error: intErr } = await db
        .from('integrations')
        .update({ access_token: null, refresh_token: null, app_secret: null, status: 'revoked', updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .select('id');
      if (intErr) log.error('integrations', 'integrations update failed', { error: intErr.message });
      report.integrations_revoked = revoked?.length ?? 0;
    }

    // --- aviso aos admins (cancelamento da cobrança é manual) ---
    try {
      const { data: admins } = await db
        .from('user_roles')
        .select('user_id')
        .in('role', ['admin', 'super_admin']);
      const adminIds = [...new Set((admins ?? []).map((a: any) => a.user_id as string))];
      const hardDeleteAt = new Date(requestedAt.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000);
      const notice = adminDeletionNotice(user.email, user.id, hardDeleteAt);
      if (adminIds.length) {
        const { error: nErr } = await db.from('notifications').insert(
          adminIds.map((id) => ({ user_id: id, title: notice.title, message: notice.message, type: 'warning', read: false })),
        );
        if (nErr) log.error('notify', 'admin notification failed', { error: nErr.message });
        else report.admins_notified = adminIds.length;
      }
    } catch (e) {
      log.error('notify', 'admin notification failed', { error: toMessage(e) });
    }

    // --- encerra as sessões em todos os dispositivos (o cliente também faz signOut) ---
    try {
      const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
      await db.auth.admin.signOut(jwt, 'global');
    } catch (e) {
      log.warn('signout', 'global sign-out failed', { error: toMessage(e) });
    }

    log.info('handler', 'deletion requested', { user_id: user.id, ...report });
    return json({ success: true, deletion_requested_at: requestedAt.toISOString(), grace_days: GRACE_DAYS, ...report });
  } catch (e) {
    const authResp = authErrorResponse(e, cors);
    if (authResp) return authResp;
    log.error('handler', 'error', { error: toMessage(e) });
    return json({ success: false, error: 'Não foi possível solicitar a exclusão da conta. Tente novamente ou fale com o suporte.' }, 500);
  }
});
