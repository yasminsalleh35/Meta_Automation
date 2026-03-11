
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Settings, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap
} from 'lucide-react';
import { useMetaAdsAutomation } from '@/hooks/useMetaAdsAutomation';
import { AutomationRule } from '@/services/metaAds/automation/MetaAdsAutomationService';

interface AutomationRulesPanelProps {
  campaigns: any[];
  onRefresh?: () => void;
}

export const AutomationRulesPanel: React.FC<AutomationRulesPanelProps> = ({
  campaigns,
  onRefresh
}) => {
  const {
    automationRules,
    automationResults,
    isRunning,
    addAutomationRule,
    removeAutomationRule,
    updateAutomationRule,
    runAutomation,
    createLowCtrAutoPause,
    createHighCpcAlert,
    createHighFrequencyAlert,
    hasMetaIntegration
  } = useMetaAdsAutomation();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleType, setNewRuleType] = useState<'auto_pause' | 'performance_alert'>('auto_pause');
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);

  const campaignsWithMeta = campaigns.filter(c => c.meta_campaign_id);

  const handleRunAutomation = async () => {
    await runAutomation(campaignsWithMeta);
    onRefresh?.();
  };

  const handleToggleRule = (ruleId: string, isActive: boolean) => {
    updateAutomationRule(ruleId, { isActive });
  };

  const handleCreateQuickRule = (type: 'low_ctr' | 'high_cpc' | 'high_frequency') => {
    const allCampaignIds = campaignsWithMeta.map(c => c.id);
    
    switch (type) {
      case 'low_ctr':
        createLowCtrAutoPause(allCampaignIds, 0.5);
        break;
      case 'high_cpc':
        createHighCpcAlert(allCampaignIds, 10);
        break;
      case 'high_frequency':
        createHighFrequencyAlert(allCampaignIds, 5);
        break;
    }
  };

  const getStatusIcon = (rule: AutomationRule) => {
    if (!rule.isActive) return <Pause className="w-4 h-4 text-gray-400" />;
    
    switch (rule.type) {
      case 'auto_pause':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'performance_alert':
        return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      default:
        return <Settings className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      'auto_pause': 'Auto-pausar',
      'auto_optimize': 'Auto-otimizar',
      'budget_alert': 'Alerta de orçamento',
      'performance_alert': 'Alerta de performance'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (!hasMetaIntegration) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="w-5 h-5" />
            <span>Automação</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Configure a integração com Meta Ads para usar automações.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5" />
            <span>Automação</span>
            <Badge variant="outline">
              {automationRules.filter(r => r.isActive).length} ativas
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRunAutomation}
              disabled={isRunning || automationRules.length === 0}
            >
              {isRunning ? (
                <Clock className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Executar Agora
            </Button>
            
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Regra
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Regra de Automação</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="rule-name">Nome da Regra</Label>
                    <Input
                      id="rule-name"
                      value={newRuleName}
                      onChange={(e) => setNewRuleName(e.target.value)}
                      placeholder="Ex: Pausar campanhas com CTR baixo"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="rule-type">Tipo</Label>
                    <Select value={newRuleType} onValueChange={(value: any) => setNewRuleType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto_pause">Auto-pausar</SelectItem>
                        <SelectItem value="performance_alert">Alerta de Performance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={() => setShowCreateDialog(false)}>
                      Criar Regra
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCreateQuickRule('low_ctr')}
            className="text-left justify-start"
          >
            <Zap className="w-4 h-4 mr-2" />
            Auto-pausar CTR baixo
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCreateQuickRule('high_cpc')}
            className="text-left justify-start"
          >
            <Zap className="w-4 h-4 mr-2" />
            Alerta CPC alto
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCreateQuickRule('high_frequency')}
            className="text-left justify-start"
          >
            <Zap className="w-4 h-4 mr-2" />
            Alerta frequência alta
          </Button>
        </div>

        <Separator />

        {/* Automation Rules */}
        <div className="space-y-2">
          {automationRules.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <Bot className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>Nenhuma regra de automação criada</p>
              <p className="text-sm">Use os botões acima para criar regras rápidas</p>
            </div>
          ) : (
            automationRules.map(rule => (
              <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(rule)}
                  <div className="flex-1">
                    <div className="font-medium">{rule.name}</div>
                    <div className="text-sm text-gray-500">
                      {getTypeLabel(rule.type)} • {rule.campaignIds.length} campanhas
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={rule.isActive}
                    onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                  />
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAutomationRule(rule.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Recent Results */}
        {automationResults.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-2">Últimas Execuções</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {automationResults.slice(0, 5).map((result, index) => (
                  <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                    <span>{result.action}</span>
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? 'Sucesso' : 'Falha'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
