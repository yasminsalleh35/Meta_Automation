import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  DollarSign,
  Eye,
  MousePointer,
  Settings,
  Bell,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { usePerformanceAlerts } from '@/hooks/analytics/usePerformanceAlerts';
import { useShowMore } from '@/hooks/analytics/useShowMore';

interface AlertsPanelProps {
  data: any;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ data }) => {
  const { alerts, recommendations, alertSettings, updateAlertSettings } = usePerformanceAlerts(data);
  const [activeTab, setActiveTab] = useState('alerts');

  // Sistema "Show More" para alertas
  const {
    visibleData: visibleAlerts,
    showMore: showMoreAlerts,
    showLess: showLessAlerts,
    hasMore: hasMoreAlerts,
    isShowingAll: isShowingAllAlerts,
    remainingItems: remainingAlerts
  } = useShowMore({
    data: alerts || [],
    initialCount: 5,
    incrementCount: 5
  });

  // Sistema "Show More" para recomendações
  const {
    visibleData: visibleRecommendations,
    showMore: showMoreRecommendations,
    showLess: showLessRecommendations,
    hasMore: hasMoreRecommendations,
    isShowingAll: isShowingAllRecommendations,
    remainingItems: remainingRecommendations
  } = useShowMore({
    data: recommendations || [],
    initialCount: 3,
    incrementCount: 3
  });

  const getAlertIcon = (type: string, severity: string) => {
    if (severity === 'critical') return <XCircle className="w-4 h-4 text-red-500" />;
    if (severity === 'warning') return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getAlertBadgeColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Alertas e Recomendações
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="alerts">
              Alertas {alerts?.length > 0 && `(${alerts.length})`}
            </TabsTrigger>
            <TabsTrigger value="recommendations">
              Recomendações {recommendations?.length > 0 && `(${recommendations.length})`}
            </TabsTrigger>
            <TabsTrigger value="settings">
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="space-y-4 mt-4">
            <div className="max-h-96 overflow-y-auto">
              {visibleAlerts && visibleAlerts.length > 0 ? (
                <div className="space-y-4">
                  {visibleAlerts.map((alert, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      {getAlertIcon(alert.type, alert.severity)}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{alert.title}</h4>
                          <Badge variant={getAlertBadgeColor(alert.severity) as any}>
                            {alert.severity === 'critical' ? 'Crítico' : 
                             alert.severity === 'warning' ? 'Atenção' : 'Normal'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{alert.description}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>Campanha: {alert.campaignName}</span>
                          <span>•</span>
                          <span>Detectado há {alert.timeAgo}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Botões de controle "Show More/Less" */}
                  {(hasMoreAlerts || !isShowingAllAlerts) && (
                    <div className="flex items-center justify-center gap-2 pt-4 border-t">
                      {hasMoreAlerts && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={showMoreAlerts}
                          className="flex items-center gap-2"
                        >
                          <ChevronDown className="w-4 h-4" />
                          Ver mais {remainingAlerts} alertas
                        </Button>
                      )}
                      {!isShowingAllAlerts && visibleAlerts.length > 5 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={showLessAlerts}
                          className="flex items-center gap-2"
                        >
                          <ChevronUp className="w-4 h-4" />
                          Ver menos
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p>Nenhum alerta ativo</p>
                  <p className="text-sm">Suas campanhas estão performando bem!</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4 mt-4">
            <div className="max-h-96 overflow-y-auto">
              {visibleRecommendations && visibleRecommendations.length > 0 ? (
                <div className="space-y-4">
                  {visibleRecommendations.map((rec, index) => (
                    <div key={index} className="p-4 border rounded-lg hover:bg-blue-50 border-blue-200 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          {rec.type === 'budget' && <DollarSign className="w-4 h-4 text-blue-600" />}
                          {rec.type === 'targeting' && <Target className="w-4 h-4 text-blue-600" />}
                          {rec.type === 'creative' && <Eye className="w-4 h-4 text-blue-600" />}
                          {rec.type === 'bidding' && <TrendingUp className="w-4 h-4 text-blue-600" />}
                        </div>
                        <div className="flex-1 space-y-2">
                          <h4 className="font-medium text-gray-900">{rec.title}</h4>
                          <p className="text-sm text-gray-600">{rec.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-blue-600 font-medium">
                              Impacto estimado: {rec.impact}
                            </div>
                            <Button size="sm" variant="outline">
                              Aplicar sugestão
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Botões de controle "Show More/Less" */}
                  {(hasMoreRecommendations || !isShowingAllRecommendations) && (
                    <div className="flex items-center justify-center gap-2 pt-4 border-t">
                      {hasMoreRecommendations && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={showMoreRecommendations}
                          className="flex items-center gap-2"
                        >
                          <ChevronDown className="w-4 h-4" />
                          Ver mais {remainingRecommendations} recomendações
                        </Button>
                      )}
                      {!isShowingAllRecommendations && visibleRecommendations.length > 3 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={showLessRecommendations}
                          className="flex items-center gap-2"
                        >
                          <ChevronUp className="w-4 h-4" />
                          Ver menos
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 text-blue-500" />
                  <p>Nenhuma recomendação disponível</p>
                  <p className="text-sm">Continue monitorando para novas sugestões</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 mt-4">
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Configurações de Alertas
              </h4>
              
              {Object.entries(alertSettings || {}).map(([key, setting]: [string, any]) => (
                <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium text-sm">{setting.label}</div>
                    <div className="text-xs text-gray-500">{setting.description}</div>
                  </div>
                  <Switch
                    checked={setting.enabled}
                    onCheckedChange={(checked) => updateAlertSettings(key, { ...setting, enabled: checked })}
                  />
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium">Limites de Performance</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">CTR mínimo (%)</label>
                  <input 
                    type="number" 
                    className="w-full p-2 border rounded-md text-sm"
                    defaultValue="1.5"
                    step="0.1"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">CPC máximo (R$)</label>
                  <input 
                    type="number" 
                    className="w-full p-2 border rounded-md text-sm"
                    defaultValue="5.00"
                    step="0.10"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
