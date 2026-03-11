
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Play, 
  Pause, 
  Square, 
  MoreHorizontal, 
  Edit, 
  BarChart3, 
  RefreshCw,
  Settings,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'finished';
  meta_campaign_id?: string;
}

interface CampaignQuickActionsProps {
  campaign: Campaign;
  onActivate: (campaignId: string) => void;
  onPause: (campaignId: string) => void;
  onStop: (campaignId: string) => void;
  onEdit: (campaignId: string) => void;
  onViewInsights: (campaignId: string) => void;
  onSync: (campaignId: string) => void;
  isLoading?: boolean;
  isSynced?: boolean;
}

export const CampaignQuickActions: React.FC<CampaignQuickActionsProps> = ({
  campaign,
  onActivate,
  onPause,
  onStop,
  onEdit,
  onViewInsights,
  onSync,
  isLoading = false,
  isSynced = true
}) => {
  const getStatusBadge = () => {
    switch (campaign.status) {
      case 'active':
        return <Badge className="bg-green-500">Ativa</Badge>;
      case 'paused':
        return <Badge variant="secondary">Pausada</Badge>;
      case 'finished':
        return <Badge variant="destructive">Finalizada</Badge>;
      default:
        return <Badge variant="outline">Rascunho</Badge>;
    }
  };

  const canActivate = campaign.status === 'paused' || campaign.status === 'draft';
  const canPause = campaign.status === 'active';
  const canStop = campaign.status === 'active' || campaign.status === 'paused';

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{campaign.name}</h3>
            <div className="flex items-center space-x-2 mt-1">
              {getStatusBadge()}
              {campaign.meta_campaign_id && (
                <Badge variant="outline" className="text-xs">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Meta
                </Badge>
              )}
              {!isSynced && campaign.meta_campaign_id && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Dessinc
                </Badge>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white border shadow-lg z-50">
              <DropdownMenuItem onClick={() => onEdit(campaign.id)}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              
              {campaign.meta_campaign_id && (
                <>
                  <DropdownMenuItem onClick={() => onViewInsights(campaign.id)}>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Ver Métricas
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => onSync(campaign.id)}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sincronizar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex space-x-2">
          {canActivate && (
            <Button
              size="sm"
              onClick={() => onActivate(campaign.id)}
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Play className="w-4 h-4 mr-1" />
              Ativar
            </Button>
          )}
          
          {canPause && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPause(campaign.id)}
              disabled={isLoading}
              className="flex-1"
            >
              <Pause className="w-4 h-4 mr-1" />
              Pausar
            </Button>
          )}
          
          {canStop && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onStop(campaign.id)}
              disabled={isLoading}
              className="flex-1"
            >
              <Square className="w-4 h-4 mr-1" />
              Finalizar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
