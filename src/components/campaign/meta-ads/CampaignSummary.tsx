
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface CampaignSummaryProps {
  isConnected: boolean;
  adAccountId: string | null;
  isFormValid: boolean;
  isLoading: boolean;
  onCreateCampaign: () => void;
}

export const CampaignSummary: React.FC<CampaignSummaryProps> = ({
  isConnected,
  adAccountId,
  isFormValid,
  isLoading,
  onCreateCampaign
}) => {
  return (
    <>
      {/* Campaign Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Resumo da Campanha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Tipo:</strong> Advantage+ Lead Generation (Meta Ads)</p>
          <p><strong>Objetivo:</strong> Gerar leads com otimização automática</p>
          <p><strong>Público:</strong> Determinado automaticamente pelo Meta</p>
          <p><strong>Posicionamentos:</strong> Automático (Feed, Stories, Reels, etc.)</p>
          <p><strong>Status inicial:</strong> Pausada (você ativa depois de revisar)</p>
          {isConnected && adAccountId && (
            <p><strong>Conta de Anúncios:</strong> {adAccountId}</p>
          )}
        </CardContent>
      </Card>

      {/* Create Campaign Button */}
      <Button 
        onClick={onCreateCampaign}
        disabled={!isFormValid || isLoading}
        className="w-full h-12 bg-green-600 hover:bg-green-700"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Criando campanha no Meta Ads...
          </>
        ) : (
          "🚀 Criar Campanha Advantage+"
        )}
      </Button>

      {!isConnected && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription>
            Para criar campanhas, você precisa conectar sua conta Meta Ads nas configurações de integração primeiro.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};
