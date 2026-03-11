import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Facebook, Instagram, ExternalLink, RefreshCw, Clock, AlertTriangle } from 'lucide-react';
import type { LiveCampaign } from '@/types/liveCampaign';
import { CampaignPreviewImage } from '@/components/common/CampaignPreviewImage';
import { asMoneyBRL, asPercent, asCompactNumber, PH } from '@/utils/metricsFormat';
import { isMetricsStale, getLastSyncLabel, getMetricsStaleColor } from '@/utils/metricsStaleChecker';

interface EnhancedDashboardCampaignCardProps {
  campaign: LiveCampaign;
  onStatusToggle: (campaignId: string, newStatus: 'active' | 'paused') => void;
  onViewDetails: (campaignId: string) => void;
  onRefreshMetrics?: (campaignId: string, metaCampaignId: string) => Promise<void>;
  isRefreshing?: boolean;
}

export const EnhancedDashboardCampaignCard: React.FC<EnhancedDashboardCampaignCardProps> = ({
  campaign,
  onStatusToggle,
  onViewDetails,
  onRefreshMetrics,
  isRefreshing = false
}) => {
  const primaryConversations = campaign.metrics?.conversations;
  const primaryCost = campaign.metrics?.cost_per_messaging_conversation_started_7d;
  const metricsAreStale = isMetricsStale(campaign.last_metrics_sync_at);
  const lastSyncLabel = getLastSyncLabel(campaign.last_metrics_sync_at);
  const staleColor = getMetricsStaleColor(campaign.last_metrics_sync_at);

  const handleRefresh = async () => {
    if (onRefreshMetrics && campaign.metaCampaignId) {
      await onRefreshMetrics(campaign.id, campaign.metaCampaignId);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border border-border bg-card">
      <CardContent className="p-0">
        <div className="flex gap-3 sm:gap-4 p-3 sm:p-4">
          {/* Media Preview - Small and Fixed */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
            <CampaignPreviewImage
              src={campaign.mediaPreviewUrl}
              alt={campaign.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            {/* Header with Actions */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base sm:text-lg text-foreground truncate">
                  {campaign.name}
                </h3>
                
                {/* Social Icons + Metrics Status */}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {campaign.page?.name && (
                      <div className="flex items-center gap-1">
                        <Facebook className="w-3 h-3 text-blue-600" />
                        <span className="truncate max-w-[100px]">{campaign.page.name}</span>
                      </div>
                    )}
                    {campaign.instagram?.username && (
                      <div className="flex items-center gap-1">
                        <Instagram className="w-3 h-3 text-pink-600" />
                        <span className="truncate max-w-[100px]">@{campaign.instagram.username}</span>
                      </div>
                    )}
                  </div>

                  {/* Last Sync Badge */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge 
                          variant="outline" 
                          className={`text-[9px] px-1.5 py-0 ${staleColor} border-current/20`}
                        >
                          <Clock className="w-2.5 h-2.5 mr-1" />
                          {lastSyncLabel}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          {campaign.last_metrics_sync_at 
                            ? `Última atualização: ${new Date(campaign.last_metrics_sync_at).toLocaleString('pt-BR')}`
                            : 'Métricas nunca sincronizadas'
                          }
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Stale Warning */}
                  {metricsAreStale && campaign.status === 'active' && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <AlertTriangle className="w-3 h-3 text-yellow-600" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Métricas desatualizadas (&gt;1h)</p>
                        </TooltipContent>

                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>

              {/* Status Toggle + Refresh Button */}
              <div className="flex items-center gap-2">
                {/* Refresh Button (only for active campaigns) */}
                {campaign.status === 'active' && onRefreshMetrics && campaign.metaCampaignId && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRefresh}
                          disabled={isRefreshing}
                          className="h-8 w-8 p-0"
                        >
                          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Atualizar métricas</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {campaign.status === 'active' ? 'Ativa' : 
                   campaign.status === 'pending_review' ? 'Em análise' : 'Pausada'}
                </span>
                <Switch
                  checked={campaign.status === 'active' || campaign.status === 'pending_review'}
                  onCheckedChange={(checked) => {
                    onStatusToggle(campaign.id, checked ? 'active' : 'paused');
                  }}
                  disabled={campaign.status === 'draft' || campaign.status === 'finished' || campaign.status === 'pending_review'}
                />
              </div>
            </div>

            {/* Primary Metrics - Compact */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="space-y-0.5 p-2 sm:p-2.5 rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900">
                <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wide truncate">
                  Conversas
                </p>
                <p className="text-base sm:text-lg font-bold text-primary truncate">
                  {primaryConversations ?? PH.NONE}
                </p>
              </div>
              <div className="space-y-0.5 p-2 sm:p-2.5 rounded-md bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900">
                <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wide truncate">
                  Custo/Conv
                </p>
                <p className="text-base sm:text-lg font-bold text-green-600 dark:text-green-400 truncate">
                  {primaryCost ? asMoneyBRL(primaryCost) : PH.NONE}
                </p>
              </div>
            </div>

            {/* Secondary Metrics - Compact Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground truncate">Gasto</p>
                <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                  {asMoneyBRL(campaign.metrics?.spend)}
                </p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground truncate">Alcance</p>
                <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                  {asCompactNumber(campaign.metrics?.reach)}
                </p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground truncate">CTR</p>
                <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                  {asPercent(campaign.metrics?.clicks, campaign.metrics?.impressions)}
                </p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground truncate">Cliques</p>
                <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                  {asCompactNumber(campaign.metrics?.clicks)}
                </p>
              </div>
            </div>

            {/* View Details Button - Bottom */}
            <div className="flex justify-end pt-2 border-t border-border">
              <Button
                onClick={() => onViewDetails(campaign.id)}
                variant="default"
                size="sm"
                className="w-full sm:w-auto"
              >
                Ver Detalhes
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
