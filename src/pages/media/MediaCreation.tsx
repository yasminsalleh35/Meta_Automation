
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Image, Upload as UploadIcon, FolderOpen } from 'lucide-react';
import { MediaUpload } from '@/components/media/MediaUpload';
import { MediaGallery } from '@/components/media/MediaGallery';
import { useMediaLibrary } from '@/hooks/useMediaLibrary';

export default function MediaCreation() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('gallery');

  const {
    mediaFiles,
    isLoading,
    isUploading,
    uploadFile,
    deleteMedia
  } = useMediaLibrary();


  const handleDeleteMedia = async (id: string) => {
    const success = await deleteMedia(id);
    if (success) {
      toast({
        title: "Mídia removida",
        description: "A mídia foi removida da sua biblioteca.",
      });
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Criativos</h1>
        <p className="text-lg text-gray-600">
          Gerencie suas mídias: faça upload, gere com IA e organize sua biblioteca
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Image className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Mídias</p>
                <p className="text-2xl font-bold text-gray-900">{mediaFiles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <UploadIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Uploads</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mediaFiles.filter(m => m.source === 'upload').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="gallery" className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            Biblioteca
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <UploadIcon className="w-4 h-4" />
            Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gallery" className="mt-6">
          <MediaGallery
            mediaFiles={mediaFiles}
            isLoading={isLoading}
            onDelete={handleDeleteMedia}
          />
        </TabsContent>

        <TabsContent value="upload" className="mt-6">
          <MediaUpload
            onUpload={uploadFile}
            isUploading={isUploading}
            multiple={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
