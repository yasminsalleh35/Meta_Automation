
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { imageGenerationService } from '@/services/imageGenerationService';
import { useAIRateLimit } from './useAIRateLimit';

export const useImageGeneration = () => {
  const { toast } = useToast();
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const { checkRateLimit } = useAIRateLimit();

  const generateImage = async (prompt: string): Promise<string | null> => {
    const userId = 'user_1'; // TODO: Pegar do contexto de auth
    
    // Verificar rate limit para geração de imagens
    if (!checkRateLimit(userId, 'free', 'image_generation')) {
      return null;
    }

    setIsGeneratingImage(true);

    try {
      const generatedImage = await imageGenerationService.generateImage(prompt, userId);
      
      toast({
        title: "Imagem gerada com sucesso!",
        description: "Sua imagem foi criada e salva na galeria.",
      });
      
      return generatedImage.url;
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      toast({
        title: "Erro ao gerar imagem",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return {
    isGeneratingImage,
    generateImage
  };
};
