import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { isCron, requireUser, authErrorResponse } from "../_shared/auth.ts";
import { normalizeInsight } from "../_shared/metrics.ts";
import { mapMetaEffectiveStatus } from "../_shared/status.ts";
import { META_GRAPH_VERSION } from '../_shared/meta.ts'; // audit PLT-03

// audit DATA-04: pg_cron invokes this every 10 min through pg_net with a 150s
// timeout. Each run works through campaigns oldest-`last_status_sync_at` first,
// interleaved across users, and stops starting new campaigns once the time budget
// is used up — so no user is starved and the run ends before pg_net gives up.
const RUN_BUDGET_MS = 90_000;        // stop starting new campaigns after this
const FETCH_TIMEOUT_MS = 15_000;     // per Meta request attempt
const MAX_CANDIDATES_PER_RUN = 300;  // campaigns loaded per run (ordered by cursor)
const DELAY_BETWEEN_CAMPAIGNS_MS = 500;
const META_API_VERSION = META_GRAPH_VERSION;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============= CIRCUIT BREAKER PERSISTENTE (DB) =============
async function checkCircuitBreaker(admin: any, adAccountId: string): Promise<{ isPaused: boolean; remainingMinutes?: number }> {
  try {
    const { data } = await admin
      .from('meta_rate_limits')
      .select('blocked_until')
      .eq('ad_account_id', adAccountId)
      .maybeSingle();

    if (!data?.blocked_until) return { isPaused: false };
    const blockedUntil = new Date(data.blocked_until).getTime();
    if (Date.now() < blockedUntil) {
      const remainingMinutes = Math.ceil((blockedUntil - Date.now()) / 60000);
      return { isPaused: true, remainingMinutes };
    }
    return { isPaused: false };
  } catch (err) {
    console.error('Error checking circuit breaker:', err);
    return { isPaused: false };
  }
}

async function triggerCircuitBreaker(admin: any, adAccountId: string, errorMessage: string) {
  const blockedUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  try {
    await admin.from('meta_rate_limits').upsert({
      ad_account_id: adAccountId,
      blocked_until: blockedUntil,
      last_error_code: '80004',
      last_error_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'ad_account_id' });
    console.warn(`🛡️ CIRCUIT BREAKER PERSISTIDO para account ${adAccountId} até ${blockedUntil}`);
  } catch (err) {
    console.error('Error persisting circuit breaker:', err);
  }
}

// ============= RATE LIMIT HANDLER (ETAPA 2) =============
class RateLimitError extends Error {}

function isMetaRateLimitBody(body: any): boolean {
  const code = body?.error?.code;
  const subcode = body?.error?.error_subcode;
  return code === 80004 || code === 17 || subcode === 2446079;
}

