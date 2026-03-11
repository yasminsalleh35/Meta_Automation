
interface BusinessData {
  name: string;
  description: string;
  mainProduct: string;
  category: string;
  targetAudience: string;
  businessGoals: string;
}

interface AIConfig {
  provider: 'openai' | 'deepseek';
  apiKey: string;
  model: string;
  enabled: boolean;
  context: {
    metaAds: string;
    googleAds: string;
    general: string;
  };
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

interface CampaignAnalysis {
  performanceScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  summary: string;
  nextActions: string[];
}

interface CampaignData {
  id: string;
  name: string;
  objective: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  leads: number;
  ctr: number;
  cpa: number;
  roas: number;
  startDate: string;
  endDate?: string;
}

export class OpenAIService {
  private async getAdminAIConfig(): Promise<AIConfig | null> {
    try {
      // Usar instância singleton do Supabase
      const { supabase } = await import('@/integrations/supabase/client');

      console.log('Buscando configuração de IA do admin...');
      
      // Buscar configuração ativa usando função administrativa segura (não expõe API keys)
      const { data: aiConfigs, error } = await supabase
        .rpc('get_ai_configurations_admin_safe')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (error) {
        console.warn('Erro ao buscar configuração do admin:', error);
        // Fallback para localStorage se não conseguir buscar do admin
        return this.getLocalConfig();
      }

      if (aiConfigs) {
        console.log('Configuração encontrada no admin:', aiConfigs);
        // Nota: A função segura não retorna API keys por segurança
        // Para acessar API keys, isso deveria ser feito em Edge Functions
        console.warn('API keys não disponíveis via função segura - use Edge Functions para acessar');
        return this.getLocalConfig(); // Fallback para localStorage por enquanto
      }

      // Se não encontrou no admin, usar localStorage
      return this.getLocalConfig();
    } catch (error) {
      console.error('Erro ao buscar configuração do admin:', error);
      return this.getLocalConfig();
    }
  }

  private getLocalConfig(): AIConfig | null {
    const configStr = localStorage.getItem('camply_ai_config');
    return configStr ? JSON.parse(configStr) : null;
  }

  private getProviderUrl(provider: 'openai' | 'deepseek'): string {
    switch (provider) {
      case 'openai':
        return 'https://api.openai.com/v1/chat/completions';
      case 'deepseek':
        return 'https://api.deepseek.com/v1/chat/completions';
      default:
        throw new Error(`Provedor não suportado: ${provider}`);
    }
  }

  async analyzeCampaign(campaign: CampaignData): Promise<CampaignAnalysis> {
    const config = await this.getAdminAIConfig();

    if (!config || !config.enabled || !config.apiKey) {
      throw new Error('Camply IA não está configurada. Configure nas configurações de admin.');
    }

    console.log('Analisando campanha com provedor:', config.provider);

    const prompt = this.buildAnalysisPrompt(campaign);

    try {
      return await this.callAIProviderForAnalysis(config.provider, config.model, config.apiKey, prompt, campaign);
    } catch (error) {
      console.warn(`Falha no provedor principal (${config.provider}):`, error);
      throw error;
    }
  }

