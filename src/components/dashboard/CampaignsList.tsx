import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, MousePointer, DollarSign, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Campaign {
  id: string;
  name: string;
  status: string;
  budget_daily?: number;
  budget_total?: number;
  objective?: string;
  created_at: string;
}

interface CampaignsListProps {
  campaigns: Campaign[];
  insights: any[];
  isLoading?: boolean;
}

export const CampaignsList: React.FC<CampaignsListProps> = ({ 
  campaigns, 
  insights,
  isLoading = false 
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'active': { label: 'Ativa', variant: 'default' as const },
      'paused': { label: 'Pausada', variant: 'secondary' as const },
      'draft': { label: 'Rascunho', variant: 'outline' as const },
      'finished': { label: 'Finalizada', variant: 'destructive' as const }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || 
      { label: status, variant: 'outline' as const };
    
    return (
      <Badge variant={statusInfo.variant} className="text-xs">
        {statusInfo.label}
      </Badge>
    );
  };

  const getCampaignInsights = (campaignId: string) => {
    const insight = insights.find(i => i.campaign_id === campaignId);
    return insight?.success ? insight.insights : null;
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Campanhas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-5 bg-muted rounded w-1/3" />
                  <div className="h-6 bg-muted rounded w-20" />
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-4 bg-muted rounded" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Campanhas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhuma campanha encontrada.</p>
            <Link 
              to="/dashboard/simple-campaign-wizard"
              className="text-primary hover:underline mt-2 inline-block"
            >
              Criar sua primeira campanha
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Campanhas
          <span className="text-sm font-normal text-muted-foreground">
            {campaigns.length} total
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
          {campaigns.slice(0, 10).map((campaign) => {
            const campaignInsights = getCampaignInsights(campaign.id);
            
            return (
              <div 
                key={campaign.id}
                className="p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm truncate max-w-[200px]">
                      {campaign.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {campaign.objective || 'OUTCOME_TRAFFIC'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {getStatusBadge(campaign.status)}
                    <span className="text-xs text-muted-foreground">
                      {formatCurrency(campaign.budget_daily || 0)}/dia
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <Eye className="h-3 w-3 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Alcance</p>
                      <p className="font-medium">
                        {campaignInsights ? formatNumber(campaignInsights.reach || 0) : '-'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MousePointer className="h-3 w-3 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Cliques</p>
                      <p className="font-medium">
                        {campaignInsights ? formatNumber(campaignInsights.clicks || 0) : '-'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Gasto</p>
                      <p className="font-medium">
                        {campaignInsights ? formatCurrency(campaignInsights.spend || 0) : '-'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">CPA</p>
                      <p className="font-medium">
                        {campaignInsights && campaignInsights.clicks > 0 
                          ? formatCurrency((campaignInsights.spend || 0) / campaignInsights.clicks)
                          : '-'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {campaigns.length > 10 && (
          <div className="mt-4 text-center">
            <Link 
              to="/dashboard/campaigns"
              className="text-sm text-primary hover:underline"
            >
              Ver todas as {campaigns.length} campanhas
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};