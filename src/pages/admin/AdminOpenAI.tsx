
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Brain, Key, MessageSquare, TestTube, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';

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

const AdminOpenAI = () => {
  const { toast } = useToast();
  const { role } = useUserRole();
  const [config, setConfig] = useState<AIConfig>({
    provider: 'deepseek',
    apiKey: '',
    model: 'deepseek-chat',
    enabled: false,
    context: {
      metaAds: '',
      googleAds: '',
      general: ''
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Carregar configurações salvas
  useEffect(() => {
    const savedConfig = localStorage.getItem('camply_ai_config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    } else {
      // Configurar contextos padrão
      setConfig(prev => ({
        ...prev,
        context: {
          metaAds: `Você é um especialista em Meta Ads (Facebook e Instagram Ads) com mais de 10 anos de experiência. Você domina:

- Configuração e otimização de campanhas
- Segmentação de audiências e lookalike audiences
- Criação de criativos eficazes
- Análise de métricas (CTR, CPC, ROAS, etc.)
- Facebook Business Manager e Ads Manager
- Pixel do Facebook e eventos de conversão
- Testes A/B e otimização contínua
- Compliance com políticas do Meta

Sempre forneça respostas práticas, específicas e baseadas em melhores práticas atuais do Meta Ads.`,

          googleAds: `Você é um especialista em Google Ads com mais de 10 anos de experiência. Você domina:

- Configuração e otimização de campanhas (Search, Display, Shopping, YouTube)
- Pesquisa e seleção de palavras-chave
- Criação de anúncios de alta conversão
- Análise de métricas (Quality Score, CPC, ROAS, etc.)
- Google Analytics e Google Tag Manager
- Estratégias de lances automatizadas
- Extensões de anúncios
- Campanhas de remarketing

Sempre forneça respostas práticas, específicas e baseadas em melhores práticas atuais do Google Ads.`,

          general: `Você é um especialista em marketing digital e publicidade online, com foco em Meta Ads e Google Ads. Seu objetivo é ajudar usuários a criar, otimizar e gerenciar campanhas publicitárias eficazes.

Características:
- Sempre prático e objetivo
- Baseado em dados e métricas
- Atualizado com as últimas tendências
- Foca em ROI e performance
- Explica conceitos de forma clara

Quando responder, considere sempre o contexto específico da plataforma (Meta ou Google) e forneça exemplos práticos quando possível.`
        }
      }));
    }
  }, []);

  const getProviderInfo = () => {
    switch (config.provider) {
      case 'openai':
        return {
          name: 'OpenAI',
          url: 'https://api.openai.com/v1/chat/completions',
          keyPrefix: 'sk-',
          models: [
            { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Rápido e Econômico)' },
            { value: 'gpt-4o', label: 'GPT-4o (Mais Poderoso)' },
            { value: 'gpt-4.5-preview', label: 'GPT-4.5 Preview (Experimental)' }
          ],
          defaultModel: 'gpt-4o-mini'
        };
      case 'deepseek':
        return {
          name: 'DeepSeek',
          url: 'https://api.deepseek.com/v1/chat/completions',
          keyPrefix: 'sk-',
          models: [
            { value: 'deepseek-chat', label: 'DeepSeek Chat (Recomendado)' },
            { value: 'deepseek-coder', label: 'DeepSeek Coder (Para código)' }
          ],
          defaultModel: 'deepseek-chat'
        };
      default:
        return null;
    }
  };

  const handleProviderChange = (provider: 'openai' | 'deepseek') => {
    const providerInfo = getProviderInfo();
    setConfig(prev => ({
      ...prev,
      provider,
      model: provider === 'openai' ? 'gpt-4o-mini' : 'deepseek-chat',
      apiKey: '' // Limpar API key ao trocar provedor
    }));
  };

  const handleSaveConfig = async () => {
    setIsLoading(true);
    
    try {
      console.log('🔄 Salvando configuração de IA...', config);
      
      // Verificar permissões
      if (role !== 'super_admin') {
        throw new Error('Você precisa ser super admin para salvar configurações de IA');
      }
      
      // Validação básica
      if (!config.apiKey.trim()) {
        throw new Error('API Key é obrigatória');
      }
      
      if (!config.provider || !config.model) {
        throw new Error('Provedor e modelo são obrigatórios');
      }

      // Usar instância singleton do Supabase
      const { supabase } = await import('@/integrations/supabase/client');

      // Operação atômica: desativar todas as outras configurações e ativar/criar a atual
      const { error: deactivateError } = await supabase.rpc('upsert_global_setting', {
        p_setting_key: 'ai_configuration',
        p_setting_value: {
          provider: config.provider,
          api_key: config.apiKey,
          model_name: config.model,
          is_active: config.enabled,
          max_tokens: 1500,
          temperature: 0.7,
          contexts: config.context
        },
        p_description: 'Configuração global de IA para todos os usuários'
      });

      if (deactivateError) {
        console.error('❌ Erro ao salvar configuração global:', deactivateError);
        
        // Melhor tratamento de erro baseado no tipo
        let errorMessage = 'Erro ao salvar configuração';
        if (deactivateError.message.includes('permission denied')) {
          errorMessage = 'Permissão negada. Você precisa ser super admin.';
        } else if (deactivateError.message.includes('not found')) {
          errorMessage = 'Função não encontrada. Verifique as configurações do banco.';
        } else {
          errorMessage = `Erro no banco: ${deactivateError.message}`;
        }
        
        throw new Error(errorMessage);
      }

      // Também salvar na tabela ai_configurations para compatibilidade
      if (config.enabled) {
        // Primeiro desativar todas as outras configurações
        await supabase
          .from('ai_configurations')
          .update({ is_active: false, is_default: false })
          .neq('provider', config.provider)
          .neq('model_name', config.model);

        // Upsert da configuração atual
        const { error: configError } = await supabase
          .from('ai_configurations')
          .upsert({
            provider: config.provider,
            api_key: config.apiKey,
            model_name: config.model,
            is_active: config.enabled,
            is_default: config.enabled,
            max_tokens: 1500,
            temperature: 0.7,
            config_data: {
              contexts: config.context
            }
          }, {
            onConflict: 'provider,model_name',
            ignoreDuplicates: false
          });

        if (configError) {
          console.error('❌ Erro ao salvar na tabela ai_configurations:', configError);
          console.warn('Falha ao salvar na tabela ai_configurations, mas configuração global foi salva');
        } else {
          console.log('✅ Configuração salva na tabela ai_configurations');
        }
      }

      // Cache local para melhor UX (opcional)
      localStorage.setItem('camply_ai_config', JSON.stringify(config));

      console.log('✅ Configuração salva globalmente com sucesso');

      toast({
        title: 'Configurações salvas com sucesso!',
        description: `As configurações do ${getProviderInfo()?.name} foram aplicadas para todos os usuários do sistema.`,
      });
      
    } catch (error) {
      console.error('❌ Erro ao salvar configurações:', error);
      
      // Log detalhado do erro para debugging
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      
      toast({
        title: 'Erro ao salvar configurações',
        description: error instanceof Error ? error.message : 'Erro desconhecido ao salvar',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config.apiKey) {
      toast({
        title: 'API Key necessária',
        description: `Por favor, insira a API Key do ${getProviderInfo()?.name} antes de testar.`,
        variant: 'destructive',
      });
      return;
    }

    const providerInfo = getProviderInfo();
    if (!providerInfo) return;

    setIsLoading(true);
    setTestResult(null);

    try {
      console.log(`Testando conexão com ${providerInfo.name}...`);
      console.log('API Key formato:', config.apiKey.substring(0, 7) + '...');
      
      const response = await fetch(providerInfo.url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: 'user',
              content: 'Teste de conexão. Responda apenas "OK".'
            }
          ],
          max_tokens: 10,
        }),
      });

      console.log('Status da resposta:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Resposta do ${providerInfo.name}:`, data);
        
        setTestResult({
          success: true,
          message: `Conexão estabelecida com sucesso! Provedor: ${providerInfo.name}, Modelo: ${config.model}`
        });
        
        toast({
          title: 'Teste bem-sucedido!',
          description: `A API Key do ${providerInfo.name} está válida e funcionando.`,
        });
      } else {
        const errorData = await response.text();
        console.error('Erro na resposta:', errorData);
        
        let errorMessage = `Erro na conexão com ${providerInfo.name}.`;
        
        if (response.status === 401) {
          errorMessage = 'API Key inválida. Verifique se está correta.';
        } else if (response.status === 429) {
          errorMessage = 'Limite de requisições atingido. Tente novamente mais tarde.';
        } else if (response.status === 402) {
          errorMessage = 'Conta sem créditos. Adicione créditos na sua conta.';
        }
        
        setTestResult({
          success: false,
          message: `${errorMessage} (Status: ${response.status})`
        });
      }
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      setTestResult({
        success: false,
        message: 'Erro de rede. Verifique sua conexão com a internet.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const providerInfo = getProviderInfo();

  // Verificar se usuário tem permissão antes de renderizar
  if (role !== 'super_admin') {
    return (
      <div className="space-y-6">
        <Alert className="border-red-500 bg-red-50">
          <XCircle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-700">
            Acesso negado. Você precisa ser super admin para acessar as configurações de IA.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Brain className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Integração de IA</h1>
          <p className="text-gray-600">Configure a integração com provedores de IA para assistência especializada em anúncios</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Seleção do Provedor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="w-5 h-5" />
              <span>Provedor de IA</span>
            </CardTitle>
            <CardDescription>
              Escolha qual provedor de IA você deseja usar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  config.provider === 'deepseek' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleProviderChange('deepseek')}
              >
                <div className="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    checked={config.provider === 'deepseek'} 
                    onChange={() => handleProviderChange('deepseek')}
                  />
                  <div>
                    <h3 className="font-semibold">DeepSeek (Recomendado)</h3>
                    <p className="text-sm text-gray-600">Mais barato, alta qualidade</p>
                    <Badge variant="secondary" className="mt-1">💰 Econômico</Badge>
                  </div>
                </div>
              </div>

              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  config.provider === 'openai' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleProviderChange('openai')}
              >
                <div className="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    checked={config.provider === 'openai'} 
                    onChange={() => handleProviderChange('openai')}
                  />
                  <div>
                    <h3 className="font-semibold">OpenAI</h3>
                    <p className="text-sm text-gray-600">GPT-4, mais estabelecido</p>
                    <Badge variant="outline" className="mt-1">🏆 Premium</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações da API */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="w-5 h-5" />
              <span>Configurações da API - {providerInfo?.name}</span>
            </CardTitle>
            <CardDescription>
              Configure a conexão com a API do {providerInfo?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key do {providerInfo?.name}</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder={`${providerInfo?.keyPrefix}...`}
                  value={config.apiKey}
                  onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                />
                <p className="text-sm text-gray-500">
                  {config.provider === 'openai' 
                    ? 'Obtenha sua API Key em platform.openai.com'
                    : 'Obtenha sua API Key em platform.deepseek.com'
                  }
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="model">Modelo</Label>
                <select
                  id="model"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={config.model}
                  onChange={(e) => setConfig(prev => ({ ...prev, model: e.target.value }))}
                >
                  {providerInfo?.models.map(model => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Status da Integração</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={(enabled) => setConfig(prev => ({ ...prev, enabled }))}
                  />
                  <span className="text-sm text-gray-600">
                    {config.enabled ? 'Ativada' : 'Desativada'}
                  </span>
                  <Badge variant={config.enabled ? 'default' : 'secondary'}>
                    {config.enabled ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>

              <Button onClick={handleTestConnection} disabled={isLoading}>
                <TestTube className="w-4 h-4 mr-2" />
                {isLoading ? 'Testando...' : 'Testar Conexão'}
              </Button>
            </div>

            {testResult && (
              <Alert className={testResult.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                {testResult.success ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <AlertDescription className={testResult.success ? 'text-green-700' : 'text-red-700'}>
                  {testResult.message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Contextos de Especialização */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Contextos de Especialização</span>
            </CardTitle>
            <CardDescription>
              Configure como a IA deve se comportar para diferentes tipos de anúncios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="metaAdsContext">Contexto para Meta Ads (Facebook/Instagram)</Label>
              <Textarea
                id="metaAdsContext"
                rows={6}
                placeholder="Defina como a IA deve se comportar ao ajudar com Meta Ads..."
                value={config.context.metaAds}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  context: { ...prev.context, metaAds: e.target.value }
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="googleAdsContext">Contexto para Google Ads</Label>
              <Textarea
                id="googleAdsContext"
                rows={6}
                placeholder="Defina como a IA deve se comportar ao ajudar com Google Ads..."
                value={config.context.googleAds}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  context: { ...prev.context, googleAds: e.target.value }
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="generalContext">Contexto Geral</Label>
              <Textarea
                id="generalContext"
                rows={4}
                placeholder="Contexto geral para todas as interações..."
                value={config.context.general}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  context: { ...prev.context, general: e.target.value }
                }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Botão de Salvar */}
        <div className="flex justify-end">
          <Button onClick={handleSaveConfig} disabled={isLoading} size="lg">
            {isLoading ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminOpenAI;
