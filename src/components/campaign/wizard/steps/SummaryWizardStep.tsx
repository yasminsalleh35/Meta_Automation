
import React from 'react';
import { CheckCircle, MapPin, DollarSign, Calendar, Palette, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CampaignData } from '@/types/campaign';

interface SummaryWizardStepProps {
  campaignData: CampaignData;
  onCreateCampaign: () => void;
  isCreating: boolean;
  handleApplySuggestions?: (suggestions: any) => void;
  aiSuggestions?: any;
  isLocationValid?: () => boolean;
}

export const SummaryWizardStep: React.FC<SummaryWizardStepProps> = ({
  campaignData,
  onCreateCampaign,
  isCreating,
  handleApplySuggestions,
  aiSuggestions,
  isLocationValid
}) => {
  const calculateDays = () => {
    if (campaignData.duration.startDate && campaignData.duration.endDate) {
      const start = new Date(campaignData.duration.startDate);
      const end = new Date(campaignData.duration.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  const totalBudget = calculateDays() * campaignData.budget.daily;
  const estimatedReach = campaignData.budget.daily * 20; // Estimativa simples

  const getLocationDisplay = () => {
    if (campaignData.location.selectedLocations && campaignData.location.selectedLocations.length > 0) {
      return {
        hasLocations: true,
        count: campaignData.location.selectedLocations.length,
        locations: campaignData.location.selectedLocations.slice(0, 2).map(loc => loc.name).join(', '),
        hasMore: campaignData.location.selectedLocations.length > 2,
        moreCount: campaignData.location.selectedLocations.length - 2
      };
    }
    return { hasLocations: false };
  };

  const locationDisplay = getLocationDisplay();

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Perfeito! Sua campanha está pronta
          </h2>
          <p className="text-gray-600 mt-2 max-w-md mx-auto">
            Revise as informações abaixo e clique em "Criar Campanha" para publicar no Meta Ads.
          </p>
        </div>
      </div>

      {/* Campaign Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Location Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-base">
              <MapPin className="w-5 h-5 text-blue-600" />
              <span>Localização</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {locationDisplay.hasLocations ? (
                <div>
                  <p className="font-medium text-gray-900">
                    {locationDisplay.count} local{locationDisplay.count > 1 ? 'is' : ''} selecionado{locationDisplay.count > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-gray-600">
                    {locationDisplay.locations}
                    {locationDisplay.hasMore && ` +${locationDisplay.moreCount} mais`}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-gray-900">
                    Nenhuma localização selecionada
                  </p>
                </div>
              )}
              {campaignData.location.radius && (
                <p className="text-sm text-gray-600">
                  Raio de {campaignData.location.radius}km
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Budget Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-base">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span>Orçamento</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium text-gray-900">
                R$ {campaignData.budget.daily}/dia
              </p>
              <p className="text-sm text-gray-600">
                Total: R$ {totalBudget.toFixed(0)} ({calculateDays()} dias)
              </p>
              <p className="text-xs text-blue-600">
                ~{estimatedReach} pessoas alcançadas/dia
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Duration Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-base">
              <Calendar className="w-5 h-5 text-purple-600" />
              <span>Período</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium text-gray-900">
                {calculateDays()} dias
              </p>
              <p className="text-sm text-gray-600">
                {new Date(campaignData.duration.startDate).toLocaleDateString('pt-BR')} até{' '}
                {new Date(campaignData.duration.endDate).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Creative Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-base">
              <Palette className="w-5 h-5 text-orange-600" />
              <span>Anúncio</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium text-gray-900 truncate">
                {campaignData.campaignName}
              </p>
              <div className="flex flex-wrap gap-1">
                {campaignData.selectedFanPage && (
                  <Badge variant="outline" className="text-xs">Facebook</Badge>
                )}
                {campaignData.selectedInstagram && (
                  <Badge variant="outline" className="text-xs">Instagram</Badge>
                )}
                {campaignData.selectedWhatsApp && (
                  <Badge variant="outline" className="text-xs">WhatsApp</Badge>
                )}
                {campaignData.media && (
                  <Badge variant="outline" className="text-xs">Imagem</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preview do Anúncio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">
              {campaignData.adTitle || 'Título do anúncio'}
            </h3>
            <p className="text-gray-700 text-sm mb-3">
              {campaignData.adText || 'Texto do anúncio'}
            </p>
            {campaignData.media && (
              <div className="text-xs text-gray-500 flex items-center space-x-1">
                <span>📷</span>
                <span>Imagem anexada</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Important Information */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Sua campanha será criada no Meta Ads em estado pausado. 
          Você poderá ativá-la e fazer ajustes através do painel de campanhas.
        </AlertDescription>
      </Alert>

      {/* Create Campaign Button */}
      <div className="text-center pt-6">
        <Button
          onClick={onCreateCampaign}
          disabled={isCreating}
          size="lg"
          className="px-8 py-4 text-lg bg-green-600 hover:bg-green-700"
        >
          {isCreating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Criando campanha...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              Criar Campanha no Meta Ads
            </>
          )}
        </Button>
        <p className="text-sm text-gray-500 mt-3">
          A criação leva alguns segundos. Não feche esta página.
        </p>
      </div>
    </div>
  );
};