  private async callAIProviderForAnalysis(
    provider: 'openai' | 'deepseek',
    model: string,
    apiKey: string,
    prompt: string,
    campaign: CampaignData
  ): Promise<CampaignAnalysis> {
    const apiUrl = this.getProviderUrl(provider);
    const startTime = Date.now();

    console.log(`Consultando ${provider} para análise...`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em marketing digital e análise de campanhas do Facebook e Instagram Ads. 
            Analise campanhas de forma didática e amigável para pequenos e médios empresários brasileiros.
            Sempre forneça respostas em português brasileiro com linguagem acessível.`
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

    const responseTime = Date.now() - startTime;
    console.log(`Tempo de resposta ${provider}: ${responseTime}ms`);

    if (!response.ok) {
      let errorMessage = `Erro na ${provider === 'openai' ? 'OpenAI' : 'DeepSeek'}: ${response.status}`;
      
      if (response.status === 401) {
        errorMessage = 'API Key inválida. Verifique suas configurações.';
      } else if (response.status === 429) {
        errorMessage = 'Limite de requisições atingido. Tente novamente mais tarde.';
      } else if (response.status === 402) {
        errorMessage = 'Conta sem créditos. Adicione créditos na sua conta.';
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const analysis = data.choices[0]?.message?.content;

    if (!analysis) {
      throw new Error(`Resposta vazia da ${provider}`);
    }

    this.logMetrics(provider, model, responseTime, prompt.length, analysis.length);

    return this.parseAnalysisResponse(analysis, campaign);
  }

  private buildAnalysisPrompt(campaign: CampaignData): string {
    const spentPercentage = ((campaign.spent / campaign.budget) * 100).toFixed(1);
    const conversionRate = campaign.impressions > 0 ? ((campaign.leads / campaign.impressions) * 100).toFixed(3) : '0';
    
    return `
Analise esta campanha de marketing digital:

**DADOS DA CAMPANHA:**
- Nome: ${campaign.name}
- Objetivo: ${campaign.objective}
- Orçamento: R$ ${campaign.budget.toFixed(2)}
- Gasto: R$ ${campaign.spent.toFixed(2)} (${spentPercentage}% do orçamento)
- Impressões: ${campaign.impressions.toLocaleString('pt-BR')}
- Cliques: ${campaign.clicks.toLocaleString('pt-BR')}
- Leads: ${campaign.leads}
- CTR: ${campaign.ctr.toFixed(2)}%
- CPA: R$ ${campaign.cpa.toFixed(2)}
- ROAS: ${campaign.roas.toFixed(1)}x
- Taxa de Conversão: ${conversionRate}%
- Período: ${campaign.startDate} ${campaign.endDate ? `até ${campaign.endDate}` : '(em andamento)'}

Forneça uma análise completa no seguinte formato JSON:
{
  "performanceScore": [número de 0 a 100],
  "strengths": ["ponto forte 1", "ponto forte 2"],
  "weaknesses": ["ponto fraco 1", "ponto fraco 2"],
  "recommendations": ["recomendação 1", "recomendação 2", "recomendação 3"],
  "summary": "resumo geral do desempenho em linguagem simples",
  "nextActions": ["próxima ação 1", "próxima ação 2"]
}

IMPORTANTE:
- Use linguagem simples e didática
- Considere que o usuário pode não entender termos técnicos
- Seja específico nas recomendações
- Foque em ações práticas que podem ser implementadas
`;
  }

  private parseAnalysisResponse(response: string, campaign: CampaignData): CampaignAnalysis {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          performanceScore: parsed.performanceScore || this.calculateBasicScore(campaign),
          strengths: parsed.strengths || [],
          weaknesses: parsed.weaknesses || [],
          recommendations: parsed.recommendations || [],
          summary: parsed.summary || 'Análise gerada com base nos dados da campanha.',
          nextActions: parsed.nextActions || []
        };
      }
    } catch (error) {
      console.warn('Falha ao fazer parse da análise, usando fallback');
    }

    return this.generateFallbackAnalysis(campaign);
  }

  private calculateBasicScore(campaign: CampaignData): number {
    let score = 50;
    
    if (campaign.ctr > 3) score += 20;
    else if (campaign.ctr > 2) score += 10;
    else if (campaign.ctr < 1) score -= 15;
    
    if (campaign.roas > 4) score += 25;
    else if (campaign.roas > 3) score += 15;
    else if (campaign.roas > 2) score += 5;
    else if (campaign.roas < 2) score -= 20;
    
    const spentPercentage = (campaign.spent / campaign.budget) * 100;
    if (spentPercentage > 90 && spentPercentage <= 100) score += 5;
    else if (spentPercentage < 50) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }

  private generateFallbackAnalysis(campaign: CampaignData): CampaignAnalysis {
    const score = this.calculateBasicScore(campaign);
    
    return {
      performanceScore: score,
      strengths: campaign.ctr > 2 ? ['Taxa de cliques acima da média'] : [],
      weaknesses: campaign.roas < 2 ? ['Retorno sobre investimento baixo'] : [],
      recommendations: [
        'Revise o público-alvo da campanha',
        'Teste diferentes criativos',
        'Ajuste o orçamento baseado no desempenho'
      ],
      summary: `Campanha com score de ${score}/100. ${score > 70 ? 'Bom desempenho geral.' : score > 50 ? 'Desempenho médio, há oportunidades de melhoria.' : 'Precisa de otimizações urgentes.'}`,
      nextActions: [
        'Monitorar métricas diariamente',
        'Implementar as recomendações sugeridas'
      ]
    };
  }

  async generateCampaignSuggestions(objective: string): Promise<CampaignSuggestion> {
    const config = await this.getAdminAIConfig();
    const businessData = await this.getBusinessData();

    if (!config || !config.enabled || !config.apiKey) {
      throw new Error('Camply IA não está configurada. Configure nas configurações de admin.');
    }

    console.log('Dados do negócio carregados:', businessData);

    let context = config.context.general;
    if (objective.includes('whatsapp') || objective.includes('social')) {
      context = config.context.metaAds;
    }

    const prompt = this.buildPrompt(businessData, objective, context);

    try {
      return await this.callAIProvider(config.provider, config.model, config.apiKey, context, prompt);
    } catch (error) {
      console.warn(`Falha no provedor principal (${config.provider}):`, error);
      throw error;
    }
  }

  private async callAIProvider(
    provider: 'openai' | 'deepseek',
    model: string,
    apiKey: string,
    context: string,
    prompt: string
  ): Promise<CampaignSuggestion> {
    const apiUrl = this.getProviderUrl(provider);
    const startTime = Date.now();

    console.log(`Consultando ${provider}...`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: context
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

    const responseTime = Date.now() - startTime;
    console.log(`Tempo de resposta ${provider}: ${responseTime}ms`);

    if (!response.ok) {
      let errorMessage = `Erro na ${provider === 'openai' ? 'OpenAI' : 'DeepSeek'}: ${response.status}`;
      
      if (response.status === 401) {
        errorMessage = 'API Key inválida. Verifique suas configurações.';
      } else if (response.status === 429) {
        errorMessage = 'Limite de requisições atingido. Tente novamente mais tarde.';
      } else if (response.status === 402) {
        errorMessage = 'Conta sem créditos. Adicione créditos na sua conta.';
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error(`Resposta vazia da ${provider}`);
    }

    this.logMetrics(provider, model, responseTime, prompt.length, aiResponse.length);

    return this.parseAIResponseWithFallback(aiResponse, await this.getBusinessData());
  }

  private logMetrics(
    provider: string, 
    model: string, 
    responseTime: number, 
    inputTokens: number, 
    outputTokens: number
  ): void {
    const metric = {
      provider,
      model,
      timestamp: new Date().toISOString(),
      responseTime,
      inputTokens,
      outputTokens,
      cost: this.calculateCost(provider, model, inputTokens, outputTokens)
    };

    const existingMetrics = JSON.parse(localStorage.getItem('camply_ai_metrics') || '[]');
    existingMetrics.push(metric);
    
    if (existingMetrics.length > 1000) {
      existingMetrics.splice(0, existingMetrics.length - 1000);
    }
    
    localStorage.setItem('camply_ai_metrics', JSON.stringify(existingMetrics));
  }

  private calculateCost(provider: string, model: string, inputTokens: number, outputTokens: number): number {
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
      'gpt-4o': { input: 0.005, output: 0.015 },
      'deepseek-chat': { input: 0.000014, output: 0.000028 }
    };

    const modelPricing = pricing[model] || { input: 0.0001, output: 0.0002 };
    
    return ((inputTokens / 1000) * modelPricing.input) + ((outputTokens / 1000) * modelPricing.output);
  }

  private buildPrompt(businessData: BusinessData | null, objective: string, context: string): string {
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

IMPORTANTE: Responda APENAS com o JSON válido, sem texto adicional.
`;
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
    "state": "código do estado brasileiro mais adequado para este tipo de negócio",
    "city": "all ou cidade específica se apropriado"
  },
  "audience": {
    "gender": "all, male ou female baseado no público-alvo descrito",
    "ageMin": idade_minima_adequada_para_o_negocio,
    "ageMax": idade_maxima_adequada_para_o_negocio
  },
  "budget": {
    "daily": valor_diario_recomendado_para_este_tipo_de_negocio,
    "total": valor_total_mensal_recomendado
  },
  "duration": {
    "startDate": "${nextWeek.toISOString().split('T')[0]}",
    "endDate": "${nextMonth.toISOString().split('T')[0]}"
  }
}

IMPORTANTE: 
- Responda APENAS com o JSON válido, sem texto adicional
- Baseie TODAS as sugestões nas informações específicas do negócio
- Use códigos de estado brasileiros válidos (SP, RJ, MG, RS, SC, PR, etc.)
- Valores de orçamento devem ser números inteiros apropriados para o tipo de negócio
- Personalize completamente o texto e título do anúncio para o negócio específico
`;
  }

  private async parseAIResponseWithFallback(response: string, businessData: BusinessData | null): Promise<CampaignSuggestion> {
    console.log('🤖 Resposta bruta da IA:', response);
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('📊 JSON parseado da IA:', parsed);
        
        // Verificar se o título está personalizado
        const isGenericTitle = !parsed.adTitle || 
          parsed.adTitle === 'Transforme seu negócio hoje mesmo!' ||
          parsed.adTitle.includes('seu negócio') ||
          parsed.adTitle.length < 10;
          
        console.log('🎯 Título personalizado?', !isGenericTitle, 'Título:', parsed.adTitle);
        
        const smartTitle = isGenericTitle ? 
          await this.generateSmartTitle(businessData) : 
          parsed.adTitle;
          
        console.log('✨ Título final escolhido:', smartTitle);
        
        return {
          interests: Array.isArray(parsed.interests) ? parsed.interests : [],
          adText: parsed.adText || this.generateSmartAdText(businessData),
          adTitle: smartTitle,
          audienceInsights: parsed.audienceInsights || 'Sugestões geradas com base nas informações do seu negócio.',
          budgetRecommendation: parsed.budgetRecommendation || 'Recomendamos começar com um orçamento de R$ 50-100 por dia.',
          location: {
            state: parsed.location?.state || 'SP',
            city: parsed.location?.city || 'all'
          },
          audience: {
            gender: ['all', 'male', 'female'].includes(parsed.audience?.gender) ? parsed.audience.gender : 'all',
            ageMin: Math.max(18, Math.min(65, parsed.audience?.ageMin || 25)),
            ageMax: Math.max(18, Math.min(65, parsed.audience?.ageMax || 45))
          },
          budget: {
            daily: Math.max(10, parsed.budget?.daily || 50),
            total: Math.max(100, parsed.budget?.total || 1500)
          },
          duration: {
            startDate: parsed.duration?.startDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            endDate: parsed.duration?.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }
        };
      }
    } catch (error) {
      console.error('❌ Falha ao fazer parse da resposta JSON:', error);
      console.log('📝 Resposta que causou erro:', response);
    }

    console.log('🔄 Usando fallback completo');
    return {
      interests: ['marketing digital', 'empreendedorismo', 'vendas online', 'redes sociais', 'negócios'],
      adText: this.generateSmartAdText(businessData),
      adTitle: await this.generateSmartTitle(businessData),
      audienceInsights: 'Sugestões geradas com base nas informações do seu negócio.',
      budgetRecommendation: 'Recomendamos começar com um orçamento de R$ 50-100 por dia.',
      location: {
        state: 'SP',
        city: 'all'
      },
      audience: {
        gender: 'all',
        ageMin: 25,
        ageMax: 45
      },
      budget: {
        daily: 50,
        total: 1500
      },
      duration: {
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    };
  }

  private async generateSmartTitle(businessData: BusinessData | null): Promise<string> {
    console.log('🔍 DEBUG generateSmartTitle - businessData recebido:', businessData);
    console.log('🔍 DEBUG - businessData.name:', businessData?.name);
    console.log('🔍 DEBUG - businessData.category:', businessData?.category);
    
    // Se não temos dados, tentar recuperar diretamente
    if (!businessData || !businessData.name) {
      console.log('⚠️ BusinessData nulo - tentando recuperar diretamente...');
      try {
        const freshBusinessData = await this.getBusinessDataSync();
        if (freshBusinessData && freshBusinessData.name) {
          console.log('✅ Dados recuperados com sucesso:', freshBusinessData);
          businessData = freshBusinessData;
        } else {
          console.log('❌ Não foi possível recuperar dados válidos');
        }
      } catch (error) {
        console.error('❌ Erro ao tentar recuperar dados:', error);
      }
    }

    // Ainda sem dados válidos? Usar título personalizado baseado no localStorage
    if (!businessData || !businessData.name) {
      console.log('🔄 Tentando localStorage como último recurso...');
      const localData = this.getLocalBusinessData();
      if (localData && localData.name) {
        console.log('✅ Dados encontrados no localStorage:', localData);
        businessData = localData;
      }
    }

    // Se AINDA não temos dados, usar título mais genérico mas útil
    if (!businessData || !businessData.name) {
      console.log('❌ FALLBACK FINAL - sem dados de negócio disponíveis');
      return 'Descubra como podemos transformar seus resultados!';
    }

    const category = businessData.category?.toLowerCase() || '';
    const name = businessData.name;
    const product = businessData.mainProduct || '';
    
    console.log('✨ Gerando título personalizado para:', { name, category, product });

    // Títulos específicos por categoria
    if (category.includes('odontolog') || category.includes('dental') || category.includes('dentista')) {
      const dentalTitles = [
        `✨ ${name} - Seu sorriso perfeito te espera!`,
        `Transforme seu sorriso com a ${name}`,
        `${name} - Tratamentos dentais de excelência`,
        `Sorriso dos sonhos? A ${name} realiza!`
      ];
      const selectedTitle = dentalTitles[Math.floor(Math.random() * dentalTitles.length)];
      console.log('🦷 Título dental selecionado:', selectedTitle);
      return selectedTitle;
    } 
    
    if (category.includes('saúde') || category.includes('clínica') || category.includes('médic')) {
      const healthTitle = `${name} - Cuidando da sua saúde com excelência`;
      console.log('🏥 Título de saúde:', healthTitle);
      return healthTitle;
    }
    
    if (category.includes('beleza') || category.includes('estética')) {
      const beautyTitle = `${name} - Realce sua beleza natural`;
      console.log('💄 Título de beleza:', beautyTitle);
      return beautyTitle;
    }
    
    if (category.includes('educação') || category.includes('curso')) {
      const eduTitle = `${name} - Transforme seu futuro profissional`;
      console.log('🎓 Título educacional:', eduTitle);
      return eduTitle;
    }

    // Título personalizado genérico
    if (product) {
      const productTitle = `${name} - ${product} de qualidade`;
      console.log('🛍️ Título com produto:', productTitle);
      return productTitle;
    }

    const generalTitle = `${name} - A solução que você procurava`;
    console.log('🎯 Título geral personalizado:', generalTitle);
    return generalTitle;
  }

  private generateSmartAdText(businessData: BusinessData | null): string {
    if (!businessData || !businessData.name) {
      return 'Descubra como nossos produtos/serviços podem transformar seu dia a dia! Entre em contato e saiba mais. 🚀';
    }

    const name = businessData.name;
    const category = businessData.category?.toLowerCase() || '';
    const product = businessData.mainProduct || 'nossos serviços';

    if (category.includes('odontolog') || category.includes('dental') || category.includes('dentista')) {
      return `✨ Transforme seu sorriso com a ${name}! Oferecemos ${product} com tecnologia moderna e atendimento humanizado. Agende sua consulta e descubra o sorriso dos seus sonhos! 😊`;
    }

    if (category.includes('saúde') || category.includes('clínica') || category.includes('médic')) {
      return `🏥 ${name} - Sua saúde em primeiro lugar! Oferecemos ${product} com profissionais qualificados. Agende sua consulta e cuide de você! 💙`;
    }

    return `🚀 Conheça a ${name}! Oferecemos ${product} de qualidade para você. Entre em contato e saiba como podemos te ajudar!`;
  }

  getMetrics(): any[] {
    return JSON.parse(localStorage.getItem('camply_ai_metrics') || '[]');
  }

  async getBusinessData(): Promise<BusinessData | null> {
    try {
      console.log('Carregando dados do negócio para contexto da IA...');
      
      const { supabase } = await import('@/integrations/supabase/client');

      const { data: session } = await supabase.auth.getSession();
      
      if (session?.session) {
        console.log('Usuário autenticado, buscando dados no Supabase...');
        const { data, error } = await supabase
          .from('business_settings')
          .select('*')
          .eq('user_id', session.session.user.id)
          .maybeSingle();

        if (!error && data) {
          console.log('Dados encontrados no Supabase:', data);
          const businessData = {
            name: data.business_name || '',
            description: data.business_description || '',
            mainProduct: data.main_product || '',
            category: data.category || '',
            targetAudience: data.target_audience || '',
            businessGoals: data.business_goals || ''
          };

          if (businessData.name || businessData.description) {
            return businessData;
          }
        }
      }

      // Fallback para localStorage
      const businessStr = localStorage.getItem('camply_business_data');
      if (businessStr) {
        console.log('Dados encontrados no localStorage');
        const localData = JSON.parse(businessStr);
        
        if (localData.name || localData.description) {
          return localData;
        }
      }

      console.log('Nenhum dado válido de negócio encontrado');
      return null;
    } catch (error) {
      console.error('Erro ao carregar dados do negócio:', error);
      
      const businessStr = localStorage.getItem('camply_business_data');
      if (businessStr) {
        try {
          return JSON.parse(businessStr);
        } catch (parseError) {
          console.error('Erro ao fazer parse dos dados do localStorage:', parseError);
        }
      }
      return null;
    }
  }

  private async getBusinessDataSync(): Promise<BusinessData | null> {
    try {
      console.log('🔄 Tentativa síncrona de recuperar dados do negócio...');
      
      const { supabase } = await import('@/integrations/supabase/client');

      const { data: session } = await supabase.auth.getSession();
      
      if (session?.session) {
        const { data, error } = await supabase
          .from('business_settings')
          .select('*')
          .eq('user_id', session.session.user.id)
          .maybeSingle();

        if (!error && data && data.business_name) {
          const businessData = {
            name: data.business_name || '',
            description: data.business_description || '',
            mainProduct: data.main_product || '',
            category: data.category || '',
            targetAudience: data.target_audience || '',
            businessGoals: data.business_goals || ''
          };
          
          // Salvar no localStorage para cache
          localStorage.setItem('camply_business_data', JSON.stringify(businessData));
          
          return businessData;
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Erro na recuperação síncrona:', error);
      return null;
    }
  }

  private getLocalBusinessData(): BusinessData | null {
    try {
      const businessStr = localStorage.getItem('camply_business_data');
      if (businessStr) {
        const localData = JSON.parse(businessStr);
        if (localData.name) {
          return localData;
        }
      }
      return null;
    } catch (error) {
      console.error('❌ Erro ao ler localStorage:', error);
      return null;
    }
  }
}

export const openaiService = new OpenAIService();
