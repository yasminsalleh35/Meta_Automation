import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, Clock, Heart, MessageSquare } from 'lucide-react';
import SimpleVideoPlayer from './SimpleVideoPlayer';
import { CommentsSection } from './CommentsSection';
import { useVideoProgress } from '@/hooks/useVideoProgress';
import { useSupabaseLearningContent } from '@/hooks/useSupabaseLearningContent';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: any;
}

export const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onClose, content }) => {
  const { trackView } = useSupabaseLearningContent();
  const { progress, updateProgress, markAsComplete, toggleFavorite } = useVideoProgress(content?.id);

  // Track view when modal opens
  useEffect(() => {
    if (isOpen && content) {
      trackView(content.id);
    }
  }, [isOpen, content]);

  if (!content) return null;

  const handleMarkComplete = () => {
    markAsComplete();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-xl font-bold">{content.title}</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                <Clock className="w-3 h-3 mr-1" />
                {content.duration_minutes}min
              </Badge>
              <Badge variant="outline">
                <Eye className="w-3 h-3 mr-1" />
                {content.view_count} views
              </Badge>
            </div>
          </DialogTitle>
          <DialogDescription>
            Assista ao vídeo e participe da discussão nos comentários
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Video Player - Takes 2 columns on large screens */}
          <div className="lg:col-span-2 space-y-4">
            <SimpleVideoPlayer content={content} />
            
            {/* Video Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant={progress?.is_favorited ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFavorite()}
                >
                  <Heart className={`w-4 h-4 mr-1 ${progress?.is_favorited ? 'fill-current' : ''}`} />
                  {progress?.is_favorited ? 'Favorito' : 'Favoritar'}
                </Button>
                <Button
                  variant={progress?.completed ? "secondary" : "outline"}
                  size="sm"
                  onClick={handleMarkComplete}
                  disabled={progress?.completed}
                >
                  {progress?.completed ? '✓ Concluído' : 'Marcar como concluído'}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Description and Materials */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Descrição</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {content.description || 'Nenhuma descrição disponível.'}
                </p>
              </div>

              {content.supplementary_material && content.supplementary_material.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Material Complementar</h3>
                  <div className="space-y-2">
                    {content.supplementary_material.map((material: any, index: number) => (
                      <a
                        key={index}
                        href={material.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline p-2 border rounded-md hover:bg-muted/50 transition-colors"
                      >
                        📎 {material.title}
                        {material.description && (
                          <span className="text-muted-foreground">- {material.description}</span>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Comments Sidebar - Takes 1 column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4" />
              <h3 className="font-semibold">Comentários</h3>
            </div>
            <ScrollArea className="h-[400px]">
              <CommentsSection contentId={content.id} />
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};