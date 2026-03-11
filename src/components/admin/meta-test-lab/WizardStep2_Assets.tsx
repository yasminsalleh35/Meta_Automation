import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { MessageCircle, Upload, Image as ImageIcon, User, Loader2 } from 'lucide-react';
import { TestWizardFormData } from '@/types/testWizard.types';
import { useMetaAssetsContext } from '@/contexts/MetaAssetsContext';
import { useMediaLibrary } from '@/hooks/useMediaLibrary';
import { useToast } from '@/hooks/use-toast';
import { WhatsAppInput } from '@/components/SimpleCampaignWizard/WhatsAppInput';

interface WizardStep2AssetsProps {
  formData: TestWizardFormData;
  updateFormData: (field: keyof TestWizardFormData, value: any) => void;
  mode: 'ctwa' | 'wa_link';
}

export const WizardStep2_Assets: React.FC<WizardStep2AssetsProps> = ({ 
  formData, 
  updateFormData, 
  mode 
}) => {
  const { facebookPages, instagramAccounts, assetsLoading } = useMetaAssetsContext();
  const { uploadFile, isUploading } = useMediaLibrary();
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem (JPG, PNG, etc.)",
        variant: "destructive"
      });
      return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo é 5MB",
        variant: "destructive"
      });
      return;
    }

    try {
      // Usar hook validado de upload
      const uploadedMedia = await uploadFile(file, ['test-wizard']);
      
      if (uploadedMedia) {
        updateFormData('selectedMediaFile', file);
        updateFormData('selectedMediaMeta', {
          file_type: uploadedMedia.file_type,
          public_url: uploadedMedia.public_url || '',
          filename: uploadedMedia.filename
        });
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar a mídia",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Passo 2: Ativos Meta & WhatsApp</CardTitle>
        <CardDescription>Selecione Fanpage, Instagram e WhatsApp</CardDescription>
        {mode === 'wa_link' && (
          <Alert className="mt-2">
            <MessageCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Modo WA.ME Link:</strong> Você precisa fornecer um número de WhatsApp válido.
              Não é necessário que esteja conectado à Página.
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Fanpage */}
        <div className="space-y-2">
          <Label htmlFor="fanpage">Fanpage</Label>
          <Select 
            value={formData.fanpage} 
            onValueChange={(v) => updateFormData('fanpage', v)}
            disabled={assetsLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder={assetsLoading ? "Carregando..." : "Selecione sua fanpage"} />
            </SelectTrigger>
            <SelectContent>
              {facebookPages.map(page => (
                <SelectItem key={page.id} value={page.id}>
                  <div className="flex items-center gap-2">
                    {page.pictureUrl ? (
                      <img 
                        src={page.pictureUrl} 
                        alt={page.name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-muted-foreground" />
                    )}
                    {page.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Instagram */}
        <div className="space-y-2">
          <Label htmlFor="instagram">Instagram</Label>
          <Select 
            value={formData.instagram} 
            onValueChange={(v) => updateFormData('instagram', v)}
            disabled={assetsLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder={assetsLoading ? "Carregando..." : "Selecione seu Instagram"} />
            </SelectTrigger>
            <SelectContent>
              {instagramAccounts.map(account => (
                <SelectItem key={account.id} value={account.id}>
                  <div className="flex items-center gap-2">
                    {account.profilePictureUrl ? (
                      <img 
                        src={account.profilePictureUrl} 
                        alt={account.name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-muted-foreground" />
                    )}
                    {account.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* WhatsApp - OBRIGATÓRIO para WA.ME Link */}
        {mode === 'wa_link' && (
          <WhatsAppInput
            value={formData.whatsappNumber}
            onChange={(val) => updateFormData('whatsappNumber', val)}
            placeholder="11 91234-5678"
            countryCode="+55"
          />
        )}

        {/* Mídia: Upload */}
        <div className="space-y-2">
          <Label>Mídia da Campanha</Label>
          <Tabs value={formData.creativeType} onValueChange={(v) => updateFormData('creativeType', v as 'upload' | 'post')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">
                <Upload className="w-4 h-4 mr-2" />
                Upload de Imagem
              </TabsTrigger>
              <TabsTrigger value="post" disabled>
                <ImageIcon className="w-4 h-4 mr-2" />
                Post do IG (Em breve)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-3">
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="media-upload"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isUploading}
                />
                <label htmlFor="media-upload" className="cursor-pointer">
                  {isUploading ? (
                    <Loader2 className="w-12 h-12 mx-auto text-blue-500 animate-spin" />
                  ) : formData.selectedMediaMeta ? (
                    <div className="space-y-2">
                      <img 
                        src={formData.selectedMediaMeta.public_url} 
                        alt="Preview"
                        className="max-h-40 mx-auto rounded"
                      />
                      <p className="text-sm text-green-600">✓ Imagem carregada</p>
                      <Button variant="outline" size="sm" type="button">
                        Trocar imagem
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Clique para selecionar uma imagem
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        JPG, PNG (máx 5MB)
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </TabsContent>

            <TabsContent value="post">
              <Alert>
                <AlertDescription>
                  Seleção de posts do Instagram será implementada em breve
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};