// audit DATA-04: deadline-aware — never sleeps or waits past `deadline`, so the
// whole run stays inside pg_net's 150s timeout (was 3 retries of up to 30s, no timeout).
async function fetchWithBackoff(
  url: string,
  options: RequestInit,
  deadline: number,
  maxRetries = 2
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const remaining = deadline - Date.now();
    if (remaining <= 1000) break;

    let response: Response;
    try {
      response = await fetch(url, { ...options, signal: AbortSignal.timeout(Math.min(FETCH_TIMEOUT_MS, remaining)) });
    } catch (error) {
      lastError = error as Error;
      const delay = 5000 * Math.pow(2, attempt) + Math.random() * 2000;
      if (attempt < maxRetries && Date.now() + delay < deadline) {
        console.warn(`⚠️ Network error, retry em ${Math.round(delay / 1000)}s (attempt ${attempt + 1}/${maxRetries + 1})`, {
          error: lastError.message
        });
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw lastError;
    }

    if (response.ok) return response;

    let errorBody: any = null;
    try {
      errorBody = await response.clone().json();
    } catch {}

    if (response.status === 429 || isMetaRateLimitBody(errorBody)) {
      const delay = Math.min(5000 * Math.pow(2, attempt) + Math.random() * 2000, 30000);
      if (attempt < maxRetries && Date.now() + delay < deadline) {
        console.warn(`⚠️ RATE LIMIT detectado (attempt ${attempt + 1}/${maxRetries + 1}), aguardando ${Math.round(delay / 1000)}s`, {
          errorCode: errorBody?.error?.code,
          errorSubcode: errorBody?.error?.error_subcode,
        });
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw new RateLimitError(`Meta API Rate Limit: ${errorBody?.error?.message || 'Too many requests'} (Code: ${errorBody?.error?.code})`);
    }

    return response;
  }

  throw lastError || new Error('Fetch skipped: run time budget exhausted');
}

type CandidateCampaign = {
  id: string;
  user_id: string;
  status: string;
  meta_campaign_id: string;
  meta_ad_id: string | null;
  metrics: Record<string, unknown> | null;
  needs_immediate_sync: boolean | null;
  last_metrics_sync_at: string | null;
  last_status_sync_at: string | null;
};

// Round-robin across users, keeping each user's own order (oldest cursor first).
function interleaveByUser(rows: CandidateCampaign[]): CandidateCampaign[] {
  const byUser = new Map<string, CandidateCampaign[]>();
  for (const r of rows) {
    const list = byUser.get(r.user_id) ?? [];
    list.push(r);
    byUser.set(r.user_id, list);
  }
  const queues = [...byUser.values()];
  const out: CandidateCampaign[] = [];
  for (let i = 0; queues.some(q => i < q.length); i++) {
    for (const q of queues) if (i < q.length) out.push(q[i]);
  }
  return out;
}

type SyncError = { campaignId: string; error: string };
type UserSyncResult = {
  userId: string;
  totalCampaigns: number;
  syncedCampaigns: number;
  outOfSyncCampaigns: number;
  metricsUpdated: number;
  skipped?: boolean;
  reason?: string;
  errors: SyncError[];
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startedAt = Date.now();
  // Hard stop for any in-flight Meta request (pg_net gives up at 150s).
  const hardDeadline = startedAt + RUN_BUDGET_MS + 40_000;

  // ============= ETAPA 1: VERIFICAR SE ESTÁ PAUSADO =============
  const SYNC_PAUSED = Deno.env.get('PAUSE_AUTO_SYNC') === 'true';
  if (SYNC_PAUSED) {
    console.log('⏸️ AUTO-SYNC PAUSADO via environment variable PAUSE_AUTO_SYNC=true');
    return new Response(JSON.stringify({
      success: true,
      status: 'paused',
      message: 'Auto-sync pausado temporariamente para economia de quota da Meta API',
      instruction: 'Para reativar, configure PAUSE_AUTO_SYNC=false no Supabase Dashboard'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Autorização (audit SEC-06/SEC-15): cron sincroniza todos; usuário só a própria integração.
  let scopeUserId: string | null = null;
  if (!isCron(req)) {
    try {
      const { user } = await requireUser(req);
      scopeUserId = user.id;
    } catch (e) {
      const resp = authErrorResponse(e, corsHeaders);
      if (resp) return resp;
      throw e;
    }
  }

  try {
    console.log('🔄 Meta Campaign Auto Sync function started');

    // Integrações Meta Ads ativas (todas no cron; apenas a do usuário quando chamado pelo app)
    let integrationsQuery = supabaseClient
      .from('integrations')
      .select('user_id, access_token, ad_account_id')
      .eq('provider', 'meta_ads')
      .eq('status', 'active');
    if (scopeUserId) integrationsQuery = integrationsQuery.eq('user_id', scopeUserId);
    const { data: integrations, error: integrationsError } = await integrationsQuery;

    if (integrationsError) {
      throw new Error(`Error fetching integrations: ${integrationsError.message}`);
    }

    console.log(`📊 Found ${integrations?.length || 0} active Meta Ads integrations`);

    const integrationByUser = new Map<string, any>();
    const resultsByUser = new Map<string, UserSyncResult>();
    for (const integration of integrations || []) {
      // One integration per user (first wins, like the old per-user loop's effective behaviour)
      if (integrationByUser.has(integration.user_id)) continue;
      integrationByUser.set(integration.user_id, integration);
      resultsByUser.set(integration.user_id, {
        userId: integration.user_id,
        totalCampaigns: 0,
        syncedCampaigns: 0,
        outOfSyncCampaigns: 0,
        metricsUpdated: 0,
        errors: []
      });
    }

    // ============= ETAPA 5: VERIFICAR CIRCUIT BREAKER (uma vez por conta) =============
    const blockedUsers = new Set<string>();
    for (const [userId, integration] of integrationByUser) {
      const adAccountId = integration.ad_account_id || integration.user_id;
      const circuitStatus = await checkCircuitBreaker(supabaseClient, adAccountId);
      if (circuitStatus.isPaused) {
        console.warn(`⏸️ CIRCUIT BREAKER ativo para account ${adAccountId}, pulando sync (${circuitStatus.remainingMinutes} min restantes)`);
        blockedUsers.add(userId);
        const r = resultsByUser.get(userId)!;
        r.skipped = true;
        r.reason = `Circuit breaker ativo (${circuitStatus.remainingMinutes} min restantes)`;
      }
    }

    const eligibleUserIds = [...integrationByUser.keys()].filter(u => !blockedUsers.has(u));

    // audit DATA-04: fair batching. Candidates are ordered by needs_immediate_sync,
    // then by the oldest last_status_sync_at (the round-robin cursor, bumped for every
    // campaign we touch — success or failure), and interleaved across users.
    let candidates: CandidateCampaign[] = [];
    if (eligibleUserIds.length > 0) {
      const { data: rows, error: campaignsError } = await supabaseClient
        .from('campaigns')
        .select('id, user_id, status, meta_campaign_id, meta_ad_id, metrics, needs_immediate_sync, last_metrics_sync_at, last_status_sync_at')
        .in('user_id', eligibleUserIds)
        .not('meta_campaign_id', 'is', null)
        .neq('status', 'deleted')
        .order('needs_immediate_sync', { ascending: false, nullsFirst: false })
        .order('last_status_sync_at', { ascending: true, nullsFirst: true })
        .limit(MAX_CANDIDATES_PER_RUN);

      if (campaignsError) {
        throw new Error(`Error fetching campaigns: ${campaignsError.message}`);
      }
      candidates = interleaveByUser((rows || []) as CandidateCampaign[]);
    }

    let processedCount = 0;
    let stoppedForBudget = false;
    const rateLimitedUsers = new Set<string>();

    // ============= ETAPA 3: LOOP COM DELAYS ENTRE CAMPANHAS =============
    for (let i = 0; i < candidates.length; i++) {
      if (Date.now() - startedAt > RUN_BUDGET_MS) {
        stoppedForBudget = true;
        console.log(`⏱️ Time budget reached after ${processedCount} campaigns; remaining ${candidates.length - i} continue next run`);
        break;
      }

      const campaign = candidates[i];
      if (rateLimitedUsers.has(campaign.user_id)) continue;

      const integration = integrationByUser.get(campaign.user_id);
      const adAccountId = integration.ad_account_id || integration.user_id;
      const userSyncResults = resultsByUser.get(campaign.user_id)!;
      userSyncResults.totalCampaigns++;
      processedCount++;

      try {
        // ============= ETAPA 2: FETCH COM BACKOFF =============
        // Fetch campaign status and creative from Meta
        const fields = `id,name,status,effective_status${campaign.meta_ad_id ? ',ads{creative{thumbnail_url,object_story_spec}}' : ''}`;
        const statusResponse = await fetchWithBackoff(
          `https://graph.facebook.com/${META_API_VERSION}/${campaign.meta_campaign_id}?fields=${fields}&access_token=${integration.access_token}`,
          { method: 'GET' },
          hardDeadline
        );

        if (!statusResponse.ok) {
          const error = await statusResponse.json().catch(() => ({}));
          const errorMessage = `Meta API Error: ${error.error?.message || 'Unknown error'}`;
          throw new Error(errorMessage);
        }

        const metaCampaign = await statusResponse.json();

        // ============= ETAPA 4: CACHE DE INSIGHTS (só buscar se >1h ou needs_immediate_sync) =============
        let shouldFetchMetrics = !!campaign.needs_immediate_sync;
        if (!shouldFetchMetrics) {
          if (campaign.last_metrics_sync_at) {
            const hoursSinceLastSync = (Date.now() - new Date(campaign.last_metrics_sync_at).getTime()) / (1000 * 60 * 60);
            shouldFetchMetrics = hoursSinceLastSync >= 1;
          } else {
            shouldFetchMetrics = true; // Primeira sync ou sem histórico
          }
        }

        // audit DATA-04: metrics are only written when the insights fetch succeeded
        // in this run. Previously a skipped/failed fetch wrote a zeroed object and
        // wiped the campaign's real numbers (e.g. right after pausing it in Ads Manager).
        let fetchedMetrics: Record<string, unknown> | null = null;
        if (campaign.meta_ad_id && shouldFetchMetrics) {
          try {
            const insightsResponse = await fetchWithBackoff(
              `https://graph.facebook.com/${META_API_VERSION}/${campaign.meta_ad_id}/insights?fields=impressions,reach,clicks,spend,actions,cost_per_action_type,ctr&date_preset=last_30d&access_token=${integration.access_token}`,
              { method: 'GET' },
              hardDeadline
            );

            if (insightsResponse.ok) {
              const insightsData = await insightsResponse.json();
              const insight = insightsData.data?.[0] || {};
              // audit DATA-02: shared metric definition
              const n = normalizeInsight(insight);
              fetchedMetrics = {
                impressions: n.impressions,
                reach: n.reach,
                clicks: n.clicks,
                spend: n.spend,
                ctr: Number(insight.ctr) || 0,
                cpc: n.cpc ?? 0,
                conversations: n.conversations,
                cost_per_messaging_conversation_started_7d: n.costPerConversation ?? 0
              };
              console.log(`📊 Metrics fetched para campaign ${campaign.id}:`, fetchedMetrics);
            } else {
              const error = await insightsResponse.json().catch(() => ({}));
              console.warn(`⚠️ Insights fetch failed for campaign ${campaign.id}: ${error.error?.message || insightsResponse.status}`);
            }
          } catch (metricsError) {
            if (metricsError instanceof RateLimitError) throw metricsError;
            console.error(`⚠️ Could not fetch metrics for campaign ${campaign.id}:`, metricsError);
          }
        }

        // Extract media preview URL from creative
        let mediaPreviewUrl: string | undefined = undefined;
        if (metaCampaign.ads?.data?.[0]) {
          const ad = metaCampaign.ads.data[0];
          mediaPreviewUrl =
            ad.creative?.thumbnail_url ||
            ad.creative?.object_story_spec?.link_data?.picture ||
            undefined;
        }

        // Status canônico (audit CMP-10); effective_status primeiro (configurada ACTIVE mas em análise
        // → pending_review); desconhecido → mantém o atual em vez de forçar 'paused'
        const expectedLocalStatus =
          mapMetaEffectiveStatus(metaCampaign.effective_status) ??
          mapMetaEffectiveStatus(metaCampaign.status) ??
          campaign.status;

        const nowIso = new Date().toISOString();
        const statusChanged = campaign.status !== expectedLocalStatus;

        // Status (and cursor) — written on every successful status fetch.
        const update: Record<string, unknown> = {
          last_status_sync_at: nowIso,
        };
        if (metaCampaign.effective_status) update.status_at_sync = metaCampaign.effective_status;
        if (statusChanged) {
          update.status = expectedLocalStatus;
          update.updated_at = nowIso;
        }
        if (mediaPreviewUrl) update.media_preview_url = mediaPreviewUrl;

        // Metrics — only when fetched successfully in this run.
        if (fetchedMetrics) {
          update.metrics = { ...(campaign.metrics || {}), ...fetchedMetrics };
          update.last_metrics_sync_at = nowIso;
          update.needs_immediate_sync = false;
        } else if (campaign.needs_immediate_sync && !campaign.meta_ad_id) {
          // Nothing to fetch metrics from; don't keep it at the head of the queue forever.
          update.needs_immediate_sync = false;
        }

        const { error: updateError } = await supabaseClient
          .from('campaigns')
          .update(update)
          .eq('id', campaign.id);

        if (updateError) {
          throw new Error(`Error updating campaign ${campaign.id}: ${updateError.message}`);
        }

        if (fetchedMetrics) userSyncResults.metricsUpdated++;
        if (statusChanged) {
          userSyncResults.outOfSyncCampaigns++;
          console.log(`✅ Updated campaign ${campaign.id} - Status: ${campaign.status} -> ${expectedLocalStatus}`);
        } else {
          userSyncResults.syncedCampaigns++;
        }

      } catch (error) {
        console.error(`❌ Error syncing campaign ${campaign.id}:`, error);
        userSyncResults.errors.push({
          campaignId: String(campaign.id),
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        // ============= ETAPA 5: TRIGGER CIRCUIT BREAKER SE RATE LIMIT =============
        if (error instanceof RateLimitError) {
          await triggerCircuitBreaker(supabaseClient, adAccountId, error.message);
          rateLimitedUsers.add(campaign.user_id);
        }

        // Bump the cursor even on failure so a permanently failing campaign
        // doesn't sit at the head of the queue and starve the others.
        await supabaseClient
          .from('campaigns')
          .update({ last_status_sync_at: new Date().toISOString() })
          .eq('id', campaign.id);
      }

      // ============= ETAPA 3: DELAY ENTRE CAMPANHAS (500ms) =============
      if (i < candidates.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_CAMPAIGNS_MS));
      }
    }

    const syncResults = [...resultsByUser.values()];
    const totalCampaigns = syncResults.reduce((sum, result) => sum + result.totalCampaigns, 0);
    const totalSynced = syncResults.reduce((sum, result) => sum + result.syncedCampaigns, 0);
    const totalOutOfSync = syncResults.reduce((sum, result) => sum + result.outOfSyncCampaigns, 0);
    const totalMetricsUpdated = syncResults.reduce((sum, result) => sum + result.metricsUpdated, 0);
    const totalErrors = syncResults.reduce((sum, result) => sum + result.errors.length, 0);
    const totalSkipped = syncResults.filter(r => r.skipped).length;

    console.log(`✅ Auto sync completed in ${Math.round((Date.now() - startedAt) / 1000)}s - Processed: ${totalCampaigns}/${candidates.length}, Synced: ${totalSynced}, Out of sync: ${totalOutOfSync}, Metrics: ${totalMetricsUpdated}, Errors: ${totalErrors}, Skipped users: ${totalSkipped}, Budget stop: ${stoppedForBudget}`);

    // Log circuit breaker state from DB
    const { data: activeBreakers } = await supabaseClient
      .from('meta_rate_limits')
      .select('ad_account_id, blocked_until')
      .gt('blocked_until', new Date().toISOString());

    if (activeBreakers && activeBreakers.length > 0) {
      console.warn(`🛡️ CIRCUIT BREAKER STATE:`, activeBreakers);
    }

    return new Response(JSON.stringify({
      success: true,
      syncResults,
      summary: {
        totalUsers: integrationByUser.size,
        candidates: candidates.length,
        totalCampaigns,
        totalSynced,
        totalOutOfSync,
        totalMetricsUpdated,
        totalErrors,
        totalSkipped,
        stoppedForBudget,
        elapsedMs: Date.now() - startedAt,
        circuitBreakerActive: (activeBreakers?.length || 0) > 0,
        circuitBreakerAccounts: activeBreakers?.map((b: any) => b.ad_account_id) || []
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Auto sync edge function error:', error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorResponse = {
      success: false,
      error: errorMessage
    };

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
