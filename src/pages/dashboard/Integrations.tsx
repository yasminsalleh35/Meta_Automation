
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Facebook } from 'lucide-react';
import MetaAdsIntegration from '@/components/integrations/MetaAdsIntegration';
import { MetaAssetsProvider } from '@/contexts/MetaAssetsContext';
import { useMetaAdsIntegration } from '@/hooks/useMetaAdsIntegration';

const Integrations: React.FC = () => {
  const [isMetaConnected, setIsMetaConnected] = useState(false);
  const { existingIntegration, isTokenIncompatible } = useMetaAdsIntegration();

  const isConnected = existingIntegration?.status === 'active' && !isTokenIncompatible;

  const handleMetaConnectionChange = (connected: boolean) => {
    setIsMetaConnected(connected);
  };

  return (
    <div className="container-responsive space-y-6">
      {/* Clean Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Integrações</h1>
        <p className="text-muted-foreground">Conecte e gerencie suas ferramentas de marketing</p>
      </div>

      {/* Main Meta Ads Integration */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Facebook className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Meta Ads (Facebook & Instagram)</CardTitle>
              <CardDescription>
                Conecte sua conta Meta para gerenciar campanhas de Facebook e Instagram
              </CardDescription>
            </div>
            {isConnected && (
              <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                Conectado
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <MetaAssetsProvider>
            <MetaAdsIntegration
              onConnectionChange={handleMetaConnectionChange}
              isConnected={isMetaConnected}
            />
          </MetaAssetsProvider>
        </CardContent>
      </Card>

      {/* Legacy components - now handled by IntegrationStatusCard */}
    </div>
  );
};

export default Integrations;
