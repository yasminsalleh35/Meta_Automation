import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import CodePreview from './CodePreview';
import LogConsole from './LogConsole';
import { CampaignConfigValidator } from '@/services/metaAds/utils/CampaignConfigValidator';

// Mapeamento de optimization goals por objetivo de campanha
const OPTIMIZATION_GOALS_BY_OBJECTIVE: Record<string, Array<{ value: string; label: string }>> = {
  'OUTCOME_ENGAGEMENT': [
    { value: 'CONVERSATIONS', label: 'Conversations (WhatsApp/Messenger)' },
    { value: 'QUALITY_CALL', label: 'Quality Call' },
    { value: 'REACH', label: 'Reach' }
  ],
  'MESSAGES': [
    { value: 'CONVERSATIONS', label: 'Conversations (WhatsApp/Messenger)' },
    { value: 'QUALITY_CALL', label: 'Quality Call' }
  ],
  'OUTCOME_MESSAGES': [
    { value: 'CONVERSATIONS', label: 'Conversations (WhatsApp/Messenger)' },
    { value: 'QUALITY_CALL', label: 'Quality Call' }
  ],
  'OUTCOME_TRAFFIC': [
    { value: 'LINK_CLICKS', label: 'Link Clicks' },
    { value: 'LANDING_PAGE_VIEWS', label: 'Landing Page Views' },
    { value: 'OFFSITE_CONVERSIONS', label: 'Offsite Conversions' }
  ],
  'OUTCOME_LEADS': [
    { value: 'LEAD_GENERATION', label: 'Lead Generation' },
    { value: 'QUALITY_LEAD', label: 'Quality Lead' }
  ],
  'OUTCOME_SALES': [
    { value: 'OFFSITE_CONVERSIONS', label: 'Offsite Conversions' },
    { value: 'VALUE', label: 'Value' }
  ],
  'OUTCOME_AWARENESS': [
    { value: 'REACH', label: 'Reach' },
    { value: 'IMPRESSIONS', label: 'Impressions' }
  ]
};

interface AdSetTestPanelProps {
  adAccountId: string;
  campaignId: string;
  campaignObjective: string;
  pageId?: string | null;
  accessToken: string;
  onAdSetCreated: (adSetId: string) => void;
}

