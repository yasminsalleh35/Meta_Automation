import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScoringRequest {
  responses: Record<string, any>;
  weights: Record<string, number>;
  quiz_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { responses, weights, quiz_id }: ScoringRequest = await req.json();

    console.log('📊 Quiz Lead Scoring - Starting analysis', { quiz_id, responsesCount: Object.keys(responses).length });

    // Buscar configuração de IA ativa
    const { data: aiConfig, error: aiError } = await supabase
      .from('ai_configurations')
      .select('*')
      .eq('is_active', true)
      .eq('is_default', true)
      .single();

    if (aiError || !aiConfig) {
      console.error('❌ No active AI configuration found');
      return new Response(
        JSON.stringify({ error: 'AI configuration not available' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Preparar prompt para análise
    const prompt = `
Você é a IA do Camply, especializada em qualificação de leads para serviços de anúncios digitais.

Analise o seguinte lead baseado nas respostas do quiz:

${JSON.stringify(responses, null, 2)}

Pesos por categoria:
- Urgência (urgency): ${weights.urgency || 1}
- Orçamento (budget): ${weights.budget || 1}
- Perfil (profile): ${weights.profile || 1}
- Necessidades (needs): ${weights.needs || 1}

IMPORTANTE: Retorne APENAS um JSON válido (sem markdown, sem \`\`\`json) com a seguinte estrutura EXATA:

{
  "score": 85,
  "classification": "hot",
  "opportunities": [
    "Lead demonstra urgência alta",
    "Orçamento adequado para serviço premium"
  ],
  "risks": [
    "Pode ter expectativas irreais de ROI"
  ],
  "summary": "Lead qualificado com alta intenção de compra. Empresa estabelecida no segmento de saúde, demonstra entendimento da importância de marketing digital.",
  "recommendation": "Agendar reunião estratégica nas próximas 24h. Apresentar case de sucesso similar no mesmo segmento."
}

Classificação:
- "hot" (80-100): Alta probabilidade de fechamento
- "warm" (50-79): Potencial médio, necessita nutrição
- "cold" (0-49): Baixa prioridade ou não qualificado

Considere especialmente:
- Urgência declarada
- Capacidade de investimento
- Poder de decisão
- Situação atual com anúncios
- Clareza de objetivos`;

    // Chamar API da IA
    let aiResponse;
    
    if (aiConfig.provider === 'openai') {
      const apiKey = aiConfig.api_key;
      
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: aiConfig.model_name || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Você é um assistente especializado em qualificação de leads. Retorne apenas JSON válido.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.status}`);
      }

      const openaiData = await openaiResponse.json();
      const content = openaiData.choices[0].message.content;
      
      // Parse JSON removendo possíveis markdown
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      aiResponse = JSON.parse(cleanContent);
    } else {
      // Fallback para scoring simples baseado em regras
      aiResponse = calculateRuleBasedScoring(responses, weights);
    }

    console.log('✅ Quiz Lead Scoring - Analysis complete', { 
      score: aiResponse.score, 
      classification: aiResponse.classification 
    });

    return new Response(
      JSON.stringify(aiResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Quiz Lead Scoring - Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        fallback: calculateRuleBasedScoring({}, {})
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Função de fallback com scoring baseado em regras
function calculateRuleBasedScoring(responses: Record<string, any>, weights: Record<string, number>) {
  let score = 50; // Base score
  
  // Urgência
  if (responses.urgency_level === 'imediato') score += 20;
  else if (responses.urgency_level === 'semana') score += 15;
  else if (responses.urgency_level === 'mes') score += 10;
  
  // Orçamento
  if (responses.monthly_budget === '5000+') score += 20;
  else if (responses.monthly_budget === '3000_5000') score += 15;
  else if (responses.monthly_budget === '1000_3000') score += 10;
  
  // Decisor
  if (responses.decision_maker === 'eu_decido') score += 10;
  else if (responses.decision_maker === 'consulto') score += 5;
  
  // Situação atual
  if (responses.current_ads_status === 'anunciando_muito') score += 10;
  else if (responses.current_ads_status === 'nunca_anunciou') score += 5;
  
  // Leads diários (quanto menos, mais precisa)
  if (responses.daily_leads === '0-5') score += 10;
  
  score = Math.min(100, Math.max(0, score));
  
  const classification = score >= 80 ? 'hot' : score >= 50 ? 'warm' : 'cold';
  
  return {
    score,
    classification,
    opportunities: ['Lead qualificado automaticamente'],
    risks: ['Análise simplificada - IA indisponível'],
    summary: `Lead classificado com score ${score} baseado em regras automáticas.`,
    recommendation: score >= 80 ? 'Contatar imediatamente' : score >= 50 ? 'Incluir em fluxo de nutrição' : 'Baixa prioridade'
  };
}
