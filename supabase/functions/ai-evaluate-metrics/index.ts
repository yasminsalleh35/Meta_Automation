import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeadersFor, handlePreflight } from '../_shared/cors.ts';
import { authErrorResponse } from '../_shared/auth.ts';
import { consumeAiQuota } from '../_shared/aiQuota.ts';

// Version: 1.0.0 - AI metric evaluation with bounded optimization suggestions

interface CampaignMetrics {
  impressions: number;
  clicks: number;
  spend: number;
  cpm: number;
  cpc: number;
  ctr: number;
  reach: number;
  conversions: number;
  cpa: number;
  messaging_conversations: number;
}

const MESSAGING_RESULT_ACTION = 'onsite_conversion.messaging_conversation_started_7d';
const OTHER_RESULT_ACTIONS = ['lead', 'purchase', 'contact_total'];
const LLM_TIMEOUT_MS = 30_000;

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const cors = corsHeadersFor(origin);

  if (req.method === 'OPTIONS') {
    return handlePreflight(req);
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autorização não fornecido' }),
        { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // Limite por usuário para IA paga (audit SEC-10)
    try {
      await consumeAiQuota(supabaseClient, user.id, 'ai-evaluate-metrics');
    } catch (e) {
      const resp = authErrorResponse(e, cors);
      if (resp) return resp;
      throw e;
    }

    const input = await req.json().catch(() => ({}));
    const { campaignId } = input;

    if (!campaignId) {
      return new Response(
        JSON.stringify({ error: 'campaignId é obrigatório' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch campaign from DB
    const { data: campaign, error: campaignError } = await supabaseClient
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (campaignError || !campaign) {
      return new Response(
        JSON.stringify({ error: 'Campanha não encontrada' }),
        { status: 404, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    if (!campaign.meta_campaign_id) {
      return new Response(
        JSON.stringify({ error: 'Campanha sem ID do Meta Ads' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // Get Meta access token
    const { data: integration, error: intError } = await supabaseClient
      .from('integrations')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('provider', 'meta_ads')
      .eq('status', 'active')
      .single();

    if (intError || !integration?.access_token) {
      return new Response(
        JSON.stringify({ error: 'Integração Meta Ads não encontrada' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch campaign insights from Meta API (last 7 days)
    const accessToken = integration.access_token;
    const insightsUrl = `https://graph.facebook.com/v23.0/${campaign.meta_campaign_id}/insights` +
      `?fields=impressions,clicks,spend,cpm,cpc,ctr,reach,actions` +
      `&date_preset=last_7d&access_token=${accessToken}`;

    console.log('📊 [AI-EVAL] Fetching insights for:', campaign.meta_campaign_id);

    const insightsRes = await fetch(insightsUrl);
    if (!insightsRes.ok) {
      const err = await insightsRes.json();
      console.error('❌ [AI-EVAL] Meta insights error:', err);
      return new Response(
        JSON.stringify({ error: `Erro ao buscar métricas: ${err.error?.message || 'Unknown'}` }),
        { status: 502, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const insightsData = await insightsRes.json();
    const raw = insightsData.data?.[0] || {};

    // Resultados = conversas iniciadas no WhatsApp (CTWA) + leads + compras + contatos (audit CMP-14).
    // Antes só contava tipos inexistentes e campanhas CTWA apareciam com "0 conversões".
    const actionCount = (type: string) => (raw.actions || [])
      .filter((a: any) => a.action_type === type)
      .reduce((sum: number, a: any) => sum + (parseInt(a.value || '0', 10) || 0), 0);
    const messagingConversations = actionCount(MESSAGING_RESULT_ACTION);
    const conversions = messagingConversations +
      OTHER_RESULT_ACTIONS.reduce((sum, type) => sum + actionCount(type), 0);

    const metrics: CampaignMetrics = {
      impressions: parseInt(raw.impressions || '0', 10),
      clicks: parseInt(raw.clicks || '0', 10),
      spend: parseFloat(raw.spend || '0'),
      cpm: parseFloat(raw.cpm || '0'),
      cpc: parseFloat(raw.cpc || '0'),
      ctr: parseFloat(raw.ctr || '0'),
      reach: parseInt(raw.reach || '0', 10),
      conversions,
      cpa: conversions > 0 ? parseFloat(raw.spend || '0') / conversions : 0,
      messaging_conversations: messagingConversations,
    };

    console.log('📊 [AI-EVAL] Metrics:', metrics);

    // Configuração global de IA (a tabela não tem user_id) — prefere a padrão entre as ativas
    const { data: aiConfig } = await supabaseClient
      .from('ai_configurations')
      .select('provider, api_key, model_name')
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get business settings for context
    const { data: bizSettings } = await supabaseClient
      .from('business_settings')
      .select('business_name, business_sector, business_description, target_audience')
      .eq('user_id', user.id)
      .single();

    // Build AI prompt
    const systemPrompt = `Você é um especialista em Meta Ads com foco em otimização de campanhas.
Analise as métricas da campanha e gere sugestões de otimização PRÁTICAS e ACIONÁVEIS.

REGRAS IMPORTANTES:
- Gere entre 1 e 5 sugestões, apenas se justificadas pelas métricas
- Cada sugestão deve ter um tipo válido: increase_budget, decrease_budget, pause_campaign, adjust_targeting, duplicate_campaign, update_creative, general
- Sugira ajustes de orçamento de no máximo ±30% do valor atual
- NUNCA sugira ações que o usuário não possa executar com um clique
- Considere o setor do negócio e público-alvo ao fazer sugestões
- "Resultados" inclui conversas iniciadas no WhatsApp: se Resultados > 0, a campanha TEM conversões; nunca afirme o contrário
- Responda APENAS em JSON válido, sem markdown ou texto adicional

FORMATO DE RESPOSTA (JSON array):
[
  {
    "type": "increase_budget",
    "title": "Título curto da sugestão",
    "description": "Explicação detalhada de por que esta otimização é recomendada",
    "severity": "success|warning|danger|info",
    "suggested_action": {
      "action": "update_budget",
      "field": "daily_budget",
      "current_value": 50,
      "suggested_value": 65,
      "meta_object_id": "campaign_id_here"
    }
  }
]`;

    const userPrompt = `Campanha: "${campaign.name || campaign.campaign_name}"
Objetivo: ${campaign.objective || 'OUTCOME_ENGAGEMENT'}
Status: ${campaign.status}
Orçamento diário: R$ ${campaign.budget_daily || campaign.daily_budget || 'N/A'}
${bizSettings ? `Negócio: ${bizSettings.business_name || 'N/A'} (${bizSettings.business_sector || 'N/A'})` : ''}
${bizSettings?.target_audience ? `Público-alvo: ${bizSettings.target_audience}` : ''}

MÉTRICAS (últimos 7 dias):
- Impressões: ${metrics.impressions.toLocaleString('pt-BR')}
- Alcance: ${metrics.reach.toLocaleString('pt-BR')}
- Cliques: ${metrics.clicks.toLocaleString('pt-BR')}
- CTR: ${metrics.ctr.toFixed(2)}%
- CPC: R$ ${metrics.cpc.toFixed(2)}
- CPM: R$ ${metrics.cpm.toFixed(2)}
- Gasto total: R$ ${metrics.spend.toFixed(2)}
- Resultados (conversas no WhatsApp + leads + compras + contatos): ${metrics.conversions}
- Conversas iniciadas no WhatsApp: ${metrics.messaging_conversations}
- Custo por resultado: R$ ${metrics.cpa.toFixed(2)}

Meta Campaign ID: ${campaign.meta_campaign_id}
Meta AdSet ID: ${campaign.meta_adset_id || 'N/A'}
Meta Ad ID: ${campaign.meta_ad_id || 'N/A'}

Analise estas métricas e gere sugestões de otimização.`;

    // Call AI provider
    const provider = aiConfig?.provider || 'openai';
    const model = aiConfig?.model_name || 'gpt-4o-mini';
    let apiKey = aiConfig?.api_key;

    if (!apiKey) {
      // Fallback to env
      apiKey = provider === 'deepseek'
        ? Deno.env.get('DEEPSEEK_API_KEY')
        : Deno.env.get('OPENAI_API_KEY');
    }

    if (!apiKey) {
      // Generate rule-based suggestions as fallback
      console.log('⚠️ [AI-EVAL] No AI key, using rule-based evaluation');
      const suggestions = generateRuleBasedSuggestions(metrics, campaign);
      await saveSuggestions(supabaseClient, user.id, campaign, suggestions, 'rule-based', 'none', metrics);
      return new Response(
        JSON.stringify({ success: true, suggestions, source: 'rule-based' }),
        { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const apiUrl = provider === 'deepseek'
      ? 'https://api.deepseek.com/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';

    console.log(`🤖 [AI-EVAL] Calling ${provider} (${model})...`);

    let aiRes: Response | null = null;
    try {
      aiRes = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 2000,
        }),
        signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
      });
    } catch (fetchError) {
      console.error('❌ [AI-EVAL] AI request failed/timed out:', fetchError instanceof Error ? fetchError.message : fetchError);
    }

    if (!aiRes || !aiRes.ok) {
      const err = aiRes ? await aiRes.text().catch(() => '') : 'timeout/network';
      console.error('❌ [AI-EVAL] AI API error:', err);
      // Fallback to rule-based
      const suggestions = generateRuleBasedSuggestions(metrics, campaign);
      await saveSuggestions(supabaseClient, user.id, campaign, suggestions, 'rule-based', 'none', metrics);
      return new Response(
        JSON.stringify({ success: true, suggestions, source: 'rule-based-fallback' }),
        { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiRes.json().catch(() => ({}));
    const aiContent = aiData.choices?.[0]?.message?.content || '[]';

    let suggestions: any[];
    try {
      // Strip markdown code fences if present
      const cleaned = aiContent.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();
      suggestions = JSON.parse(cleaned);
      if (!Array.isArray(suggestions)) suggestions = [suggestions];
    } catch (parseError) {
      console.error('❌ [AI-EVAL] Failed to parse AI response:', aiContent);
      suggestions = generateRuleBasedSuggestions(metrics, campaign);
    }

    // Validate and sanitize suggestions
    const validTypes = ['increase_budget', 'decrease_budget', 'pause_campaign', 'activate_campaign', 'adjust_targeting', 'duplicate_campaign', 'update_creative', 'general'];
    const validSeverities = ['info', 'success', 'warning', 'danger'];

    suggestions = suggestions
      .filter((s: any) => s && s.title && s.description)
      .map((s: any) => ({
        type: validTypes.includes(s.type) ? s.type : 'general',
        title: String(s.title).slice(0, 200),
        description: String(s.description).slice(0, 1000),
        severity: validSeverities.includes(s.severity) ? s.severity : 'info',
        suggested_action: s.suggested_action || {},
      }))
      .slice(0, 5); // Max 5 suggestions

    // Limite ±30% sobre o orçamento REAL da campanha, nunca sobre o current_value do modelo (audit CMP-14/SEC-15)
    const realBudget = parseFloat(campaign.budget_daily || campaign.daily_budget || '0');
    const allowedObjects = [campaign.meta_campaign_id, campaign.meta_adset_id].filter(Boolean).map(String);
    for (const s of suggestions) {
      const action = s.suggested_action;
      const isBudget = action?.action === 'update_budget' ||
        s.type === 'increase_budget' || s.type === 'decrease_budget';
      if (!isBudget) continue;
      const suggested = Number(action?.suggested_value);
      if (!(realBudget > 0) || !Number.isFinite(suggested) || suggested <= 0) {
        // Sem orçamento conhecido não há como limitar: mantém só como recomendação textual
        s.type = 'general';
        s.suggested_action = {};
        continue;
      }
      const bounded = Math.min(Math.max(suggested, realBudget * 0.7), realBudget * 1.3);
      const objectId = allowedObjects.includes(String(action?.meta_object_id))
        ? String(action.meta_object_id)
        : String(campaign.meta_campaign_id);
      s.suggested_action = {
        action: 'update_budget',
        field: 'daily_budget',
        current_value: realBudget,
        suggested_value: Math.round(bounded * 100) / 100,
        meta_object_id: objectId,
      };
      s.type = bounded >= realBudget ? 'increase_budget' : 'decrease_budget';
    }

    console.log(`✅ [AI-EVAL] Generated ${suggestions.length} suggestions via ${provider}`);

    // Save to DB (include metrics snapshot for audit)
    await saveSuggestions(supabaseClient, user.id, campaign, suggestions, model, provider, metrics);

    return new Response(
      JSON.stringify({
        success: true,
        suggestions,
        metrics,
        source: provider,
        model,
      }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ [AI-EVAL] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Erro interno' }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
});

// Save suggestions to optimization_suggestions table
async function saveSuggestions(
  supabase: any,
  userId: string,
  campaign: any,
  suggestions: any[],
  aiModel: string,
  aiProvider: string,
  metrics: CampaignMetrics | null = null
) {
  // Expire old pending suggestions for this campaign
  await supabase
    .from('optimization_suggestions')
    .update({ status: 'expired' })
    .eq('campaign_id', campaign.id)
    .eq('user_id', userId)
    .eq('status', 'pending');

  // Insert new suggestions
  const rows = suggestions.map((s: any) => ({
    user_id: userId,
    campaign_id: campaign.id,
    meta_campaign_id: campaign.meta_campaign_id,
    type: s.type,
    title: s.title,
    description: s.description,
    severity: s.severity,
    metrics_snapshot: metrics || s.metrics_snapshot || {},
    suggested_action: s.suggested_action || {},
    status: 'pending',
    ai_model: aiModel,
    ai_provider: aiProvider,
  }));

  if (rows.length > 0) {
    const { error } = await supabase
      .from('optimization_suggestions')
      .insert(rows);
    if (error) {
      console.error('⚠️ [AI-EVAL] Failed to save suggestions:', error.message);
    } else {
      console.log(`📥 [AI-EVAL] Saved ${rows.length} suggestions to DB`);
    }
  }
}

// Rule-based fallback when no AI key available
function generateRuleBasedSuggestions(metrics: CampaignMetrics, campaign: any): any[] {
  const suggestions: any[] = [];
  const budget = parseFloat(campaign.budget_daily || campaign.daily_budget || '0');

  // Low CTR
  if (metrics.ctr < 1.0 && metrics.impressions > 500) {
    suggestions.push({
      type: 'update_creative',
      title: 'CTR abaixo do ideal',
      description: `Seu CTR está em ${metrics.ctr.toFixed(2)}% (ideal: acima de 1%). Considere atualizar o criativo do anúncio com imagens mais atrativas ou texto mais direto.`,
      severity: 'warning',
      suggested_action: { action: 'review_creative', meta_object_id: campaign.meta_ad_id },
    });
  }

  // High CPA
  if (metrics.cpa > 50 && metrics.conversions > 0) {
    suggestions.push({
      type: 'adjust_targeting',
      title: 'CPA elevado — ajustar segmentação',
      description: `Seu CPA está em R$ ${metrics.cpa.toFixed(2)}. Refine o público-alvo para melhorar a taxa de conversão e reduzir custos.`,
      severity: 'danger',
      suggested_action: { action: 'adjust_targeting', meta_object_id: campaign.meta_adset_id },
    });
  }

  // Good performance — scale up
  if (metrics.ctr > 2.0 && metrics.cpa < 30 && metrics.conversions > 3 && budget > 0) {
    const newBudget = Math.round(budget * 1.2);
    suggestions.push({
      type: 'increase_budget',
      title: 'Bom desempenho — aumentar orçamento',
      description: `A campanha tem CTR de ${metrics.ctr.toFixed(2)}% e CPA de R$ ${metrics.cpa.toFixed(2)}. Recomendamos aumentar o orçamento de R$ ${budget} para R$ ${newBudget} (+20%).`,
      severity: 'success',
      suggested_action: {
        action: 'update_budget',
        field: 'daily_budget',
        current_value: budget,
        suggested_value: newBudget,
        meta_object_id: campaign.meta_campaign_id,
      },
    });
  }

  // Poor performance — reduce budget
  if (metrics.ctr < 0.5 && metrics.spend > 100 && metrics.conversions === 0 && budget > 0) {
    const newBudget = Math.round(budget * 0.7);
    suggestions.push({
      type: 'decrease_budget',
      title: 'Desempenho fraco — reduzir orçamento',
      description: `R$ ${metrics.spend.toFixed(2)} gastos sem conversões e CTR de ${metrics.ctr.toFixed(2)}%. Reduzir orçamento para R$ ${newBudget} enquanto ajusta a campanha.`,
      severity: 'danger',
      suggested_action: {
        action: 'update_budget',
        field: 'daily_budget',
        current_value: budget,
        suggested_value: newBudget,
        meta_object_id: campaign.meta_campaign_id,
      },
    });
  }

  // Zero impressions
  if (metrics.impressions === 0 && campaign.status === 'active') {
    suggestions.push({
      type: 'general',
      title: 'Campanha sem impressões',
      description: 'A campanha está ativa mas não está gerando impressões. Verifique se o orçamento, segmentação e criativo estão configurados corretamente.',
      severity: 'warning',
      suggested_action: {},
    });
  }

  return suggestions.length > 0 ? suggestions : [{
    type: 'general',
    title: 'Campanha em desempenho normal',
    description: 'As métricas estão dentro dos parâmetros esperados. Continue monitorando.',
    severity: 'info',
    suggested_action: {},
  }];
}
