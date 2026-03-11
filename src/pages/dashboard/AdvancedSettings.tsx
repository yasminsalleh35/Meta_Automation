import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Bell, 
  Database, 
  Code, 
  Zap, 
  AlertTriangle, 
  Settings,
  ExternalLink 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdvancedSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    autoOptimization: true,
    smartBidding: false,
    apiAccess: false,
    debugMode: false,
    dataRetention: '90',
    webhookUrl: '',
    maxCampaigns: '10',
    notificationLevel: 'all',
  });

  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Configurações Salvas",
      description: "Suas configurações avançadas foram atualizadas com sucesso.",
    });
  };

  const handleReset = () => {
    setSettings({
      autoOptimization: true,
      smartBidding: false,
      apiAccess: false,
      debugMode: false,
      dataRetention: '90',
      webhookUrl: '',
      maxCampaigns: '10',
      notificationLevel: 'all',
    });
    toast({
      title: "Configurações Redefinidas",
      description: "Todas as configurações foram restauradas aos valores padrão.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configurações Avançadas</h1>
            <p className="text-gray-600">
              Configure opções avançadas do sistema
            </p>
          </div>
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            <Shield className="h-3 w-3 mr-1" />
            Admin Only
          </Badge>
        </div>

        <Tabs defaultValue="optimization" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="optimization">Otimização</TabsTrigger>
            <TabsTrigger value="api">API & Webhooks</TabsTrigger>
            <TabsTrigger value="data">Dados</TabsTrigger>
            <TabsTrigger value="system">Sistema</TabsTrigger>
          </TabsList>

          <TabsContent value="optimization" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Otimização Automática
                </CardTitle>
                <CardDescription>
                  Configure as opções de otimização automática das campanhas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-otimização de Orçamento</Label>
                    <p className="text-sm text-gray-500">
                      Permite que o sistema ajuste automaticamente os orçamentos
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoOptimization}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, autoOptimization: checked }))
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Smart Bidding</Label>
                    <p className="text-sm text-gray-500">
                      Usa IA para otimizar lances automaticamente
                    </p>
                  </div>
                  <Switch
                    checked={settings.smartBidding}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, smartBidding: checked }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Limite Máximo de Campanhas</Label>
                  <Select
                    value={settings.maxCampaigns}
                    onValueChange={(value) => 
                      setSettings(prev => ({ ...prev, maxCampaigns: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 campanhas</SelectItem>
                      <SelectItem value="10">10 campanhas</SelectItem>
                      <SelectItem value="25">25 campanhas</SelectItem>
                      <SelectItem value="50">50 campanhas</SelectItem>
                      <SelectItem value="unlimited">Ilimitado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  API & Integração
                </CardTitle>
                <CardDescription>
                  Configure acesso à API e webhooks para integração externa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Acesso à API</Label>
                    <p className="text-sm text-gray-500">
                      Habilita acesso programático via API REST
                    </p>
                  </div>
                  <Switch
                    checked={settings.apiAccess}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, apiAccess: checked }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>URL do Webhook</Label>
                  <Input
                    value={settings.webhookUrl}
                    onChange={(e) => 
                      setSettings(prev => ({ ...prev, webhookUrl: e.target.value }))
                    }
                    placeholder="https://sua-app.com/webhook"
                  />
                  <p className="text-sm text-gray-500">
                    URL para receber notificações de eventos das campanhas
                  </p>
                </div>

                {settings.apiAccess && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <ExternalLink className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-900">Documentação da API</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Acesse nossa documentação completa para integrar com a API
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Gestão de Dados
                </CardTitle>
                <CardDescription>
                  Configure a retenção e processamento de dados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Período de Retenção de Dados</Label>
                  <Select
                    value={settings.dataRetention}
                    onValueChange={(value) => 
                      setSettings(prev => ({ ...prev, dataRetention: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 dias</SelectItem>
                      <SelectItem value="90">90 dias</SelectItem>
                      <SelectItem value="180">6 meses</SelectItem>
                      <SelectItem value="365">1 ano</SelectItem>
                      <SelectItem value="forever">Permanente</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500">
                    Define por quanto tempo os dados das campanhas são mantidos
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Nível de Notificações</Label>
                  <Select
                    value={settings.notificationLevel}
                    onValueChange={(value) => 
                      setSettings(prev => ({ ...prev, notificationLevel: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Apenas Críticas</SelectItem>
                      <SelectItem value="important">Importantes</SelectItem>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="none">Nenhuma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Sistema
                </CardTitle>
                <CardDescription>
                  Configurações de sistema e debug
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Modo Debug</Label>
                    <p className="text-sm text-gray-500">
                      Ativa logs detalhados para diagnóstico
                    </p>
                  </div>
                  <Switch
                    checked={settings.debugMode}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, debugMode: checked }))
                    }
                  />
                </div>

                {settings.debugMode && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-yellow-900">Aviso</span>
                    </div>
                    <p className="text-sm text-yellow-700">
                      O modo debug pode impactar a performance do sistema
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-6 border-t">
          <Button variant="outline" onClick={handleReset}>
            Restaurar Padrões
          </Button>
          <Button onClick={handleSave}>
            Salvar Configurações
          </Button>
        </div>
    </div>
  );
};

export default AdvancedSettings;
