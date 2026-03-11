
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Instagram, Facebook, MessageCircle, CheckCircle, XCircle } from 'lucide-react';
import { WhatsAppFlowAnimation } from './WhatsAppFlowAnimation';

interface Asset {
  id: string;
  name: string;
  type: 'page' | 'instagram' | 'whatsapp';
  connected: boolean;
}

interface CampaignAssetsDisplayProps {
  facebookPage?: Asset;
  instagram?: Asset;
  whatsapp?: Asset;
  isActive?: boolean;
  className?: string;
}

export const CampaignAssetsDisplay: React.FC<CampaignAssetsDisplayProps> = ({
  facebookPage,
  instagram,
  whatsapp,
  isActive = false,
  className = ""
}) => {
  const assets = [
    {
      ...facebookPage,
      icon: Facebook,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      label: 'Facebook Page'
    },
    {
      ...instagram,
      icon: Instagram,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      label: 'Instagram'
    },
    {
      ...whatsapp,
      icon: MessageCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      label: 'WhatsApp'
    }
  ].filter(asset => asset.id);

  if (assets.length === 0) {
    return (
      <div className={`${className} text-center py-4`}>
        <div className="text-sm text-gray-500">
          Nenhum ativo conectado
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} space-y-4`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900">Ativos Conectados</h4>
        {whatsapp?.connected && isActive && (
          <WhatsAppFlowAnimation />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {assets.map((asset, index) => {
          const IconComponent = asset.icon;
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
                  <XCircle className="w-3 h-3 text-red-500 ml-auto" />
                )}
              </div>
              
              <div className="text-sm font-semibold text-gray-900 mb-1 truncate">
                {asset.name || 'Não configurado'}
              </div>
              
              <Badge 
                variant={asset.connected ? "default" : "secondary"}
                className={`text-xs ${asset.connected ? `${asset.color} bg-white border-current` : 'text-gray-500'}`}
              >
                {asset.connected ? 'Conectado' : 'Desconectado'}
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
};
