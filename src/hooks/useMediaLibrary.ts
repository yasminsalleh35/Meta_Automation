
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/contexts/AuthContext';

export interface MediaFile {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  file_path: string;
  public_url?: string;
  storage_path?: string;
  thumbnail_url?: string;
  source: string;
  metadata: Record<string, any>;
  tags: string[];
  created_at: string;
  user_id: string;
}

export const useMediaLibrary = () => {
  const { toast } = useToast();
  const supabase = useSupabase();
  const { user } = useAuth();
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Carregar mídias do usuário
  const loadUserMedia = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Cast dos dados do Supabase para nosso tipo customizado
      const typedMediaFiles: MediaFile[] = (data || []).map(item => ({
        ...item,
        metadata: (item.metadata as Record<string, any>) || {}
      }));
      
      setMediaFiles(typedMediaFiles);
    } catch (error) {
      console.error('Erro ao carregar mídias:', error);
      toast({
        title: 'Erro ao carregar mídias',
        description: 'Não foi possível carregar suas mídias.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Upload de arquivo com TUS resumable
  const uploadFile = async (file: File, tags: string[] = []): Promise<MediaFile | null> => {
    if (!user?.id) {
      toast({
        title: 'Erro de autenticação',
        description: 'Você precisa estar logado para fazer upload.',
        variant: 'destructive'
      });
      return null;
    }

    // Validar tamanho antes do upload
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const maxSize = isImage ? 50 * 1024 * 1024 : 1024 * 1024 * 1024; // 50MB para imagens, 1GB para vídeos
    
    if (file.size > maxSize) {
      const maxSizeText = isImage ? '50MB' : '1GB';
      toast({
        title: 'Arquivo muito grande',
        description: `O arquivo excede o limite de ${maxSizeText} para ${isImage ? 'imagens' : 'vídeos'}.`,
        variant: 'destructive'
      });
      return null;
    }

    setIsUploading(true);

    // Comprimir imagens grandes antes do upload
    let fileToUpload = file;
    if (isImage && file.size > 2 * 1024 * 1024) {
      try {
        const { compressImage } = await import('@/lib/upload/imageCompression');
        toast({
          title: 'Otimizando imagem...',
          description: 'Comprimindo para upload mais rápido.',
        });
        fileToUpload = await compressImage(file);
      } catch (error) {
        console.error('Erro ao comprimir imagem:', error);
      }
    }

    return new Promise((resolve, reject) => {
      const fileExtension = fileToUpload.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
      const storagePath = `${user.id}/${fileName}`;
      const uploadStartTime = Date.now();

      import('@/lib/upload/resumableUpload').then(({ resumableUpload }) => {
        resumableUpload({
          file: fileToUpload,
          bucket: 'user-media',
          path: storagePath,
          onProgress: (bytesUploaded, bytesTotal) => {
            const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
            window.dispatchEvent(new CustomEvent('upload-progress', {
              detail: { filename: file.name, percentage, bytesUploaded, bytesTotal }
            }));
          },
          onSuccess: async (publicUrl) => {
            try {
              const uploadDuration = (Date.now() - uploadStartTime) / 1000;
              
              console.log('✅ Upload concluído:', {
                file: file.name,
                size: (fileToUpload.size / (1024*1024)).toFixed(2) + 'MB',
                duration: uploadDuration.toFixed(2) + 's',
                publicUrl
              });

              // Refresh token se upload demorou mais de 2 minutos (antes de tentar salvar)
              if (uploadDuration > 2 * 60) {
                console.log('🔄 Refreshing session (upload demorou >2min)...');
                const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
                
                if (refreshError) {
                  console.error('❌ Falha ao renovar sessão:', refreshError);
                  toast({
                    title: 'Sessão expirada',
                    description: 'Por favor, faça login novamente e tente o upload.',
                    variant: 'destructive'
                  });
                  setIsUploading(false);
                  window.dispatchEvent(new CustomEvent('upload-complete', {
                    detail: { filename: file.name, success: false, error: refreshError }
                  }));
                  reject(new Error('Sessão expirada durante o upload'));
                  return;
                }
                
                console.log('✅ Sessão renovada com sucesso');
              }

              toast({
                title: 'Upload completo!',
                description: 'Salvando na biblioteca...',
              });

              // Inserir com retry robusto (3 tentativas)
              const insertWithRetry = async (attempts = 3) => {
                for (let i = 0; i < attempts; i++) {
                  try {
                    console.log(`💾 Tentativa ${i + 1}/${attempts} de salvar no banco...`);
                    
                    // Verificar se usuário ainda está autenticado
                    const { data: { user: currentUser } } = await supabase.auth.getUser();
                    if (!currentUser) {
                      console.error('❌ Usuário não autenticado');
                      throw new Error('Usuário não autenticado');
                    }
                    
                    const mediaData = {
                      user_id: currentUser.id, // Usar ID do usuário atual verificado
                      filename: file.name,
                      file_type: fileToUpload.type,
                      file_size: fileToUpload.size,
                      file_path: storagePath,
                      storage_path: storagePath,
                      public_url: publicUrl,
                      source: 'upload',
                      metadata: {
                        originalName: file.name,
                        originalSize: file.size,
                        uploadedAt: new Date().toISOString(),
                        uploadMethod: 'resumable',
                        uploadDuration,
                        compressed: fileToUpload.size !== file.size
                      },
                      tags
                    };
                    
                    const { data, error } = await supabase
                      .from('media_files')
                      .insert(mediaData)
                      .select()
                      .single();
                    
                    if (!error) {
                      console.log('✅ Salvo no banco com sucesso!');
                      return data;
                    }
                    
                    // Log detalhado do erro
                    console.error(`⚠️ Tentativa ${i + 1} falhou:`, {
                      code: error.code,
                      message: error.message,
                      details: error.details,
                      hint: error.hint
                    });
                    
                    // Se for erro de RLS/permissão, tentar refresh
                    if (error.code === '42501' || error.message?.includes('RLS') || error.message?.includes('policy')) {
                      console.log('🔄 Erro de RLS detectado, tentando renovar sessão...');
                      const { error: refreshErr } = await supabase.auth.refreshSession();
                      if (refreshErr) {
                        console.error('❌ Falha ao renovar sessão:', refreshErr);
                      }
                    }
                    
                    if (i === attempts - 1) throw error;
                    
                    await new Promise(r => setTimeout(r, 2000));
                  } catch (err) {
                    if (i === attempts - 1) throw err;
                  }
                }
              };

              const insertedData = await insertWithRetry();

              const newMediaFile: MediaFile = {
                ...insertedData,
                metadata: (insertedData.metadata as Record<string, any>) || {}
              };
              
              setMediaFiles(prev => [newMediaFile, ...prev]);
              toast({
                title: 'Upload realizado com sucesso!',
                description: `${file.name} foi adicionado à sua biblioteca.`,
              });
              setIsUploading(false);
              
              // Notificar UI de sucesso
              window.dispatchEvent(new CustomEvent('upload-complete', {
                detail: { filename: file.name, success: true, mediaFile: newMediaFile }
              }));
              
              resolve(newMediaFile);
            } catch (error) {
              console.error('Erro ao salvar no banco:', error);
              toast({
                title: 'Erro ao salvar',
                description: 'Upload concluído, mas falha ao registrar no banco. Tente fazer login novamente.',
                variant: 'destructive'
              });
              setIsUploading(false);
              
              // Notificar UI de falha
              window.dispatchEvent(new CustomEvent('upload-complete', {
                detail: { filename: file.name, success: false, error }
              }));
              
              reject(error);
            }
          },
          onError: (error) => {
            console.error('Erro no upload:', error);
            toast({
              title: 'Erro no upload',
              description: error.message || 'Não foi possível fazer upload do arquivo.',
              variant: 'destructive'
            });
            setIsUploading(false);
            reject(error);
          }
        });
      });
    });
  };

  // Salvar mídia gerada por IA
  const saveGeneratedMedia = async (url: string, prompt: string, metadata: Record<string, any> = {}): Promise<MediaFile | null> => {
    if (!user?.id) return null;

    try {
      // Baixar a imagem da URL
      const response = await fetch(url);
      const blob = await response.blob();
      
      // Criar arquivo a partir do blob
      const fileName = `ai-generated-${Date.now()}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      // Fazer upload normal
      const uploadedFile = await uploadFile(file, ['ai-generated']);
      
      if (uploadedFile) {
        // Atualizar metadata com informações da IA
        const { error } = await supabase
          .from('media_files')
          .update({
            source: 'ai_generated',
            metadata: {
              ...uploadedFile.metadata,
              prompt,
              generatedAt: new Date().toISOString(),
              ...metadata
            }
          })
          .eq('id', uploadedFile.id);

        if (error) throw error;

        // Atualizar estado local
        setMediaFiles(prev => prev.map(file => 
          file.id === uploadedFile.id 
            ? { ...file, source: 'ai_generated', metadata: { ...uploadedFile.metadata, prompt, ...metadata } }
            : file
        ));
      }

      return uploadedFile;
    } catch (error) {
      console.error('Erro ao salvar mídia gerada por IA:', error);
      return null;
    }
  };

  // Deletar mídia
  const deleteMedia = async (mediaId: string): Promise<boolean> => {
    try {
      const mediaFile = mediaFiles.find(f => f.id === mediaId);
      if (!mediaFile) return false;

      // Deletar do storage
      const { error: storageError } = await supabase.storage
        .from('user-media')
        .remove([mediaFile.storage_path || mediaFile.file_path]);

      if (storageError) throw storageError;

      // Deletar registro da tabela
      const { error: dbError } = await supabase
        .from('media_files')
        .delete()
        .eq('id', mediaId);

      if (dbError) throw dbError;

      // Atualizar estado local
      setMediaFiles(prev => prev.filter(f => f.id !== mediaId));

      toast({
        title: 'Mídia deletada',
        description: 'O arquivo foi removido da sua biblioteca.',
      });

      return true;
    } catch (error) {
      console.error('Erro ao deletar mídia:', error);
      toast({
        title: 'Erro ao deletar',
        description: 'Não foi possível deletar o arquivo.',
        variant: 'destructive'
      });
      return false;
    }
  };

  // Carregar mídias ao montar o componente
  useEffect(() => {
    loadUserMedia();
  }, [user?.id]);

  return {
    mediaFiles,
    isLoading,
    isUploading,
    uploadFile,
    saveGeneratedMedia,
    deleteMedia,
    loadUserMedia
  };
};
