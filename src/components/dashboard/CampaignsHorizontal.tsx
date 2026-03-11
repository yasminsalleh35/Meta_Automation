import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Link } from 'react-router-dom';
import { brl, formatNumber, statusColor } from '@/utils/format';
import type { LiveCampaign } from '@/types/liveCampaign';
import { Megaphone, MousePointer, Eye, Coins, TrendingDown, Facebook, Instagram } from 'lucide-react';

interface Props { 
  campaigns: LiveCampaign[]; 
  title?: string;
  isLoading?: boolean;
}

export default function CampaignsHorizontal({ campaigns, title = 'Campanhas', isLoading = false }: Props) {
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 bg-muted animate-pulse rounded w-32" />
            <div className="h-8 bg-muted animate-pulse rounded w-20" />
          </div>
          <div className="flex gap-4 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="min-w-[320px] p-4 bg-muted animate-pulse rounded-2xl h-48" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">{title}</h3>
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard/campaigns">Ver todas</Link>
            </Button>
          </div>
          <div className="text-center py-12 text-muted-foreground">
            <p className="mb-2">Nenhuma campanha encontrada.</p>
            <Button asChild variant="outline">
              <Link to="/dashboard/simple-campaign-wizard">
                Criar sua primeira campanha
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard/campaigns">Ver todas</Link>
          </Button>
        </div>

        <div 
          className="flex gap-4 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgb(148 163 184) transparent'
          }}
        >
          {campaigns.map((campaign) => {
            const sc = statusColor(campaign.status);
            return (
              <Card 
                key={campaign.id} 
                className="min-w-[320px] lg:min-w-[280px] snap-start rounded-2xl shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  {/* Preview da mídia */}
                  {(campaign as any).previewUrl && (
                    <div className="mb-3 rounded-lg overflow-hidden">
                      <img 
                        src={(campaign as any).previewUrl} 
                        alt={`Preview de ${campaign.name}`}
                        className="w-full h-32 object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {campaign.name}
                      </h4>
                    </div>
                    <Badge className={`${sc.bg} ${sc.fg} border-0 text-xs font-semibold ml-2`}>
                      {sc.label}
                    </Badge>
                  </div>

                  {/* Página e Instagram */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(campaign as any).page?.name && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                        <Facebook size={10} />
                        <span className="truncate max-w-[80px]">{(campaign as any).page.name}</span>
                      </div>
                    )}
                    {(campaign as any).instagram?.username && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 rounded-full text-xs">
                        <Instagram size={10} />
                        <span className="truncate max-w-[80px]">@{(campaign as any).instagram.username}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-full text-xs">
                      <Megaphone size={12} className="text-muted-foreground" />
                      <span>{campaign.objective || 'traffic'}</span>
                    </div>
                  </div>

                  <div className="border-t pt-4 mb-4">
                    <div className="grid grid-cols-2 gap-3">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2">
                              <Eye size={14} className="text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">Alcance</p>
                                <p className="text-sm font-semibold">
                                  {formatNumber(campaign.metrics?.reach ?? 0)}
                                </p>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Número de pessoas alcançadas</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2">
                              <MousePointer size={14} className="text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">Cliques</p>
                                <p className="text-sm font-semibold">
                                  {formatNumber(campaign.metrics?.clicks ?? 0)}
                                </p>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Total de cliques nos anúncios</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2">
                              <Coins size={14} className="text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">Gasto</p>
                                <p className="text-sm font-semibold">
                                  {brl(campaign.metrics?.spend ?? 0)}
                                </p>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Valor total investido</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2">
                              <TrendingDown size={14} className="text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">CPA</p>
                                <p className="text-sm font-semibold">
                                  {campaign.metrics?.cpa ? brl(campaign.metrics.cpa) : '—'}
                                </p>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Custo por aquisição</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      asChild 
                      size="sm" 
                      className="rounded-full"
                      aria-label={`Ver mais sobre ${campaign.name}`}
                    >
                      <Link to="/dashboard/campaigns">Ver mais</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}