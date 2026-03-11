
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlayCircle, FileText, HelpCircle, TrendingUp, ExternalLink } from 'lucide-react';
import { useSupabaseLearningContent } from '@/hooks/useSupabaseLearningContent';
import { VideoModal } from '@/components/video/VideoModal';

interface LearningContentDisplayProps {
  contentType?: 'video' | 'guide' | 'tutorial' | 'article';
  title?: string;
}

export const LearningContentDisplay: React.FC<LearningContentDisplayProps> = ({ 
  contentType, 
  title = "Conteúdos" 
}) => {
  const { contents, isLoading, getContentsByType, trackView } = useSupabaseLearningContent();
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const displayContents = contentType ? getContentsByType(contentType) : contents;

  // 🔍 DEBUG: Verificar o que está sendo carregado
  console.log('📹 LearningContentDisplay DEBUG:', {
    contentType,
    totalContents: contents.length,
    displayContents: displayContents.length,
    isLoading,
    sampleContent: displayContents[0] // Primeiro item para debug
  });

  const getIcon = (type: string) => {
    const icons = {
      video: PlayCircle,
      tutorial: PlayCircle,
      guide: FileText,
      article: FileText
    };
    const IconComponent = icons[type as keyof typeof icons] || FileText;
    return <IconComponent className="w-5 h-5" />;
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      video: 'Vídeo',
      tutorial: 'Tutorial',
      guide: 'Guia',
      article: 'Artigo'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const handleContentClick = async (content: any) => {
    console.log('🎬 Video click:', {
      contentId: content.id,
      contentType: content.content_type,
      contentUrl: content.content_url,
      hasUrl: !!content.content_url
    });
    
    if (content.content_type === 'video' && content.content_url) {
      setSelectedContent(content);
      setIsModalOpen(true);
      console.log('✅ Opening video modal for:', content.title);
    } else {
      await trackView(content.id);
      if (content.content_url) {
        window.open(content.content_url, '_blank');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (displayContents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum conteúdo disponível</h3>
        <p className="text-gray-500">
          {contentType 
            ? `Não há ${getTypeLabel(contentType).toLowerCase()}s disponíveis no momento.`
            : 'Não há conteúdos disponíveis no momento.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Badge variant="outline">{displayContents.length} item(s)</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayContents.map((content) => (
          <Card key={content.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="outline">
                  {getIcon(content.content_type)}
                  <span className="ml-1">{getTypeLabel(content.content_type)}</span>
                </Badge>
              </div>
              <CardTitle className="text-lg">{content.title}</CardTitle>
              {content.description && (
                <CardDescription>{content.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {content.thumbnail_url && (
                <img 
                  src={content.thumbnail_url} 
                  alt={content.title}
                  className="w-full h-32 object-cover rounded mb-4"
                />
              )}
              
              {/* Mostrar duração se disponível */}
              {content.duration_minutes && (
                <p className="text-sm text-muted-foreground mb-2">
                  Duração: {content.duration_minutes} minutos
                </p>
              )}

              {/* Mostrar material complementar se disponível */}
              {content.supplementary_material && content.supplementary_material.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Material complementar:</p>
                  <div className="space-y-1">
                    {content.supplementary_material.slice(0, 2).map((material: any, index: number) => (
                      <a 
                        key={index}
                        href={material.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline block"
                      >
                        📎 {material.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                {content.content_url ? (
                  <Button 
                    onClick={() => handleContentClick(content)} 
                    className="flex-1"
                  >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    {content.content_type === 'video' ? 'Assistir Vídeo' : 'Assistir'}
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleContentClick(content)} 
                    variant="outline" 
                    className="flex-1"
                  >
                    Ver Detalhes
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Video Modal */}
      <VideoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        content={selectedContent}
      />
    </div>
  );
};
