import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import CodePreview from './CodePreview';
import LogConsole from './LogConsole';
import { CAMPAIGN_TEST_MODES } from './types';

interface CampaignTestPanelProps {
  adAccountId: string;
  pageId: string;
  accessToken: string;
  onCampaignCreated: (campaignId: string, objective: string) => void;
}

const CampaignTestPanel: React.FC<CampaignTestPanelProps> = ({
  adAccountId,
  pageId,
  accessToken,
  onCampaignCreated,
}) => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [logs, setLogs] = useState<Array<{ type: string; message: string; timestamp: Date }>>([]);

  const [config, setConfig] = useState({
    name: 'Test WA.ME Link Campaign v23.0',
    testMode: 'wa_link_traffic' as keyof typeof CAMPAIGN_TEST_MODES,
    status: 'PAUSED',
    whatsappLink: 'https://wa.me/5511999999999',
    adTitle: 'Fale conosco agora',
    adText: 'Tire suas dúvidas pelo WhatsApp',
    dailyBudget: 1000, // 10 BRL em centavos
  });

  const currentTestMode = CAMPAIGN_TEST_MODES[config.testMode];

  const addLog = (type: string, message: string) => {
    setLogs(prev => [...prev, { type, message, timestamp: new Date() }]);
  };

  const handleCreate = async () => {
    setIsCreating(true);
    setCreatedId(null);
    setLogs([]);
    addLog('info', '🚀 Iniciando criação de campanha...');
    addLog('info', `📋 Modo de teste: ${currentTestMode.name}`);
    addLog('info', `🎯 Objetivo: ${currentTestMode.campaign.objective}`);
    addLog('info', `🔧 API Version: v23.0`);

    try {
      if (currentTestMode.needsWhatsAppLink) {
        // Chamada para edge function completa (wa.me link)
        addLog('info', '📤 Usando test-wa-link-campaign-create (campanha completa)...');
        
        const { data, error } = await supabase.functions.invoke('test-wa-link-campaign-create', {
          body: {
            adAccountId,
            pageId,
            accessToken,
            campaignName: config.name,
            adTitle: config.adTitle,
            adText: config.adText,
            whatsappLink: config.whatsappLink,
            dailyBudget: config.dailyBudget,
            creativeType: 'post',
            selected_locations: [
              {
                type: 'country',
                country_code: 'BR',
                name: 'Brasil'
              }
            ],
            countryCode: 'BR'
          }
        });

        if (error) {
          addLog('error', `❌ Erro na função: ${error.message}`);
          toast({
            title: 'Erro',
            description: error.message,
            variant: 'destructive',
          });
          return;
        }

        if (!data.success) {
          addLog('error', `❌ Erro: ${data.error}`);
          addLog('info', `📄 Logs: ${data.logs?.join('\n')}`);
          toast({
            title: 'Erro ao criar campanha',
            description: data.error,
            variant: 'destructive',
          });
          return;
        }

        addLog('success', `✅ Campanha criada com sucesso!`);
        addLog('success', `🆔 Campaign ID: ${data.campaignId}`);
        addLog('success', `📦 Ad Set ID: ${data.adSetId}`);
        addLog('success', `🎨 Creative ID: ${data.creativeId}`);
        addLog('success', `📢 Ad ID: ${data.adId}`);
        addLog('info', `📄 Logs: ${data.logs?.join('\n')}`);

        setCreatedId(data.campaignId);
        onCampaignCreated(data.campaignId, currentTestMode.campaign.objective);

        toast({
          title: '✅ Campanha Completa Criada!',
          description: `Campaign: ${data.campaignId}\nAd Set: ${data.adSetId}\nAd: ${data.adId}`,
        });
      } else {
        // Chamada original (apenas campanha CTWA)
        addLog('info', '📤 Usando test-meta-campaign-create (apenas campanha)...');
        
        const campaignConfig = {
          name: config.name,
          objective: currentTestMode.campaign.objective,
          status: config.status,
          special_ad_categories: ['NONE']
        };

        const { data, error } = await supabase.functions.invoke('test-meta-campaign-create', {
          body: {
            adAccountId,
            campaignConfig,
            accessToken,
          },
        });

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
            title: 'Erro ao criar campanha',
            description: data.error,
            variant: 'destructive',
          });
          return;
        }

        addLog('success', `✅ Campanha criada com sucesso!`);
        addLog('success', `🆔 Campaign ID: ${data.campaignId}`);
        addLog('success', `🎯 Objective: ${currentTestMode.campaign.objective}`);
        addLog('info', `📄 Resposta completa: ${JSON.stringify(data.rawResponse, null, 2)}`);

        setCreatedId(data.campaignId);
        onCampaignCreated(data.campaignId, currentTestMode.campaign.objective);

        toast({
          title: 'Campanha criada!',
          description: `ID: ${data.campaignId}`,
        });
      }
    } catch (err: any) {
      addLog('error', `❌ Erro inesperado: ${err.message}`);
      toast({
        title: 'Erro inesperado',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Configuration Panel */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Configuração da Campanha</CardTitle>
            <CardDescription>Configure os parâmetros para teste com API v23.0</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Modo de Teste */}
            <div className="space-y-2">
              <Label htmlFor="test-mode">Modo de Teste</Label>
              <Select value={config.testMode} onValueChange={(value) => setConfig({ ...config, testMode: value as keyof typeof CAMPAIGN_TEST_MODES })}>
                <SelectTrigger id="test-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CAMPAIGN_TEST_MODES).map(([key, mode]) => (
                    <SelectItem key={key} value={key}>
                      {mode.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Descrição do Modo Selecionado */}
              <Alert>
                <Info className="w-4 h-4" />
                <AlertDescription className="text-xs">
                  <strong>{currentTestMode.name}</strong>
                  <br />
                  {currentTestMode.description}
                  <br />
                  <Badge variant="outline" className="mt-1 mr-1 text-xs">
                    {currentTestMode.campaign.objective}
                  </Badge>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {currentTestMode.adSet.optimization_goal}
                  </Badge>
                </AlertDescription>
              </Alert>
            </div>

            {/* Nome da Campanha */}
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Nome da Campanha</Label>
              <Input
                id="campaign-name"
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                placeholder="Ex: Test WA.ME Link Campaign"
              />
            </div>

            {/* WhatsApp Link (se necessário) */}
            {currentTestMode.needsWhatsAppLink && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp-link">Link WhatsApp (wa.me)</Label>
                  <Input
                    id="whatsapp-link"
                    value={config.whatsappLink}
                    onChange={(e) => setConfig({ ...config, whatsappLink: e.target.value })}
                    placeholder="https://wa.me/5511999999999"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ad-title">Título do Anúncio</Label>
                  <Input
                    id="ad-title"
                    value={config.adTitle}
                    onChange={(e) => setConfig({ ...config, adTitle: e.target.value })}
                    placeholder="Ex: Fale conosco agora"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ad-text">Texto do Anúncio</Label>
                  <Input
                    id="ad-text"
                    value={config.adText}
                    onChange={(e) => setConfig({ ...config, adText: e.target.value })}
                    placeholder="Ex: Tire suas dúvidas pelo WhatsApp"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="daily-budget">Orçamento Diário (R$)</Label>
                  <Input
                    id="daily-budget"
                    type="number"
                    value={config.dailyBudget / 100}
                    onChange={(e) => setConfig({ ...config, dailyBudget: parseFloat(e.target.value) * 100 })}
                    placeholder="10.00"
                    step="0.01"
                  />
                </div>
              </>
            )}

            {/* Status Inicial */}
            <div className="space-y-2">
              <Label htmlFor="status">Status Inicial</Label>
              <Select value={config.status} onValueChange={(value) => setConfig({ ...config, status: value })}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAUSED">PAUSED (Recomendado)</SelectItem>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Info sobre Page ID */}
            <Alert>
              <AlertDescription className="text-xs">
                <strong>Page ID configurado:</strong> {pageId}
                <br />
                {currentTestMode.needsWhatsAppLink ? (
                  <span className="text-muted-foreground">
                    ✅ Usando wa.me link externo (sem promoted_object)
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    ✅ Usando promoted_object.page_id (CTWA nativo)
                  </span>
                )}
              </AlertDescription>
            </Alert>

            <Button onClick={handleCreate} disabled={isCreating || !config.name} className="w-full">
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
                'Criar Campanha no Meta v23.0'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Status Card */}
        {createdId && (
          <Card className="border-green-500">
            <CardHeader>
              <CardTitle className="text-green-600 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                {currentTestMode.needsWhatsAppLink ? 'Campanha Completa Criada' : 'Campanha Criada'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Campaign ID:</p>
                  <p className="font-mono text-sm">{createdId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Objetivo:</p>
                  <Badge variant="outline">{currentTestMode.campaign.objective}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Call to Action:</p>
                  <Badge variant="outline">{currentTestMode.creative.call_to_action_type}</Badge>
                </div>
                {currentTestMode.needsWhatsAppLink && (
                  <div>
                    <p className="text-sm text-muted-foreground">Link:</p>
                    <p className="font-mono text-xs truncate">{config.whatsappLink}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">API Version:</p>
                  <Badge variant="outline">v23.0</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Preview & Logs Panel */}
      <div className="space-y-4">
        <CodePreview 
          code={currentTestMode.needsWhatsAppLink ? {
            campaign: {
              name: config.name,
              objective: currentTestMode.campaign.objective,
              status: config.status,
            },
            adset: {
              optimization_goal: currentTestMode.adSet.optimization_goal,
              billing_event: currentTestMode.adSet.billing_event,
              daily_budget: config.dailyBudget,
            },
            creative: {
              link: config.whatsappLink,
              message: config.adText,
              name: config.adTitle,
              call_to_action: {
                type: currentTestMode.creative.call_to_action_type
              }
            },
            api_version: 'v23.0',
            test_mode: currentTestMode.name
          } : {
            name: config.name,
            objective: currentTestMode.campaign.objective,
            status: config.status,
            special_ad_categories: ['NONE'],
            api_version: 'v23.0',
            test_mode: currentTestMode.name
          }} 
          title="JSON que será enviado" 
        />
        <LogConsole logs={logs} />
      </div>
    </div>
  );
};

export default CampaignTestPanel;
