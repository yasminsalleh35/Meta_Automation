import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminPagarme() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [creatingPlans, setCreatingPlans] = useState(false);
  const [testStatus, setTestStatus] = useState<{ ok: boolean; message: string } | null>(null);
  
  const [activeEnvironment, setActiveEnvironment] = useState<'test' | 'live'>('test');
  
  // Test fields
  const [testAccountId, setTestAccountId] = useState('');
  const [testPublicKey, setTestPublicKey] = useState('');
  const [testSecretKey, setTestSecretKey] = useState('');
  const [testEncryptionKey, setTestEncryptionKey] = useState('');
  const [testWebhookSecret, setTestWebhookSecret] = useState('');
  const [testPlanMensalId, setTestPlanMensalId] = useState('');
  const [testPlanAnualId, setTestPlanAnualId] = useState('');
  
  // Live fields
  const [liveAccountId, setLiveAccountId] = useState('');
  const [livePublicKey, setLivePublicKey] = useState('');
  const [liveSecretKey, setLiveSecretKey] = useState('');
  const [liveEncryptionKey, setLiveEncryptionKey] = useState('');
  const [liveWebhookSecret, setLiveWebhookSecret] = useState('');
  const [livePlanMensalId, setLivePlanMensalId] = useState('');
  const [livePlanAnualId, setLivePlanAnualId] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('pagarme_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setActiveEnvironment(data.active_environment as 'test' | 'live');
        
        // Test
        setTestAccountId(data.test_account_id || '');
        setTestPublicKey(data.test_public_key || '');
        setTestSecretKey(data.test_secret_key || '');
        setTestEncryptionKey(data.test_encryption_key || '');
        setTestWebhookSecret(data.test_webhook_secret || '');
        setTestPlanMensalId(data.test_plan_id_mensal || ''); // V5 field
        setTestPlanAnualId(data.test_plan_id_anual || '');   // V5 field
        
        // Live
        setLiveAccountId(data.live_account_id || '');
        setLivePublicKey(data.live_public_key || '');
        setLiveSecretKey(data.live_secret_key || '');
        setLiveEncryptionKey(data.live_encryption_key || '');
        setLiveWebhookSecret(data.live_webhook_secret || '');
        setLivePlanMensalId(data.live_plan_id_mensal || ''); // V5 field
        setLivePlanAnualId(data.live_plan_id_anual || '');   // V5 field
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: 'Erro ao carregar configurações',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      console.log('[AdminPagarme] Iniciando salvamento...');
      console.log('[AdminPagarme] Usuário do contexto:', user?.id);

      // Preparar dados para salvar (usar novos campos V5)
      const settingsData = {
        active_environment: activeEnvironment,
        test_account_id: testAccountId,
        test_public_key: testPublicKey,
        test_secret_key: testSecretKey,
        test_encryption_key: testEncryptionKey,
        test_webhook_secret: testWebhookSecret,
        test_plan_id_mensal: testPlanMensalId, // V5 field
        test_plan_id_anual: testPlanAnualId,   // V5 field
        live_account_id: liveAccountId,
        live_public_key: livePublicKey,
        live_secret_key: liveSecretKey,
        live_encryption_key: liveEncryptionKey,
        live_webhook_secret: liveWebhookSecret,
        live_plan_id_mensal: livePlanMensalId, // V5 field
        live_plan_id_anual: livePlanAnualId    // V5 field
      };
      
      console.log('[AdminPagarme] Dados preparados para salvar');
      
      // 4. Verificar se já existem configurações
      const { data: existingSettings, error: checkError } = await supabase
        .from('pagarme_settings')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      if (checkError) {
        console.error('[AdminPagarme] Erro ao verificar configurações existentes:', checkError);
        throw new Error('Erro ao verificar configurações existentes');
      }
      
      // 5. Executar INSERT ou UPDATE
      let result;
      
      if (existingSettings) {
        console.log('[AdminPagarme] Atualizando configurações existentes (ID:', existingSettings.id, ')');
        result = await supabase
          .from('pagarme_settings')
          .update(settingsData)
          .eq('id', existingSettings.id)
          .select();
      } else {
        console.log('[AdminPagarme] Inserindo novas configurações...');
        result = await supabase
          .from('pagarme_settings')
          .insert(settingsData)
          .select();
      }
      
      // 6. Verificar resultado
      if (result.error) {
        console.error('[AdminPagarme] Erro retornado pela operação:', result.error);
        
        // Tratamento específico por tipo de erro
        if (result.error.code === 'PGRST301') {
          throw new Error('Erro de permissão: Você não tem acesso para modificar estas configurações.');
        } else if (result.error.message?.includes('row-level security') || result.error.message?.includes('RLS')) {
          throw new Error('Erro de segurança: As políticas de acesso bloquearam a operação. Verifique se você está autenticado como administrador.');
        } else if (result.error.message?.includes('permission')) {
          throw new Error('Erro de permissão: Acesso negado para esta operação.');
        } else {
          throw new Error(`Erro ao salvar: ${result.error.message}`);
        }
      }
      
      if (!result.data || result.data.length === 0) {
        console.error('[AdminPagarme] Nenhum dado retornado após salvamento');
        throw new Error('Configurações não foram salvas corretamente. Nenhum registro retornado.');
      }
      
      console.log('[AdminPagarme] ✅ Configurações salvas com sucesso!', result.data);
      
      toast({
        title: "Sucesso",
        description: "Configurações do Pagar.me salvas com sucesso!",
      });
      
      // Recarregar configurações para garantir sincronização
      await loadSettings();
      setTestStatus(null);
      
    } catch (error: any) {
      console.error('[AdminPagarme] ❌ Erro no processo de salvamento:', error);
      
      let errorMessage = "Não foi possível salvar as configurações.";
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro ao salvar",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestStatus(null);
    
    try {
      // 1. Obter o token da sessão atual
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Sessão não encontrada. Faça login novamente.');
      }

      // 2. Invocar a edge COM Authorization e o ambiente selecionado
      const { data, error } = await supabase.functions.invoke('pagarme-test-connection', {
        body: { environment: activeEnvironment },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        // Tentar extrair mensagem de erro detalhada
        const errorMsg = error.message || 'Falha ao testar conexão';
        throw new Error(errorMsg);
      }
      
      if (data?.success && data?.data) {
        setTestStatus({
          ok: true,
          message: `Conexão OK! Company: ${data.data.company?.name || 'N/A'} (${data.data.company?.id || 'N/A'}) - Ambiente: ${data.data.environment || activeEnvironment}`
        });
        toast({
          title: 'Conexão bem-sucedida',
          description: `Conectado à empresa ${data.data.company?.name || 'Pagar.me'}`
        });
      } else {
        throw new Error(data?.error?.message || data?.error || 'Connection failed');
      }
    } catch (error: any) {
      console.error('Test connection error:', error);
      const errorMessage = error.message || error.error?.message || 'Falha na conexão';
      setTestStatus({
        ok: false,
        message: errorMessage
      });
      toast({
        title: 'Erro ao testar conexão',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleCreatePlans = async () => {
    setCreatingPlans(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('pagarme-create-plans', {
        body: { environment: activeEnvironment }
      });
      
      if (error) throw error;
      
      if (data.ok) {
        // Update local state with new plan IDs
        if (activeEnvironment === 'test') {
          setTestPlanMensalId(data.mensal.id);
          setTestPlanAnualId(data.anual.id);
        } else {
          setLivePlanMensalId(data.mensal.id);
          setLivePlanAnualId(data.anual.id);
        }
        
        // Reload to get updated data
        await loadSettings();
        
        toast({
          title: 'Planos criados',
          description: `Planos criados com sucesso no ambiente ${data.environment}`
        });
      } else {
        throw new Error(data.error || 'Failed to create plans');
      }
    } catch (error) {
      console.error('Create plans error:', error);
      toast({
        title: 'Erro ao criar planos',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    } finally {
      setCreatingPlans(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Configuração Pagar.me</h1>
          <p className="text-muted-foreground">Gerencie assinaturas e planos de pagamento</p>
        </div>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Label htmlFor="environment" className="text-base font-semibold">
              Ambiente Ativo
            </Label>
            <p className="text-sm text-muted-foreground">
              {activeEnvironment === 'test' ? 'Sandbox (Testes)' : 'Produção (Live)'}
            </p>
          </div>
          <Switch
            id="environment"
            checked={activeEnvironment === 'live'}
            onCheckedChange={(checked) => setActiveEnvironment(checked ? 'live' : 'test')}
          />
        </div>
        
        {testStatus && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            testStatus.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {testStatus.ok ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            <span className="text-sm">{testStatus.message}</span>
          </div>
        )}
      </Card>

      <Tabs value={activeEnvironment} onValueChange={(v) => setActiveEnvironment(v as 'test' | 'live')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="test">Sandbox (Test)</TabsTrigger>
          <TabsTrigger value="live">Produção (Live)</TabsTrigger>
        </TabsList>

        <TabsContent value="test" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Credenciais de Teste</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="test-account-id">Account ID</Label>
                <Input
                  id="test-account-id"
                  value={testAccountId}
                  onChange={(e) => setTestAccountId(e.target.value)}
                  placeholder="acc_..."
                />
              </div>

              <div>
                <Label htmlFor="test-public-key">Public Key</Label>
                <Input
                  id="test-public-key"
                  value={testPublicKey}
                  onChange={(e) => setTestPublicKey(e.target.value)}
                  placeholder="pk_test_..."
                />
              </div>

              <div>
                <Label htmlFor="test-secret-key">Secret Key</Label>
                <Input
                  id="test-secret-key"
                  type="password"
                  value={testSecretKey}
                  onChange={(e) => setTestSecretKey(e.target.value)}
                  placeholder="sk_test_..."
                />
              </div>

              <div>
                <Label htmlFor="test-encryption-key" className="flex items-center gap-2">
                  <span className="line-through text-gray-400">Encryption Key</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">❌ V5 não usa</span>
                </Label>
                <Input
                  id="test-encryption-key"
                  value={testEncryptionKey}
                  onChange={(e) => setTestEncryptionKey(e.target.value)}
                  placeholder="V5 usa Tokenizecard.js (não precisa)"
                  disabled
                  className="bg-gray-50 text-gray-400"
                />
                <p className="text-xs text-gray-500 mt-1">
                  ℹ️ V5 tokeniza via <code>checkout.pagar.me/v1/tokenizecard.js</code>
                </p>
              </div>

              <div>
                <Label htmlFor="test-webhook-secret">Webhook Secret</Label>
                <Input
                  id="test-webhook-secret"
                  type="password"
                  value={testWebhookSecret}
                  onChange={(e) => setTestWebhookSecret(e.target.value)}
                  placeholder="Segredo do webhook"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="test-plan-mensal">Plan ID Mensal (V5)</Label>
                  <Input
                    id="test-plan-mensal"
                    value={testPlanMensalId}
                    onChange={(e) => setTestPlanMensalId(e.target.value)}
                    placeholder="plan_... (criado via botão)"
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Auto-preenchido ao criar planos V5
                  </p>
                </div>

                <div>
                  <Label htmlFor="test-plan-anual">Plan ID Anual (V5)</Label>
                  <Input
                    id="test-plan-anual"
                    value={testPlanAnualId}
                    onChange={(e) => setTestPlanAnualId(e.target.value)}
                    placeholder="plan_... (criado via botão)"
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Auto-preenchido ao criar planos V5
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="live" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Credenciais de Produção</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="live-account-id">Account ID</Label>
                <Input
                  id="live-account-id"
                  value={liveAccountId}
                  onChange={(e) => setLiveAccountId(e.target.value)}
                  placeholder="acc_..."
                />
              </div>

              <div>
                <Label htmlFor="live-public-key">Public Key</Label>
                <Input
                  id="live-public-key"
                  value={livePublicKey}
                  onChange={(e) => setLivePublicKey(e.target.value)}
                  placeholder="pk_live_..."
                />
              </div>

              <div>
                <Label htmlFor="live-secret-key">Secret Key</Label>
                <Input
                  id="live-secret-key"
                  type="password"
                  value={liveSecretKey}
                  onChange={(e) => setLiveSecretKey(e.target.value)}
                  placeholder="sk_live_..."
                />
              </div>

              <div>
                <Label htmlFor="live-encryption-key" className="flex items-center gap-2">
                  <span className="line-through text-gray-400">Encryption Key</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">❌ V5 não usa</span>
                </Label>
                <Input
                  id="live-encryption-key"
                  value={liveEncryptionKey}
                  onChange={(e) => setLiveEncryptionKey(e.target.value)}
                  placeholder="V5 usa Tokenizecard.js (não precisa)"
                  disabled
                  className="bg-gray-50 text-gray-400"
                />
                <p className="text-xs text-gray-500 mt-1">
                  ℹ️ V5 tokeniza via <code>checkout.pagar.me/v1/tokenizecard.js</code>
                </p>
              </div>

              <div>
                <Label htmlFor="live-webhook-secret">Webhook Secret</Label>
                <Input
                  id="live-webhook-secret"
                  type="password"
                  value={liveWebhookSecret}
                  onChange={(e) => setLiveWebhookSecret(e.target.value)}
                  placeholder="Segredo do webhook"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="live-plan-mensal">Plan ID Mensal (V5)</Label>
                  <Input
                    id="live-plan-mensal"
                    value={livePlanMensalId}
                    onChange={(e) => setLivePlanMensalId(e.target.value)}
                    placeholder="plan_... (criado via botão)"
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Auto-preenchido ao criar planos V5
                  </p>
                </div>

                <div>
                  <Label htmlFor="live-plan-anual">Plan ID Anual (V5)</Label>
                  <Input
                    id="live-plan-anual"
                    value={livePlanAnualId}
                    onChange={(e) => setLivePlanAnualId(e.target.value)}
                    placeholder="plan_... (criado via botão)"
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Auto-preenchido ao criar planos V5
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex gap-3 mt-6">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex-1"
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Configurações
        </Button>

        <Button
          onClick={handleTestConnection}
          disabled={testing || saving}
          variant="outline"
        >
          {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Testar Conexão
        </Button>

        <Button
          onClick={handleCreatePlans}
          disabled={creatingPlans || saving}
          variant="secondary"
        >
          {creatingPlans && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Criar Planos V5
        </Button>
      </div>

      <Card className="p-4 mt-6 bg-muted/50">
        <h4 className="font-semibold mb-2">Webhook URL</h4>
        <code className="text-sm">https://iacamply.com/api/webhooks/pagarme</code>
        <p className="text-sm text-muted-foreground mt-2">
          Configure esta URL no painel da Pagar.me para receber eventos de pagamento
        </p>
      </Card>
    </div>
  );
}
