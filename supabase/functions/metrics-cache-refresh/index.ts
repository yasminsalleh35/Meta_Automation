// =============================================
// Edge Function: Metrics Cache Refresh
// Phase 6.1: Background refresh of campaign metrics
// Phase 6.3: Per-user Meta API rate limit tracking
//
// Modes:
//   - "refresh_user" — refresh all active campaigns for a user
//   - "refresh_all"  — refresh stale caches across all users (cron)
//   - "check_alerts" — detect anomalies and generate alerts
// =============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const log = (step: string, details?: any) => {
  console.log(`[metrics-cache-refresh] ${step}`, details ? JSON.stringify(details) : '');
};

const META_API_VERSION = 'v23.0';
const CACHE_TTL_ACTIVE_MIN = 15;   // 15 min for active campaigns
const CACHE_TTL_PAUSED_MIN = 60;   // 1 hour for paused campaigns
const MAX_CAMPAIGNS_PER_RUN = 20;  // Rate limit safety
const MAX_API_CALLS_PER_HOUR = 180; // Stay below Meta's 200/hour

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json().catch(() => ({}));
    const mode = body.mode || 'refresh_user';

    let result: any = {};

    switch (mode) {
      case 'refresh_user':
        if (!body.user_id) {
          return json(400, { error: 'user_id required' });
        }
        result = await refreshUserMetrics(supabase, body.user_id, body.date_preset || 'last_7d');
        break;

      case 'refresh_all':
        result = await refreshAllStaleMetrics(supabase);
        break;

      case 'check_alerts':
        result = await checkPerformanceAlerts(supabase);
        break;

      default:
        return json(400, { error: `Unknown mode: ${mode}` });
    }

    return json(200, { success: true, ...result });

  } catch (error: any) {
    log('ERROR', { message: error.message });
    return json(500, { error: error.message });
  }
});

function json(status: number, data: any) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ── Rate limit tracking helper ──────────────────────────────────────────────

async function trackApiCall(supabase: any, userId: string, endpoint: string) {
  const now = new Date();
  const hourBucket = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()).toISOString();

  // Upsert: increment call_count for this hour bucket
  const { data: existing } = await supabase
    .from('meta_api_usage')
    .select('call_count, endpoints')
    .eq('user_id', userId)
    .eq('hour_bucket', hourBucket)
    .maybeSingle();

  if (existing) {
    const endpoints = existing.endpoints || {};
    endpoints[endpoint] = (endpoints[endpoint] || 0) + 1;

    await supabase
      .from('meta_api_usage')
      .update({
        call_count: existing.call_count + 1,
        endpoints,
        updated_at: now.toISOString(),
      })
      .eq('user_id', userId)
      .eq('hour_bucket', hourBucket);
  } else {
    await supabase
      .from('meta_api_usage')
      .insert({
        user_id: userId,
        hour_bucket: hourBucket,
        call_count: 1,
        endpoints: { [endpoint]: 1 },
      });
  }
}

async function getUserApiCallsThisHour(supabase: any, userId: string): Promise<number> {
  const now = new Date();
  const hourBucket = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()).toISOString();

  const { data } = await supabase
    .from('meta_api_usage')
    .select('call_count')
    .eq('user_id', userId)
    .eq('hour_bucket', hourBucket)
    .maybeSingle();

  return data?.call_count || 0;
}

// ── refresh_user: Fetch metrics for all active campaigns of a user ──────────

