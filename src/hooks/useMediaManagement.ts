
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMediaLibrary, MediaFile } from '@/hooks/useMediaLibrary';

interface GeneratedMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  prompt: string;
  createdAt: string;
}

export const useMediaManagement = (onMediaChange: (field: string, value: any) => void) => {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [selectedCreatedMedia, setSelectedCreatedMedia] = useState<GeneratedMedia | null>(null);
  const [selectedLibraryMedia, setSelectedLibraryMedia] = useState<MediaFile | null>(null);

  // Usar o hook da biblioteca de mídias
  const { mediaFiles, uploadFile } = useMediaLibrary();

  // Converter MediaFiles para o formato GeneratedMedia para compatibilidade
  const generatedMedia: GeneratedMedia[] = mediaFiles.map(media => ({
    id: media.id,
    type: media.file_type.startsWith('image/') ? 'image' : 'video',
    url: media.public_url,
    prompt: media.metadata?.prompt || media.filename,
    createdAt: media.created_at
  }));

  const handleFileSelect = async (file: File) => {
    console.log('📁 File selected:', file.name);
    setSelectedFile(file);
    setSelectedCreatedMedia(null);
    setSelectedLibraryMedia(null);
    
    // Fazer upload direto e notificar mudança
    const uploadedMedia = await uploadFile(file);
    if (uploadedMedia) {
      onMediaChange('media', file);
      onMediaChange('mediaFileId', uploadedMedia.id);
      console.log('✅ File uploaded and media updated:', { fileId: uploadedMedia.id });
    } else {
      onMediaChange('media', file);
      console.log('✅ File set as media (no upload)');
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setFilePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCreatedMediaSelect = async (media: GeneratedMedia) => {
    console.log('🎨 Created media selected:', media.id);
    try {
      // Encontrar o arquivo na biblioteca
      const libraryMedia = mediaFiles.find(m => m.id === media.id);
      
      if (libraryMedia) {
        // Usar mídia da biblioteca
        setSelectedLibraryMedia(libraryMedia);
        setSelectedFile(null);
        setSelectedCreatedMedia(null);
        setFilePreview(libraryMedia.public_url);
        onMediaChange('mediaFileId', libraryMedia.id);
        onMediaChange('media', null);
        console.log('✅ Library media selected from created media:', { fileId: libraryMedia.id });
      } else {
        // Fallback para o comportamento antigo (localStorage)
        const response = await fetch(media.url);
        const blob = await response.blob();
        const file = new File([blob], `generated-media-${media.id}`, { type: blob.type });
        
        setSelectedCreatedMedia(media);
        setSelectedFile(file);
        setSelectedLibraryMedia(null);
        setFilePreview(media.url);
        onMediaChange('media', file);
        console.log('✅ Created media converted to file:', { mediaId: media.id });
      }
      
      toast({
        title: "Mídia selecionada",
        description: "A mídia foi selecionada para a campanha.",
      });
    } catch (error) {
      console.error('Erro ao selecionar mídia criada:', error);
      toast({
        title: "Erro ao selecionar mídia",
        description: "Não foi possível selecionar a mídia. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleLibraryMediaSelect = (media: MediaFile) => {
    console.log('📚 Library media selected:', { id: media.id, filename: media.filename });
    setSelectedLibraryMedia(media);
    setSelectedFile(null);
    setSelectedCreatedMedia(null);
    setFilePreview(media.public_url);
    onMediaChange('mediaFileId', media.id);
    onMediaChange('media', null); // Clear the file since we're using library media
    
    console.log('✅ Library media state updated:', { 
      selectedLibraryMedia: media.id,
      mediaFileId: media.id
    });
    
    toast({
      title: "Mídia selecionada",
      description: "A mídia da biblioteca foi selecionada para a campanha.",
    });
  };

  const handleClearSelection = () => {
    console.log('🗑️ Clearing media selection');
    setSelectedCreatedMedia(null);
    setSelectedLibraryMedia(null);
    setSelectedFile(null);
    setFilePreview(null);
    onMediaChange('media', null);
    onMediaChange('mediaFileId', null);
  };

  // Log do estado atual para debug
  useEffect(() => {
    console.log('📊 Media management state:', {
      selectedFile: !!selectedFile,
      selectedCreatedMedia: !!selectedCreatedMedia,
      selectedLibraryMedia: !!selectedLibraryMedia,
      filePreview: !!filePreview,
      mediaFilesCount: mediaFiles.length
    });
  }, [selectedFile, selectedCreatedMedia, selectedLibraryMedia, filePreview, mediaFiles.length]);

  return {
    selectedFile,
    filePreview,
    generatedMedia, // Compatibilidade com código existente
    selectedCreatedMedia,
    selectedLibraryMedia,
    mediaFiles, // Acesso direto à biblioteca
    handleFileSelect,
    handleCreatedMediaSelect,
    handleLibraryMediaSelect,
    handleClearSelection
  };
};
