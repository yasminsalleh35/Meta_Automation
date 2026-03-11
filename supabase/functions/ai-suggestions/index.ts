import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { toMessage, toObject } from '../_shared/errors.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache de sugestões para reduzir chamadas à API
const responseCache = new Map<string, { response: CampaignSuggestion; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

interface BusinessData {
  name?: string;
  description?: string;
  mainProduct?: string;
  category?: string;
  targetAudience?: string;
  businessGoals?: string;
}

interface AIConfig {
  provider: 'openai' | 'deepseek';
  api_key: string;
  model_name: string;
}

interface CampaignSuggestion {
  interests: string[];
  adText: string;
  adTitle: string;
  audienceInsights: string;
  budgetRecommendation: string;
  location: {
    state: string;
    city: string;
  };
  audience: {
    gender: 'all' | 'male' | 'female';
    ageMin: number;
    ageMax: number;
  };
  budget: {
    daily: number;
    total: number;
  };
  duration: {
    startDate: string;
    endDate: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { objective } = await req.json();
    
    if (!objective) {
      throw new Error('Objetivo da campanha é obrigatório');
    }

    console.log('🤖 Processando sugestão de IA para objetivo:', objective);

    // Criar cliente Supabase para acessar configuração
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar configuração ativa de IA diretamente da base
    const { data: aiConfig, error: configError } = await supabase
      .from('ai_configurations')
      .select('provider, api_key, model_name')
      .eq('is_active', true)
      .eq('is_default', true)
      .single();

    if (configError || !aiConfig) {
      console.error('❌ Configuração de IA não encontrada:', configError);
      throw new Error('IA não configurada. Configure a integração de IA nas configurações de admin.');
    }

    if (!aiConfig.api_key) {
      throw new Error('API Key não configurada. Configure a integração de IA nas configurações de admin.');
    }

    console.log('✅ Configuração de IA encontrada:', { 
      provider: aiConfig.provider, 
      model: aiConfig.model_name,
      hasApiKey: !!aiConfig.api_key
    });

    // Buscar dados do negócio do usuário (se autenticado)
    let businessData: BusinessData | null = null;
    
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      
      // Criar cliente com JWT do usuário para buscar seus dados
      const userSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      });

      const { data: businessSettings } = await userSupabase
        .from('business_settings')
        .select('business_name, business_description, main_product, category, target_audience, business_goals')
        .single();

      if (businessSettings) {
        businessData = {
          name: businessSettings.business_name,
          description: businessSettings.business_description,
          mainProduct: businessSettings.main_product,
          category: businessSettings.category,
          targetAudience: businessSettings.target_audience,
          businessGoals: businessSettings.business_goals
        };
        console.log('📊 Dados do negócio carregados:', businessData);
      }
    }

    // Verificar cache de respostas
    const cacheKey = `${objective}_${businessData?.name || 'generic'}`;
    const cachedResponse = responseCache.get(cacheKey);

    if (cachedResponse && (Date.now() - cachedResponse.timestamp) < CACHE_DURATION) {
      console.log('📦 Usando resposta do cache (5 minutos)');
      return new Response(
        JSON.stringify(cachedResponse.response),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gerar sugestões usando o provedor configurado
    const suggestions = await generateAISuggestions(aiConfig, businessData, objective);
    
    // Armazenar no cache
    responseCache.set(cacheKey, { response: suggestions, timestamp: Date.now() });
    
    console.log('✅ Sugestões geradas com sucesso e armazenadas no cache');
    
    return new Response(
      JSON.stringify(suggestions),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: unknown) {
    console.error('❌ Erro na Edge Function:', toObject(err));
    
    let errorMessage = 'Erro ao gerar sugestões de IA';
    
    const errorMsg = toMessage(err);
    if (errorMsg.includes('não configurada') || errorMsg.includes('não encontrada')) {
      errorMessage = 'IA não configurada. Configure a integração de IA nas configurações de admin.';
    } else if (errorMsg.includes('API Key')) {
      errorMessage = 'Chave de API inválida. Verifique sua configuração de IA.';
    } else if (errorMsg.includes('401')) {
      errorMessage = 'Chave de API inválida. Verifique sua configuração de IA.';
    } else if (errorMsg.includes('429')) {
      errorMessage = 'Limite de requisições atingido. Tente novamente em alguns minutos.';
    } else if (errorMsg.includes('402')) {
      errorMessage = 'Conta sem créditos. Adicione créditos na sua conta de IA.';
    } else {
      errorMessage = `Erro na IA: ${errorMsg}`;
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function generateAISuggestions(
  config: AIConfig,
  businessData: BusinessData | null,
  objective: string
): Promise<CampaignSuggestion> {
  const apiUrl = getProviderUrl(config.provider);
  const prompt = buildPrompt(businessData, objective);
  
  console.log(`🚀 Chamando ${config.provider} com modelo ${config.model_name}...`);
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.api_key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model_name,
      messages: [
        {
          role: 'system',
          content: `Você é um especialista em marketing digital e campanhas do Facebook e Instagram Ads.
          Crie sugestões específicas e práticas para pequenos e médios empresários brasileiros.
          Sempre responda em português brasileiro com linguagem acessível.
          Foque em resultados práticos e orçamentos realistas para PMEs.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Erro na API ${config.provider}:`, response.status, errorText);
    
    if (response.status === 401) {
      throw new Error('API Key inválida');
    } else if (response.status === 429) {
      throw new Error('Limite de requisições atingido');
    } else if (response.status === 402) {
      throw new Error('Conta sem créditos');
    } else {
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }
  }

  const data = await response.json();
  const aiResponse = data.choices[0]?.message?.content;

  if (!aiResponse) {
    throw new Error(`Resposta vazia da ${config.provider}`);
  }

  console.log('📝 Resposta da IA recebida, fazendo parse...');
  return parseAIResponse(aiResponse, businessData);
}

function getProviderUrl(provider: 'openai' | 'deepseek'): string {
  switch (provider) {
    case 'openai':
      return 'https://api.openai.com/v1/chat/completions';
    case 'deepseek':
      return 'https://api.deepseek.com/v1/chat/completions';
    default:
      throw new Error(`Provedor não suportado: ${provider}`);
  }
}

function buildPrompt(businessData: BusinessData | null, objective: string): string {
  const currentDate = new Date();
  const nextWeek = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000);

  if (!businessData || (!businessData.name && !businessData.description)) {
    return `
Preciso de sugestões COMPLETAS para uma campanha de anúncios com o seguinte objetivo: ${objective}

Como não tenho informações específicas do negócio, forneça sugestões genéricas mas úteis no seguinte formato JSON EXATO:
{
  "interests": ["interesse1", "interesse2", "interesse3", "interesse4", "interesse5"],
  "adText": "texto do anúncio sugerido",
  "adTitle": "título chamativo para o anúncio",
  "audienceInsights": "insights detalhados sobre o público-alvo",
  "budgetRecommendation": "recomendação de orçamento detalhada",
  "location": {
    "state": "SP",
    "city": "all"
  },
  "audience": {
    "gender": "all",
    "ageMin": 25,
    "ageMax": 45
  },
  "budget": {
    "daily": 50,
    "total": 1500
  },
  "duration": {
    "startDate": "${nextWeek.toISOString().split('T')[0]}",
    "endDate": "${nextMonth.toISOString().split('T')[0]}"
  }
}

IMPORTANTE: Responda APENAS com o JSON válido, sem texto adicional.`;
  }

  return `
Com base nas informações do negócio abaixo, preciso de sugestões COMPLETAS para uma campanha de anúncios:

**INFORMAÇÕES DO NEGÓCIO:**
- Nome: ${businessData.name || 'Não informado'}
- Descrição: ${businessData.description || 'Não informada'}
- Produto/Serviço Principal: ${businessData.mainProduct || 'Não informado'}
- Categoria: ${businessData.category || 'Não informada'}
- Público-Alvo: ${businessData.targetAudience || 'Não informado'}
- Objetivos: ${businessData.businessGoals || 'Não informados'}

**OBJETIVO DA CAMPANHA:** ${objective}

Por favor, forneça sugestões COMPLETAS baseadas no contexto do negócio no seguinte formato JSON EXATO:
{
  "interests": ["interesse1", "interesse2", "interesse3", "interesse4", "interesse5"],
  "adText": "texto do anúncio personalizado baseado no negócio e produto/serviço",
  "adTitle": "título específico e chamativo para ${businessData.name || 'o negócio'} - NUNCA use títulos genéricos como 'Transforme seu negócio'",
  "audienceInsights": "insights detalhados sobre o público-alvo baseado no perfil do negócio",
  "budgetRecommendation": "recomendação de orçamento específica considerando o tipo de negócio e objetivos",
  "location": {
    "state": "SP",
    "city": "all"
  },
  "audience": {
    "gender": "all",
    "ageMin": 25,
    "ageMax": 45
  },
  "budget": {
    "daily": 75,
    "total": 2250
  },
  "duration": {
    "startDate": "${nextWeek.toISOString().split('T')[0]}",
    "endDate": "${nextMonth.toISOString().split('T')[0]}"
  }
}

IMPORTANTE: 
- Responda APENAS com o JSON válido, sem texto adicional
- Personalize completamente baseado no negócio específico
- Use valores realistas para PMEs brasileiras
- Seja específico nos interesses baseados na categoria do negócio`;
}

function parseAIResponse(response: string, businessData: BusinessData | null): CampaignSuggestion {
  try {
    // Tentar extrair JSON da resposta
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validar e garantir que todos os campos estão presentes
      return {
        interests: parsed.interests || ["marketing digital", "empreendedorismo", "negócios online", "vendas", "publicidade"],
        adText: parsed.adText || `Descubra como ${businessData?.name || 'nosso serviço'} pode transformar seus resultados. Clique e saiba mais!`,
        adTitle: parsed.adTitle || `${businessData?.name || 'Oportunidade Especial'} - Resultados Garantidos`,
        audienceInsights: parsed.audienceInsights || "Público interessado em soluções práticas para negócios",
        budgetRecommendation: parsed.budgetRecommendation || "Orçamento inicial recomendado para teste de mercado",
        location: {
          state: parsed.location?.state || "SP",
          city: parsed.location?.city || "all"
        },
        audience: {
          gender: parsed.audience?.gender || "all",
          ageMin: parsed.audience?.ageMin || 25,
          ageMax: parsed.audience?.ageMax || 45
        },
        budget: {
          daily: parsed.budget?.daily || 50,
          total: parsed.budget?.total || 1500
        },
        duration: {
          startDate: parsed.duration?.startDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: parsed.duration?.endDate || new Date(Date.now() + 37 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      };
    }
  } catch (error) {
    console.warn('❌ Falha ao fazer parse da resposta da IA:', error);
  }

  // Fallback com sugestões genéricas
  console.log('📝 Usando fallback para sugestões');
  return generateFallbackSuggestions(businessData);
}

function generateFallbackSuggestions(businessData: BusinessData | null): CampaignSuggestion {
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const nextMonth = new Date(Date.now() + 37 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  return {
    interests: ["marketing digital", "empreendedorismo", "negócios", "vendas", "publicidade online"],
    adText: `Descubra como ${businessData?.name || 'nossos serviços'} podem transformar seus resultados. Agende uma consulta gratuita!`,
    adTitle: `${businessData?.name || 'Oportunidade Especial'} - Resultados Comprovados`,
    audienceInsights: "Público interessado em soluções práticas para crescimento de negócios",
    budgetRecommendation: "Orçamento inicial de R$ 50/dia para teste de mercado e otimização gradual",
    location: {
      state: "SP",
      city: "all"
    },
    audience: {
      gender: "all",
      ageMin: 25,
      ageMax: 45
    },
    budget: {
      daily: 50,
      total: 1500
    },
    duration: {
      startDate: nextWeek,
      endDate: nextMonth
    }
  };
}