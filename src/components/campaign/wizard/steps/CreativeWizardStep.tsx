
import React from 'react';
import { Palette } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MetaAdsCreativesStep } from '@/components/campaign/MetaAdsCreativesStep';
import { CampaignData } from '@/types/campaign';

interface CreativeWizardStepProps {
  campaignData: CampaignData;
  updateCampaignData: (field: keyof CampaignData, value: any) => void;
  onAISuggestion?: () => void;
  handleApplySuggestions?: (suggestions: any) => void;
  isAILoading?: boolean;
  aiSuggestions?: any;
  fullCampaignData?: CampaignData;
}

export const CreativeWizardStep: React.FC<CreativeWizardStepProps> = ({
  campaignData,
  updateCampaignData,
  onAISuggestion,
  handleApplySuggestions,
  isAILoading = false,
  aiSuggestions,
  fullCampaignData
}) => {
  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center">
          <Palette className="w-8 h-8 text-orange-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Agora vamos criar seu anúncio!
          </h2>
          <p className="text-gray-600 mt-2 max-w-md mx-auto">
            Configure os textos, imagem e suas páginas. Nossa IA pode ajudar com sugestões personalizadas.
          </p>
        </div>
      </div>

      {/* Tip Alert */}
      <Alert className="border-orange-200 bg-orange-50">
        <Palette className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <strong>Dica:</strong> Use textos claros e diretos. Mostre o benefício principal do seu produto/serviço logo no início!
        </AlertDescription>
      </Alert>

      {/* Use existing MetaAdsCreativesStep component */}
      <MetaAdsCreativesStep
        creativesData={{
          campaignName: campaignData.campaignName || '',
          adTitle: campaignData.adTitle || '',
          adText: campaignData.adText || '',
          selectedFanPage: campaignData.selectedFanPage || '',
          selectedInstagram: campaignData.selectedInstagram || '',
          selectedWhatsApp: campaignData.selectedWhatsApp || '',
          media: campaignData.media
        }}
        onCreativesChange={updateCampaignData}
        onCreateCampaign={() => {}} // Will be handled in summary step
        isLoading={false}
        fullCampaignData={fullCampaignData || campaignData}
      />

      {/* AI Content Generation - Clean version */}
      {onAISuggestion && (
        <div className="text-center pt-6 border-t border-gray-100">
          <button
            onClick={onAISuggestion}
            disabled={isAILoading}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-camply-blue to-camply-green text-white rounded-lg hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
          >
            <Palette className="w-5 h-5 mr-2" />
            {isAILoading ? 'Gerando conteúdo...' : 'Gerar textos com IA'}
          </button>
          <p className="text-sm text-gray-500 mt-2">
            Baseado nas configurações da sua campanha
          </p>
        </div>
      )}
    </div>
  );
};
