import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  MessageCircle,
  DollarSign,
  Wallet,
  Users,
  TrendingUp,
  MousePointer,
  RotateCw,
  Info,
  Clock,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { LiveCampaign } from '@/types/liveCampaign';
import { getObjectiveFriendlyName } from '@/utils/objectiveNames';
import { CampaignPreviewImage } from '@/components/common/CampaignPreviewImage';
import { CampaignBudgetInline } from '@/components/campaign/CampaignBudgetInline';
import { asMoneyBRL, asPercent, asCompactNumber, PH, formatSyncDate } from '@/utils/metricsFormat';
import { isMetricsStale, getLastSyncLabel, getMetricsStaleColor } from '@/utils/metricsStaleChecker';

interface ModernCampaignCardProps {
  campaign: LiveCampaign;
  onStatusChange: (campaignId: string, newStatus: 'active' | 'paused') => void;
  onRefresh: () => void;
  onRefreshMetrics?: (campaignId: string, metaCampaignId: string) => Promise<void>;
  isLoading?: boolean;
  isRefreshing?: boolean;
  isIndividualRefreshing?: boolean;
}

export const ModernCampaignCard: React.FC<ModernCampaignCardProps> = ({
  campaign,
  onStatusChange,
  onRefresh,
  onRefreshMetrics,
  isLoading = false,
  isRefreshing = false,
  isIndividualRefreshing = false
}) => {
  const metricsAreStale = isMetricsStale(campaign.last_metrics_sync_at);
  const lastSyncLabel = getLastSyncLabel(campaign.last_metrics_sync_at);
  const staleColor = getMetricsStaleColor(campaign.last_metrics_sync_at);

  const handleIndividualRefresh = async () => {
    if (onRefreshMetrics && campaign.metaCampaignId) {
      await onRefreshMetrics(campaign.id, campaign.metaCampaignId);
    }
  };
  const getCTRColor = (clicks?: number, impressions?: number): string => {
    const c = Number(clicks) || 0;
    const i = Number(impressions) || 0;
    if (i === 0) return 'text-muted-foreground';
    const ctr = (c / i) * 100;
    if (ctr >= 2) return 'text-green-600';
    if (ctr >= 1) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = () => {
    switch (campaign.status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-600 rounded-full mr-1 animate-pulse" />
            Ativa
          </Badge>
        );
      case 'paused':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
            Pausada
          </Badge>
        );
      case 'pending_review':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full mr-1 animate-pulse" />
            Em análise
          </Badge>
        );
      case 'finished':
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
            Finalizada
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
            Rascunho
          </Badge>
        );
    }
  };

  const MetricCard = ({ 
    icon: Icon, 
    label, 
    value, 
    isPrimary = false 
  }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    isPrimary?: boolean;
  }) => (
    <div className={`rounded-lg ${
      isPrimary 
        ? 'bg-primary/5 dark:bg-primary/10 p-2 sm:p-2.5' 
        : 'bg-muted p-1.5 sm:p-2'
    }`}>
      <div className="flex items-start gap-1 sm:gap-1.5">
        <Icon className={`w-3 h-3 mt-0.5 flex-shrink-0 ${isPrimary ? 'text-primary' : 'text-muted-foreground'}`} />
        <div className="flex-1 min-w-0">
          <p className="text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-wide truncate mb-0.5">
            {label}
          </p>
          <p className={`font-semibold truncate ${isPrimary ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'}`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border border-border hover:border-primary/50 bg-card">
      <CardContent className="p-2 sm:p-3 md:p-4">
        <div className="flex gap-2 sm:gap-3 md:gap-4">
          {/* Media Preview — Increased size for better visibility */}
          <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-lg overflow-hidden flex-shrink-0 bg-muted transition-transform duration-300 hover:scale-105">
            <CampaignPreviewImage
              src={campaign.mediaPreviewUrl}
              alt={campaign.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Campaign Info */}
          <div className="flex-1 min-w-0 flex flex-col gap-2 sm:gap-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-1 sm:gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm sm:text-base text-foreground mb-0.5 leading-tight truncate">
                  {campaign.name}
                </h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  {getObjectiveFriendlyName(campaign.objective)}
                </p>
                {/* Social links - esconder no mobile muito pequeno */}
                <div className="hidden xs:flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-0.5 truncate max-w-[70px] sm:max-w-[100px]">
                    <span className="flex-shrink-0">FB:</span>
                    <span className="truncate">{campaign.page?.name || 'N/D'}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5 truncate max-w-[70px] sm:max-w-[100px]">
                    <span className="flex-shrink-0">IG:</span>
                    <span className="truncate">
                      {campaign.instagram?.username ? `@${campaign.instagram.username}` : '—'}
                    </span>
                  </span>
                </div>
              </div>
              
              {/* Actions - Badge + labeled refresh + Switch */}
              <div className="flex flex-wrap items-center gap-1.5 justify-end flex-shrink-0">
                {getStatusBadge()}

                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 px-2"
                  onClick={handleIndividualRefresh}
                  disabled={isIndividualRefreshing || isRefreshing || !campaign.metaCampaignId}
                  title="Atualizar métricas (últimos 30 dias)"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isIndividualRefreshing ? 'animate-spin' : ''}`} />
                  <span className="text-xs">Atualizar métricas</span>
                </Button>

                <Switch
                  checked={campaign.status === 'active' || campaign.status === 'pending_review'}
                  onCheckedChange={(checked) => {
                    onStatusChange(campaign.id, checked ? 'active' : 'paused');
                  }}
                  disabled={isLoading || campaign.status === 'finished' || campaign.status === 'pending_review'}
                  className={`scale-75 sm:scale-100 ${(campaign.status === 'active' || campaign.status === 'pending_review')
                    ? 'data-[state=checked]:bg-green-600' 
                    : 'data-[state=unchecked]:bg-slate-400'
                  }`}
                />
              </div>
            </div>

            {/* Daily budget — display + inline edit */}
            <CampaignBudgetInline
              campaignId={campaign.id}
              metaAdsetId={campaign.metaAdsetId}
              budgetDaily={campaign.budgetDaily}
              disabled={campaign.status === 'finished'}
            />

            {/* Primary Metrics - Highlighted */}
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Período: últimos 30 dias</p>
                      {campaign.last_metrics_sync_at && (
                        <p className="text-xs">
                          Atualizado em: {formatSyncDate(campaign.last_metrics_sync_at)}
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span>Métricas</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <MetricCard
                  icon={MessageCircle}
                  label="Conversas Iniciadas"
                  value={campaign.metrics?.conversations ?? PH.NONE}
                  isPrimary
                />
                <MetricCard
                  icon={DollarSign}
                  label="Custo por Conversa"
                  value={campaign.metrics?.cost_per_messaging_conversation_started_7d 
                    ? asMoneyBRL(campaign.metrics.cost_per_messaging_conversation_started_7d)
                    : PH.NONE
                  }
                  isPrimary
                />
              </div>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 pt-2 sm:pt-2.5 border-t">
              <div className="space-y-0.5 p-1.5 sm:p-2 rounded-lg bg-muted">
                <div className="flex items-center gap-0.5 sm:gap-1 mb-0.5">
                  <Wallet className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground flex-shrink-0" />
                  <p className="text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-wide truncate">Gasto</p>
                </div>
                <p className="text-[10px] sm:text-xs font-semibold text-foreground truncate">
                  {asMoneyBRL(campaign.metrics?.spend)}
                </p>
              </div>

              <div className="space-y-0.5 p-1.5 sm:p-2 rounded-lg bg-muted">
                <div className="flex items-center gap-0.5 sm:gap-1 mb-0.5">
                  <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground flex-shrink-0" />
                  <p className="text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-wide truncate">Alcance</p>
                </div>
                <p className="text-[10px] sm:text-xs font-semibold text-foreground truncate">
                  {asCompactNumber(campaign.metrics?.reach)}
                </p>
              </div>

              <div className="space-y-0.5 p-1.5 sm:p-2 rounded-lg bg-muted">
                <div className="flex items-center gap-0.5 sm:gap-1 mb-0.5">
                  <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground flex-shrink-0" />
                  <p className="text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-wide truncate">CTR</p>
                </div>
                <p className={`text-[10px] sm:text-xs font-semibold truncate ${getCTRColor(campaign.metrics?.clicks, campaign.metrics?.impressions)}`}>
                  {asPercent(campaign.metrics?.clicks, campaign.metrics?.impressions)}
                </p>
              </div>

              <div className="space-y-0.5 p-1.5 sm:p-2 rounded-lg bg-muted">
                <div className="flex items-center gap-0.5 sm:gap-1 mb-0.5">
                  <MousePointer className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground flex-shrink-0" />
                  <p className="text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-wide truncate">Cliques</p>
                </div>
                <p className="text-[10px] sm:text-xs font-semibold text-foreground truncate">
                  {asCompactNumber(campaign.metrics?.clicks)}
                </p>
              </div>
            </div>

            {/* Ver Detalhes Button */}
            <div className="flex justify-end pt-2 border-t">
              <Button
                variant="default"
                size="sm"
                asChild
                className="gap-1.5"
              >
                <Link to={`/dashboard/simple-campaign-insights/${campaign.id}`}>
                  Ver Detalhes
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
