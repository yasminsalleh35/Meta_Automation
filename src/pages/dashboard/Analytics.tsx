import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, TrendingUp, Users, DollarSign, Eye, Target, Activity } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRealMetrics } from '@/hooks/useRealMetrics';
import { useRealCampaigns } from '@/hooks/useRealCampaigns';
import { realMetricsService } from '@/services/RealMetricsService';

const Analytics: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date()
  });

  const { metrics, loading, error } = useRealMetrics(dateRange);
  const { campaigns } = useRealCampaigns();
  const [campaignPerformance, setCampaignPerformance] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchCampaignPerformance = async () => {
      try {
        const performance = await realMetricsService.getCampaignPerformance(dateRange);
        setCampaignPerformance(performance);
      } catch (error) {
        console.error('Error fetching campaign performance:', error);
      }
    };

    fetchCampaignPerformance();
  }, [dateRange]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setDateRange({
        from: subDays(date, 30),
        to: date
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Erro ao carregar analytics: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Análise detalhada do desempenho das suas campanhas</p>
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })} - {format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={dateRange.to}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investimento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalInvested)}</div>
            <p className="text-xs text-muted-foreground">
              ROAS: {metrics.roas.toFixed(2)}x
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Gerados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.leadsGenerated)}</div>
            <p className="text-xs text-muted-foreground">
              CPA: {formatCurrency(metrics.cpa)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CTR Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.ctr.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(metrics.clicks)} cliques
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impressões</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.impressions)}</div>
            <p className="text-xs text-muted-foreground">
              Alcance: {formatNumber(metrics.reach)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance das Campanhas */}
      <Card>
        <CardHeader>
          <CardTitle>Performance das Campanhas</CardTitle>
          <CardDescription>
            Análise detalhada de cada campanha no período selecionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {campaignPerformance.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Sem dados de performance
              </h3>
              <p className="text-gray-600">
                Dados de performance aparecerão quando as campanhas estiverem ativas
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {campaignPerformance.map((campaign, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{campaign.name}</h4>
                    <Badge 
                      className={campaign.status === 'Ativa' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                    >
                      {campaign.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Leads</p>
                      <p className="font-medium">{campaign.leads}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">CPL</p>
                      <p className="font-medium">{formatCurrency(parseFloat(campaign.cpl))}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">WhatsApp</p>
                      <p className="font-medium">{campaign.whatsappContacts}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Orçamento</p>
                      <p className="font-medium">{formatCurrency(campaign.budget)}/dia</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo de Conversões */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Conversões</CardTitle>
            <CardDescription>
              Análise de conversões do período
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total de Conversões</span>
                <span className="font-medium">{formatNumber(metrics.conversions)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Taxa de Conversão</span>
                <span className="font-medium">
                  {metrics.impressions > 0 ? ((metrics.conversions / metrics.impressions) * 100).toFixed(2) : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Custo por Conversão</span>
                <span className="font-medium">
                  {formatCurrency(metrics.conversions > 0 ? metrics.totalInvested / metrics.conversions : 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Receita por Conversão</span>
                <span className="font-medium">
                  {formatCurrency(metrics.conversions > 0 ? metrics.totalRevenue / metrics.conversions : 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ROI e Performance</CardTitle>
            <CardDescription>
              Retorno sobre investimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Receita Total</span>
                <span className="font-medium">{formatCurrency(metrics.totalRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Investimento Total</span>
                <span className="font-medium">{formatCurrency(metrics.totalInvested)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">ROI</span>
                <span className="font-medium text-green-600">
                  {((metrics.totalRevenue - metrics.totalInvested) / Math.max(metrics.totalInvested, 1) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">ROAS</span>
                <span className="font-medium text-blue-600">
                  {metrics.roas.toFixed(2)}x
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
