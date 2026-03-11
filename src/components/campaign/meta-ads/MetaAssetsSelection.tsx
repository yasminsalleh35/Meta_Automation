
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { MessageCircle, Loader2, RefreshCw } from 'lucide-react';
import { WhatsAppManualConfig } from './WhatsAppManualConfig';
import { useMetaAdsAssets } from '@/hooks/useMetaAdsAssets';
import { FacebookPageSelection } from './FacebookPageSelection';
import { InstagramSelection } from './InstagramSelection';
import { WhatsAppSelection } from './WhatsAppSelection';
import { MetaAssetsSelectionProps } from './types';

export const MetaAssetsSelection: React.FC<MetaAssetsSelectionProps> = ({
  assets,
  selectedFanPage,
  selectedInstagram,
  selectedWhatsApp,
  isLoadingAssets,
  hasIntegration,
  isConnected,
  onAssetChange,
  onRefreshAssets
}) => {
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const { addManualWhatsApp, removeManualWhatsApp } = useMetaAdsAssets();

  const handleAddManualWhatsApp = (whatsappData: { id: string; name: string; phone: string }) => {
    addManualWhatsApp(whatsappData);
  };

  const handleRemoveWhatsApp = (id: string, isManual: boolean) => {
    if (isManual) {
      removeManualWhatsApp(id);
      if (selectedWhatsApp === id) {
        onAssetChange('selectedWhatsApp', '');
      }
    }
  };

  const handleAddWhatsApp = () => {
    setIsWhatsAppModalOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            <span>Ativos do Meta (Dados Reais)</span>
            {isLoadingAssets && <Loader2 className="w-4 h-4 animate-spin" />}
            {isConnected && (
              <Button variant="outline" size="sm" onClick={onRefreshAssets} disabled={isLoadingAssets}>
                <RefreshCw className={`w-4 h-4 ${isLoadingAssets ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasIntegration ? (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertDescription>
                Nenhuma integração Meta Ads encontrada. Configure a integração primeiro nas configurações.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <FacebookPageSelection
                pages={assets.pages}
                selectedFanPage={selectedFanPage}
                isConnected={isConnected}
                isLoadingAssets={isLoadingAssets}
                onAssetChange={onAssetChange}
              />

              <InstagramSelection
                instagram={assets.instagram}
                selectedInstagram={selectedInstagram}
                selectedFanPage={selectedFanPage}
                isConnected={isConnected}
                isLoadingAssets={isLoadingAssets}
                onAssetChange={onAssetChange}
              />

              <WhatsAppSelection
                whatsapp={assets.whatsapp}
                selectedWhatsApp={selectedWhatsApp}
                isLoadingAssets={isLoadingAssets}
                onAssetChange={onAssetChange}
                onAddWhatsApp={handleAddWhatsApp}
                onRemoveWhatsApp={handleRemoveWhatsApp}
              />
            </>
          )}
        </CardContent>
      </Card>

      <WhatsAppManualConfig
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        onSave={handleAddManualWhatsApp}
      />
    </>
  );
};
