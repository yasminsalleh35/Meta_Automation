
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight,
  MapPin,
  DollarSign,
  Calendar,
  Play,
  Pause,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import { RealCampaign } from '@/types/realCampaign';
import { getObjectiveFriendlyName } from '@/utils/objectiveNames';

interface MobileCampaignCardProps {
  campaign: RealCampaign;
  onExpand: () => void;
  onStatusChange: (campaignId: string, newStatus: 'active' | 'paused' | 'finished') => void;
  onQuickAction?: (action: 'edit' | 'view' | 'delete', campaignId: string) => void;
}

export const MobileCampaignCard: React.FC<MobileCampaignCardProps> = ({
  campaign,
  onExpand,
  onStatusChange,
  onQuickAction
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-500 text-white border-0 text-xs">
            <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
            Ativa
          </Badge>
        );
      case 'paused':
        return (
          <Badge className="bg-yellow-500 text-white border-0 text-xs">
            <Pause className="w-3 h-3 mr-1" />
            Pausada
          </Badge>
        );
      case 'finished':
        return (
          <Badge className="bg-gray-500 text-white border-0 text-xs">
            Finalizada
          </Badge>
        );
      case 'draft':
        return (
          <Badge className="bg-blue-500 text-white border-0 text-xs">
            Rascunho
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getLocationText = () => {
    if (campaign.location_city && campaign.location_state) {
      return `${campaign.location_city}, ${campaign.location_state}`;
    }
    if (campaign.location_city) {
      return campaign.location_city;
    }
    if (campaign.location_state) {
      return campaign.location_state;
    }
    return 'Localização não definida';
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border border-gray-200 bg-white">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-base leading-tight mb-1 truncate">
              {campaign.name}
            </h3>
            <p className="text-sm text-gray-500 mb-2 truncate">
              {getObjectiveFriendlyName(campaign.objective)}
            </p>
            {getStatusBadge(campaign.status)}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onExpand}
            className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 ml-2"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Content Grid */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-700 truncate">
              {getLocationText()}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Orçamento/dia</p>
              <p className="text-sm font-bold text-blue-600">
                {formatCurrency(campaign.budget_daily)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Criada em</p>
              <p className="text-sm text-gray-700">
                {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {campaign.status === 'active' ? (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(campaign.id, 'paused');
                }}
                className="h-8 px-3 text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                <Pause className="w-3 h-3 mr-1" />
                Pausar
              </Button>
            ) : campaign.status === 'paused' || campaign.status === 'draft' ? (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(campaign.id, 'active');
                }}
                className="h-8 px-3 text-green-600 border-green-200 hover:bg-green-50"
              >
                <Play className="w-3 h-3 mr-1" />
                Ativar
              </Button>
            ) : null}
          </div>
          
          <div className="flex items-center gap-1">
            {campaign.meta_campaign_id && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickAction?.('view', campaign.id);
                }}
                className="h-8 px-2 text-blue-600 hover:bg-blue-50"
              >
                <Eye className="w-3 h-3" />
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onQuickAction?.('edit', campaign.id);
              }}
              className="h-8 px-2 text-gray-600 hover:bg-gray-50"
            >
              <MoreHorizontal className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Meta Integration Badge */}
        {campaign.meta_campaign_id && (
          <div className="mt-3 pt-2 border-t border-gray-100">
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              Meta Ads Integrado
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
