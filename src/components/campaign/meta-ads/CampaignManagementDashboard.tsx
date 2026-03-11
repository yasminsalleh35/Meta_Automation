import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, BarChart3, Settings, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { BulkOperationsPanel } from './BulkOperationsPanel';
import { CampaignInsightsCard } from './CampaignInsightsCard';
import { AutomationRulesPanel } from './AutomationRulesPanel';
import { CampaignReportsPanel } from './CampaignReportsPanel';
import { CampaignStatusSync } from '../CampaignStatusSync';
import { CampaignSyncDashboard } from '../CampaignSyncDashboard';
import { useMetaCampaignInsights } from '@/hooks/useMetaCampaignInsights';
import { useRealCampaigns } from '@/hooks/useRealCampaigns';

interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'finished';
  objective: string;
  budget_daily: number;
  budget_total: number;
  created_at: string;
  meta_campaign_id?: string;
  meta_adset_id?: string;
  meta_ad_id?: string;
}

interface CampaignManagementDashboardProps {
  campaigns: Campaign[];
  onRefresh: () => void;
}

export const CampaignManagementDashboard: React.FC<CampaignManagementDashboardProps> = ({
  campaigns,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [integrationFilter, setIntegrationFilter] = useState<string>('all');
  const [selectedTab, setSelectedTab] = useState('overview');

  const { insights, isLoading: insightsLoading, fetchInsights } = useMetaCampaignInsights();
  const { 
    hasMetaIntegration, 
    lastSyncTime, 
    outOfSyncCampaigns,
    refreshCampaignSync,
    getCampaignSyncStatus 
  } = useRealCampaigns();

  // Filter campaigns based on search and filters
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    const matchesIntegration = integrationFilter === 'all' || 
      (integrationFilter === 'connected' && campaign.meta_campaign_id) ||
      (integrationFilter === 'not-connected' && !campaign.meta_campaign_id);
    
    return matchesSearch && matchesStatus && matchesIntegration;
  });

  // Statistics
  const stats = {
    total: campaigns.length,
    active: campaigns.filter(c => c.status === 'active').length,
    paused: campaigns.filter(c => c.status === 'paused').length,
    withMeta: campaigns.filter(c => c.meta_campaign_id).length,
    synced: campaigns.length - outOfSyncCampaigns.length,
    outOfSync: outOfSyncCampaigns.length
  };

  // Load insights for campaigns with Meta integration
  const loadInsights = async () => {
    const campaignsWithMeta = filteredCampaigns
      .filter(c => c.meta_campaign_id)
      .map(c => ({ id: c.id, meta_campaign_id: c.meta_campaign_id! }));
    
    if (campaignsWithMeta.length > 0) {
      await fetchInsights(campaignsWithMeta);
    }
  };

  useEffect(() => {
    if (selectedTab === 'insights') {
      loadInsights();
    }
  }, [selectedTab, filteredCampaigns]);

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-gray-600">Ativas</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.paused}</div>
            <div className="text-sm text-gray-600">Pausadas</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.withMeta}</div>
            <div className="text-sm text-gray-600">Com Meta</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.synced}</div>
            <div className="text-sm text-gray-600">Sincronizadas</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.outOfSync}</div>
            <div className="text-sm text-gray-600">Dessincronizadas</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filtros e Busca</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar campanhas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="paused">Pausadas</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="finished">Finalizadas</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={integrationFilter} onValueChange={setIntegrationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Integração Meta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="connected">Com Meta Ads</SelectItem>
                <SelectItem value="not-connected">Sem Meta Ads</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="sync">Sincronização</TabsTrigger>
          <TabsTrigger value="insights">Métricas</TabsTrigger>
          <TabsTrigger value="bulk">Operações</TabsTrigger>
          <TabsTrigger value="automation">Automação</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            {filteredCampaigns.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-gray-500">
                    Nenhuma campanha encontrada com os filtros aplicados.
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredCampaigns.map(campaign => (
                <Card key={campaign.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{campaign.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          <span>Objetivo: {campaign.objective}</span>
                          <span>Orçamento: R$ {campaign.budget_daily}/dia</span>
                          <span>Criada: {new Date(campaign.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge variant={
                          campaign.status === 'active' ? 'default' :
                          campaign.status === 'paused' ? 'secondary' :
                          campaign.status === 'finished' ? 'destructive' : 'outline'
                        }>
                          {campaign.status === 'active' ? 'Ativa' :
                           campaign.status === 'paused' ? 'Pausada' :
                           campaign.status === 'finished' ? 'Finalizada' : 'Rascunho'}
                        </Badge>
                        
                        {campaign.meta_campaign_id ? (
                          <Badge className="bg-blue-500">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Meta Ads
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            Sem Meta
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <CampaignSyncDashboard
            totalCampaigns={stats.withMeta}
            syncedCount={stats.synced}
            outOfSyncCount={stats.outOfSync}
            lastSyncTime={lastSyncTime}
            isSyncing={false}
            hasMetaIntegration={hasMetaIntegration}
            onManualSync={refreshCampaignSync}
          />
          
          {outOfSyncCampaigns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span>Campanhas Dessincronizadas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {outOfSyncCampaigns.map(campaignId => {
                  const campaign = campaigns.find(c => c.id === campaignId);
                  const syncResult = getCampaignSyncStatus(campaignId);
                  
                  if (!campaign) return null;
                  
                  return (
                    <div key={campaignId}>
                      <h4 className="font-medium mb-2">{campaign.name}</h4>
                      <CampaignStatusSync
                        campaignId={campaignId}
                        syncResult={syncResult}
                        isLoading={false}
                        onSync={() => refreshCampaignSync()}
                        onForceSync={() => refreshCampaignSync()}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {!hasMetaIntegration ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Configure a integração com Meta Ads para visualizar métricas das campanhas.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCampaigns
                .filter(c => c.meta_campaign_id)
                .map(campaign => (
                  <CampaignInsightsCard
                    key={campaign.id}
                    campaignId={campaign.id}
                    campaignName={campaign.name}
                    insight={insights.find(i => i.campaignId === campaign.id) || null}
                    isLoading={insightsLoading}
                    onRefresh={loadInsights}
                  />
                ))}
              
              {filteredCampaigns.filter(c => c.meta_campaign_id).length === 0 && (
                <Card className="md:col-span-2 lg:col-span-3">
                  <CardContent className="p-8 text-center">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <div className="text-gray-500">
                      Nenhuma campanha com integração Meta Ads encontrada.
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <BulkOperationsPanel
            campaigns={filteredCampaigns}
            onRefresh={onRefresh}
          />
          
          {filteredCampaigns.filter(c => c.meta_campaign_id).length === 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                As operações em lote estão disponíveis apenas para campanhas com integração Meta Ads.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <AutomationRulesPanel
            campaigns={filteredCampaigns}
            onRefresh={onRefresh}
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <CampaignReportsPanel
            campaigns={filteredCampaigns}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
