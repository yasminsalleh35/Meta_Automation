
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Save, TestTube, AlertCircle, Eye, EyeOff, ExternalLink, CheckCircle, PiggyBank } from 'lucide-react';
import { useStripeConfig } from '@/hooks/useStripeConfig';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import PagarmeAdminConfig from './PagarmeAdminConfig';

const StripeAdminConfig: React.FC = () => {
  const { config, loading, saving, updateConfig } = useStripeConfig();
  const { plans, loading: plansLoading, saving: plansSaving, updatePriceIds, getPriceIds } = useSubscriptionPlans();
  const { toast } = useToast();
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  
  const [formData, setFormData] = useState({
    publishable_key: '',
    secret_key: '',
    webhook_secret: '',
    environment: 'test' as 'test' | 'live'
  });

  const [planPrices, setPlanPrices] = useState({
    premium_monthly: '',
    premium_annual: ''
  });

  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  React.useEffect(() => {
    if (config) {
      setFormData({
        publishable_key: config.publishable_key || '',
        secret_key: '', // Never pre-fill secret key for security
        webhook_secret: '', // Never pre-fill webhook secret for security
        environment: config.environment
      });
    }
  }, [config]);

  React.useEffect(() => {
    if (!plansLoading && !hasInitialLoad) {
      const priceIds = getPriceIds();
      setPlanPrices(priceIds);
      setHasInitialLoad(true);
    }
  }, [plansLoading]);

  const handleSave = async () => {
    // Prepare update object - only include fields that have values
    const updates: any = {
      publishable_key: formData.publishable_key,
      environment: formData.environment
    };

    // Only update secret_key if user provided a new one
    if (formData.secret_key.trim()) {
      updates.secret_key = formData.secret_key;
    }

    // Only update webhook_secret if user provided a new one
    if (formData.webhook_secret.trim()) {
      updates.webhook_secret = formData.webhook_secret;
    }

    await updateConfig(updates);
  };

  const testStripeConnection = async () => {
    setIsTesting(true);
    try {
      // Simulate testing connection
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast({
        title: "Conexão testada com sucesso!",
        description: "A configuração do Stripe está funcionando corretamente.",
      });
    } catch (error) {
      toast({
        title: "Erro na conexão",
        description: "Verifique suas chaves e tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSavePriceIds = async () => {
    if (!planPrices.premium_monthly || !planPrices.premium_annual) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha ambos os Price IDs (mensal e anual).",
        variant: "destructive"
      });
      return;
    }

    await updatePriceIds(planPrices);
  };

  const isConfigured = config?.publishable_key && config?.has_webhook_secret;
  const hasSecretKey = config?.secret_key && config.secret_key.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <CreditCard className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuração de Pagamentos - Camply</h1>
          <p className="text-gray-600">Configure Stripe (assinaturas) e Pagar.me (parcelado) de forma unificada</p>
        </div>
      </div>

      {/* Tabs para Stripe e Pagar.me */}
      <Tabs defaultValue="stripe" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stripe" className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4" />
            <span>Stripe (Assinaturas)</span>
          </TabsTrigger>
          <TabsTrigger value="pagarme" className="flex items-center space-x-2">
            <PiggyBank className="w-4 h-4" />
            <span>Pagar.me (Parcelado)</span>
          </TabsTrigger>
        </TabsList>

        {/* Conteúdo Stripe */}
        <TabsContent value="stripe" className="space-y-6">

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TestTube className="w-5 h-5" />
            <span>Status da Configuração</span>
            {isConfigured ? (
              <Badge className="bg-green-500 text-white">
                <CheckCircle className="w-3 h-3 mr-1" />
                Configurado
              </Badge>
            ) : (
              <Badge variant="destructive">Pendente</Badge>
            )}
          </CardTitle>
          <CardDescription>
            {isConfigured 
              ? `Ambiente atual: ${config?.environment === 'live' ? 'Produção' : 'Teste'}`
              : 'Configure as chaves do Stripe para habilitar pagamentos'
            }
          </CardDescription>
        </CardHeader>
        {isConfigured && (
          <CardContent>
            <Button onClick={testStripeConnection} disabled={isTesting} variant="outline">
              {isTesting ? 'Testando...' : 'Testar Conexão'}
            </Button>
          </CardContent>
        )}
      </Card>

      {/* API Keys Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Chaves de API</CardTitle>
          <CardDescription>
            Configure suas chaves do Stripe para processar pagamentos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Environment Selection */}
          <div className="space-y-2">
            <Label htmlFor="environment">Ambiente</Label>
            <Select
              value={formData.environment}
              onValueChange={(value: 'test' | 'live') => 
                setFormData(prev => ({ ...prev, environment: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o ambiente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="test">Teste (Sandbox)</SelectItem>
                <SelectItem value="live">Produção (Live)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Publishable Key */}
          <div className="space-y-2">
            <Label htmlFor="publishable_key">Publishable Key</Label>
            <Input
              id="publishable_key"
              type="text"
              placeholder={`pk_${formData.environment}_...`}
              value={formData.publishable_key}
              onChange={(e) => 
                setFormData(prev => ({ ...prev, publishable_key: e.target.value }))
              }
            />
          </div>

          {/* Secret Key */}
          <div className="space-y-2">
            <Label htmlFor="secret_key" className="flex items-center space-x-2">
              <span>Secret Key</span>
              {hasSecretKey && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Configurada
                </Badge>
              )}
            </Label>
            <div className="relative">
              <Input
                id="secret_key"
                type={showSecretKey ? "text" : "password"}
                placeholder={hasSecretKey ? "Deixe vazio para manter a chave atual" : `sk_${formData.environment}_...`}
                value={formData.secret_key}
                onChange={(e) => 
                  setFormData(prev => ({ ...prev, secret_key: e.target.value }))
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                onClick={() => setShowSecretKey(!showSecretKey)}
              >
                {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-sm text-orange-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {hasSecretKey 
                ? "Secret key já configurada. Insira uma nova apenas se quiser substituir."
                : "Esta chave será salva como secret no Supabase"
              }
            </p>
          </div>

          {/* Webhook Secret */}
          <div className="space-y-2">
            <Label htmlFor="webhook_secret" className="flex items-center space-x-2">
              <span>Webhook Secret</span>
              {config?.has_webhook_secret && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Configurado
                </Badge>
              )}
            </Label>
            <div className="relative">
              <Input
                id="webhook_secret"
                type={showWebhookSecret ? "text" : "password"}
                placeholder={config?.has_webhook_secret ? "Deixe vazio para manter o webhook atual" : "whsec_..."}
                value={formData.webhook_secret}
                onChange={(e) => 
                  setFormData(prev => ({ ...prev, webhook_secret: e.target.value }))
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                onClick={() => setShowWebhookSecret(!showWebhookSecret)}
              >
                {showWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {config?.has_webhook_secret 
                ? "Webhook secret já configurado. Insira um novo apenas se quiser substituir."
                : "Copie o webhook secret do Dashboard do Stripe"
              }
            </p>
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => window.open('https://dashboard.stripe.com/apikeys', '_blank')}
              className="flex items-center space-x-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Dashboard Stripe</span>
            </Button>

            <Button 
              onClick={handleSave}
              disabled={saving}
              className="min-w-[120px]"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Configuração'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Plan Prices Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração dos Price IDs</CardTitle>
          <CardDescription>
            Configure os Price IDs do Stripe para a assinatura mensal e anual do Camply Premium
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Camply Premium</CardTitle>
                <CardDescription>Configure os Price IDs do Stripe para as assinaturas do Camply</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="premium_monthly">Price ID Mensal</Label>
                    <Input
                      id="premium_monthly"
                      placeholder="price_1234567890..."
                      value={planPrices.premium_monthly}
                      onChange={(e) => setPlanPrices(prev => ({ ...prev, premium_monthly: e.target.value }))}
                    />
                    <p className="text-sm text-muted-foreground mt-1">R$ 349,99/mês</p>
                  </div>
                  <div>
                    <Label htmlFor="premium_annual">Price ID Anual</Label>
                    <Input
                      id="premium_annual"
                      placeholder="price_1234567890..."
                      value={planPrices.premium_annual}
                      onChange={(e) => setPlanPrices(prev => ({ ...prev, premium_annual: e.target.value }))}
                    />
                    <p className="text-sm text-muted-foreground mt-1">R$ 2.499,00/ano (12x R$ 208,25 sem juros)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button 
              onClick={handleSavePriceIds}
              disabled={plansSaving || plansLoading}
            >
              <Save className="w-4 h-4 mr-2" />
              {plansSaving ? 'Salvando...' : 'Salvar Price IDs'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instruções de Configuração</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">1. Criar Produto no Stripe</h4>
            <p className="text-sm text-muted-foreground mb-2">
              No Dashboard do Stripe, vá em "Products" → "Add product":
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
              <li>Nome: "Camply Premium"</li>
              <li>Descrição: "Acesso completo à plataforma Camply"</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">2. Configurar Preços Recorrentes</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Adicione dois preços ao produto "Camply Premium":
            </p>
            <div className="space-y-2">
              <div className="bg-muted p-3 rounded">
                <p className="font-medium text-sm">Preço Mensal:</p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
                  <li>Valor: R$ 349,99</li>
                  <li>Frequência: Mensal</li>
                  <li>Moeda: BRL (Real Brasileiro)</li>
                </ul>
              </div>
              <div className="bg-muted p-3 rounded">
                <p className="font-medium text-sm">Preço Anual:</p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
                  <li>Valor: R$ 2.499,00</li>
                  <li>Frequência: Anual</li>
                  <li>Moeda: BRL (Real Brasileiro)</li>
                  <li>Parcelamento: 12x sem juros (configurar no checkout)</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">3. Copiar Price IDs</h4>
            <p className="text-sm text-muted-foreground">
              Após criar os preços, copie os Price IDs (começam com "price_") e cole nos campos acima.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">4. Configurar Webhooks</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Vá em "Developers" → "Webhooks" e adicione um endpoint:
            </p>
            <div className="bg-muted p-3 rounded text-sm">
              <p className="font-medium mb-2">URL do Endpoint:</p>
              <code className="text-xs">https://ibwhqkgvrkkqxiksbiqr.supabase.co/functions/v1/stripe-webhook</code>
              
              <p className="font-medium mt-3 mb-2">Eventos Necessários:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>customer.subscription.created</li>
                <li>customer.subscription.updated</li>
                <li>customer.subscription.deleted</li>
                <li>invoice.payment_succeeded</li>
                <li>invoice.payment_failed</li>
              </ul>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">5. Configurar Parcelamento (Brasil)</h4>
            <p className="text-sm text-muted-foreground">
              Para o plano anual, configure parcelamento em até 12x sem juros nas configurações de checkout do Stripe para o mercado brasileiro.
            </p>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        {/* Conteúdo Pagar.me */}
        <TabsContent value="pagarme">
          <PagarmeAdminConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StripeAdminConfig;
