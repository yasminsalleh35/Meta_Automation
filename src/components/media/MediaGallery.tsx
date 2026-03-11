
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Image, 
  Video, 
  Search, 
  Download, 
  Trash2, 
  Eye,
  Calendar,
  HardDrive,
  Tag,
  Sparkles
} from 'lucide-react';
import { MediaFile } from '@/hooks/useMediaLibrary';
import { useToast } from '@/hooks/use-toast';

interface MediaGalleryProps {
  mediaFiles: MediaFile[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  onSelect?: (media: MediaFile) => void;
  selectable?: boolean;
  selectedIds?: string[];
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  mediaFiles,
  isLoading,
  onDelete,
  onSelect,
  selectable = false,
  selectedIds = []
}) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'ai'>('all');

  const filteredMedia = mediaFiles.filter(media => {
    const matchesSearch = media.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         media.metadata?.prompt?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || 
                       (filterType === 'image' && media.file_type.startsWith('image/')) ||
                       (filterType === 'video' && media.file_type.startsWith('video/')) ||
                       (filterType === 'ai' && media.source === 'ai_generated');

    return matchesSearch && matchesType;
  });

  const handleDownload = async (media: MediaFile) => {
    try {
      const response = await fetch(media.public_url || '');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = media.filename;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Download iniciado',
        description: `${media.filename} está sendo baixado.`,
      });
    } catch (error) {
      toast({
        title: 'Erro no download',
        description: 'Não foi possível baixar o arquivo.',
        variant: 'destructive'
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-0">
              <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
              <div className="p-2 sm:p-3 space-y-2">
                <div className="h-3 sm:h-4 bg-gray-200 rounded"></div>
                <div className="h-2 sm:h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por nome ou prompt..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2">
          <Button
            variant={filterType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('all')}
            className="text-xs sm:text-sm"
          >
            Todos ({mediaFiles.length})
          </Button>
          <Button
            variant={filterType === 'image' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('image')}
            className="text-xs sm:text-sm"
          >
            <Image className="w-3 h-3 sm:mr-1" />
            <span className="hidden xs:inline">Imagens</span>
            <span className="xs:hidden ml-1">Img</span>
            <span className="ml-1">({mediaFiles.filter(m => m.file_type.startsWith('image/')).length})</span>
          </Button>
          <Button
            variant={filterType === 'video' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('video')}
            className="text-xs sm:text-sm"
          >
            <Video className="w-3 h-3 sm:mr-1" />
            <span className="hidden xs:inline">Vídeos</span>
            <span className="xs:hidden ml-1">Vid</span>
            <span className="ml-1">({mediaFiles.filter(m => m.file_type.startsWith('video/')).length})</span>
          </Button>
          <Button
            variant={filterType === 'ai' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('ai')}
            className="text-xs sm:text-sm"
          >
            <Sparkles className="w-3 h-3 sm:mr-1" />
            <span className="ml-1">IA ({mediaFiles.filter(m => m.source === 'ai_generated').length})</span>
          </Button>
        </div>
      </div>

      {/* Galeria */}
      {filteredMedia.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Image className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filterType !== 'all' 
              ? 'Nenhuma mídia encontrada' 
              : 'Sua biblioteca está vazia'
            }
          </h3>
          <p className="text-gray-600">
            {searchTerm || filterType !== 'all'
              ? 'Tente ajustar os filtros de busca.'
              : 'Faça upload de imagens e vídeos ou gere com IA.'
            }
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          {filteredMedia.map((media) => (
            <Card 
              key={media.id} 
              className={`group overflow-hidden transition-all hover:shadow-lg ${
                selectable && selectedIds.includes(media.id) 
                  ? 'ring-2 ring-blue-500 ring-offset-2' 
                  : ''
              } ${selectable ? 'cursor-pointer' : ''}`}
              onClick={() => selectable && onSelect?.(media)}
            >
              <CardContent className="p-0">
                {/* Preview da Mídia */}
                <div className="aspect-square relative bg-gray-100 overflow-hidden">
                  {media.file_type.startsWith('image/') ? (
                    <img
                      src={media.public_url || ''}
                      alt={media.filename}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                      <video
                        src={media.public_url || ''}
                        className="w-full h-full object-cover"
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black bg-opacity-50 rounded-full p-3">
                          <Video className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-1 sm:top-2 left-1 sm:left-2 flex gap-0.5 sm:gap-1">
                    <Badge variant={media.file_type.startsWith('image/') ? 'default' : 'secondary'} className="text-[9px] sm:text-xs px-1 sm:px-2 py-0 sm:py-0.5">
                      {media.file_type.startsWith('image/') ? 'IMG' : 'VID'}
                    </Badge>
                    {media.source === 'ai_generated' && (
                      <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300 text-[9px] sm:text-xs px-1 sm:px-2 py-0 sm:py-0.5">
                        <Sparkles className="w-2 h-2 sm:w-3 sm:h-3 sm:mr-1" />
                        IA
                      </Badge>
                    )}
                  </div>

                  {/* Overlay com Ações */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={(e) => {
                        e.stopPropagation();
                        window.open(media.public_url, '_blank');
                      }}>
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="secondary" onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(media);
                      }}>
                        <Download className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={(e) => {
                        e.stopPropagation();
                        onDelete(media.id);
                      }}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Informações */}
                <div className="p-2 sm:p-3 space-y-1 sm:space-y-2">
                  <h4 className="font-medium text-xs sm:text-sm truncate" title={media.filename}>
                    {media.filename}
                  </h4>
                  
                  {media.source === 'ai_generated' && media.metadata?.prompt && (
                    <p className="text-[10px] sm:text-xs text-gray-600 line-clamp-2">
                      "{media.metadata.prompt}"
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-500">
                    <span className="flex items-center gap-0.5 sm:gap-1">
                      <HardDrive className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      {formatFileSize(media.file_size)}
                    </span>
                    <span className="hidden sm:flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(media.created_at)}
                    </span>
                  </div>

                  {media.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {media.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          <Tag className="w-2 h-2 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                      {media.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{media.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
