
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface LearningCategory {
  id: string;
  name: string;
  description?: string;
}

interface LearningContent {
  id: string;
  title: string;
  description?: string;
  content_type: 'video' | 'tutorial' | 'guide' | 'article';
  content_url?: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  duration_minutes?: number;
  view_count: number;
  is_featured: boolean;
  category_id?: string;
  category?: LearningCategory;
  is_published: boolean;
  created_at: string;
  thumbnail_url?: string;
  tags?: string[];
  sort_order?: number;
}

interface LoadContentsParams {
  published?: boolean;
  category_id?: string;
  content_type?: string;
}

export const useRealLearningContent = () => {
  const { toast } = useToast();
  const [contents, setContents] = useState<LearningContent[]>([]);
  const [categories, setCategories] = useState<LearningCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data para demonstração
  const mockCategories: LearningCategory[] = [
    { id: '1', name: 'Primeiros Passos', description: 'Introdução à plataforma' },
    { id: '2', name: 'Criação de Campanhas', description: 'Como criar campanhas eficazes' },
    { id: '3', name: 'Integrações', description: 'Conectar suas ferramentas' },
    { id: '4', name: 'Análise e Otimização', description: 'Interpretar dados e otimizar' },
  ];

  const mockContents: LearningContent[] = [
    {
      id: '1',
      title: 'Como criar sua primeira campanha',
      description: 'Aprenda o passo a passo para criar campanhas eficazes no Meta Ads',
      content_type: 'tutorial',
      content_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      difficulty_level: 'beginner',
      duration_minutes: 15,
      view_count: 1250,
      is_featured: true,
      is_published: true,
      created_at: '2024-01-15T10:30:00Z',
      category_id: '2',
      category: mockCategories[1]
    },
    {
      id: '2',
      title: 'Configuração do Pixel do Facebook',
      description: 'Tutorial sobre como configurar o pixel corretamente',
      content_type: 'video',
      content_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      difficulty_level: 'intermediate',
      duration_minutes: 20,
      view_count: 890,
      is_featured: false,
      is_published: true,
      created_at: '2024-01-10T14:20:00Z',
      category_id: '3',
      category: mockCategories[2]
    },
    {
      id: '3',
      title: 'Guia Completo de Segmentação',
      description: 'Manual detalhado sobre segmentação de público',
      content_type: 'guide',
      difficulty_level: 'advanced',
      duration_minutes: 30,
      view_count: 567,
      is_featured: true,
      is_published: true,
      created_at: '2024-01-05T09:15:00Z',
      category_id: '2',
      category: mockCategories[1]
    },
    {
      id: '4',
      title: 'Primeiros Passos na Plataforma',
      description: 'Conheça todas as funcionalidades básicas',
      content_type: 'tutorial',
      content_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      difficulty_level: 'beginner',
      duration_minutes: 10,
      view_count: 2100,
      is_featured: false,
      is_published: true,
      created_at: '2024-01-20T16:45:00Z',
      category_id: '1',
      category: mockCategories[0]
    },
    {
      id: '5',
      title: 'Análise de Métricas Avançadas',
      description: 'Como interpretar dados e tomar decisões baseadas em métricas',
      content_type: 'guide',
      difficulty_level: 'advanced',
      duration_minutes: 25,
      view_count: 334,
      is_featured: false,
      is_published: false,
      created_at: '2024-01-12T11:30:00Z',
      category_id: '4',
      category: mockCategories[3]
    },
    {
      id: '6',
      title: 'Integração com Meta Ads',
      description: 'Tutorial passo a passo para conectar sua conta do Meta',
      content_type: 'video',
      content_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      difficulty_level: 'intermediate',
      duration_minutes: 18,
      view_count: 756,
      is_featured: true,
      is_published: true,
      created_at: '2024-01-08T13:20:00Z',
      category_id: '3',
      category: mockCategories[2]
    }
  ];

  const loadContents = useCallback(async (params: LoadContentsParams = {}) => {
    try {
      setIsLoading(true);
      
      // Simular delay de carregamento
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let filteredContents = [...mockContents];
      
      if (params.content_type) {
        filteredContents = filteredContents.filter(content => 
          content.content_type === params.content_type
        );
      }
      
      if (params.category_id) {
        filteredContents = filteredContents.filter(content => 
          content.category_id === params.category_id
        );
      }

      if (params.published !== undefined) {
        filteredContents = filteredContents.filter(content => 
          content.is_published === params.published
        );
      }
      
      setContents(filteredContents);
      setCategories(mockCategories);
      
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
  }, [toast]);

  const incrementViewCount = useCallback(async (contentId: string) => {
    try {
      // Simular incremento de visualização
      setContents(prev => prev.map(content => 
        content.id === contentId 
          ? { ...content, view_count: content.view_count + 1 }
          : content
      ));
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  }, []);

  const createContent = useCallback(async (newContent: Partial<LearningContent>) => {
    try {
      setIsLoading(true);
      
      // Simular delay de criação
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const content: LearningContent = {
        id: Date.now().toString(),
        title: newContent.title || '',
        description: newContent.description,
        content_type: newContent.content_type || 'article',
        content_url: newContent.content_url,
        difficulty_level: newContent.difficulty_level || 'beginner',
        duration_minutes: newContent.duration_minutes,
        view_count: 0,
        is_featured: newContent.is_featured || false,
        is_published: newContent.is_published || false,
        created_at: new Date().toISOString(),
        category_id: newContent.category_id,
        category: newContent.category_id ? mockCategories.find(c => c.id === newContent.category_id) : undefined,
        thumbnail_url: newContent.thumbnail_url,
        tags: newContent.tags || [],
        sort_order: newContent.sort_order || 0
      };
      
      setContents(prev => [content, ...prev]);
      
      toast({
        title: "Sucesso",
        description: "Conteúdo criado com sucesso!",
      });
    } catch (error) {
      console.error('Error creating content:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar conteúdo",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const updateContent = useCallback(async (contentId: string, updatedContent: Partial<LearningContent>) => {
    try {
      setIsLoading(true);
      
      // Simular delay de atualização
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setContents(prev => prev.map(content => 
        content.id === contentId 
          ? { 
              ...content, 
              ...updatedContent,
              category: updatedContent.category_id ? mockCategories.find(c => c.id === updatedContent.category_id) : content.category
            }
          : content
      ));
      
      toast({
        title: "Sucesso",
        description: "Conteúdo atualizado com sucesso!",
      });
    } catch (error) {
      console.error('Error updating content:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar conteúdo",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const deleteContent = useCallback(async (contentId: string) => {
    try {
      setIsLoading(true);
      
      // Simular delay de exclusão
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setContents(prev => prev.filter(content => content.id !== contentId));
      
      toast({
        title: "Sucesso",
        description: "Conteúdo excluído com sucesso!",
      });
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir conteúdo",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const togglePublish = useCallback(async (contentId: string, publishStatus: boolean) => {
    try {
      setContents(prev => prev.map(content => 
        content.id === contentId 
          ? { ...content, is_published: publishStatus }
          : content
      ));
      
      toast({
        title: "Sucesso",
        description: `Conteúdo ${publishStatus ? 'publicado' : 'despublicado'} com sucesso!`,
      });
    } catch (error) {
      console.error('Error toggling publish status:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status de publicação",
        variant: "destructive"
      });
    }
  }, [toast]);

  return {
    contents,
    categories,
    isLoading,
    loadContents,
    incrementViewCount,
    createContent,
    updateContent,
    deleteContent,
    togglePublish
  };
};
