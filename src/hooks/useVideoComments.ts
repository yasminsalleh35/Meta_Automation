import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Comment {
  id: string;
  content_id: string;
  user_id: string;
  comment_text: string;
  parent_comment_id?: string;
  created_at: string;
  updated_at: string;
  author_name?: string;
  replies?: Comment[];
}

export const useVideoComments = (contentId: string) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load comments with author information
  const loadComments = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Load main comments (no parent)
      const { data: mainComments, error: mainError } = await supabase
        .from('learning_content_comments')
        .select(`
          *,
          author:profiles(name)
        `)
        .eq('content_id', contentId)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: false });

      if (mainError) throw mainError;

      // Load replies for each main comment
      const { data: replies, error: repliesError } = await supabase
        .from('learning_content_comments')
        .select(`
          *,
          author:profiles(name)
        `)
        .eq('content_id', contentId)
        .not('parent_comment_id', 'is', null)
        .order('created_at', { ascending: true });

      if (repliesError) throw repliesError;

      // Organize comments with replies
      const organizedComments = (mainComments || []).map(comment => {
        const commentReplies = (replies || []).filter(
          reply => reply.parent_comment_id === comment.id
        );
        
        return {
          ...comment,
          author_name: comment.author?.name || 'Usuário',
          replies: commentReplies.map(reply => ({
            ...reply,
            author_name: reply.author?.name || 'Usuário'
          }))
        };
      });

      setComments(organizedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar comentários",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [contentId, toast]);

  // Add a new comment
  const addComment = useCallback(async (text: string, parentId?: string) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para comentar",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('learning_content_comments')
        .insert({
          content_id: contentId,
          user_id: user.id,
          comment_text: text,
          parent_comment_id: parentId || null
        })
        .select(`
          *,
          author:profiles(name)
        `)
        .single();

      if (error) throw error;

      const newComment = {
        ...data,
        author_name: data.author?.name || user.user_metadata?.name || 'Usuário',
        replies: []
      };

      if (parentId) {
        // Update the parent comment's replies
        setComments(prev => prev.map(comment => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newComment]
            };
          }
          return comment;
        }));
      } else {
        // Add as a main comment
        setComments(prev => [newComment, ...prev]);
      }

      toast({
        title: "Sucesso",
        description: "Comentário adicionado com sucesso!",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar comentário",
        variant: "destructive"
      });
    }
  }, [contentId, user, toast]);

  // Load comments on mount and content change
  useEffect(() => {
    if (contentId) {
      loadComments();
    }
  }, [contentId, loadComments]);

  // Set up real-time subscription for new comments
  useEffect(() => {
    if (!contentId) return;

    const channel = supabase
      .channel(`comments-${contentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'learning_content_comments',
          filter: `content_id=eq.${contentId}`
        },
        (payload) => {
          console.log('New comment received:', payload);
          // Reload comments to get author info
          loadComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contentId, loadComments]);

  return {
    comments,
    isLoading,
    addComment,
    refreshComments: loadComments
  };
};