async function refreshUserMetrics(supabase: any, userId: string, datePreset: string) {
  // Check rate limit
  const currentCalls = await getUserApiCallsThisHour(supabase, userId);
  if (currentCalls >= MAX_API_CALLS_PER_HOUR) {
    log('Rate limit reached', { userId, currentCalls });
    return { refreshed: 0, rate_limited: true, calls_this_hour: currentCalls };
  }

  // Get user's Meta integration (try 'meta_ads' first, then 'meta')
  let { data: integration } = await supabase
    .from('integrations')
    .select('access_token, ad_account_id')
    .eq('user_id', userId)
    .eq('provider', 'meta_ads')
    .maybeSingle();

  if (!integration?.access_token || !integration?.ad_account_id) {
    const { data: metaInt } = await supabase
      .from('integrations')
      .select('access_token, ad_account_id')
      .eq('user_id', userId)
      .eq('provider', 'meta')
      .maybeSingle();

    if (!metaInt?.access_token || !metaInt?.ad_account_id) {
      return { refreshed: 0, error: 'No Meta integration found' };
    }

    integration = metaInt;
  }

  const accessToken = integration.access_token;
  const adAccountId = integration.ad_account_id;
  const actId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;

  // Get active campaigns that need refresh
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, meta_campaign_id, status, name')
    .eq('user_id', userId)
    .not('meta_campaign_id', 'is', null)
    .limit(MAX_CAMPAIGNS_PER_RUN);

  if (!campaigns?.length) {
    return { refreshed: 0, message: 'No campaigns with Meta IDs' };
  }

  // Filter out campaigns whose cache is still fresh
  const now = new Date();
  const campaignsToRefresh: typeof campaigns = [];

  for (const c of campaigns) {
    const { data: cached } = await supabase
      .from('campaign_metrics_cache')
      .select('expires_at')
      .eq('campaign_id', c.meta_campaign_id)
      .eq('date_preset', datePreset)
      .maybeSingle();

    if (!cached || new Date(cached.expires_at) < now) {
      campaignsToRefresh.push(c);
    }
  }

  if (campaignsToRefresh.length === 0) {
    return { refreshed: 0, message: 'All caches are fresh' };
  }

  // Check we won't exceed rate limit
  const remainingBudget = MAX_API_CALLS_PER_HOUR - currentCalls;
  const toProcess = campaignsToRefresh.slice(0, Math.min(campaignsToRefresh.length, remainingBudget));

  log(`Refreshing ${toProcess.length} campaigns`, { userId, datePreset });

  let refreshed = 0;
  let errors = 0;

  for (const campaign of toProcess) {
    try {
      const metaCampaignId = campaign.meta_campaign_id;

      const url = `https://graph.facebook.com/${META_API_VERSION}/${metaCampaignId}/insights?` +
        `fields=impressions,reach,clicks,spend,actions,ctr,cpc,cpm,frequency,cost_per_action_type` +
        `&date_preset=${datePreset}` +
        `&access_token=${accessToken}`;

      const response = await fetch(url);
      await trackApiCall(supabase, userId, `campaign_insights:${datePreset}`);

      if (!response.ok) {
        const errBody = await response.text();
        log('Meta API error', { campaign: metaCampaignId, status: response.status, body: errBody.substring(0, 200) });
        errors++;
        continue;
      }

      const data = await response.json();
      const insights = data.data?.[0] || {};

      // Extract conversations from actions
      const conversationTypes = [
        'onsite_conversion.messaging_conversation_started_7d',
        'onsite_conversion.messaging_first_reply',
        'start_messaging',
      ];

      let conversations = 0;
      if (insights.actions) {
        for (const action of insights.actions) {
          if (conversationTypes.includes(action.action_type)) {
            conversations += parseInt(action.value || '0', 10);
          }
        }
      }

      const spend = parseFloat(insights.spend || '0');
      const cpa = conversations > 0 ? spend / conversations : 0;

      const metrics = {
        impressions: parseInt(insights.impressions || '0', 10),
        reach: parseInt(insights.reach || '0', 10),
        clicks: parseInt(insights.clicks || '0', 10),
        spend,
        ctr: parseFloat(insights.ctr || '0'),
        cpc: parseFloat(insights.cpc || '0'),
        cpm: parseFloat(insights.cpm || '0'),
        frequency: parseFloat(insights.frequency || '0'),
        conversations,
        cpa,
        actions: insights.actions || [],
        cost_per_action_type: insights.cost_per_action_type || [],
      };

      const isActive = campaign.status === 'ACTIVE' || campaign.status === 'active';
      const ttlMinutes = isActive ? CACHE_TTL_ACTIVE_MIN : CACHE_TTL_PAUSED_MIN;
      const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();

      await supabase
        .from('campaign_metrics_cache')
        .upsert({
          user_id: userId,
          campaign_id: metaCampaignId,
          ad_account_id: actId,
          metrics,
          date_preset: datePreset,
          fetched_at: now.toISOString(),
          expires_at: expiresAt,
        }, {
          onConflict: 'campaign_id,date_preset',
        });

      refreshed++;

      // Small delay to avoid Meta rate limits
      if (toProcess.indexOf(campaign) < toProcess.length - 1) {
        await new Promise(r => setTimeout(r, 350));
      }

    } catch (e: any) {
      log('Campaign refresh error', { campaign: campaign.meta_campaign_id, error: e.message });
      errors++;
    }
  }

  return { refreshed, errors, total: toProcess.length, calls_this_hour: currentCalls + refreshed };
}

// ── refresh_all: Cron job to refresh stale metrics across all users ──────────

