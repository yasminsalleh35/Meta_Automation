
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Image, Type, Link, Copy, ExternalLink } from 'lucide-react';
import { RealCampaign } from '@/types/realCampaign';
import { useToast } from '@/hooks/use-toast';

interface CampaignCreativeInfoProps {
  campaign: RealCampaign;
}

export const CampaignCreativeInfo: React.FC<CampaignCreativeInfoProps> = ({ campaign }) => {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência`,
    });
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Image className="w-5 h-5 text-pink-600" />
          Conteúdo Criativo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Título do Anúncio */}
        {campaign.ad_title && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <Type className="w-4 h-4" />
                Título do Anúncio
              </h4>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(campaign.ad_title!, 'Título')}
                className="h-7 px-2"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-900">{campaign.ad_title}</p>
            </div>
          </div>
        )}

        {/* Texto do Anúncio */}
        {campaign.ad_text && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <Type className="w-4 h-4" />
                Texto do Anúncio
              </h4>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(campaign.ad_text!, 'Texto')}
                className="h-7 px-2"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <p className="text-sm text-green-900 whitespace-pre-wrap">{campaign.ad_text}</p>
            </div>
          </div>
        )}

        {/* URL de Destino */}
        {campaign.destination_url && (
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
              <Link className="w-4 h-4" />
              URL de Destino
            </h4>
            <div className="flex items-center gap-2 bg-purple-50 p-3 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-900 flex-1 truncate">{campaign.destination_url}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(campaign.destination_url!, 'URL')}
                className="h-7 px-2"
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(campaign.destination_url, '_blank')}
                className="h-7 px-2"
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Arquivo de Mídia */}
        {campaign.media_file_id && (
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
              <Image className="w-4 h-4" />
              Mídia
            </h4>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                <Badge variant="outline">ID: {campaign.media_file_id}</Badge>
                <p className="text-sm text-gray-600">Arquivo de mídia anexado</p>
              </div>
            </div>
          </div>
        )}

        {/* Resumo do Conteúdo */}
        <div className="pt-3 border-t border-gray-100">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Resumo do Conteúdo:</strong>
            </p>
            <ul className="text-xs text-gray-700 space-y-1">
              <li>• {campaign.ad_title ? 'Título definido' : 'Título não definido'}</li>
              <li>• {campaign.ad_text ? 'Texto definido' : 'Texto não definido'}</li>
              <li>• {campaign.destination_url ? 'URL de destino configurada' : 'URL de destino não configurada'}</li>
              <li>• {campaign.media_file_id ? 'Mídia anexada' : 'Nenhuma mídia anexada'}</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
