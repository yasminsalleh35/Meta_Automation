import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
async function fetchWithBackoff(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (response.ok) {
        return response;
      }
      
      // Check for rate limit errors
      const isRateLimit = response.status === 429;
      let errorBody: any = null;
      
      try {
        const clonedResponse = response.clone();
        errorBody = await clonedResponse.json();
      } catch {}
      
      const errorCode = errorBody?.error?.code;
      const errorSubcode = errorBody?.error?.error_subcode;
      const isMetaRateLimit = errorCode === 80004 || errorCode === 17 || errorSubcode === 2446079;
      
      if (isRateLimit || isMetaRateLimit) {
        if (attempt < maxRetries) {
          const baseDelay = 5000; // 5s base
          const exponentialDelay = baseDelay * Math.pow(2, attempt); // 5s, 10s, 20s
          const jitter = Math.random() * 2000; // 0-2s random
          const totalDelay = Math.min(exponentialDelay + jitter, 30000); // max 30s
          
          console.warn(`⚠️ RATE LIMIT detectado (attempt ${attempt + 1}/${maxRetries + 1}), aguardando ${Math.round(totalDelay / 1000)}s`, {
            errorCode,
            errorSubcode,
            url: url.substring(0, 80) + '...'
          });
          
          await new Promise(resolve => setTimeout(resolve, totalDelay));
          continue;
        } else {
          console.error('❌ RATE LIMIT esgotado após retries', {
            errorCode,
            errorSubcode,
            attempts: maxRetries + 1
          });
          throw new Error(`Meta API Rate Limit: ${errorBody?.error?.message || 'Too many requests'} (Code: ${errorCode})`);
        }
      }
      
      return response;
      
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        const delay = 5000 * Math.pow(2, attempt) + Math.random() * 2000;
        console.warn(`⚠️ Network error, retry em ${Math.round(delay / 1000)}s (attempt ${attempt + 1}/${maxRetries + 1})`, {
          error: lastError.message
        });
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw lastError;
    }
  }
  
  throw lastError || new Error('Fetch failed after retries');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

  try {
    console.log('🔄 Meta Campaign Auto Sync function started');

    // Get all active Meta Ads integrations
    const { data: integrations, error: integrationsError } = await supabaseClient
      .from('integrations')
      .select('user_id, access_token, ad_account_id')
      .eq('provider', 'meta_ads')
      .eq('status', 'active');

    if (integrationsError) {
      throw new Error(`Error fetching integrations: ${integrationsError.message}`);
    }

    console.log(`📊 Found ${integrations?.length || 0} active Meta Ads integrations`);

    const syncResults = [];

    for (const integration of integrations || []) {
      try {
        const adAccountId = integration.ad_account_id || integration.user_id;
        
        // ============= ETAPA 5: VERIFICAR CIRCUIT BREAKER =============
        const circuitStatus = await checkCircuitBreaker(supabaseClient, adAccountId);
        if (circuitStatus.isPaused) {
          console.warn(`⏸️ CIRCUIT BREAKER ativo para account ${adAccountId}, pulando sync (${circuitStatus.remainingMinutes} min restantes)`);
          syncResults.push({
            userId: integration.user_id,
            totalCampaigns: 0,
            syncedCampaigns: 0,
            outOfSyncCampaigns: 0,
            skipped: true,
            reason: `Circuit breaker ativo (${circuitStatus.remainingMinutes} min restantes)`,
            errors: []
          });
          continue;
        }
        
        console.log(`🔄 Syncing campaigns for user: ${integration.user_id}`);

        // Get user's campaigns with Meta IDs (prioritize those needing immediate sync)
        const { data: campaigns, error: campaignsError } = await supabaseClient
          .from('campaigns')
          .select('id, name, status, meta_campaign_id, meta_ad_id, needs_immediate_sync, last_metrics_sync_at')
          .eq('user_id', integration.user_id)
          .not('meta_campaign_id', 'is', null)
          .order('needs_immediate_sync', { ascending: false })
          .order('updated_at', { ascending: true });

        if (campaignsError) {
          throw new Error(`Error fetching campaigns: ${campaignsError.message}`);
        }

type SyncError = { campaignId: string; error: string }

        const userSyncResults: {
          userId: string;
          totalCampaigns: number;
          syncedCampaigns: number;
          outOfSyncCampaigns: number;
          errors: SyncError[];
        } = {
          userId: integration.user_id,
          totalCampaigns: campaigns?.length || 0,
          syncedCampaigns: 0,
          outOfSyncCampaigns: 0,
          errors: []
        };

        // ============= ETAPA 3: LOOP COM DELAYS ENTRE CAMPANHAS =============
        for (let i = 0; i < (campaigns || []).length; i++) {
          const campaign = campaigns![i];
          
          try {
            // ============= ETAPA 2: FETCH COM BACKOFF =============
            // Fetch campaign status, metrics AND creative from Meta
            const fields = `id,name,status,effective_status${campaign.meta_ad_id ? ',ads{creative{thumbnail_url,object_story_spec}}' : ''}`;
            const statusResponse = await fetchWithBackoff(
              `https://graph.facebook.com/v19.0/${campaign.meta_campaign_id}?fields=${fields}&access_token=${integration.access_token}`,
              { method: 'GET' }
            );

            if (!statusResponse.ok) {
              const error = await statusResponse.json();
              const errorMessage = `Meta API Error: ${error.error?.message || 'Unknown error'}`;
              
              // ============= ETAPA 5: TRIGGER CIRCUIT BREAKER SE RATE LIMIT =============
              if (error.error?.code === 80004 || error.error?.error_subcode === 2446079) {
                await triggerCircuitBreaker(supabaseClient, adAccountId, errorMessage);
              }
              
              throw new Error(errorMessage);
            }

            const metaCampaign = await statusResponse.json();

            // ============= ETAPA 4: CACHE DE INSIGHTS (só buscar se >1h ou needs_immediate_sync) =============
            let shouldFetchMetrics = campaign.needs_immediate_sync;
            
            if (!shouldFetchMetrics && campaign.last_metrics_sync_at) {
              const lastSyncTime = new Date(campaign.last_metrics_sync_at).getTime();
              const now = Date.now();
              const hoursSinceLastSync = (now - lastSyncTime) / (1000 * 60 * 60);
              shouldFetchMetrics = hoursSinceLastSync >= 1;
              
              if (!shouldFetchMetrics) {
                console.log(`⏭️ Pulando metrics para campaign ${campaign.id} (última sync há ${Math.round(hoursSinceLastSync * 60)} min)`);
              }
            } else {
              shouldFetchMetrics = true; // Primeira sync ou sem histórico
            }
            
            // Fetch metrics from Meta Insights API (last 7 days) - COM CACHE
            let metrics = {
              impressions: 0,
              reach: 0,
              clicks: 0,
              spend: 0,
              ctr: 0,
              conversations: 0,
              cost_per_messaging_conversation_started_7d: 0
            };

            if (campaign.meta_ad_id && shouldFetchMetrics) {
              try {
                // ============= ETAPA 2: INSIGHTS COM BACKOFF =============
                const insightsResponse = await fetchWithBackoff(
                  `https://graph.facebook.com/v19.0/${campaign.meta_ad_id}/insights?fields=impressions,reach,clicks,spend,actions,cost_per_action_type,ctr&date_preset=last_30d&access_token=${integration.access_token}`,
                  { method: 'GET' }
                );

                if (insightsResponse.ok) {
                  const insightsData = await insightsResponse.json();
                  const insight = insightsData.data?.[0] || {};

                  // Extract conversations
                  const actions = insight.actions || [];
                  const conversationsAction = actions.find(
                    (a: any) => a.action_type === 'onsite_conversion.messaging_conversation_started_7d'
                  );
                  const conversations = conversationsAction ? Number(conversationsAction.value) : 0;

                  const costPerActionType = insight.cost_per_action_type || [];
                  const costPerConversationAction = costPerActionType.find(
                    (c: any) => c.action_type === 'onsite_conversion.messaging_conversation_started_7d'
                  );
                  const costPerConversation = costPerConversationAction ? Number(costPerConversationAction.value) : 0;

                  metrics = {
                    impressions: Number(insight.impressions) || 0,
                    reach: Number(insight.reach) || 0,
                    clicks: Number(insight.clicks) || 0,
                    spend: Number(insight.spend) || 0,
                    ctr: Number(insight.ctr) || 0,
                    conversations: conversations,
                    cost_per_messaging_conversation_started_7d: costPerConversation
                  };

                  console.log(`📊 Metrics fetched para campaign ${campaign.id}:`, metrics);
                } else {
                  const error = await insightsResponse.json();
                  
                  // ============= ETAPA 5: TRIGGER CIRCUIT BREAKER SE RATE LIMIT =============
                  if (error.error?.code === 80004 || error.error?.error_subcode === 2446079) {
                    await triggerCircuitBreaker(supabaseClient, adAccountId, `Insights API Rate Limit: ${error.error?.message}`);
                  }
                }
              } catch (metricsError) {
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
              
              if (mediaPreviewUrl) {
                console.log(`🖼️ Media preview found for campaign ${campaign.id}`);
              }
            }
            
            // Map Meta status to local status
            const statusMap: Record<string, string> = {
              'ACTIVE': 'active',
              'PAUSED': 'paused',
              'DELETED': 'deleted',
              'ARCHIVED': 'finished',
              'IN_PROCESS': 'pending_review'
            };

            const expectedLocalStatus = statusMap[metaCampaign.status] || statusMap[metaCampaign.effective_status] || 'paused';

            if (campaign.status !== expectedLocalStatus || campaign.needs_immediate_sync || shouldFetchMetrics) {
              // Update local status, metrics AND media preview to match Meta
              const { error: updateError } = await supabaseClient
                .from('campaigns')
                .update({ 
                  status: expectedLocalStatus,
                  metrics: metrics,
                  media_preview_url: mediaPreviewUrl,
                  last_metrics_sync_at: new Date().toISOString(),
                  needs_immediate_sync: false,
                  updated_at: new Date().toISOString()
                })
                .eq('id', campaign.id);

              if (updateError) {
                throw new Error(`Error updating campaign ${campaign.id}: ${updateError.message}`);
              }

              userSyncResults.outOfSyncCampaigns++;
              console.log(`✅ Updated campaign ${campaign.id} - Status: ${campaign.status} -> ${expectedLocalStatus}, Metrics synced`);
            } else {
              userSyncResults.syncedCampaigns++;
            }

          } catch (error) {
            console.error(`❌ Error syncing campaign ${campaign.id}:`, error);
            userSyncResults.errors.push({
              campaignId: String(campaign.id),
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
          
          // ============= ETAPA 3: DELAY ENTRE CAMPANHAS (500ms) =============
          if (i < campaigns.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        syncResults.push(userSyncResults);
        console.log(`Sync completed for user ${integration.user_id}:`, userSyncResults);

      } catch (error) {
        console.error(`Error syncing user ${integration.user_id}:`, error);
        syncResults.push({
          userId: integration.user_id,
          totalCampaigns: 0,
          syncedCampaigns: 0,
          outOfSyncCampaigns: 0,
          errors: [{
            campaignId: 'all',
            error: error instanceof Error ? error.message : 'Unknown error'
          }]
        });
      }
    }

    const totalCampaigns = syncResults.reduce((sum, result) => sum + result.totalCampaigns, 0);
    const totalSynced = syncResults.reduce((sum, result) => sum + result.syncedCampaigns, 0);
    const totalOutOfSync = syncResults.reduce((sum, result) => sum + result.outOfSyncCampaigns, 0);
    const totalErrors = syncResults.reduce((sum, result) => sum + result.errors.length, 0);
    const totalSkipped = syncResults.filter(r => (r as any).skipped).length;

    console.log(`✅ Auto sync completed - Total: ${totalCampaigns}, Synced: ${totalSynced}, Out of sync: ${totalOutOfSync}, Errors: ${totalErrors}, Skipped: ${totalSkipped}`);
    
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
        totalUsers: integrations?.length || 0,
        totalCampaigns,
        totalSynced,
        totalOutOfSync,
        totalErrors,
        totalSkipped,
        circuitBreakerActive: (activeBreakers?.length || 0) > 0,
        circuitBreakerAccounts: activeBreakers?.map(b => b.ad_account_id) || []
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