async function refreshAllStaleMetrics(supabase: any) {
  // Find users with active campaigns whose caches are stale
  const { data: staleUsers } = await supabase
    .from('campaigns')
    .select('user_id')
    .in('status', ['ACTIVE', 'active'])
    .not('meta_campaign_id', 'is', null)
    .limit(100);

  if (!staleUsers?.length) {
    return { users_processed: 0, message: 'No active campaigns' };
  }

  // Deduplicate user IDs
  const uniqueUserIds = [...new Set(staleUsers.map((c: any) => c.user_id))] as string[];

  log(`Processing ${uniqueUserIds.length} users with active campaigns`);

  let totalRefreshed = 0;
  let usersProcessed = 0;

  for (const userId of uniqueUserIds.slice(0, 10)) { // Max 10 users per cron run
    try {
      const result = await refreshUserMetrics(supabase, userId, 'last_7d');
      totalRefreshed += result.refreshed || 0;
      usersProcessed++;
    } catch (e: any) {
      log('User refresh error', { userId, error: e.message });
    }
  }

  return { users_processed: usersProcessed, total_refreshed: totalRefreshed };
}

// ── check_alerts: Detect performance anomalies ──────────────────────────────

async function checkPerformanceAlerts(supabase: any) {
  // Get recently cached metrics to analyze
  const { data: cached } = await supabase
    .from('campaign_metrics_cache')
    .select('user_id, campaign_id, metrics, date_preset')
    .eq('date_preset', 'last_7d')
    .gt('fetched_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()) // Last 2 hours
    .limit(100);

  if (!cached?.length) {
    return { alerts_generated: 0 };
  }

  let alertsGenerated = 0;

  for (const entry of cached) {
    const raw = entry.metrics;
    // Ensure numeric values (JSONB may store as strings in edge cases)
    const m = {
      frequency: Number(raw.frequency) || 0,
      ctr: Number(raw.ctr) || 0,
      cpa: Number(raw.cpa) || 0,
      spend: Number(raw.spend) || 0,
      impressions: Number(raw.impressions) || 0,
      conversations: Number(raw.conversations) || 0,
    };
    const alerts: Array<{ type: string; severity: string; title: string; description: string; metric: string; value: number; threshold: number }> = [];

    // High frequency (>3 = ad fatigue)
    if (m.frequency > 3) {
      alerts.push({
        type: 'high_frequency',
        severity: m.frequency > 5 ? 'danger' : 'warning',
        title: 'Frequência alta detectada',
        description: `A frequência está em ${m.frequency.toFixed(1)}, indicando que o público está vendo o anúncio muitas vezes.`,
        metric: 'frequency',
        value: m.frequency,
        threshold: 3,
      });
    }

    // Low CTR (<0.5%)
    if (m.impressions > 1000 && m.ctr < 0.5) {
      alerts.push({
        type: 'low_ctr',
        severity: m.ctr < 0.2 ? 'danger' : 'warning',
        title: 'CTR abaixo do esperado',
        description: `O CTR está em ${m.ctr.toFixed(2)}%. Considere atualizar o criativo ou ajustar o público.`,
        metric: 'ctr',
        value: m.ctr,
        threshold: 0.5,
      });
    }

    // High CPA (>R$50)
    if (m.cpa > 50 && m.conversations > 0) {
      alerts.push({
        type: 'high_cpa',
        severity: m.cpa > 100 ? 'danger' : 'warning',
        title: 'Custo por conversa elevado',
        description: `O CPA está em R$ ${m.cpa.toFixed(2)}. Avalie otimizar o público ou criativo.`,
        metric: 'cpa',
        value: m.cpa,
        threshold: 50,
      });
    }

    // Zero conversations with spend
    if (m.spend > 30 && m.conversations === 0) {
      alerts.push({
        type: 'no_conversions',
        severity: 'danger',
        title: 'Sem conversas com gasto ativo',
        description: `Foram gastos R$ ${m.spend.toFixed(2)} sem nenhuma conversa iniciada.`,
        metric: 'conversations',
        value: 0,
        threshold: 1,
      });
    }

    // Insert alerts
    for (const alert of alerts) {
      // Check for recent duplicate
      const { data: existing } = await supabase
        .from('performance_alerts')
        .select('id')
        .eq('user_id', entry.user_id)
        .eq('campaign_id', entry.campaign_id)
        .eq('alert_type', alert.type)
        .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .maybeSingle();

      if (!existing) {
        await supabase.from('performance_alerts').insert({
          user_id: entry.user_id,
          campaign_id: entry.campaign_id,
          alert_type: alert.type,
          severity: alert.severity,
          title: alert.title,
          description: alert.description,
          metric_name: alert.metric,
          metric_value: alert.value,
          threshold_value: alert.threshold,
        });
        alertsGenerated++;
      }
    }
  }

  return { alerts_generated: alertsGenerated, campaigns_analyzed: cached.length };
}
