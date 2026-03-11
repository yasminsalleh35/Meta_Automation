import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/hooks/useSupabase';
import { MediaGallery } from '@/components/media/MediaGallery';
import { MediaUpload } from '@/components/media/MediaUpload';
import { useMediaLibrary, MediaFile } from '@/hooks/useMediaLibrary';
import { InstagramPostSelector } from '@/components/SimpleCampaignWizard/InstagramPostSelector';
import { Wand2, Image, Upload, CheckCircle, AlertCircle, Loader2, Instagram } from 'lucide-react';
import CodePreview from './CodePreview';
import LogConsole from './LogConsole';

interface LogEntry {
  type: 'info' | 'success' | 'error';
  message: string;
  timestamp: Date;
}

interface CreativeTestPanelProps {
  adAccountId: string;
  pageId: string;
  accessToken: string;
  instagramUserId?: string; // Fase 3: receber do MetaTestLab
  onCreativeCreated: (creativeId: string) => void;
}

export const CreativeTestPanel: React.FC<CreativeTestPanelProps> = ({
  adAccountId,
  pageId,
  accessToken,
  instagramUserId,
  onCreativeCreated
}) => {
  const { toast } = useToast();
  const supabase = useSupabase();
  const { mediaFiles, isLoading: isLoadingMedia, isUploading, uploadFile } = useMediaLibrary();
  
  const [isCreating, setIsCreating] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [config, setConfig] = useState({
    adTitle: 'Teste WhatsApp Ad',
    adText: 'Clique para conversar no WhatsApp!'
  });
  
  // Fase 1: Estados para Instagram Post
  const [creativeType, setCreativeType] = useState<'upload' | 'post'>('upload');
  const [selectedInstagramPost, setSelectedInstagramPost] = useState<{
    id: string;
    caption: string;
    media_url: string;
    instagram_user_id?: string;
  } | null>(null);

  const addLog = (type: 'info' | 'success' | 'error', message: string) => {
    setLogs(prev => [...prev, {
      type,
      message,
      timestamp: new Date()
    }]);
  };

  const handleMediaSelect = (media: MediaFile) => {
    setSelectedMedia(media);
    addLog('info', `Mídia selecionada: ${media.filename}`);
    toast({
      title: 'Mídia selecionada',
      description: media.filename
    });
  };

  const handleUploadAndSelect = async (file: File) => {
    const uploadedMedia = await uploadFile(file);
    if (uploadedMedia) {
      setSelectedMedia(uploadedMedia);
      addLog('success', `Upload realizado: ${uploadedMedia.filename}`);
      toast({
        title: 'Upload realizado!',
        description: 'Arquivo carregado e selecionado.'
      });
    }
  };

  // Fase 2: Handler para seleção de post do Instagram
  const handleInstagramPostSelect = (post: { id: string; caption: string; media_url: string; instagram_user_id?: string; media_type?: string }) => {
    console.log('📸 Post selecionado:', post);
    setSelectedInstagramPost(post);
    
    // Auto-preencher o texto do anúncio com a legenda do post
    if (post.caption) {
      setConfig(prev => ({
        ...prev,
        adText: post.caption.slice(0, 200) // Limitar a 200 caracteres
      }));
    }
    
    addLog('success', `Post ${post.media_type || 'IMAGE'} selecionado: ${post.id}`);
  };

  // Fase 1: Handler para mudança de tipo
  const handleCreativeTypeChange = (value: 'upload' | 'post') => {
    setCreativeType(value);
    if (value === 'upload') {
      setSelectedInstagramPost(null);
    } else {
      setSelectedMedia(null);
    }
  };

  const handleCreate = async () => {
    // Fase 4: Validação diferente para cada tipo
    if (creativeType === 'upload') {
      if (!selectedMedia) {
        toast({
          title: 'Erro',
          description: 'Selecione uma imagem antes de criar o creative',
          variant: 'destructive'
        });
        return;
      }

      // Validar tipo de arquivo (apenas imagens suportadas)
      const supportedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!supportedImageTypes.includes(selectedMedia.file_type)) {
        toast({
          title: 'Formato não suportado',
          description: 'Apenas imagens (JPG, PNG, GIF, WEBP) são suportadas. Vídeos requerem implementação separada.',
          variant: 'destructive'
        });
        addLog('error', `❌ Formato não suportado: ${selectedMedia.file_type}`);
        return;
      }
    } else {
      // creativeType === 'post'
      if (!selectedInstagramPost) {
        toast({
          title: 'Erro',
          description: 'Selecione um post do Instagram antes de criar o creative',
          variant: 'destructive'
        });
        return;
      }

      if (!selectedInstagramPost.instagram_user_id) {
        toast({
          title: 'Erro',
          description: 'Instagram User ID não disponível para o post selecionado',
          variant: 'destructive'
        });
        return;
      }
    }

    if (!config.adTitle || !config.adText) {
      toast({
        title: 'Erro',
        description: 'Preencha título e texto do anúncio',
        variant: 'destructive'
      });
      return;
    }

    setIsCreating(true);
    setLogs([]);
    addLog('info', '🚀 Iniciando criação de creative...');
    
    if (creativeType === 'upload') {
      addLog('info', `📸 Imagem: ${selectedMedia!.filename}`);
    } else {
      addLog('info', `📸 Post do Instagram: ${selectedInstagramPost!.id}`);
    }
    
    addLog('info', `📄 Título: ${config.adTitle}`);
    addLog('info', `💬 Texto: ${config.adText}`);
    
    console.log('🔍 [CreativeTestPanel] Dados antes de chamar edge function:', {
      creativeType,
      adAccountId,
      pageId,
      instagramUserId,
      selectedMedia: creativeType === 'upload' ? selectedMedia?.filename : null,
      selectedPost: creativeType === 'post' ? selectedInstagramPost?.id : null,
      hasAccessToken: !!accessToken
    });

    try {
      // Fase 4: Payload diferente para cada tipo
      const payload = creativeType === 'upload' ? {
        creativeType: 'upload',
        adAccountId,
        pageId,
        imageUrl: selectedMedia!.public_url,
        adTitle: config.adTitle,
        adText: config.adText,
        callToAction: {
          type: 'WHATSAPP_MESSAGE'
        },
        accessToken
      } : {
        creativeType: 'post',
        adAccountId,
        pageId,
        instagramUserId: selectedInstagramPost!.instagram_user_id,
        instagramMediaId: selectedInstagramPost!.id,
        adTitle: config.adTitle,
        adText: config.adText,
        accessToken
      };

      addLog('info', '📤 Enviando para test-meta-creative-create...');

      const { data, error } = await supabase.functions.invoke('test-meta-creative-create', {
        body: payload
      });

      if (error) {
        addLog('error', `❌ Erro: ${error.message}`);
        toast({
          title: 'Erro ao criar creative',
          description: error.message,
          variant: 'destructive'
        });
        return;
      }

      if (!data.success) {
        addLog('error', `❌ Meta API Error: ${data.error}`);
        addLog('error', JSON.stringify(data.rawResponse, null, 2));
        toast({
          title: 'Erro da Meta API',
          description: data.error,
          variant: 'destructive'
        });
        return;
      }

      addLog('success', `✅ Creative criado: ${data.creativeId}`);
      if (data.imageHash) {
        addLog('info', `🔑 Image Hash: ${data.imageHash}`);
      }
      if (data.objectStoryId) {
        addLog('info', `🔗 Object Story ID: ${data.objectStoryId}`);
      }
      setCreatedId(data.creativeId);
      onCreativeCreated(data.creativeId);

      toast({
        title: 'Creative criado com sucesso!',
        description: `ID: ${data.creativeId}`
      });

    } catch (error: any) {
      console.error('Erro ao criar creative:', error);
      addLog('error', `❌ Erro inesperado: ${error.message}`);
      toast({
        title: 'Erro inesperado',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column: Configuration */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5" />
              Configuração do Creative
            </CardTitle>
            <CardDescription>
              Configure o texto do anúncio WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Fase 1: Tipo de Creative */}
            <div>
              <Label>Tipo de Creative</Label>
              <RadioGroup value={creativeType} onValueChange={handleCreativeTypeChange} className="flex gap-4 mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="upload" id="upload" />
                  <Label htmlFor="upload" className="cursor-pointer font-normal">
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Upload de Imagem
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="post" id="post" />
                  <Label htmlFor="post" className="cursor-pointer font-normal">
                    <div className="flex items-center gap-2">
                      <Instagram className="w-4 h-4" />
                      Post Existente do Instagram
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Título do Anúncio */}
            <div>
              <Label htmlFor="adTitle">Título do Anúncio *</Label>
              <Input
                id="adTitle"
                value={config.adTitle}
                onChange={(e) => setConfig(prev => ({ ...prev, adTitle: e.target.value }))}
                placeholder="Ex: Fale conosco no WhatsApp"
              />
            </div>

            {/* Texto do Anúncio */}
            <div>
              <Label htmlFor="adText">Texto do Anúncio *</Label>
              <Textarea
                id="adText"
                value={config.adText}
                onChange={(e) => setConfig(prev => ({ ...prev, adText: e.target.value }))}
                placeholder="Ex: Tire suas dúvidas diretamente pelo WhatsApp!"
                rows={3}
              />
            </div>

            {/* Status da Mídia Selecionada */}
            {creativeType === 'upload' && selectedMedia && (
              <Alert>
                <CheckCircle className="w-4 h-4" />
                <AlertDescription>
                  <strong>Mídia selecionada:</strong> {selectedMedia.filename}
                  <br />
                  <span className="text-xs text-muted-foreground">
                    {selectedMedia.file_type} • {(selectedMedia.file_size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </AlertDescription>
              </Alert>
            )}

            {/* Status do Post do Instagram */}
            {creativeType === 'post' && selectedInstagramPost && (
              <Alert>
                <CheckCircle className="w-4 h-4" />
                <AlertDescription>
                  <strong>Post selecionado:</strong> {selectedInstagramPost.id}
                  <br />
                  <span className="text-xs text-muted-foreground">
                    {selectedInstagramPost.caption?.substring(0, 50)}...
                  </span>
                </AlertDescription>
              </Alert>
            )}

            {/* Botão de Criar */}
            <Button 
              onClick={handleCreate} 
              disabled={isCreating || (creativeType === 'upload' ? !selectedMedia : !selectedInstagramPost)}
              className="w-full"
              size="lg"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando Creative...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Criar Creative
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Fase 1 & 2: Seleção de Mídia ou Post do Instagram */}
        {creativeType === 'upload' ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                Seleção de Mídia
              </CardTitle>
              <CardDescription>
                Escolha uma imagem da galeria ou faça upload
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="gallery" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="gallery">
                    Galeria ({mediaFiles.length})
                  </TabsTrigger>
                  <TabsTrigger value="upload">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="gallery" className="max-h-[60vh] overflow-y-auto mt-4">
                  <MediaGallery
                    mediaFiles={mediaFiles}
                    isLoading={isLoadingMedia}
                    onDelete={() => {}} // Não permitir deletar durante teste
                    onSelect={handleMediaSelect}
                    selectable={true}
                    selectedIds={selectedMedia ? [selectedMedia.id] : []}
                  />
                </TabsContent>
                
                <TabsContent value="upload" className="mt-4">
                  <MediaUpload
                    onUpload={handleUploadAndSelect}
                    isUploading={isUploading}
                    accept="image/*"
                    maxSize={50}
                    multiple={false}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : instagramUserId ? (
          <InstagramPostSelector
            instagramUserId={instagramUserId}
            pageId={pageId}
            selectedPost={selectedInstagramPost}
            onPostSelect={handleInstagramPostSelect}
          />
        ) : (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Instagram não configurado. Configure uma conta do Instagram na integração Meta Ads.
            </AlertDescription>
          </Alert>
        )}

        {/* Creative Criado */}
        {/* FASE 5: Debug UI */}
        {(instagramUserId || selectedInstagramPost) && (
          <Card className="border-yellow-500">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                🔍 Debug Info
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2 font-mono">
              <div>
                <strong>Instagram User ID:</strong>{' '}
                <span className="text-muted-foreground">{instagramUserId || 'N/A'}</span>
              </div>
              <div>
                <strong>Selected Post ID:</strong>{' '}
                <span className="text-muted-foreground">{selectedInstagramPost?.id || 'N/A'}</span>
              </div>
              <div>
                <strong>Object Story ID:</strong>{' '}
                <span className="text-muted-foreground">
                  {instagramUserId && selectedInstagramPost 
                    ? `${instagramUserId}_${selectedInstagramPost.id}` 
                    : 'N/A'}
                </span>
              </div>
              <div>
                <strong>Page ID:</strong>{' '}
                <span className="text-muted-foreground">{pageId || 'N/A'}</span>
              </div>
              <div>
                <strong>Creative Type:</strong>{' '}
                <span className="text-muted-foreground">{creativeType}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {createdId && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Creative Criado com Sucesso!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Creative ID:</span>
                  <Badge variant="outline" className="font-mono">
                    {createdId}
                  </Badge>
                </div>
                <Alert>
                  <AlertDescription className="text-sm">
                    Use este Creative ID no painel "Ad" para criar o anúncio final.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Column: Preview & Logs */}
      <div className="space-y-4">
        <CodePreview
          title="Payload do Creative"
          code={creativeType === 'upload' ? (
            selectedMedia ? {
              creativeType: 'upload',
              adAccountId,
              pageId,
              imageUrl: selectedMedia.public_url,
              adTitle: config.adTitle,
              adText: config.adText,
              note: 'WhatsApp link será configurado via page_id'
            } : {
              message: 'Selecione uma mídia para ver o payload'
            }
          ) : (
            selectedInstagramPost ? {
              creativeType: 'post',
              adAccountId,
              pageId,
              instagramUserId: selectedInstagramPost.instagram_user_id,
              instagramMediaId: selectedInstagramPost.id,
              objectStoryId: `${selectedInstagramPost.instagram_user_id}_${selectedInstagramPost.id}`,
              adTitle: config.adTitle,
              adText: config.adText,
              note: 'Creative será criado usando object_story_id do post existente'
            } : {
              message: 'Selecione um post do Instagram para ver o payload'
            }
          )}
        />
        
        <LogConsole logs={logs} />
      </div>
    </div>
  );
};
