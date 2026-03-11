
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Instagram, Facebook, MessageCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { WhatsAppFlowAnimation } from './WhatsAppFlowAnimation';
import { useCampaignAssetsWithFallback } from '@/hooks/useCampaignAssetsWithFallback';
import { RealCampaign } from '@/types/realCampaign';

interface CampaignAssetsDisplayWithFallbackProps {
  campaign: RealCampaign;
  isActive?: boolean;
  className?: string;
}

export const CampaignAssetsDisplayWithFallback: React.FC<CampaignAssetsDisplayWithFallbackProps> = ({
  campaign,
  isActive = false,
  className = ""
}) => {
  const { campaignAssets, isLoading, hasAnyAssets } = useCampaignAssetsWithFallback(campaign);

  if (isLoading) {
    return (
      <div className={`${className} text-center py-4`}>
        <div className="text-sm text-gray-500">
          Carregando ativos...
        </div>
      </div>
    );
  }

  if (!hasAnyAssets) {
    return (
      <div className={`${className} text-center py-4`}>
        <div className="text-sm text-gray-500 mb-2">
          <Info className="w-4 h-4 inline-block mr-1" />
          Nenhum ativo encontrado
        </div>
        <div className="text-xs text-gray-400">
          Configure a integração Meta Ads para ver os ativos disponíveis
        </div>
      </div>
    );
  }

  const assets = [
    {
      ...campaignAssets.facebookPage,
      icon: Facebook,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      label: 'Facebook Page'
    },
    {
      ...campaignAssets.instagram,
      icon: Instagram,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      label: 'Instagram'
    },
    {
      ...campaignAssets.whatsapp,
      icon: MessageCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      label: 'WhatsApp'
    }
  ].filter(asset => asset.id);

  return (
    <div className={`${className} space-y-4`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900">Ativos Conectados</h4>
        {campaignAssets.whatsapp?.connected && isActive && (
          <WhatsAppFlowAnimation />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {assets.map((asset, index) => {
          const IconComponent = asset.icon;
          const isFromIntegration = asset.source === 'integration';
          
          return (
            <div 
              key={index} 
              className={`${asset.bgColor} rounded-lg p-3 border border-opacity-20 transition-all duration-300 hover:shadow-md`}
            >
              <div className="flex items-center gap-2 mb-2">
                <IconComponent className={`w-4 h-4 ${asset.color}`} />
                <span className="text-xs font-medium text-gray-700">{asset.label}</span>
                {asset.connected ? (
                  <CheckCircle className="w-3 h-3 text-green-500 ml-auto" />
                ) : (
                  <AlertTriangle className="w-3 h-3 text-yellow-500 ml-auto" />
                )}
              </div>
              
              <div className="text-sm font-semibold text-gray-900 mb-2 truncate">
                {asset.name || 'Não configurado'}
              </div>

              <div className="flex flex-wrap gap-1">
                <Badge 
                  variant={asset.connected ? "default" : "secondary"}
                  className={`text-xs ${asset.connected ? `${asset.color} bg-white border-current` : 'text-gray-500'}`}
                >
                  {asset.connected ? 'Conectado' : 'Desconectado'}
                </Badge>

                {isFromIntegration && (
                  <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                    <Info className="w-2 h-2 mr-1" />
                    Da Integração
                  </Badge>
                )}

                {asset.isManual && (
                  <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600">
                    Manual
                  </Badge>
                )}
              </div>

              {isFromIntegration && (
                <div className="text-xs text-gray-500 mt-2">
                  Usando ativo disponível na conta Meta Ads
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info about fallback usage */}
      {Object.values(campaignAssets).some(asset => asset?.source === 'integration') && (
        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded-lg border border-blue-200">
          <Info className="w-3 h-3 inline-block mr-1" />
          Alguns ativos são da sua integração Meta Ads. Para configurar ativos específicos para esta campanha, edite-a.
        </div>
      )}
    </div>
  );
};
