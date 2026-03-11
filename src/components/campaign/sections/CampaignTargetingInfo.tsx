
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Smartphone, Monitor, Heart, Target } from 'lucide-react';
import { RealCampaign } from '@/types/realCampaign';

interface CampaignTargetingInfoProps {
  campaign: RealCampaign;
}

export const CampaignTargetingInfo: React.FC<CampaignTargetingInfoProps> = ({ campaign }) => {
  const getGenderDisplay = (gender: string) => {
    switch (gender) {
      case 'male': return '👨 Masculino';
      case 'female': return '👩 Feminino';
      case 'all': return '👥 Todos os gêneros';
      default: return '👥 Não especificado';
    }
  };

  const renderArrayField = (field: any, icon: React.ReactNode, emptyMessage: string) => {
    if (!field || (Array.isArray(field) && field.length === 0)) {
      return <span className="text-gray-500 text-sm">{emptyMessage}</span>;
    }

    const items = Array.isArray(field) ? field : [field];
    return (
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <Badge key={index} variant="outline" className="flex items-center gap-1">
            {icon}
            <span className="text-xs">{typeof item === 'string' ? item : JSON.stringify(item)}</span>
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="w-5 h-5 text-orange-600" />
          Segmentação e Público-Alvo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Demografia */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Demografia
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Gênero</p>
              <span className="text-sm">{getGenderDisplay(campaign.gender || 'all')}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Idade Mínima</p>
              <span className="text-sm">{campaign.age_min || 18} anos</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Idade Máxima</p>
              <span className="text-sm">{campaign.age_max || 65} anos</span>
            </div>
          </div>
        </div>

        {/* Localização */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800">Localização</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Localizações Selecionadas</p>
              {campaign.selected_locations && Array.isArray(campaign.selected_locations) && campaign.selected_locations.length > 0 ? (
                <div className="space-y-1">
                  {campaign.selected_locations.map((location: any, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {typeof location === 'string' ? location : location.name || 'Local não especificado'}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-gray-500 text-sm">Nenhuma localização específica selecionada</span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Raio de Alcance</p>
              <span className="text-sm">{campaign.location_radius || 10} km</span>
            </div>
          </div>
        </div>

        {/* Interesses */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Interesses
          </h4>
          {renderArrayField(
            campaign.interests, 
            <Heart className="w-3 h-3" />, 
            "Nenhum interesse específico definido"
          )}
        </div>

        {/* Dispositivos */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800">Dispositivos</h4>
          {renderArrayField(
            campaign.devices,
            <Smartphone className="w-3 h-3" />,
            "Todos os dispositivos"
          )}
        </div>

        {/* Posicionamentos */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800">Posicionamentos</h4>
          {renderArrayField(
            campaign.placements,
            <Monitor className="w-3 h-3" />,
            "Posicionamentos automáticos"
          )}
        </div>
      </CardContent>
    </Card>
  );
};
