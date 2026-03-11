import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface LearningCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  sort_order?: number;
  is_active?: boolean;
}

interface SupplementaryMaterial {
  title: string;
  type: 'pdf' | 'link' | 'document' | 'other';
  url: string;
  description?: string;
}

interface LearningContent {
  id: string;
  title: string;
  description?: string;
  content_type: 'video' | 'tutorial' | 'guide' | 'article';
  content_url?: string;
  thumbnail_url?: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  duration_minutes?: number;
  view_count: number;
  is_featured: boolean;
  is_published: boolean;
  category_id?: string;
  category?: LearningCategory;
  tags?: string[];
  sort_order?: number;
  supplementary_material?: SupplementaryMaterial[];
  created_at: string;
  updated_at: string;
}

interface LoadContentsParams {
  published?: boolean;
  category_id?: string;
  content_type?: string;
}

export const useSupabaseLearningContent = () => {
  const { toast } = useToast();
  const [contents, setContents] = useState<LearningContent[]>([]);
  const [categories, setCategories] = useState<LearningCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Carregar categorias
  const loadCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('learning_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }, []);

  // Carregar conteúdos
  const loadContents = useCallback(async (params: LoadContentsParams = {}) => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('learning_contents')
        .select(`
          *,
          category:learning_categories(id, name, description, icon)
        `)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (params.published !== undefined) {
        query = query.eq('is_published', params.published);
      }

      if (params.category_id) {
        query = query.eq('category_id', params.category_id);
      }

      if (params.content_type) {
        query = query.eq('content_type', params.content_type);
      }

      const { data, error } = await query;

      if (error) throw error;

      const processedData = (data || []).map(item => ({
        ...item,
        supplementary_material: item.supplementary_material || []
      }));

      setContents(processedData);
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

  // Carregar dados iniciais
  useEffect(() => {
    loadCategories();
    loadContents({ published: true }); // Força carregar apenas conteúdos publicados
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executar apenas uma vez no mount

  // Incrementar visualizações
  const incrementViewCount = useCallback(async (contentId: string) => {
    try {
      const { error } = await supabase
        .rpc('inc_view_count', { p_content: contentId });

      if (error) {
        console.error('Error incrementing view count:', error);
        return;
      }

      // Atualizar estado local
      setContents(prev => prev.map(content => 
        content.id === contentId 
          ? { ...content, view_count: content.view_count + 1 }
          : content
      ));
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  }, []);

  // Criar conteúdo
  const createContent = useCallback(async (newContent: Partial<LearningContent>) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('learning_contents')
        .insert([{
          ...newContent,
          view_count: 0,
          supplementary_material: newContent.supplementary_material || []
        }])
        .select(`
          *,
          category:learning_categories(id, name, description, icon)
        `)
        .single();

      if (error) throw error;

      setContents(prev => [data, ...prev]);
      
      toast({
        title: "Sucesso",
        description: "Conteúdo criado com sucesso!",
      });

      return data;
    } catch (error) {
      console.error('Error creating content:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar conteúdo",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Atualizar conteúdo
  const updateContent = useCallback(async (contentId: string, updatedContent: Partial<LearningContent>) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('learning_contents')
        .update(updatedContent)
        .eq('id', contentId)
        .select(`
          *,
          category:learning_categories(id, name, description, icon)
        `)
        .single();

      if (error) throw error;

      setContents(prev => prev.map(content => 
        content.id === contentId ? data : content
      ));
      
      toast({
        title: "Sucesso",
        description: "Conteúdo atualizado com sucesso!",
      });

      return data;
    } catch (error) {
      console.error('Error updating content:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar conteúdo",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Deletar conteúdo
  const deleteContent = useCallback(async (contentId: string) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('learning_contents')
        .delete()
        .eq('id', contentId);

      if (error) throw error;

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
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Alternar status de publicação
  const togglePublish = useCallback(async (contentId: string, publishStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('learning_contents')
        .update({ is_published: publishStatus })
        .eq('id', contentId);

      if (error) throw error;

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
      throw error;
    }
  }, [toast]);

  // Rastrear visualização
  const trackView = useCallback(async (contentId: string) => {
    await incrementViewCount(contentId);
  }, [incrementViewCount]);

  // Filtrar conteúdos por tipo
  const getContentsByType = useCallback((type: string) => {
    return contents.filter(content => content.content_type === type);
  }, [contents]);

  // Extrair thumbnail do YouTube
  const extractYouTubeThumbnail = useCallback((url: string): string | null => {
    try {
      const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
      if (videoIdMatch && videoIdMatch[1]) {
        return `https://img.youtube.com/vi/${videoIdMatch[1]}/maxresdefault.jpg`;
      }
    } catch (error) {
      console.error('Error extracting YouTube thumbnail:', error);
    }
    return null;
  }, []);

  // Validar URL do YouTube
  const isYouTubeUrl = useCallback((url: string): boolean => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/;
    return youtubeRegex.test(url);
  }, []);

  return {
    contents,
    categories,
    isLoading,
    loadContents,
    loadCategories,
    incrementViewCount,
    createContent,
    updateContent,
    deleteContent,
    togglePublish,
    trackView,
    getContentsByType,
    extractYouTubeThumbnail,
    isYouTubeUrl,
    refreshContents: () => loadContents({ published: true })
  };
};