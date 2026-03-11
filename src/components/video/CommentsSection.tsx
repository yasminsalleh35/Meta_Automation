import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Reply, Send } from 'lucide-react';
import { useVideoComments } from '@/hooks/useVideoComments';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CommentsSectionProps {
  contentId: string;
}

interface CommentItemProps {
  comment: any;
  onReply?: (parentId: string, text: string) => void;
  depth?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, onReply, depth = 0 }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');

  const handleReply = () => {
    if (replyText.trim() && onReply) {
      onReply(comment.id, replyText.trim());
      setReplyText('');
      setIsReplying(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`space-y-3 ${depth > 0 ? 'ml-8 border-l-2 border-muted pl-4' : ''}`}>
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="text-xs">
              {getInitials(comment.author_name || 'Usuário')}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{comment.author_name || 'Usuário'}</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </span>
            </div>
            
            <p className="text-sm leading-relaxed">{comment.comment_text}</p>
            
            {depth < 2 && onReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsReplying(!isReplying)}
                className="h-6 px-2 text-xs"
              >
                <Reply className="w-3 h-3 mr-1" />
                Responder
              </Button>
            )}
          </div>
        </div>
      </Card>

      {isReplying && (
        <div className="ml-11 space-y-2">
          <Textarea
            placeholder="Escreva sua resposta..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="min-h-[60px] text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleReply}>
              <Send className="w-3 h-3 mr-1" />
              Enviar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setIsReplying(false);
                setReplyText('');
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Render replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-2">
          {comment.replies.map((reply: any) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const CommentsSection: React.FC<CommentsSectionProps> = ({ contentId }) => {
  const { user } = useAuth();
  const { comments, isLoading, addComment } = useVideoComments(contentId);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setIsSubmitting(true);
    try {
      await addComment(newComment.trim());
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (parentId: string, text: string) => {
    if (!user) return;
    try {
      await addComment(text, parentId);
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-muted rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-12 bg-muted rounded" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Comment Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder="Adicione um comentário..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
          />
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={!newComment.trim() || isSubmitting}
              size="sm"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Enviando...' : 'Comentar'}
            </Button>
          </div>
        </form>
      ) : (
        <Card className="p-4 text-center">
          <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Faça login para comentar
          </p>
        </Card>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum comentário ainda</p>
            <p className="text-sm text-muted-foreground">
              Seja o primeiro a comentar sobre este vídeo!
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={user ? handleReply : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
};