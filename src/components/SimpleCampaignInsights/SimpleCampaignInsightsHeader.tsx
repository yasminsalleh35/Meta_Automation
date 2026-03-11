
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Target } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Campaign {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'REJECTED';
  createdAt: string;
  metaCampaignId?: string;
}

interface SimpleCampaignInsightsHeaderProps {
  campaign: Campaign;
}

export const SimpleCampaignInsightsHeader: React.FC<SimpleCampaignInsightsHeaderProps> = ({
  campaign
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-500 text-white">🟢 Ativa</Badge>;
      case 'PAUSED':
        return <Badge className="bg-yellow-500 text-white">🟡 Pausada</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-500 text-white">🔴 Rejeitada</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 text-blue-600" />
            <div>
              <CardTitle className="text-2xl text-gray-900">{campaign.name}</CardTitle>
              <div className="flex items-center gap-4 mt-2">
                {getStatusBadge(campaign.status)}
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Criada em {format(new Date(campaign.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">
          Acompanhe o desempenho da sua campanha em tempo real com dados diretamente da Meta Ads.
        </p>
        {campaign.metaCampaignId && (
          <p className="text-xs text-gray-400 mt-2">
            ID Meta: {campaign.metaCampaignId}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
