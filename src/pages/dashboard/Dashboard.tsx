// Force re-deploy: 2025-01-30T14:45:00 - Fix account-insights Edge Functions
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardMetrics } from '@/components/dashboard/DashboardMetrics';
import { DataSourceIndicator } from '@/components/dashboard/DataSourceIndicator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FunnelFlow from '@/components/analytics/FunnelFlow';
import { RecentCampaigns } from '@/components/dashboard/RecentCampaigns';
import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner';
import { useMetaSelection } from '@/hooks/useMetaSelection';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useAccountMetrics, useRefreshAccountMetrics } from '@/hooks/useAccountMetrics';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const Dashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const [datePreset, setDatePreset] = useState<'today' | 'last_7d' | 'last_30d'>('last_30d');
  
  // Nova fonte de dados: cache da conta
  const { data: accountMetrics, isLoading, refetch } = useAccountMetrics(datePreset);
  const refreshAccountMetrics = useRefreshAccountMetrics();
  
  const { data: selection, isLoading: selectionLoading } = useMetaSelection();

  const handleRefresh = async () => {
    try {
      console.log('[Dashboard] Refresh iniciado - Forçando atualização do cache Meta');
      
      // 1️⃣ Primeiro: Forçar atualização do cache (busca dados novos na Meta)
      await refreshAccountMetrics();
      
      // 2️⃣ Depois: Buscar dados atualizados do cache
      await refetch();
      
      console.log('[Dashboard] Refresh concluído com sucesso');
      toast({
        title: 'Métricas atualizadas',
        description: 'Dados sincronizados com sucesso da Meta.',
      });
    } catch (error) {
      console.error('[Dashboard] Erro ao atualizar métricas:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível sincronizar com a Meta. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 isolate">
      {/* 🎉 Welcome Banner - Primeiro acesso */}
      {user?.id && <WelcomeBanner userId={user.id} />}

      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Acompanhe o desempenho das suas campanhas Meta Ads em tempo real.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading || selectionLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Link to="/dashboard/simple-campaign-wizard">
            <Button className="bg-primary hover:bg-primary/90 gap-2">
              <Plus className="h-4 w-4" />
              Nova Campanha
            </Button>
          </Link>
        </div>
      </div>

      {/* Filtro de Período e Status */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Select value={datePreset} onValueChange={(value: any) => setDatePreset(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="last_7d">Últimos 7 dias</SelectItem>
            <SelectItem value="last_30d">Últimos 30 dias</SelectItem>
          </SelectContent>
        </Select>
        
        {accountMetrics && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {accountMetrics.stale ? (
              <span className="text-yellow-600">⚠️ Dados desatualizados - clique em Atualizar</span>
            ) : (
              <span>
                ✓ Atualizado em {new Date(accountMetrics.updatedAt || '').toLocaleString('pt-BR')}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Universal Metrics */}
      <DashboardMetrics 
        data={{
          activeCampaigns: accountMetrics?.activeCampaigns || 0,
          impressions: accountMetrics?.impressions || 0,
          reach: accountMetrics?.reach || 0,
          clicks: accountMetrics?.clicks || 0,
          cpa: accountMetrics?.cpa || 0,
          ctr: accountMetrics?.clicks && accountMetrics?.impressions 
            ? (accountMetrics.clicks / accountMetrics.impressions) * 100 
            : 0,
          spend: accountMetrics?.spend || 0,
        }} 
        isLoading={isLoading} 
      />

      {/* Performance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel Card */}
        <div className="lg:col-span-2">
          <Card className="w-full h-full">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">
                Funil de Performance - {datePreset === 'today' ? 'Hoje' : datePreset === 'last_7d' ? 'Últimos 7 dias' : 'Últimos 30 dias'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {isLoading ? (
                <div className="w-full h-[340px] bg-muted animate-pulse rounded-lg" />
              ) : (
                <FunnelFlow 
                  data={{
                    impressions: accountMetrics?.impressions || 0,
                    reach: accountMetrics?.reach || 0,
                    clicks: accountMetrics?.clicks || 0,
                    cpa: accountMetrics?.cpa || 0,
                  }}
                  height={340}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Investment Card */}
        <div className="lg:col-span-1">
          <Card className="w-full h-full">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Investimento Total</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 flex flex-col justify-center items-center gap-4">
              {isLoading ? (
                <div className="w-full h-20 bg-muted animate-pulse rounded-lg" />
              ) : (
                <>
                  <div className="text-4xl font-bold text-primary">
                    {new Intl.NumberFormat('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    }).format(accountMetrics?.spend || 0)}
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    {datePreset === 'today' ? 'Investido hoje' : datePreset === 'last_7d' ? 'Últimos 7 dias' : 'Últimos 30 dias'}
                  </p>
                  {accountMetrics && accountMetrics.conversations > 0 && (
                    <div className="text-center pt-4 border-t w-full">
                      <div className="text-sm text-muted-foreground">Custo por Conversa</div>
                      <div className="text-2xl font-semibold text-secondary">
                        {new Intl.NumberFormat('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL' 
                        }).format(accountMetrics.cpa)}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Campaigns */}
      <RecentCampaigns />
    </div>
  );
};

export default Dashboard;