import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface VideoProgress {
  id: string;
  user_id: string;
  content_id: string | null;
  progress_percentage: number | null;
  completed: boolean | null;
  is_favorited: boolean | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export const useVideoProgress = (contentId?: string) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [progress, setProgress] = useState<VideoProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user progress for the content
  const loadProgress = useCallback(async () => {
    if (!user || !contentId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('user_learning_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('content_id', contentId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      setProgress(data || null);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, contentId]);

  // Update progress percentage
  const updateProgress = useCallback(async (progressPercentage: number) => {
    if (!user || !contentId) return;

    try {
      const { data, error } = await supabase
        .from('user_learning_progress')
        .upsert({
          user_id: user.id,
          content_id: contentId,
          progress_percentage: progressPercentage,
          completed: progressPercentage >= 90,
          completed_at: progressPercentage >= 90 ? new Date().toISOString() : null
        }, { onConflict: 'user_id,content_id' }) // audit DATA-05
        .select()
        .single();

      if (error) throw error;

      setProgress(data);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  }, [user, contentId]);

  // Mark as complete
  const markAsComplete = useCallback(async () => {
    if (!user || !contentId) return;

    try {
      const { data, error } = await supabase
        .from('user_learning_progress')
        .upsert({
          user_id: user.id,
          content_id: contentId,
          progress_percentage: 100,
          completed: true,
          completed_at: new Date().toISOString()
        }, { onConflict: 'user_id,content_id' }) // audit DATA-05
        .select()
        .single();

      if (error) throw error;

      setProgress(data);
      
      toast({
        title: "Parabéns!",
        description: "Vídeo concluído com sucesso!",
      });
    } catch (error) {
      console.error('Error marking as complete:', error);
      toast({
        title: "Erro",
        description: "Erro ao marcar como concluído",
        variant: "destructive"
      });
    }
  }, [user, contentId, toast]);

  // Toggle favorite status
  const toggleFavorite = useCallback(async () => {
    if (!user || !contentId) return;

    try {
      const currentFavorited = progress?.is_favorited || false;
      
      const { data, error } = await supabase
        .from('user_learning_progress')
        .upsert({
          user_id: user.id,
          content_id: contentId,
          is_favorited: !currentFavorited,
          progress_percentage: progress?.progress_percentage || 0,
          completed: progress?.completed || false
        }, { onConflict: 'user_id,content_id' }) // audit DATA-05
        .select()
        .single();

      if (error) throw error;

      setProgress(data);
      
      toast({
        title: !currentFavorited ? "Favoritado!" : "Removido dos favoritos",
        description: !currentFavorited 
          ? "Vídeo adicionado aos seus favoritos" 
          : "Vídeo removido dos seus favoritos",
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Erro",
        description: "Erro ao favoritar vídeo",
        variant: "destructive"
      });
    }
  }, [user, contentId, progress, toast]);

  // Load progress when user or contentId changes
  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  return {
    progress,
    isLoading,
    updateProgress,
    markAsComplete,
    toggleFavorite,
    refreshProgress: loadProgress
  };
};