const AdSetTestPanel: React.FC<AdSetTestPanelProps> = ({
  adAccountId,
  campaignId,
  campaignObjective,
  pageId,
  accessToken,
  onAdSetCreated,
}) => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [logs, setLogs] = useState<Array<{ type: string; message: string; timestamp: Date }>>([]);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Obter goals compatíveis com o objetivo da campanha
  const availableOptimizationGoals = useMemo(() => {
    return OPTIMIZATION_GOALS_BY_OBJECTIVE[campaignObjective] || OPTIMIZATION_GOALS_BY_OBJECTIVE['OUTCOME_TRAFFIC'];
  }, [campaignObjective]);

  // Definir optimization goal padrão baseado no objetivo
  const defaultOptimizationGoal = useMemo(() => {
    return availableOptimizationGoals[0]?.value || 'LINK_CLICKS';
  }, [availableOptimizationGoals]);

  const [config, setConfig] = useState({
    name: 'AdSet Teste Lab',
    campaign_id: campaignId,
    daily_budget: '5000',
    billing_event: 'IMPRESSIONS',
    optimization_goal: defaultOptimizationGoal,
    destination_type: 'WHATSAPP',
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    bid_amount: undefined as number | undefined,
    targeting: {
      geo_locations: { countries: ['BR'] },
      age_min: 18,
      age_max: 65,
    },
    promoted_object: pageId ? { page_id: pageId } : undefined,
    status: 'PAUSED',
  });

  const addLog = (type: string, message: string) => {
    setLogs(prev => [...prev, { type, message, timestamp: new Date() }]);
  };

  const handleCancel = () => {
    if (abortController) {
      abortController.abort();
      addLog('warn', '⚠️ Requisição cancelada pelo usuário');
      setIsCreating(false);
      setAbortController(null);
    }
  };

  // Sincronizar optimization_goal quando campaignObjective mudar
  useEffect(() => {
    console.log('🔄 campaignObjective mudou:', campaignObjective);
    console.log('🎯 availableOptimizationGoals:', availableOptimizationGoals);
    console.log('✨ defaultOptimizationGoal:', defaultOptimizationGoal);
    
    // Atualizar config.optimization_goal para o padrão do novo objetivo
    setConfig(prev => ({
      ...prev,
      optimization_goal: defaultOptimizationGoal
    }));
    
    addLog('info', `🔄 Objective detectado: ${campaignObjective}`);
    addLog('info', `🎯 Goals disponíveis: ${availableOptimizationGoals.map(g => g.value).join(', ')}`);
    addLog('info', `✨ Goal padrão selecionado: ${defaultOptimizationGoal}`);
  }, [campaignObjective, defaultOptimizationGoal, availableOptimizationGoals]);

  const handleCreate = async () => {
    // Validar compatibilidade entre Campaign Objective e Optimization Goal
    const compatibilityValidation = CampaignConfigValidator.validateCampaignAdSetCompatibility(
      campaignObjective,
      config.optimization_goal,
      config.billing_event
    );

    if (!compatibilityValidation.isValid) {
      addLog('error', `❌ ${compatibilityValidation.error}`);
      toast({
        title: 'Erro de compatibilidade',
        description: compatibilityValidation.error,
        variant: 'destructive',
      });
      return;
    }

    if (compatibilityValidation.warnings && compatibilityValidation.warnings.length > 0) {
      compatibilityValidation.warnings.forEach(warning => {
        addLog('warn', `⚠️ ${warning}`);
      });
    }

    // Validar bid_amount se necessário
    if ((config.bid_strategy === 'LOWEST_COST_WITH_BID_CAP' || 
         config.bid_strategy === 'COST_CAP') && 
        !config.bid_amount) {
      toast({
        title: 'Erro de validação',
        description: 'A estratégia selecionada requer um Bid Amount',
        variant: 'destructive',
      });
      return;
    }

    // Validar promoted_object para CONVERSATIONS
    if (config.optimization_goal === 'CONVERSATIONS' && !pageId) {
      toast({
        title: 'Erro de validação',
        description: 'CONVERSATIONS requer um Page ID na integração',
        variant: 'destructive',
      });
      return;
    }

    // Validar destination_type para CONVERSATIONS
    if (config.optimization_goal === 'CONVERSATIONS' && !config.destination_type) {
      toast({
        title: 'Erro de validação',
        description: 'CONVERSATIONS requer destination_type (WHATSAPP ou MESSENGER)',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    setCreatedId(null);
    addLog('info', '🚀 Iniciando criação de ad set...');

    // Verificar rate limiting
    addLog('info', '🔍 Verificando status da API Meta...');

    try {
      const { data: validationData, error: validationError } = await supabase.functions.invoke('meta-validation');

      if (validationError || validationData?.error || !validationData?.isValid) {
        addLog('error', '❌ Token Meta está com problemas (possivelmente rate limiting)');
        addLog('warn', '⚠️ Aguarde alguns minutos antes de tentar novamente');
        toast({
          title: 'API Meta temporariamente indisponível',
          description: 'Há muitas requisições recentes. Aguarde 5-10 minutos.',
          variant: 'destructive',
        });
        setIsCreating(false);
        return;
      }

      addLog('success', '✅ Token Meta OK, prosseguindo...');
    } catch (validationErr: any) {
      addLog('warn', `⚠️ Não foi possível verificar token: ${validationErr.message}`);
      addLog('info', '🔄 Prosseguindo mesmo assim...');
    }

    addLog('info', `📋 Config: ${JSON.stringify(config, null, 2)}`);

    try {
      // Montar config final, removendo campos undefined
      const finalConfig = { ...config };
      
      // Remover bid_amount se não for necessário ou se estiver undefined
      if (!config.bid_amount || 
          (config.bid_strategy !== 'LOWEST_COST_WITH_BID_CAP' && 
           config.bid_strategy !== 'COST_CAP')) {
        delete (finalConfig as any).bid_amount;
      }

      addLog('info', '📡 Invocando edge function test-meta-adset-create...');
      addLog('info', `🔑 Ad Account: ${adAccountId}`);
      addLog('info', `🆔 Campaign ID: ${campaignId}`);
      addLog('info', `📄 Page ID: ${pageId || 'N/A'}`);

      // Criar AbortController e timeout de 30 segundos
      const controller = new AbortController();
      setAbortController(controller);

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => {
          controller.abort();
          reject(new Error('Timeout: A requisição demorou mais de 30 segundos'));
        }, 30000)
      );

      const invocationPromise = supabase.functions.invoke('test-meta-adset-create', {
        body: {
          adAccountId,
          adSetConfig: finalConfig,
          accessToken,
        },
      });

      const { data, error } = await Promise.race([
        invocationPromise,
        timeoutPromise
      ]) as any;

      if (error) {
        addLog('error', `❌ Erro na função: ${error.message}`);
        toast({
          title: 'Erro',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      if (data.error) {
        addLog('error', `❌ Erro da API Meta: ${data.error}`);
        addLog('error', `📄 Resposta completa: ${JSON.stringify(data.rawResponse, null, 2)}`);
        toast({
          title: 'Erro ao criar ad set',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }

      addLog('success', `✅ Ad Set criado com sucesso!`);
      addLog('success', `🆔 AdSet ID: ${data.adSetId}`);
      addLog('info', `📄 Resposta completa: ${JSON.stringify(data.rawResponse, null, 2)}`);

      setCreatedId(data.adSetId);
      onAdSetCreated(data.adSetId);

      toast({
        title: 'Ad Set criado!',
        description: `ID: ${data.adSetId}`,
      });
    } catch (err: any) {
      addLog('error', `❌ Erro inesperado: ${err.message}`);
      
      if (err.message.includes('Timeout')) {
        addLog('warn', '⚠️ Possíveis causas: API Meta lenta, rate limiting, ou problemas de rede');
        addLog('info', '💡 Sugestão: Aguarde alguns minutos e tente novamente');
      }
      
      toast({
        title: 'Erro inesperado',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
      setAbortController(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Configuration Panel */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Configuração do Ad Set</CardTitle>
            <CardDescription>Configure os parâmetros do conjunto de anúncios</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Campaign ID (read-only)</Label>
              <Input value={campaignId} disabled className="font-mono text-sm" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adset-name">Nome do Ad Set</Label>
              <Input
                id="adset-name"
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="daily-budget">Orçamento Diário (centavos)</Label>
              <Input
                id="daily-budget"
                type="number"
                value={config.daily_budget}
                onChange={(e) => setConfig({ ...config, daily_budget: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Ex: 5000 = R$ 50,00</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing-event">Billing Event</Label>
              <Select value={config.billing_event} onValueChange={(value) => setConfig({ ...config, billing_event: value })}>
                <SelectTrigger id="billing-event">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IMPRESSIONS">IMPRESSIONS</SelectItem>
                  <SelectItem value="LINK_CLICKS">LINK_CLICKS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination-type">Destination Type</Label>
              <Select 
                value={config.destination_type} 
                onValueChange={(value) => setConfig({ ...config, destination_type: value })}
              >
                <SelectTrigger id="destination-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                  <SelectItem value="MESSENGER">Messenger</SelectItem>
                  <SelectItem value="WEBSITE">Website</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Para CTWA, usar WHATSAPP
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="optimization-goal">Optimization Goal</Label>
              <Select 
                value={config.optimization_goal} 
                onValueChange={(value) => setConfig({ ...config, optimization_goal: value })}
              >
                <SelectTrigger id="optimization-goal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableOptimizationGoals.map(goal => (
                    <SelectItem key={goal.value} value={goal.value}>
                      {goal.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Compatível com objetivo: <span className="font-semibold">{campaignObjective}</span>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bid-strategy">Bid Strategy</Label>
              <Select 
                value={config.bid_strategy} 
                onValueChange={(value) => setConfig({ ...config, bid_strategy: value })}
              >
                <SelectTrigger id="bid-strategy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOWEST_COST_WITHOUT_CAP">
                    Menor Custo (Automático)
                  </SelectItem>
                  <SelectItem value="LOWEST_COST_WITH_BID_CAP">
                    Limite de Lance (requer bid_amount)
                  </SelectItem>
                  <SelectItem value="COST_CAP">
                    Meta de Custo (requer bid_amount)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Recomendado: LOWEST_COST_WITHOUT_CAP para testes
              </p>
            </div>

            {(config.bid_strategy === 'LOWEST_COST_WITH_BID_CAP' || 
              config.bid_strategy === 'COST_CAP') && (
              <div className="space-y-2">
                <Label htmlFor="bid-amount">Bid Amount (centavos)</Label>
                <Input
                  id="bid-amount"
                  type="number"
                  value={config.bid_amount || ''}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    bid_amount: parseInt(e.target.value) || undefined
                  })}
                  placeholder="Ex: 500 = R$ 5,00"
                />
                <p className="text-xs text-muted-foreground">
                  Valor máximo de lance por resultado
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age-min">Idade Mínima</Label>
                <Input
                  id="age-min"
                  type="number"
                  value={config.targeting.age_min}
                  onChange={(e) => setConfig({
                    ...config,
                    targeting: { ...config.targeting, age_min: parseInt(e.target.value) },
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age-max">Idade Máxima</Label>
                <Input
                  id="age-max"
                  type="number"
                  value={config.targeting.age_max}
                  onChange={(e) => setConfig({
                    ...config,
                    targeting: { ...config.targeting, age_max: parseInt(e.target.value) },
                  })}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleCreate} 
                disabled={isCreating || !config.name} 
                className="flex-1"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : createdId ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Criado: {createdId}
                  </>
                ) : (
                  'Criar Ad Set no Meta'
                )}
              </Button>
              
              {isCreating && (
                <Button 
                  onClick={handleCancel} 
                  variant="destructive"
                  className="w-24"
                >
                  Cancelar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {createdId && (
          <Card className="border-green-500">
            <CardHeader>
              <CardTitle className="text-green-600 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Ad Set Criado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">AdSet ID:</p>
              <p className="font-mono text-sm">{createdId}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Preview & Logs Panel */}
      <div className="space-y-4">
        <CodePreview code={config} title="JSON que será enviado" />
        <LogConsole logs={logs} />
      </div>
    </div>
  );
};

export default AdSetTestPanel;
