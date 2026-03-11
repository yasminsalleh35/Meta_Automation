
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMetaAdsIntegration } from '@/hooks/useMetaAdsIntegration';
import { 
  metaAdsAutomationService, 
  AutomationRule, 
  AutomationResult 
} from '@/services/metaAds/automation/MetaAdsAutomationService';

export const useMetaAdsAutomation = () => {
  const { toast } = useToast();
  const { existingIntegration } = useMetaAdsIntegration();
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [automationResults, setAutomationResults] = useState<AutomationResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const accessToken = existingIntegration?.access_token;

  useEffect(() => {
    // Load automation rules on mount
    setAutomationRules(metaAdsAutomationService.getAutomationRules());
  }, []);

  const addAutomationRule = (rule: Omit<AutomationRule, 'id'>): AutomationRule => {
    const newRule = metaAdsAutomationService.addAutomationRule(rule);
    setAutomationRules(metaAdsAutomationService.getAutomationRules());
    
    toast({
      title: "Regra de automação criada",
      description: `A regra "${newRule.name}" foi criada com sucesso.`,
    });
    
    return newRule;
  };

  const removeAutomationRule = (ruleId: string): boolean => {
    const success = metaAdsAutomationService.removeAutomationRule(ruleId);
    if (success) {
      setAutomationRules(metaAdsAutomationService.getAutomationRules());
      toast({
        title: "Regra removida",
        description: "A regra de automação foi removida com sucesso.",
      });
    }
    return success;
  };

  const updateAutomationRule = (ruleId: string, updates: Partial<AutomationRule>): boolean => {
    const success = metaAdsAutomationService.updateAutomationRule(ruleId, updates);
    if (success) {
      setAutomationRules(metaAdsAutomationService.getAutomationRules());
      toast({
        title: "Regra atualizada",
        description: "A regra de automação foi atualizada com sucesso.",
      });
    }
    return success;
  };

  const runAutomation = async (campaigns: any[]): Promise<AutomationResult[]> => {
    if (!accessToken) {
      toast({
        title: "Erro de integração",
        description: "Meta Ads não está conectado",
        variant: "destructive"
      });
      return [];
    }

    setIsRunning(true);
    
    try {
      console.log('🤖 Running automation for', campaigns.length, 'campaigns');
      
      const results = await metaAdsAutomationService.evaluateAutomationRules(
        campaigns,
        accessToken
      );

      setAutomationResults(prev => [...results, ...prev].slice(0, 100)); // Keep last 100 results

      const successCount = results.filter(r => r.success).length;
      const totalActions = results.length;

      if (totalActions > 0) {
        toast({
          title: "Automação executada",
          description: `${successCount}/${totalActions} ações executadas com sucesso.`,
        });
      }

      return results;
    } catch (error) {
      console.error('❌ Error running automation:', error);
      toast({
        title: "Erro na automação",
        description: "Ocorreu um erro ao executar as regras de automação.",
        variant: "destructive"
      });
      return [];
    } finally {
      setIsRunning(false);
    }
  };

  const clearAutomationResults = () => {
    setAutomationResults([]);
  };

  // Pre-defined automation templates
  const createLowCtrAutoPause = (campaignIds: string[], ctrThreshold: number = 0.5): AutomationRule => {
    return addAutomationRule({
      name: `Auto-pausar CTR baixo (< ${ctrThreshold}%)`,
      type: 'auto_pause',
      conditions: [
        {
          metric: 'ctr',
          operator: 'less_than',
          value: ctrThreshold,
          timeframe: '3d'
        }
      ],
      actions: [
        {
          type: 'pause_campaign',
          parameters: {}
        },
        {
          type: 'send_notification',
          parameters: {
            message: `Campanha pausada automaticamente devido ao CTR baixo (${ctrThreshold}%)`
          }
        }
      ],
      isActive: true,
      campaignIds
    });
  };

  const createHighCpcAlert = (campaignIds: string[], cpcThreshold: number = 10): AutomationRule => {
    return addAutomationRule({
      name: `Alerta CPC alto (> R$ ${cpcThreshold})`,
      type: 'performance_alert',
      conditions: [
        {
          metric: 'cpc',
          operator: 'greater_than',
          value: cpcThreshold,
          timeframe: '1d'
        }
      ],
      actions: [
        {
          type: 'send_notification',
          parameters: {
            message: `Atenção: CPC acima de R$ ${cpcThreshold} detectado`
          }
        }
      ],
      isActive: true,
      campaignIds
    });
  };

  const createHighFrequencyAlert = (campaignIds: string[], frequencyThreshold: number = 5): AutomationRule => {
    return addAutomationRule({
      name: `Alerta frequência alta (> ${frequencyThreshold})`,
      type: 'performance_alert',
      conditions: [
        {
          metric: 'frequency',
          operator: 'greater_than',
          value: frequencyThreshold,
          timeframe: '7d'
        }
      ],
      actions: [
        {
          type: 'send_notification',
          parameters: {
            message: `Atenção: Frequência alta (${frequencyThreshold}) detectada - risco de fadiga do anúncio`
          }
        }
      ],
      isActive: true,
      campaignIds
    });
  };

  return {
    automationRules,
    automationResults,
    isRunning,
    addAutomationRule,
    removeAutomationRule,
    updateAutomationRule,
    runAutomation,
    clearAutomationResults,
    hasMetaIntegration: !!accessToken,
    
    // Pre-defined templates
    createLowCtrAutoPause,
    createHighCpcAlert,
    createHighFrequencyAlert
  };
};
