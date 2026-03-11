import React, { useState, useEffect } from 'react';
import { useAsaasConfig } from '@/hooks/useAsaasConfig';
import { useAsaasPlans } from '@/hooks/useAsaasPlans';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, Copy, Info } from 'lucide-react';
import { AsaasEnvironment } from '@/types/asaas';
import AsaasPlansManager from './AsaasPlansManager';

const AsaasAdminConfig: React.FC = () => {
  const { toast } = useToast();
  const [environment, setEnvironment] = useState<AsaasEnvironment>('sandbox');
  const { config, loading, saving, testing, isConfigured, upsertConfig, testConnection } = useAsaasConfig(environment);
  
  const [apiKey, setApiKey] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Webhook URLs
  const webhookUrl = `https://iacamply.com/functions/v1/asaas-webhook?env=${environment}`;

  useEffect(() => {
    if (config) {
      setIsActive(config.is_active);
      // API Key and Webhook Secret are not returned for security (only has_api_key flag)
      // Keep inputs empty - admin must re-enter to update
    }
  }, [config]);

  const handleSave = async () => {
    try {
      await upsertConfig({
        environment,
        api_key: apiKey || null,
        webhook_secret: webhookSecret || null,
        is_active: isActive,
      });
      toast({
        title: 'Sucesso',
        description: 'Configuração Asaas salva com sucesso',
      });
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao salvar configuração',
        variant: 'destructive',
      });
    }
  };

  const handleTest = async () => {
    try {
      const success = await testConnection();
      if (success) {
        toast({
          title: 'Conexão bem-sucedida',
          description: 'Conexão com Asaas estabelecida com sucesso',
        });
      } else {
        toast({
          title: 'Falha na conexão',
          description: 'Não foi possível conectar com Asaas. Verifique sua API Key.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao testar conexão',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado',
      description: 'URL copiada para a área de transferência',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integração Asaas</h1>
        <p className="text-muted-foreground">
          Configure a integração com o gateway de pagamento Asaas para processar assinaturas e pagamentos.
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Isolamento de Integrações</AlertTitle>
        <AlertDescription>
          A integração Asaas é completamente isolada do Pagar.me. Você pode usar ambas simultaneamente ou escolher uma apenas.
        </AlertDescription>
      </Alert>

      <Tabs value={environment} onValueChange={(v) => setEnvironment(v as AsaasEnvironment)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sandbox">Sandbox (Teste)</TabsTrigger>
          <TabsTrigger value="production">Produção</TabsTrigger>
        </TabsList>

        <TabsContent value={environment} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Credenciais {environment === 'sandbox' ? 'Sandbox' : 'Produção'}</CardTitle>
              <CardDescription>
                Configure suas credenciais da API Asaas para o ambiente {environment === 'sandbox' ? 'de testes' : 'de produção'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key *</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={config?.has_api_key 
                    ? "••••••••••••••••••••••••• (configurada)" 
                    : "$aact_..."
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Obtenha sua API Key no painel Asaas em Configurações → API
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookSecret">Webhook Secret (opcional)</Label>
                <Input
                  id="webhookSecret"
                  type="password"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder={config?.has_webhook_secret 
                    ? "••••••••••••••••••••••••• (configurado)" 
                    : "Segredo para validar webhooks"
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Configure um segredo para validar requisições de webhook (recomendado para produção)
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-border"
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Integração ativa
                </Label>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving || !apiKey}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar Configuração
                </Button>
                <Button onClick={handleTest} variant="outline" disabled={testing || !isConfigured}>
                  {testing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Testar Conexão
                </Button>
              </div>

              {isConfigured && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Configurado</AlertTitle>
                  <AlertDescription>
                    A integração Asaas está configurada para o ambiente {environment}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Webhook URL</CardTitle>
              <CardDescription>
                Configure esta URL no painel Asaas para receber notificações de eventos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>URL do Webhook</Label>
                <div className="flex gap-2">
                  <Input value={webhookUrl} readOnly className="font-mono text-sm" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(webhookUrl)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Configure em: Painel Asaas → Configurações → Webhooks → Adicionar webhook
                </p>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Eventos Importantes</AlertTitle>
                <AlertDescription>
                  Configure os eventos: PAYMENT_CONFIRMED, PAYMENT_RECEIVED, SUBSCRIPTION_CREATED, SUBSCRIPTION_UPDATED, SUBSCRIPTION_CANCELED
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Gerenciador de Planos */}
          <AsaasPlansManager environment={environment} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AsaasAdminConfig;
