
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Upload, Image, Video, Search, FolderOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MediaUpload } from '@/components/media/MediaUpload';
import { MediaGallery } from '@/components/media/MediaGallery';
import { useMediaLibrary, MediaFile } from '@/hooks/useMediaLibrary';

interface CreativeUploadProps {
  selectedFile: File | null;
  filePreview: string | null;
  selectedCreatedMedia: any | null;
  generatedMedia: any[];
  onFileSelect: (file: File) => void;
  onCreatedMediaSelect: (media: any) => void;
  onClearSelection: () => void;
}

export const CreativeUpload: React.FC<CreativeUploadProps> = ({
  selectedFile,
  filePreview,
  selectedCreatedMedia,
  onFileSelect,
  onCreatedMediaSelect,
  onClearSelection
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedMediaFile, setSelectedMediaFile] = useState<MediaFile | null>(null);

  const {
    mediaFiles,
    isLoading,
    isUploading,
    uploadFile
  } = useMediaLibrary();

  const handleUploadAndSelect = async (file: File) => {
    const uploadedMedia = await uploadFile(file);
    if (uploadedMedia) {
      onFileSelect(file);
      toast({
        title: "Upload realizado!",
        description: "Arquivo carregado e selecionado para a campanha.",
      });
    }
  };

  const handleMediaSelect = (media: MediaFile) => {
    setSelectedMediaFile(media);
    
    // Converter MediaFile para o formato esperado
    const mediaForCampaign = {
      id: media.id,
      type: media.file_type.startsWith('image/') ? 'image' : 'video',
      url: media.public_url,
      prompt: media.metadata?.prompt || media.filename,
      createdAt: media.created_at
    };
    
    onCreatedMediaSelect(mediaForCampaign);
  };

  const handleClearAll = () => {
    setSelectedMediaFile(null);
    onClearSelection();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="w-5 h-5" />
          <span>Criativo (Imagem ou Vídeo)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Preview da Seleção Atual */}
        {(selectedFile || selectedMediaFile || selectedCreatedMedia) && (
          <Card className="mb-4 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                    {selectedMediaFile ? (
                      selectedMediaFile.file_type.startsWith('image/') ? (
                        <img 
                          src={selectedMediaFile.public_url} 
                          alt="Mídia selecionada" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                          <Video className="w-6 h-6 text-white" />
                        </div>
                      )
                    ) : filePreview ? (
                      selectedFile?.type.startsWith('video/') ? (
                        <video src={filePreview} className="w-full h-full object-cover" />
                      ) : (
                        <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                      )
                    ) : selectedCreatedMedia ? (
                      <img 
                        src={selectedCreatedMedia.url} 
                        alt="Mídia gerada" 
                        className="w-full h-full object-cover" 
                      />
                    ) : null}
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">Mídia Selecionada</p>
                    <p className="text-sm text-blue-700">
                      {selectedMediaFile ? selectedMediaFile.filename : 
                       selectedFile ? selectedFile.name : 
                       selectedCreatedMedia ? 'Mídia gerada por IA' : ''}
                    </p>
                    {selectedMediaFile?.source === 'ai_generated' && selectedMediaFile.metadata?.prompt && (
                      <p className="text-xs text-blue-600 mt-1 italic">
                        "{selectedMediaFile.metadata.prompt.substring(0, 50)}..."
                      </p>
                    )}
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleClearAll}
                >
                  Trocar Mídia
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Fazer Upload
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Biblioteca ({mediaFiles.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="mt-4">
            <MediaUpload
              onUpload={handleUploadAndSelect}
              isUploading={isUploading}
              multiple={false}
              accept="image/*,video/*"
              maxSize={100}
            />
          </TabsContent>
          
          <TabsContent value="library" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Selecione uma mídia da sua biblioteca
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.open('/media', '_blank')}
                >
                  Gerenciar Biblioteca
                </Button>
              </div>

              <MediaGallery
                mediaFiles={mediaFiles}
                isLoading={isLoading}
                onDelete={() => {}} // Não permitir deletar da criação de campanha
                onSelect={handleMediaSelect}
                selectable={true}
                selectedIds={selectedMediaFile ? [selectedMediaFile.id] : []}
              />

              {mediaFiles.length === 0 && !isLoading && (
                <Card className="p-8 text-center">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <FolderOpen className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Biblioteca vazia
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Você ainda não tem mídias na sua biblioteca.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => window.open('/media', '_blank')}
                  >
                    Ir para Criativos
                  </Button>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
