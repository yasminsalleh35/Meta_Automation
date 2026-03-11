
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Target, MapPin, Users } from 'lucide-react';
import { RealCampaign } from '@/types/realCampaign';

interface CampaignBasicInfoProps {
  campaign: RealCampaign;
}

export const CampaignBasicInfo: React.FC<CampaignBasicInfoProps> = ({ campaign }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'finished': return 'bg-red-100 text-red-800 border-red-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="w-5 h-5 text-blue-600" />
          Informações Básicas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Status</p>
            <Badge className={getStatusColor(campaign.status)}>
              {campaign.status === 'active' && '🟢 Ativa'}
              {campaign.status === 'paused' && '🟡 Pausada'}
              {campaign.status === 'finished' && '🔴 Finalizada'}
              {campaign.status === 'draft' && '⚪ Rascunho'}
            </Badge>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Objetivo</p>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">{campaign.objective}</span>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Localização</p>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-600" />
              <span className="text-sm">
                {campaign.location_city && campaign.location_state 
                  ? `${campaign.location_city}, ${campaign.location_state}`
                  : campaign.location_city || campaign.location_state || 'Não definida'
                }
              </span>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Criada em</p>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span className="text-sm">{formatDate(campaign.created_at)}</span>
            </div>
          </div>
        </div>

        {campaign.start_date && (
          <div className="pt-3 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Data de Início</p>
                <span className="text-sm">{new Date(campaign.start_date).toLocaleDateString('pt-BR')}</span>
              </div>
              {campaign.end_date && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Data de Fim</p>
                  <span className="text-sm">{new Date(campaign.end_date).toLocaleDateString('pt-BR')}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
