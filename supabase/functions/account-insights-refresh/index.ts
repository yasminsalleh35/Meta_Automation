/**
 * Edge Function: account-insights-refresh
 * 
 * Busca insights da conta inteira na Meta para os períodos:
 * - today
 * - last_7d
 * - last_30d
 * 
 * Agrega e salva no cache (account_insights_cache).
 * Deve ser executado a cada hora via cron.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

type Period = 'today' | 'last_7d' | 'last_30d';

const GRAPH_VERSION = 'v21.0';
const BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function normalizeActId(id: string): string {
  if (!id) return id;
  return id.startsWith('act_') ? id : `act_${id.replace(/^act_/, '')}`;
}

async function fetchAccountInsights(params: {
  actId: string;
  accessToken: string;
  period: Period;
}) {
  const { actId, accessToken, period } = params;

  // Campos mínimos para cards do dashboard
  const fields = [
    'impressions', 'reach', 'clicks', 'spend', 'actions'
  ].join(',');

  // Parâmetros para bater com o Ads Manager (atribuição 7d clique, 1d view)
  const baseParams = new URLSearchParams({
    access_token: accessToken,
    date_preset: period,
    time_increment: 'all_days',
    level: 'account',
    fields,
    action_attribution_windows: '7d_click,1d_view',
    use_unified_attribution_setting: 'true',
    limit: '5000'
  });

  let url = `${BASE}/${actId}/insights?${baseParams.toString()}`;

  // Agregar todas as páginas
  let totalImpressions = 0;
  let totalReach = 0;
  let totalClicks = 0;
  let totalSpend = 0;
  let allActions: any[] = [];

  for (;;) {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Graph API ${res.status}: ${txt || 'unknown error'}`);
    }
    const json = await res.json();

    const rows: any[] = Array.isArray(json?.data) ? json.data : [];
    for (const r of rows) {
      // Strings → números
      totalImpressions += Number(r.impressions ?? 0);
      totalReach += Number(r.reach ?? 0);
      totalClicks += Number(r.clicks ?? 0);
      totalSpend += Number(r.spend ?? 0);

      if (Array.isArray(r.actions)) {
        allActions = allActions.concat(r.actions);
      }
    }

    const next = json?.paging?.next;
    if (!next) break;
    url = next;
  }

  // CPA: derive conversas iniciadas
  const CONVERSATION_TYPES = new Set<string>([
    'onsite_conversion.messaging_conversation_started_7d',
    'onsite_conversion.messaging_conversation_started_1d',
    'onsite_conversion.messaging_first_reply',
    'start_messaging'
  ]);

  let conversations = 0;
  for (const a of allActions) {
    const t = String(a.action_type || '');
    if (CONVERSATION_TYPES.has(t)) {
      conversations += Number(a.value ?? 0);
    }
  }

  return {
    impressions: totalImpressions,
    reach: totalReach,
    clicks: totalClicks,
    spend: Number(totalSpend.toFixed(2)),
    conversations,
    actions: allActions
  };
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'unauthorized', message: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'unauthorized', message: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log(`[Refresh] Starting for user ${userId}`);

    // Get Meta integration
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('ad_account_id, access_token')
      .eq('provider', 'meta_ads')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (integrationError || !integration) {
      console.error('[Refresh] No Meta integration found');
      return new Response(
        JSON.stringify({ error: 'no_integration', message: 'Meta Ads integration not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { ad_account_id, access_token } = integration;
    const actId = normalizeActId(ad_account_id);
    const periods: Period[] = ['today', 'last_7d', 'last_30d'];
    const summaries: any[] = [];

    // Fetch and cache each period
    for (const p of periods) {
      let data;
      try {
        console.log(`[Refresh] Fetching ${p} for account ${actId}`);
        data = await fetchAccountInsights({ actId, accessToken: access_token, period: p });
      } catch (e: any) {
        console.error('[account-insights-refresh] fetch error', { 
          period: p, 
          message: e?.message ?? String(e) 
        });
        summaries.push({ period: p, error: e?.message ?? 'fetch_failed' });
        // Não sobrescrever com zeros; prossiga com próximo período
        continue;
      }

      const hasAny = (data.impressions + data.reach + data.clicks + data.spend) > 0;

      // Se totalmente zerado, gravar zeros no cache (Meta retornou vazio válido)
      if (!hasAny && data.impressions === 0) {
        console.warn(`[account-insights-refresh] dados zerados para ${p}; gravando zeros`);
      }

      const { error: upsertError } = await supabase
        .from('account_insights_cache')
        .upsert({
          user_id: userId,
          ad_account_id: actId,
          date_preset: p,
          impressions: data.impressions,
          reach: data.reach,
          clicks: data.clicks,
          spend: data.spend,
          actions: data.actions,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: ['user_id', 'ad_account_id', 'date_preset'],
          ignoreDuplicates: false
        });

      if (upsertError) {
        console.error(`[Refresh] Upsert error for ${p}:`, upsertError);
        summaries.push({ period: p, error: 'upsert_failed' });
        continue;
      }

      summaries.push({ 
        period: p, 
        impressions: data.impressions,
        reach: data.reach,
        clicks: data.clicks,
        spend: data.spend,
        conversations: data.conversations,
        ok: true 
      });
      console.log(`[Refresh] Cached ${p}:`, {
        impressions: data.impressions,
        reach: data.reach,
        clicks: data.clicks,
        spend: data.spend,
        conversations: data.conversations
      });

      // Rate limiting - wait 350ms between calls
      await new Promise((resolve) => setTimeout(resolve, 350));
    }

    return new Response(
      JSON.stringify({
        ok: true,
        userId,
        adAccountId: actId,
        summaries,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('[account-insights-refresh] ERROR', {
      message: error?.message ?? String(error),
      stack: error?.stack ?? null
    });
    return new Response(
      JSON.stringify({ ok: false, error: error?.message ?? 'unknown' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
