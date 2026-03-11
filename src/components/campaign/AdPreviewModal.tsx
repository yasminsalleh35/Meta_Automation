
import React, { useState } from 'react';
import { sanitizeHtml } from '@/utils/security';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Loader2, 
  Eye, 
  Smartphone, 
  Monitor, 
  Camera, 
  Clock, 
  AlertCircle,
  RefreshCw,
  Settings,
  MessageCircle,
  Globe
} from 'lucide-react';
import { useMetaAdsPreview } from '@/hooks/useMetaAdsPreview';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AdPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: {
    id: string;
    name: string;
    meta_ad_id?: string;
  };
}

export const AdPreviewModal: React.FC<AdPreviewModalProps> = ({
  isOpen,
  onClose,
  campaign
}) => {
  const { 
    previews, 
    isLoading, 
    generatePreview, 
    refreshPreview,
    getAvailableFormats,
    clearCache
  } = useMetaAdsPreview();
  
  const [hasGenerated, setHasGenerated] = useState(false);
  const [includeStories, setIncludeStories] = useState(true);
  const [includeMessenger, setIncludeMessenger] = useState(false);
  const [includeAudienceNetwork, setIncludeAudienceNetwork] = useState(false);

  const handleGeneratePreview = async () => {
    if (!campaign.meta_ad_id) return;
    
    await generatePreview(campaign.meta_ad_id, {
      includeStories,
      includeMessenger,
      includeAudienceNetwork
    });
    setHasGenerated(true);
  };

  const handleRefreshPreview = async () => {
    await refreshPreview();
  };

  const handleClearCache = () => {
    if (campaign.meta_ad_id) {
      clearCache(campaign.meta_ad_id);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'DESKTOP_FEED_STANDARD':
        return <Monitor className="w-4 h-4" />;
      case 'MOBILE_FEED_STANDARD':
        return <Smartphone className="w-4 h-4" />;
      case 'MOBILE_BANNER':
        return <Smartphone className="w-4 h-4" />;
      case 'MOBILE_INTERSTITIAL':
        return <Smartphone className="w-4 h-4" />;
      case 'INSTAGRAM_STANDARD':
        return <Camera className="w-4 h-4" />;
      case 'INSTAGRAM_STORY_MOBILE':
        return <Eye className="w-4 h-4" />;
      case 'MESSENGER_MOBILE':
        return <MessageCircle className="w-4 h-4" />;
      case 'AUDIENCE_NETWORK_MOBILE_BANNER':
        return <Globe className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const getFormatLabel = (preview: any) => {
    return preview.formatName || preview.format || 'Formato desconhecido';
  };

  const availableFormats = getAvailableFormats();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Eye className="w-5 h-5" />
            <span>Preview do Anúncio - {campaign.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!campaign.meta_ad_id ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Preview não disponível
              </h3>
              <p className="text-gray-600">
                Esta campanha não foi criada no Meta Ads ainda.
              </p>
            </div>
          ) : !hasGenerated ? (
            <div className="space-y-6">
              {/* Preview Options */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Settings className="w-4 h-4" />
                  <h4 className="font-medium">Opções de Preview</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="include-stories"
                      checked={includeStories}
                      onCheckedChange={setIncludeStories}
                    />
                    <Label htmlFor="include-stories" className="text-sm">
                      Instagram Stories
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="include-messenger"
                      checked={includeMessenger}
                      onCheckedChange={setIncludeMessenger}
                    />
                    <Label htmlFor="include-messenger" className="text-sm">
                      Messenger
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="include-audience-network"
                      checked={includeAudienceNetwork}
                      onCheckedChange={setIncludeAudienceNetwork}
                    />
                    <Label htmlFor="include-audience-network" className="text-sm">
                      Audience Network
                    </Label>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <div className="text-center py-8 space-y-4">
                <Alert>
                  <Clock className="w-4 h-4" />
                  <AlertDescription>
                    O preview pode levar alguns minutos para ficar disponível após a criação da campanha.
                    Formatos disponíveis: {availableFormats.length} tipos diferentes.
                  </AlertDescription>
                </Alert>
                
                <Button
                  onClick={handleGeneratePreview}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Gerando preview...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Gerar Preview do Anúncio
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : previews.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <AlertCircle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Preview indisponível
              </h3>
              <p className="text-gray-600 mb-4">
                O anúncio ainda não está pronto para preview. Isso é normal para anúncios recém-criados.
              </p>
              <Alert>
                <Clock className="w-4 h-4" />
                <AlertDescription>
                  O Meta Ads pode precisar de alguns minutos para processar o anúncio após a criação.
                  Tente novamente em breve.
                </AlertDescription>
              </Alert>
              
              <div className="flex justify-center space-x-3">
                <Button
                  onClick={handleGeneratePreview}
                  disabled={isLoading}
                  variant="outline"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Tentando novamente...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Tentar Novamente
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={handleClearCache}
                  variant="ghost"
                  size="sm"
                >
                  Limpar Cache
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Action Bar */}
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-sm">
                    {previews.length} formato(s) disponível(is)
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    API v23.0
                  </Badge>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={handleRefreshPreview}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-1" />
                    )}
                    Atualizar
                  </Button>
                  
                  <Button
                    onClick={handleClearCache}
                    variant="ghost"
                    size="sm"
                  >
                    Limpar Cache
                  </Button>
                </div>
              </div>

              {/* Preview Tabs */}
              <Tabs defaultValue={previews[0]?.format || 'DESKTOP_FEED_STANDARD'}>
                <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
                  {previews.map((preview) => (
                    <TabsTrigger key={preview.format} value={preview.format}>
                      <div className="flex items-center space-x-2">
                        {getFormatIcon(preview.format)}
                        <span className="hidden sm:inline truncate">
                          {getFormatLabel(preview)}
                        </span>
                      </div>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {previews.map((preview) => (
                  <TabsContent key={preview.format} value={preview.format}>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-sm">
                            {getFormatLabel(preview)}
                          </Badge>
                          {preview.locale && (
                            <Badge variant="secondary" className="text-xs">
                              {preview.locale}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="border rounded-lg overflow-hidden bg-white">
                        {preview.body ? (
                           <div 
                             className="preview-container p-4 max-h-[600px] overflow-auto"
                             dangerouslySetInnerHTML={{ __html: sanitizeHtml(preview.body) }}
                             style={{
                               background: preview.format?.includes('STORY') ? '#000' : '#fff'
                             }}
                           />
                        ) : (
                          <div className="text-center py-12 text-gray-500">
                            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p>Preview não disponível para este formato</p>
                            <p className="text-sm text-gray-400 mt-1">
                              Este formato pode não ser suportado para este tipo de anúncio
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
