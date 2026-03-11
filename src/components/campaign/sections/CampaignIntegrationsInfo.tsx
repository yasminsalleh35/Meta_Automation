
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Facebook, Instagram, MessageCircle, CheckCircle2, AlertCircle, Copy, ExternalLink } from 'lucide-react';
import { RealCampaign } from '@/types/realCampaign';
import { useToast } from '@/hooks/use-toast';

interface CampaignIntegrationsInfoProps {
  campaign: RealCampaign;
}

export const CampaignIntegrationsInfo: React.FC<CampaignIntegrationsInfoProps> = ({ campaign }) => {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência`,
    });
  };

  const getIntegrationStatus = () => {
    if (campaign.meta_campaign_id && campaign.meta_adset_id && campaign.meta_ad_id) {
      return { status: 'complete', label: 'Totalmente Integrado', color: 'text-green-600' };
    } else if (campaign.meta_campaign_id) {
      return { status: 'partial', label: 'Parcialmente Integrado', color: 'text-yellow-600' };
    } else {
      return { status: 'none', label: 'Não Integrado', color: 'text-red-600' };
    }
  };

  const integrationStatus = getIntegrationStatus();

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Facebook className="w-5 h-5 text-blue-600" />
          Integrações e Plataformas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status de Integração */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800">Status Meta Ads</h4>
          <div className="flex items-center gap-2">
            {integrationStatus.status === 'complete' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
            {integrationStatus.status === 'partial' && <AlertCircle className="w-5 h-5 text-yellow-600" />}
            {integrationStatus.status === 'none' && <AlertCircle className="w-5 h-5 text-red-600" />}
            <Badge className={`${integrationStatus.color} bg-transparent border-current`}>
              {integrationStatus.label}
            </Badge>
          </div>
        </div>

        {/* IDs do Meta Ads */}
        {(campaign.meta_campaign_id || campaign.meta_adset_id || campaign.meta_ad_id) && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800">IDs Meta Ads</h4>
            
            {campaign.meta_campaign_id && (
              <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
                <Facebook className="w-4 h-4 text-blue-600" />
                <div className="flex-1">
                  <p className="text-xs text-blue-600 font-medium">Campaign ID</p>
                  <p className="text-sm font-mono text-blue-900">{campaign.meta_campaign_id}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(campaign.meta_campaign_id!, 'Campaign ID')}
                  className="h-7 px-2"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            )}

            {campaign.meta_adset_id && (
              <div className="flex items-center gap-2 bg-green-50 p-3 rounded-lg border border-green-200">
                <Facebook className="w-4 h-4 text-green-600" />
                <div className="flex-1">
                  <p className="text-xs text-green-600 font-medium">AdSet ID</p>
                  <p className="text-sm font-mono text-green-900">{campaign.meta_adset_id}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(campaign.meta_adset_id!, 'AdSet ID')}
                  className="h-7 px-2"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            )}

            {campaign.meta_ad_id && (
              <div className="flex items-center gap-2 bg-purple-50 p-3 rounded-lg border border-purple-200">
                <Facebook className="w-4 h-4 text-purple-600" />
                <div className="flex-1">
                  <p className="text-xs text-purple-600 font-medium">Ad ID</p>
                  <p className="text-sm font-mono text-purple-900">{campaign.meta_ad_id}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(campaign.meta_ad_id!, 'Ad ID')}
                  className="h-7 px-2"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Páginas e Contas */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800">Contas Conectadas</h4>
          
          {campaign.facebook_page && (
            <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
              <Facebook className="w-4 h-4 text-blue-600" />
              <div className="flex-1">
                <p className="text-xs text-blue-600 font-medium">Página do Facebook</p>
                <p className="text-sm text-blue-900">{campaign.facebook_page}</p>
              </div>
            </div>
          )}

          {campaign.instagram_account && (
            <div className="flex items-center gap-2 bg-pink-50 p-3 rounded-lg border border-pink-200">
              <Instagram className="w-4 h-4 text-pink-600" />
              <div className="flex-1">
                <p className="text-xs text-pink-600 font-medium">Conta do Instagram</p>
                <p className="text-sm text-pink-900">{campaign.instagram_account}</p>
              </div>
            </div>
          )}

          {campaign.whatsapp_number && (
            <div className="flex items-center gap-2 bg-green-50 p-3 rounded-lg border border-green-200">
              <MessageCircle className="w-4 h-4 text-green-600" />
              <div className="flex-1">
                <p className="text-xs text-green-600 font-medium">WhatsApp Business</p>
                <p className="text-sm text-green-900">{campaign.whatsapp_number}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(`https://wa.me/${campaign.whatsapp_number?.replace(/\D/g, '')}`, '_blank')}
                className="h-7 px-2"
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Status de Processamento */}
        {campaign.processing_status && campaign.processing_status !== 'draft' && (
          <div className="pt-3 border-t border-gray-100">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Status de Processamento:</strong>
              </p>
              <Badge variant="outline">{campaign.processing_status}</Badge>
              {campaign.meta_integration_status && (
                <Badge variant="outline" className="ml-2">{campaign.meta_integration_status}</Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
