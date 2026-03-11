import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import CodePreview from './CodePreview';
import LogConsole from './LogConsole';

interface AdTestPanelProps {
  adAccountId: string;
  adSetId: string;
  accessToken: string;
  creativeId?: string;
}

const AdTestPanel: React.FC<AdTestPanelProps> = ({
  adAccountId,
  adSetId,
  accessToken,
  creativeId,
}) => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [logs, setLogs] = useState<Array<{ type: string; message: string; timestamp: Date }>>([]);

  const [config, setConfig] = useState({
    name: 'Ad Teste Lab',
    adset_id: adSetId,
    creative: {
      creative_id: creativeId || '',
    },
    status: 'PAUSED',
  });

  // Atualizar creative_id quando a prop mudar
  React.useEffect(() => {
    if (creativeId) {
      setConfig(prev => ({
        ...prev,
        creative: { creative_id: creativeId }
      }));
    }
  }, [creativeId]);

  const addLog = (type: string, message: string) => {
    setLogs(prev => [...prev, { type, message, timestamp: new Date() }]);
  };

  const handleCreate = async () => {
    if (!config.creative.creative_id) {
      toast({
        title: 'Creative ID obrigatório',
        description: 'Informe o ID do creative antes de criar o anúncio',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    setCreatedId(null);
    addLog('info', '🚀 Iniciando criação de anúncio...');
    addLog('info', `📋 Config: ${JSON.stringify(config, null, 2)}`);

    try {
      const { data, error } = await supabase.functions.invoke('test-meta-ad-create', {
        body: {
          adAccountId,
          adConfig: config,
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
        // FASE 2: Log detalhado do erro
        const errorDetails = data.rawResponse?.error;
        addLog('error', `❌ Erro da API Meta: ${data.error}`);
        
        if (errorDetails) {
          addLog('error', `🔍 Detalhes do erro:`);
          addLog('error', `   - Code: ${errorDetails.code}`);
          addLog('error', `   - Type: ${errorDetails.type}`);
          addLog('error', `   - Message: ${errorDetails.message}`);
          addLog('error', `   - FB Trace ID: ${errorDetails.fbtrace_id}`);
          addLog('error', `   - Is Transient: ${errorDetails.is_transient}`);
          
          if (errorDetails.error_user_title) {
            addLog('error', `   - User Title: ${errorDetails.error_user_title}`);
          }
          if (errorDetails.error_user_msg) {
            addLog('error', `   - User Message: ${errorDetails.error_user_msg}`);
          }
        }
        
        addLog('error', `📄 Resposta completa: ${JSON.stringify(data.rawResponse, null, 2)}`);
        
        toast({
          title: 'Erro ao criar anúncio',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }

      addLog('success', `✅ Anúncio criado com sucesso!`);
      addLog('success', `🆔 Ad ID: ${data.adId}`);
      addLog('info', `📄 Resposta completa: ${JSON.stringify(data.rawResponse, null, 2)}`);

      setCreatedId(data.adId);

      toast({
        title: 'Anúncio criado!',
        description: `ID: ${data.adId}`,
      });
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
            <CardTitle>Configuração do Anúncio</CardTitle>
            <CardDescription>Configure os parâmetros do anúncio de teste</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>AdSet ID (read-only)</Label>
              <Input value={adSetId} disabled className="font-mono text-sm" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ad-name">Nome do Anúncio</Label>
              <Input
                id="ad-name"
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="creative-id">Creative ID</Label>
              <Input
                id="creative-id"
                value={config.creative.creative_id}
                onChange={(e) => setConfig({
                  ...config,
                  creative: { creative_id: e.target.value },
                })}
                placeholder="Ex: 120212345678901234"
              />
              <p className="text-xs text-muted-foreground">
                ID do creative já criado no Meta Ads
              </p>
            </div>

            <Button onClick={handleCreate} disabled={isCreating || !config.name || !config.creative.creative_id} className="w-full">
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
                'Criar Anúncio no Meta'
              )}
            </Button>
          </CardContent>
        </Card>

        {createdId && (
          <Card className="border-green-500">
            <CardHeader>
              <CardTitle className="text-green-600 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Anúncio Criado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Ad ID:</p>
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

export default AdTestPanel;
