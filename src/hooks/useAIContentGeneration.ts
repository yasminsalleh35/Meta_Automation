
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { openaiService } from '@/services/openaiService';

export const useAIContentGeneration = (
  onTitleChange: (title: string) => void,
  onTextChange: (text: string) => void
) => {
  const { toast } = useToast();
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);

  const generateTitleWithAI = async () => {
    setIsGeneratingTitle(true);
    try {
      const suggestions = await openaiService.generateCampaignSuggestions('advantage_plus_leads');
      if (suggestions.adTitle) {
        onTitleChange(suggestions.adTitle);
        toast({
          title: "Título gerado!",
          description: "Título personalizado baseado nas informações do seu negócio.",
        });
      }
    } catch (error) {
      console.error('Erro ao gerar título:', error);
      // Fallback para sugestão simples
      const titleSuggestions = [
        "Transforme seu negócio hoje mesmo!",
        "A solução que você estava procurando",
        "Resultados garantidos para sua empresa",
        "Chegou a hora de crescer!",
        "Sua empresa merece o melhor"
      ];
      
      const randomTitle = titleSuggestions[Math.floor(Math.random() * titleSuggestions.length)];
      onTitleChange(randomTitle);
      
      toast({
        title: "Título sugerido",
        description: "Configure a Camply IA nas configurações para sugestões personalizadas.",
        variant: "default"
      });
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  const generateCopyWithAI = async () => {
    setIsGeneratingCopy(true);
    try {
      const suggestions = await openaiService.generateCampaignSuggestions('advantage_plus_leads');
      if (suggestions.adText) {
        onTextChange(suggestions.adText);
        toast({
          title: "Texto gerado!",
          description: "Copy personalizada baseada nas informações do seu negócio.",
        });
      }
    } catch (error) {
      console.error('Erro ao gerar copy:', error);
      // Fallback para sugestão simples
      const copySuggestions = [
        "🎯 Quer aumentar suas vendas? Entre em contato conosco e descubra como podemos transformar seu negócio. Clique no link abaixo e fale direto no WhatsApp!",
        "💰 Transforme visitantes em clientes! Nossa equipe especializada está pronta para ajudar você a alcançar seus objetivos. Fale conosco agora mesmo!",
        "🚀 Sua empresa merece crescer! Temos as melhores soluções do mercado. Converse conosco e veja como podemos revolucionar seus resultados.",
        "⭐ Atendimento personalizado e resultados comprovados. Não perca tempo, entre em contato e tire todas as suas dúvidas. Estamos aqui para te ajudar!"
      ];
      
      const randomCopy = copySuggestions[Math.floor(Math.random() * copySuggestions.length)];
      onTextChange(randomCopy);
      
      toast({
        title: "Texto sugerido",
        description: "Configure a Camply IA nas configurações para sugestões personalizadas.",
        variant: "default"
      });
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  return {
    isGeneratingTitle,
    isGeneratingCopy,
    generateTitleWithAI,
    generateCopyWithAI
  };
};
