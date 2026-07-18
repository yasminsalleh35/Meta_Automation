// Updates a campaign's DAILY BUDGET.
// The budget lives on the Meta AD SET (campaigns here don't use CBO), so we PATCH the ad set's
// daily_budget on Graph and mirror the new value into campaigns.budget_daily.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeadersFor, handlePreflight } from '../_shared/cors.ts';
import { resolveMetaIntegration } from '../_shared/metaIntegration.ts';

const META_API_VERSION = 'v23.0';
// App-level guardrails (BRL). Mirrors src/services/metaAds/utils/budgetUtils.ts.
const MIN_DAILY_BRL = 20;
const MAX_DAILY_BRL = 50000;

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const cors = corsHeadersFor(origin);
  if (req.method === 'OPTIONS') return handlePreflight(req);

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Auth
    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return json({ success: false, error: 'Unauthorized' }, 401);

    const { campaignId, dailyBudget } = await req.json();

    if (!campaignId) return json({ success: false, error: 'campaignId é obrigatório' }, 400);

    // Validate budget
    const value = Number(dailyBudget);
    if (!Number.isFinite(value) || value <= 0) {
      return json({ success: false, error: 'Orçamento deve ser um valor positivo' }, 400);
    }
    if (value < MIN_DAILY_BRL) {
      return json({ success: false, error: `Orçamento mínimo é R$ ${MIN_DAILY_BRL}/dia` }, 400);
    }
    if (value > MAX_DAILY_BRL) {
      return json({ success: false, error: `Orçamento máximo é R$ ${MAX_DAILY_BRL}/dia` }, 400);
    }

    // Load the campaign (scoped to the user) — need the ad set id, since budget is on the ad set.
    const { data: campaign, error: cErr } = await supabase
      .from('campaigns')
      .select('id, user_id, meta_adset_id, meta_campaign_id, budget_daily')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (cErr || !campaign) return json({ success: false, error: 'Campanha não encontrada' }, 404);

    const integration = await resolveMetaIntegration(user.id);
    if (!integration?.access_token) {
      return json({ success: false, error: 'Integração Meta não encontrada ou inativa' }, 400);
    }
    const accessToken = integration.access_token;

    // Resolve the ad set id. Camply-created campaigns store it; campaigns imported from Ads Manager
    // may not, so we resolve it from Meta (the campaign's single ad set) and backfill it.
    let adSetId: string | null = campaign.meta_adset_id ?? null;
    if (!adSetId && campaign.meta_campaign_id) {
      try {
        const r = await fetch(
          `https://graph.facebook.com/${META_API_VERSION}/${campaign.meta_campaign_id}/adsets?fields=id&limit=2`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (r.ok) {
          const list = (await r.json())?.data || [];
          if (list.length === 1) {
            adSetId = String(list[0].id);
            await supabase.from('campaigns').update({ meta_adset_id: adSetId }).eq('id', campaign.id).eq('user_id', user.id);
          } else if (list.length > 1) {
            return json({ success: false, error: 'Esta campanha tem mais de um conjunto de anúncios; ajuste o orçamento pelo Ads Manager.' }, 400);
          }
        }
      } catch { /* fall through to the not-found error below */ }
    }
    if (!adSetId) {
      return json({ success: false, error: 'Não foi possível localizar o conjunto de anúncios desta campanha.' }, 400);
    }

    const cents = Math.round(value * 100);

    // PATCH the ad set's daily_budget on Meta (Graph accepts POST for updates).
    const res = await fetch(`https://graph.facebook.com/${META_API_VERSION}/${adSetId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ daily_budget: cents, access_token: accessToken }),
    });
    const metaBody = await res.json().catch(() => null);

    if (!res.ok) {
      const msg = metaBody?.error?.error_user_msg || metaBody?.error?.message || 'Falha ao atualizar o orçamento na Meta';
      console.error('[update-campaign-budget] Meta error', {
        adSetId,
        status: res.status,
        code: metaBody?.error?.code,
        subcode: metaBody?.error?.error_subcode,
        fbtrace_id: metaBody?.error?.fbtrace_id,
      });
      return json({ success: false, error: msg }, 400);
    }

    // Mirror the new value locally.
    const { error: uErr } = await supabase
      .from('campaigns')
      .update({ budget_daily: value, updated_at: new Date().toISOString() })
      .eq('id', campaign.id)
      .eq('user_id', user.id);

    if (uErr) {
      // Meta already accepted the change — surface a soft warning but treat as success.
      console.warn('[update-campaign-budget] DB mirror failed (Meta updated OK)', uErr.message);
    }

    return json({ success: true, campaignId: campaign.id, budget_daily: value });
  } catch (e) {
    console.error('[update-campaign-budget] Unexpected error', e);
    return json({ success: false, error: e instanceof Error ? e.message : 'Erro inesperado' }, 500);
  }
});
