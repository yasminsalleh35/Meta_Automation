
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ResponsiveSheet } from '@/components/ui/mobile-sheet';
import { Badge } from '@/components/ui/badge';
import { 
  Image, 
  Video, 
  Upload, 
  Trash2, 
  Eye,
  ImageIcon,
  Loader2,
  Plus
} from 'lucide-react';
import { MediaGallery } from '@/components/media/MediaGallery';
import { MediaUpload } from '@/components/media/MediaUpload';
import { useMediaLibrary } from '@/hooks/useMediaLibrary';
import { SimpleCampaignFormData } from '@/types/simpleCampaign.types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MediaSelectorProps {
  formData: SimpleCampaignFormData;
  updateFormData: (field: keyof SimpleCampaignFormData, value: any) => void;
}

export const MediaSelector: React.FC<MediaSelectorProps> = ({ 
  formData, 
  updateFormData 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { mediaFiles, isLoading, uploadFile } = useMediaLibrary();

  const handleMediaSelect = (media: any) => {
    const selectedMedia = {
      id: media.id,
      filename: media.filename,
      public_url: media.public_url,
      file_type: media.file_type,
      file_size: media.file_size
    };
    
    updateFormData('selectedMediaFile', selectedMedia);
    setIsOpen(false);
  };

  const handleRemoveMedia = () => {
    updateFormData('selectedMediaFile', null);
  };

  const handleUpload = async (file: File) => {
    const uploadedMedia = await uploadFile(file);
    if (uploadedMedia) {
      const selectedMedia = {
        id: uploadedMedia.id,
        filename: uploadedMedia.filename,
        public_url: uploadedMedia.public_url || '',
        file_type: uploadedMedia.file_type,
        file_size: uploadedMedia.file_size
      };
      
      updateFormData('selectedMediaFile', selectedMedia);
      setIsOpen(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Mídia do Anúncio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!formData.selectedMediaFile ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma mídia selecionada
            </h3>
            <p className="text-gray-600 mb-4">
              Escolha uma imagem ou vídeo para seu anúncio
            </p>
            
            <ResponsiveSheet
              open={isOpen}
              onOpenChange={setIsOpen}
              title="Selecionar Mídia para o Anúncio"
              side="bottom"
              trigger={
                <Button className="mr-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Selecionar Mídia
                </Button>
              }
            >
              <div className="h-[85vh] sm:h-auto overflow-y-auto pb-safe">
                <Tabs defaultValue="gallery" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 h-9 sm:h-10">
                    <TabsTrigger value="gallery" className="text-xs sm:text-sm px-2 sm:px-3">
                      <Image className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                      <span className="hidden xs:inline">Minha Galeria</span>
                      <span className="xs:hidden">Galeria</span>
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="text-xs sm:text-sm px-2 sm:px-3">
                      <Upload className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                      <span className="hidden xs:inline">Fazer Upload</span>
                      <span className="xs:hidden">Upload</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="gallery" className="mt-3 sm:mt-4">
                    <MediaGallery
                      mediaFiles={mediaFiles}
                      isLoading={isLoading}
                      onDelete={() => {}} // Disable delete in selector
                      onSelect={handleMediaSelect}
                      selectable={true}
                      selectedIds={[]}
                    />
                  </TabsContent>
                  
                  <TabsContent value="upload" className="mt-3 sm:mt-4">
                    <MediaUpload
                      onUpload={handleUpload}
                      isUploading={false}
                      accept="image/*,video/*"
                      multiple={false}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </ResponsiveSheet>
          </div>
        ) : (
          <div className="border rounded-lg p-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {formData.selectedMediaFile.file_type.startsWith('image/') ? (
                  <img
                    src={formData.selectedMediaFile.public_url}
                    alt={formData.selectedMediaFile.filename}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-800 rounded-lg flex items-center justify-center">
                    <Video className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">
                  {formData.selectedMediaFile.filename}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={formData.selectedMediaFile.file_type.startsWith('image/') ? 'default' : 'secondary'}>
                    {formData.selectedMediaFile.file_type.startsWith('image/') ? 'Imagem' : 'Vídeo'}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {formatFileSize(formData.selectedMediaFile.file_size)}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(formData.selectedMediaFile?.public_url, '_blank')}
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <ResponsiveSheet
                  open={isOpen}
                  onOpenChange={setIsOpen}
                  title="Selecionar Nova Mídia"
                  side="bottom"
                  trigger={
                    <Button size="sm" variant="outline">
                      Trocar
                    </Button>
                  }
                >
                  <div className="h-[85vh] sm:h-auto overflow-y-auto pb-safe">
                    <Tabs defaultValue="gallery" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 h-9 sm:h-10">
                        <TabsTrigger value="gallery" className="text-xs sm:text-sm px-2 sm:px-3">
                          <Image className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                          <span className="hidden xs:inline">Minha Galeria</span>
                          <span className="xs:hidden">Galeria</span>
                        </TabsTrigger>
                        <TabsTrigger value="upload" className="text-xs sm:text-sm px-2 sm:px-3">
                          <Upload className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                          <span className="hidden xs:inline">Fazer Upload</span>
                          <span className="xs:hidden">Upload</span>
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="gallery" className="mt-3 sm:mt-4">
                        <MediaGallery
                          mediaFiles={mediaFiles}
                          isLoading={isLoading}
                          onDelete={() => {}}
                          onSelect={handleMediaSelect}
                          selectable={true}
                          selectedIds={[]}
                        />
                      </TabsContent>
                      
                      <TabsContent value="upload" className="mt-3 sm:mt-4">
                        <MediaUpload
                          onUpload={handleUpload}
                          isUploading={false}
                          accept="image/*,video/*"
                          multiple={false}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>
                </ResponsiveSheet>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleRemoveMedia}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <div className="text-xs text-gray-500">
          <p>Formatos aceitos: JPG, PNG, WebP, GIF, MP4, MOV, AVI</p>
          <p>Imagens até 50MB • Vídeos até 1GB</p>
        </div>
      </CardContent>
    </Card>
  );
};
