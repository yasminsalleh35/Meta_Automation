import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle,
  Eye,
  Loader2,
  MousePointerClick,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useMonitoringDashboard } from '@/hooks/useMonitoringDashboard';
import type { PerformanceAlert, CampaignMetricsSummary } from '@/hooks/useMonitoringDashboard';

const formatNumber = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('pt-BR');
};

const formatCurrency = (n: number): string => {
  return `R$ ${n.toFixed(2).replace('.', ',')}`;
};

const severityColor = (s: string) => {
  switch (s) {
    case 'danger': return 'destructive';
    case 'warning': return 'secondary';
    default: return 'outline';
  }
};

const severityIcon = (s: string) => {
  switch (s) {
    case 'danger': return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case 'warning': return <TrendingDown className="h-4 w-4 text-amber-500" />;
    default: return <Activity className="h-4 w-4 text-blue-500" />;
  }
};

// ── Metric Card ─────────────────────────────────────────────────────────────

function MetricCard({ title, value, icon, subtitle }: {
  title: string;
  value: string;
  icon: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Alert Item ──────────────────────────────────────────────────────────────

function AlertItem({ alert, onDismiss }: { alert: PerformanceAlert; onDismiss: (id: string) => void }) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${alert.is_read ? 'opacity-60' : ''}`}>
      {severityIcon(alert.severity)}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{alert.title}</p>
          <Badge variant={severityColor(alert.severity) as any} className="text-[10px] px-1.5 py-0">
            {alert.severity}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
        <p className="text-[10px] text-muted-foreground mt-1">
          {new Date(alert.created_at).toLocaleString('pt-BR')}
        </p>
      </div>
      {!alert.is_read && (
        <Button variant="ghost" size="sm" onClick={() => onDismiss(alert.id)} className="shrink-0">
          <CheckCircle className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

// ── Campaign Row ────────────────────────────────────────────────────────────

function CampaignRow({ campaign }: { campaign: CampaignMetricsSummary }) {
  const statusColor = campaign.status === 'ACTIVE' || campaign.status === 'active'
    ? 'bg-green-500'
    : 'bg-gray-400';

  return (
    <div className="grid grid-cols-8 gap-2 items-center py-2.5 px-3 text-sm hover:bg-muted/50 rounded-md">
      <div className="col-span-2 flex items-center gap-2 min-w-0">
        <div className={`h-2 w-2 rounded-full shrink-0 ${statusColor}`} />
        <span className="truncate font-medium">{campaign.campaign_name}</span>
      </div>
      <div className="text-right">{formatNumber(campaign.impressions)}</div>
      <div className="text-right">{formatNumber(campaign.reach)}</div>
      <div className="text-right">{formatNumber(campaign.clicks)}</div>
      <div className="text-right">{campaign.ctr.toFixed(2)}%</div>
      <div className="text-right">{formatCurrency(campaign.spend)}</div>
      <div className="text-right font-medium">
        {campaign.conversations > 0 ? formatCurrency(campaign.cpa) : '—'}
      </div>
    </div>
  );
}

// ── Main Dashboard ──────────────────────────────────────────────────────────

export default function Monitoring() {
  const {
    campaigns,
    alerts,
    apiUsage,
    totals,
    unreadAlerts,
    isLoading,
    isRefreshing,
    refreshMetrics,
    dismissAlert,
  } = useMonitoringDashboard();

  const avgCtr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const avgCpa = totals.conversations > 0 ? totals.spend / totals.conversations : 0;
  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE' || c.status === 'active').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Monitoramento</h1>
          <p className="text-sm text-muted-foreground">
            Visao geral de performance, alertas e uso da API
          </p>
        </div>
        <Button onClick={refreshMetrics} disabled={isRefreshing} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Campanhas Ativas"
          value={String(activeCampaigns)}
          icon={<Zap className="h-5 w-5 text-primary" />}
          subtitle={`${campaigns.length} total`}
        />
        <MetricCard
          title="Impressoes"
          value={formatNumber(totals.impressions)}
          icon={<Eye className="h-5 w-5 text-primary" />}
          subtitle="Ultimos 7 dias"
        />
        <MetricCard
          title="Cliques"
          value={formatNumber(totals.clicks)}
          icon={<MousePointerClick className="h-5 w-5 text-primary" />}
          subtitle={`CTR: ${avgCtr.toFixed(2)}%`}
        />
        <MetricCard
          title="Investimento"
          value={formatCurrency(totals.spend)}
          icon={<BarChart3 className="h-5 w-5 text-primary" />}
        />
        <MetricCard
          title="CPA Medio"
          value={avgCpa > 0 ? formatCurrency(avgCpa) : '—'}
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
          subtitle={`${totals.conversations} conversas`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign Performance Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Performance por Campanha
            </CardTitle>
            <CardDescription>Metricas dos ultimos 7 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma metrica em cache. Clique em "Atualizar" para buscar dados.
              </p>
            ) : (
              <div className="space-y-0.5">
                {/* Header */}
                <div className="grid grid-cols-8 gap-2 items-center py-2 px-3 text-xs font-medium text-muted-foreground border-b">
                  <div className="col-span-2">Campanha</div>
                  <div className="text-right">Impr.</div>
                  <div className="text-right">Alcance</div>
                  <div className="text-right">Cliques</div>
                  <div className="text-right">CTR</div>
                  <div className="text-right">Gasto</div>
                  <div className="text-right">CPA</div>
                </div>
                {campaigns.map(c => (
                  <CampaignRow key={c.campaign_id} campaign={c} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts Panel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Alertas
              {unreadAlerts > 0 && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 ml-1">
                  {unreadAlerts}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Anomalias detectadas automaticamente</CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum alerta no momento</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {alerts.map(a => (
                  <AlertItem key={a.id} alert={a} onDismiss={dismissAlert} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* API Usage */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Uso da API Meta (ultimas 24h)
          </CardTitle>
          <CardDescription>Limite: 200 chamadas/hora por conta</CardDescription>
        </CardHeader>
        <CardContent>
          {apiUsage.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Sem dados de uso da API ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {apiUsage.map((u, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-12 shrink-0">{u.hour}</span>
                  <div className="flex-1">
                    <Progress
                      value={Math.min(u.percentage, 100)}
                      className={`h-2 ${u.percentage > 80 ? '[&>div]:bg-red-500' : u.percentage > 50 ? '[&>div]:bg-amber-500' : ''}`}
                    />
                  </div>
                  <span className={`text-xs w-16 text-right ${u.percentage > 80 ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                    {u.call_count}/{u.limit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
