
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface LearningContent {
  id: string;
  title: string;
  description: string | null;
  content_type: 'video' | 'guide' | 'faq' | 'case_study';
  content_url: string | null;
  content_text: string | null;
  thumbnail_url: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
}

export const useLearningContent = () => {
  const { toast } = useToast();
  const [contents, setContents] = useState<LearningContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPublishedContents();
  }, []);

  const loadPublishedContents = async () => {
    try {
      setIsLoading(true);
      
      // Simulando dados até as tabelas serem criadas
      const mockContents: LearningContent[] = [
        {
          id: '1',
          title: 'Como criar sua primeira campanha',
          description: 'Aprenda o passo a passo para criar campanhas eficazes no Meta Ads',
          content_type: 'guide',
          content_url: null,
          content_text: 'Este é um guia completo sobre como criar sua primeira campanha...',
          thumbnail_url: null,
          is_published: true,
          sort_order: 1,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Configuração do Pixel do Facebook',
          description: 'Tutorial sobre como configurar o pixel corretamente',
          content_type: 'video',
          content_url: 'https://www.youtube.com/watch?v=example',
          content_text: null,
          thumbnail_url: null,
          is_published: true,
          sort_order: 2,
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          title: 'Perguntas Frequentes sobre Anúncios',
          description: 'Respostas para as dúvidas mais comuns',
          content_type: 'faq',
          content_url: null,
          content_text: 'P: Como definir o orçamento ideal? R: O orçamento deve ser baseado...',
          thumbnail_url: null,
          is_published: true,
          sort_order: 3,
          created_at: new Date().toISOString()
        },
        {
          id: '4',
          title: 'Caso de Sucesso: Loja de Roupas',
          description: 'Como uma loja aumentou as vendas em 300%',
          content_type: 'case_study',
          content_url: null,
          content_text: 'Uma loja de roupas conseguiu triplicar suas vendas usando as estratégias...',
          thumbnail_url: null,
          is_published: true,
          sort_order: 4,
          created_at: new Date().toISOString()
        }
      ];

      setContents(mockContents);
    } catch (error) {
      console.error('Error loading learning contents:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar conteúdos do centro de aprendizado",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getContentsByType = (type: string) => {
    return contents.filter(content => content.content_type === type);
  };

  const trackView = async (contentId: string) => {
    try {
      // Simulando tracking até as tabelas serem criadas
      console.log('Tracking view for content:', contentId);
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  return {
    contents,
    isLoading,
    getContentsByType,
    trackView,
    refreshContents: loadPublishedContents
  };
};
