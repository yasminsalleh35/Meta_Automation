
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMetaAdsIntegration } from '@/hooks/useMetaAdsIntegration';
import { metaAdsPreviewService } from '@/services/metaAds/MetaAdsPreviewService';

export interface PreviewOptions {
  locale?: string;
  includeStories?: boolean;
  includeMessenger?: boolean;
  includeAudienceNetwork?: boolean;
}

export const useMetaAdsPreview = () => {
  const { toast } = useToast();
  const { existingIntegration } = useMetaAdsIntegration();
  const [previews, setPreviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastGeneratedAdId, setLastGeneratedAdId] = useState<string | null>(null);

  const generatePreview = async (adId: string, options: PreviewOptions = {}) => {
    if (!existingIntegration?.access_token) {
      toast({
        title: "Erro",
        description: "Integração Meta Ads não configurada.",
        variant: "destructive"
      });
      return;
    }

    if (!adId) {
      toast({
        title: "Erro",
        description: "ID do anúncio não fornecido.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setPreviews([]); // Clear previous previews
    setLastGeneratedAdId(adId);
    
    try {
      console.log('🎬 Generating ad preview for:', adId, 'with options:', options);
      
      const previewData = await metaAdsPreviewService.getMultipleFormats(
        adId,
        existingIntegration.access_token,
        {
          locale: 'pt_BR',
          includeStories: true,
          includeMessenger: false,
          includeAudienceNetwork: false,
          ...options
        }
      );

      console.log('✅ Generated previews:', previewData);
      setPreviews(previewData);
      
      if (previewData.length === 0) {
        toast({
          title: "Preview indisponível",
          description: "O anúncio ainda não está pronto para preview. Isso é normal para anúncios recém-criados.",
          variant: "default"
        });
      } else {
        toast({
          title: "Preview gerado",
          description: `${previewData.length} formato(s) de preview disponível(is).`,
        });
      }
      
      return previewData;
    } catch (error) {
      console.error('❌ Error generating preview:', error);
      
      let errorMessage = "Não foi possível gerar o preview.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro ao gerar preview",
        description: errorMessage,
        variant: "destructive"
      });
      
      setPreviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPreview = async () => {
    if (lastGeneratedAdId) {
      // Clear cache before refreshing
      metaAdsPreviewService.clearAdCache(lastGeneratedAdId);
      await generatePreview(lastGeneratedAdId);
    }
  };

  const generateSingleFormat = async (
    adId: string, 
    format: string,
    options: { locale?: string } = {}
  ) => {
    if (!existingIntegration?.access_token) {
      throw new Error("Integração Meta Ads não configurada.");
    }

    try {
      const preview = await metaAdsPreviewService.generateAdPreview(
        adId,
        existingIntegration.access_token,
        format as any,
        options
      );
      
      return preview;
    } catch (error) {
      console.error(`❌ Error generating preview for ${format}:`, error);
      throw error;
    }
  };

  const getAvailableFormats = () => {
    return metaAdsPreviewService.getAvailableFormats();
  };

  const clearCache = (adId: string) => {
    metaAdsPreviewService.clearAdCache(adId);
    toast({
      title: "Cache limpo",
      description: "Cache de preview removido. Próxima geração será atualizada.",
    });
  };

  return {
    previews,
    isLoading,
    lastGeneratedAdId,
    generatePreview,
    refreshPreview,
    generateSingleFormat,
    getAvailableFormats,
    clearCache
  };
};
