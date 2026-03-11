
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Image, Upload, Brain, Loader2, Play, MessageCircle, Star } from 'lucide-react';
import { openaiService } from '@/services/openaiService';
import { useToast } from '@/hooks/use-toast';

interface CreativesData {
  campaignName: string;
  adTitle: string;
  adText: string;
  destinationUrl: string;
  media: File | null;
  selectedMediaId: string;
  facebookPage: string;
  instagramAccount: string;
  whatsappNumber: string;
}

interface CreativesStepProps {
  creativesData: CreativesData;
  aiSuggestions?: { adText: string; adTitle?: string } | null;
  onCreativesChange: (field: keyof CreativesData, value: any) => void;
}

interface GeneratedMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  prompt: string;
  createdAt: string;
}

export const CreativesStep: React.FC<CreativesStepProps> = ({
  creativesData,
  aiSuggestions,
  onCreativesChange
}) => {
  const { toast } = useToast();
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [generatedMedia, setGeneratedMedia] = useState<GeneratedMedia[]>([]);
  const [mediaSelectionType, setMediaSelectionType] = useState<'upload' | 'library'>('upload');

  // Carregar mídias do localStorage
  useEffect(() => {
    const savedMedia = localStorage.getItem('camply_generated_media');
    if (savedMedia) {
      try {
        setGeneratedMedia(JSON.parse(savedMedia));
      } catch (error) {
        console.error('Erro ao carregar mídias:', error);
      }
    }
  }, []);

  // Auto-gerar URL do WhatsApp quando o número for preenchido
  useEffect(() => {
    if (creativesData.whatsappNumber && !creativesData.destinationUrl) {
      const cleanNumber = creativesData.whatsappNumber.replace(/\D/g, '');
      if (cleanNumber.length >= 10) {
        const whatsappUrl = `https://wa.me/${cleanNumber}`;
        onCreativesChange('destinationUrl', whatsappUrl);
      }
    }
  }, [creativesData.whatsappNumber, creativesData.destinationUrl, onCreativesChange]);

  const handleGenerateTitle = async () => {
    setIsGeneratingTitle(true);
    try {
      const suggestions = await openaiService.generateCampaignSuggestions('title generation');
      const generatedTitle = `${suggestions.adText.split(' ').slice(0, 6).join(' ')}...`;
      onCreativesChange('adTitle', generatedTitle);
      
      toast({
        title: "Título gerado com sucesso!",
        description: "O título foi criado pela Camply IA para gerar clientes no WhatsApp.",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar título",
        description: "Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  const handleGenerateText = async () => {
    setIsGeneratingText(true);
    try {
      const suggestions = await openaiService.generateCampaignSuggestions('ad text generation');
      onCreativesChange('adText', suggestions.adText);
      
      toast({
        title: "Texto gerado com sucesso!",
        description: "O texto foi criado pela Camply IA para converter clientes no WhatsApp.",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar texto",
        description: "Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingText(false);
    }
  };

  const handleMediaSelect = (mediaId: string) => {
    onCreativesChange('selectedMediaId', mediaId);
    onCreativesChange('media', null);
  };

  const handleFileUpload = (file: File) => {
    onCreativesChange('media', file);
    onCreativesChange('selectedMediaId', '');
  };

  const formatWhatsAppNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4');
  };

  return (
    <div className="space-y-6">
      {/* WhatsApp - Seção Principal */}
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            <span>Configuração do WhatsApp</span>
            <Star className="w-4 h-4 text-yellow-500" />
          </CardTitle>
          <CardDescription>
            Configure seu WhatsApp para receber clientes da campanha
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="whatsappNumber" className="text-base font-medium text-green-900">
              Número do WhatsApp *
            </Label>
            <Input 
              id="whatsappNumber"
              placeholder="Ex: +55 11 99999-9999"
              value={creativesData.whatsappNumber}
              onChange={(e) => {
                const formatted = formatWhatsAppNumber(e.target.value);
                onCreativesChange('whatsappNumber', formatted);
              }}
              className="border-green-300 focus:border-green-500"
            />
            <p className="text-sm text-green-700 mt-1">
              Este será o número que os clientes irão chamar. Inclua o código do país (+55).
            </p>
          </div>

          {creativesData.whatsappNumber && (
            <Alert className="border-green-200 bg-green-50">
              <MessageCircle className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-700">
                <strong>Link do WhatsApp:</strong> {creativesData.destinationUrl || 'Será gerado automaticamente'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Campaign Name and Ad Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Image className="w-5 h-5" />
            <span>Anúncio da Campanha</span>
          </CardTitle>
          <CardDescription>
            Configure o nome e o conteúdo do seu anúncio para WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="campaignName">Nome da Campanha *</Label>
            <Input 
              id="campaignName"
              placeholder="Ex: Campanha WhatsApp - Black Friday 2024"
              value={creativesData.campaignName}
              onChange={(e) => onCreativesChange('campaignName', e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="adTitle">Título do Anúncio</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerateTitle}
                disabled={isGeneratingTitle}
                className="flex items-center gap-2"
              >
                {isGeneratingTitle ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Brain className="w-3 h-3" />
                )}
                Gerar com Camply IA
              </Button>
            </div>
            <Input 
              id="adTitle"
              placeholder="Ex: Ofertas Especiais! Chame no WhatsApp!"
              value={creativesData.adTitle}
              onChange={(e) => onCreativesChange('adTitle', e.target.value)}
            />
            <p className="text-sm text-gray-500 mt-1">
              Caracteres: {creativesData.adTitle.length}/100
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="adText">Texto do Anúncio *</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerateText}
                disabled={isGeneratingText}
                className="flex items-center gap-2"
              >
                {isGeneratingText ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Brain className="w-3 h-3" />
                )}
                Gerar com Camply IA
              </Button>
            </div>
            <Textarea 
              id="adText"
              placeholder="Escreva um texto atrativo que incentive as pessoas a entrarem em contato pelo WhatsApp..."
              value={creativesData.adText}
              onChange={(e) => onCreativesChange('adText', e.target.value)}
              rows={4}
            />
            <p className="text-sm text-gray-500 mt-1">
              Caracteres: {creativesData.adText.length}/300
            </p>
            
            {aiSuggestions && aiSuggestions.adText && creativesData.adText !== aiSuggestions.adText && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  🤖 Sugestão da Camply IA para gerar clientes no WhatsApp:
                </p>
                <p className="text-sm text-blue-800 mb-2">"{aiSuggestions.adText}"</p>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onCreativesChange('adText', aiSuggestions.adText)}
                >
                  Usar esta sugestão
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Media Upload/Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Imagem ou Vídeo *</CardTitle>
          <CardDescription>
            Escolha uma mídia atrativa para sua campanha de WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={mediaSelectionType} onValueChange={(value) => setMediaSelectionType(value as 'upload' | 'library')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Fazer Upload</TabsTrigger>
              <TabsTrigger value="library">Biblioteca de Mídias</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Selecione uma mídia
                </h3>
                <p className="text-gray-600 mb-4">
                  PNG, JPG, MP4 até 10MB
                </p>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="hidden"
                  id="file-upload"
                />
                <Button variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                  Escolher Arquivo
                </Button>
                {creativesData.media && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ Arquivo selecionado: {creativesData.media.name}
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="library" className="mt-4">
              {generatedMedia.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {generatedMedia.map((media) => (
                    <div
                      key={media.id}
                      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        creativesData.selectedMediaId === media.id
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleMediaSelect(media.id)}
                    >
                      <div className="aspect-square">
                        {media.type === 'image' ? (
                          <img
                            src={media.url}
                            alt={media.prompt}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="relative w-full h-full bg-gray-100 flex items-center justify-center">
                            <Play className="w-8 h-8 text-gray-400" />
                            <video
                              src={media.url}
                              className="absolute inset-0 w-full h-full object-cover"
                              muted
                            />
                          </div>
                        )}
                      </div>
                      <div className="absolute top-2 left-2">
                        <Badge variant={media.type === 'image' ? 'default' : 'secondary'}>
                          {media.type === 'image' ? 'Imagem' : 'Vídeo'}
                        </Badge>
                      </div>
                      {creativesData.selectedMediaId === media.id && (
                        <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                          <div className="bg-blue-500 text-white rounded-full p-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Nenhuma mídia encontrada na sua biblioteca
                  </p>
                  <Button variant="outline" onClick={() => window.open('/media', '_blank')}>
                    Criar Mídias com IA
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Social Media Assets - Opcional */}
      <Card>
        <CardHeader>
          <CardTitle>Páginas das Redes Sociais (Opcional)</CardTitle>
          <CardDescription>
            Conecte suas páginas do Facebook e Instagram para a campanha
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="facebookPage">Página do Facebook</Label>
            <Select 
              value={creativesData.facebookPage} 
              onValueChange={(value) => onCreativesChange('facebookPage', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione sua página do Facebook" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minha-empresa">Minha Empresa</SelectItem>
                <SelectItem value="loja-online">Loja Online</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="instagramAccount">Conta do Instagram</Label>
            <Select 
              value={creativesData.instagramAccount} 
              onValueChange={(value) => onCreativesChange('instagramAccount', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione sua conta do Instagram" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="@minhaempresa">@minhaempresa</SelectItem>
                <SelectItem value="@lojaonline">@lojaonline</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
