import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, Info, AlertTriangle, Copy } from 'lucide-react';
import { TestWizardFormData, LogEntry } from '@/types/testWizard.types';
import { WizardStep1_Info } from './WizardStep1_Info';
import { WizardStep2_Assets } from './WizardStep2_Assets';
import { WizardStep3_Budget } from './WizardStep3_Budget';
import { WizardStep4_Location } from './WizardStep4_Location';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CampaignWizardTestProps {
  mode: 'ctwa' | 'wa_link';
  adAccountId: string;
  pageId: string;
  accessToken: string;
  instagramUserId?: string;
}

export const CampaignWizardTest: React.FC<CampaignWizardTestProps> = ({
  mode,
  adAccountId,
  pageId,
  accessToken,
  instagramUserId
}) => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<any>(null);

  const [formData, setFormData] = useState<TestWizardFormData>({
    campaignName: '',
    adTitle: '',
    adText: '',
    fanpage: pageId || '',
    instagram: instagramUserId || '',
    whatsappNumber: '',
    dailyBudget: 30,
    startDate: null,
    countryCode: 'BR',
    city: '',
    cityCoordinates: null,
    radius: 10,
    selected_locations: [],
    creativeType: 'upload',
    selectedMediaFile: null,
    selectedMediaId: null,
    selectedMediaMeta: null,
    selectedInstagramPost: null,
    selectedInstagramPostId: null,
  });

  const updateFormData = (field: keyof TestWizardFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addLog = (stage: string, message: string, type: LogEntry['type'] = 'info', data?: any) => {
    setLogs(prev => [...prev, {
      timestamp: new Date(),
      stage,
      message,
      type,
      data
    }]);
  };

  const validateForm = (): boolean => {
    if (!formData.campaignName) {
      toast({ title: "Nome da campanha é obrigatório", variant: "destructive" });
      return false;
    }
    if (!formData.adTitle || !formData.adText) {
      toast({ title: "Título e texto do anúncio são obrigatórios", variant: "destructive" });
      return false;
    }
    if (!formData.fanpage || !formData.instagram) {
      toast({ title: "Fanpage e Instagram são obrigatórios", variant: "destructive" });
      return false;
    }
    if (mode === 'wa_link' && !formData.whatsappNumber) {
      toast({ title: "Número do WhatsApp é obrigatório para WA.ME Link", variant: "destructive" });
      return false;
    }
    if (!formData.selectedMediaMeta) {
      toast({ title: "Selecione uma mídia", variant: "destructive" });
      return false;
    }
    if (formData.dailyBudget < 30) {
      toast({ title: "Orçamento mínimo: R$ 30/dia", variant: "destructive" });
      return false;
    }
    if (formData.selected_locations.length === 0) {
      toast({ title: "Selecione uma localização", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleCreateCampaign = async () => {
    setIsCreating(true);
    setLogs([]);
    setResult(null);

    try {
      addLog('INIT', 'Iniciando validações...', 'info');

      // 🔍 VALIDAÇÃO DE TOKEN
      if (!accessToken || accessToken.length < 100) {
        addLog('VALIDATION', '❌ Token de acesso inválido ou expirado', 'error');
        toast({
          title: "Token inválido",
          description: "O token de acesso do Meta Ads pode ter expirado. Reconecte a integração.",
          variant: "destructive"
        });
        setIsCreating(false);
        return;
      }

      // 🔍 VALIDAÇÃO DE AD ACCOUNT
      if (!adAccountId || !adAccountId.startsWith('act_')) {
        addLog('VALIDATION', `❌ Ad Account ID inválido: ${adAccountId}`, 'error');
        toast({
          title: "Ad Account inválido",
          description: "O ID da conta de anúncios está incorreto.",
          variant: "destructive"
        });
        setIsCreating(false);
        return;
      }

      addLog('VALIDATION', '✅ Token e Ad Account validados', 'info');

      // Validações de formulário
      if (!validateForm()) {
        setIsCreating(false);
        return;
      }

      addLog('INIT', `Iniciando criação de campanha no modo: ${mode.toUpperCase()}`, 'info');

      // Preparar WhatsApp link (código do país +55 automático)
      const cleanNumber = formData.whatsappNumber.replace(/\D/g, '');
      const whatsappLink = `https://wa.me/55${cleanNumber}`;

      addLog('PAYLOAD', 'Preparando payload para edge function', 'info', {
        mode,
        campaignName: formData.campaignName,
        whatsappLink
      });

      const payload = {
        adAccountId,
        pageId: formData.fanpage,
        accessToken,
        campaignName: formData.campaignName,
        adTitle: formData.adTitle,
        adText: formData.adText,
        whatsappLink,
        dailyBudget: formData.dailyBudget,
        selectedMediaMeta: formData.selectedMediaMeta,
        creativeType: formData.creativeType,
        instagramUserId: formData.instagram,
        selected_locations: formData.selected_locations,
        countryCode: formData.countryCode
      };

      // 🔍 VALIDAÇÃO CRÍTICA DE PAYLOAD
      addLog('VALIDATION', 'Validando payload crítico...', 'info');
      if (!payload.adAccountId) {
        throw new Error('❌ Ad Account ID está vazio no payload');
      }
      if (!payload.pageId) {
        throw new Error('❌ Page ID está vazio no payload');
      }
      if (!payload.whatsappLink || !payload.whatsappLink.includes('wa.me')) {
        throw new Error(`❌ WhatsApp link inválido: ${payload.whatsappLink}`);
      }
      if (!payload.selected_locations || payload.selected_locations.length === 0) {
        throw new Error('❌ Nenhuma localização selecionada');
      }
      
      addLog('VALIDATION', '✅ Payload validado com sucesso', 'success');
      
      // 🔍 DEBUG: Log completo do payload (sem access token)
      console.log('📦 PAYLOAD COMPLETO:', {
        ...payload,
        accessToken: `${payload.accessToken?.substring(0, 20)}...` // Mascarar token
      });

      addLog('API_CALL', 'Chamando edge function test-wa-link-campaign-create', 'info');

      const { data, error } = await supabase.functions.invoke('test-wa-link-campaign-create', {
        body: payload
      });

      // 🔍 PROCESSAR LOGS PRIMEIRO (mesmo se houver erro)
      if (data?.logs && Array.isArray(data.logs)) {
        data.logs.forEach((log: string) => {
          // Categorizar logs por tipo baseado no conteúdo
          let logType: LogEntry['type'] = 'info';
          let stage = 'META_API';
          
          if (log.includes('[ERROR]') || log.includes('[CAMPAIGN-ERROR]') || log.includes('[TEST-ERROR]')) {
            logType = 'error';
            stage = 'ERROR';
          } else if (log.includes('[VALIDATION-ERROR]')) {
            logType = 'error';
            stage = 'VALIDATION';
          } else if (log.includes('[DEBUG]')) {
            stage = 'DEBUG';
          } else if (log.includes('[TEST]')) {
            stage = 'CONNECTION_TEST';
          } else if (log.includes('[CAMPAIGN]')) {
            stage = 'CAMPAIGN';
          } else if (log.includes('[ADSET]')) {
            stage = 'ADSET';
          } else if (log.includes('[CREATIVE]')) {
            stage = 'CREATIVE';
          } else if (log.includes('[AD]')) {
            stage = 'AD';
          } else if (log.includes('✓') || log.includes('✅')) {
            logType = 'success';
          }
          
          addLog(stage, log, logType);
        });
      }

      // 🔍 EXTRAIR DETALHES DE ERRO DA META API
      if (data?.error_details) {
        addLog('META_ERROR', '🔴 Detalhes do erro da Meta API:', 'error');
        if (data.error_details.code) {
          addLog('META_ERROR', `❌ Error Code: ${data.error_details.code}`, 'error');
        }
        if (data.error_details.type) {
          addLog('META_ERROR', `❌ Error Type: ${data.error_details.type}`, 'error');
        }
        if (data.error_details.message) {
          addLog('META_ERROR', `❌ Message: ${data.error_details.message}`, 'error');
        }
        if (data.error_details.error_subcode) {
          addLog('META_ERROR', `❌ Subcode: ${data.error_details.error_subcode}`, 'error');
        }
        if (data.error_details.fbtrace_id) {
          addLog('META_ERROR', `🔍 FBTrace ID: ${data.error_details.fbtrace_id}`, 'error');
        }
      }

      // 🔍 VERIFICAR ERRO DE SUPABASE
      if (error) {
        addLog('SUPABASE_ERROR', `Erro ao chamar edge function: ${error.message}`, 'error');
        throw new Error(`Edge Function Error: ${error.message}`);
      }

      // 🔍 VERIFICAR SUCESSO OU FALHA
      if (!data?.success) {
        const errorMsg = data?.error || data?.error_details?.message || 'Falha na criação da campanha (motivo desconhecido)';
        addLog('ERROR', `❌ ${errorMsg}`, 'error');
        throw new Error(errorMsg);
      }

      // ✅ SUCESSO
      addLog('SUCCESS', '🎉 Campanha criada com sucesso!', 'success', data);
      setResult(data);
      toast({
        title: "✅ Campanha criada!",
        description: `Campaign ID: ${data.campaign_id}`,
      });

    } catch (error: any) {
      console.error('❌ ERRO CAPTURADO:', error);
      
      // Log do erro com stack trace se disponível
      const errorMessage = error.message || 'Erro desconhecido';
      addLog('EXCEPTION', `❌ ${errorMessage}`, 'error');
      
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
      
      toast({
        title: "❌ Erro ao criar campanha",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const copyLogsToClipboard = () => {
    const logsText = logs.map(log => 
      `[${log.timestamp.toLocaleTimeString()}] [${log.stage}] ${log.message}`
    ).join('\n');
    
    navigator.clipboard.writeText(logsText);
    toast({
      title: "✅ Logs copiados!",
      description: "Logs copiados para a área de transferência",
    });
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Coluna Esquerda: Wizard */}
      <div className="space-y-4">
        <Alert>
          <AlertDescription>
            <strong>Modo {mode === 'wa_link' ? 'WA.ME Link' : 'CTWA Nativo'}</strong>
            {mode === 'wa_link' && ' - Usa OUTCOME_TRAFFIC e LINK_CLICKS'}
          </AlertDescription>
        </Alert>

        <WizardStep1_Info formData={formData} updateFormData={updateFormData} />
        <WizardStep2_Assets formData={formData} updateFormData={updateFormData} mode={mode} />
        <WizardStep3_Budget formData={formData} updateFormData={updateFormData} />
        <WizardStep4_Location formData={formData} updateFormData={updateFormData} />

        <Button 
          onClick={handleCreateCampaign} 
          disabled={isCreating}
          className="w-full"
          size="lg"
        >
          {isCreating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Criando Campanha...
            </>
          ) : (
            'Criar Campanha Completa (1 Clique)'
          )}
        </Button>
      </div>

      {/* Coluna Direita: Logs */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Logs de Execução</CardTitle>
            {logs.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={copyLogsToClipboard}
                className="h-7"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copiar
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aguardando criação...</p>
              ) : (
                logs.map((log, index) => (
                  <div 
                    key={index} 
                    className={`flex items-start gap-2 text-xs p-2 rounded ${
                      log.type === 'error' ? 'bg-red-50 dark:bg-red-950/20' :
                      log.type === 'success' ? 'bg-green-50 dark:bg-green-950/20' :
                      log.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-950/20' :
                      ''
                    }`}
                  >
                    {getLogIcon(log.type)}
                    <div className="flex-1">
                      <span className="font-mono text-muted-foreground">
                        [{log.timestamp.toLocaleTimeString()}]
                      </span>
                      <span className={`font-semibold ml-2 ${
                        log.type === 'error' ? 'text-red-600' :
                        log.type === 'success' ? 'text-green-600' :
                        ''
                      }`}>[{log.stage}]</span>
                      <p className="mt-1 break-words">{log.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Resultado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs font-mono">
              <div>
                <span className="text-muted-foreground">Campaign ID:</span>{' '}
                <span className="text-green-600">{result.campaign_id}</span>
              </div>
              <div>
                <span className="text-muted-foreground">AdSet ID:</span>{' '}
                <span className="text-green-600">{result.adset_id}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Creative ID:</span>{' '}
                <span className="text-green-600">{result.creative_id}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Ad ID:</span>{' '}
                <span className="text-green-600">{result.ad_id}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
