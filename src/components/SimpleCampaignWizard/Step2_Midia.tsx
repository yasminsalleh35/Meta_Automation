
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, AlertCircle, RefreshCw, User, Upload, AlertTriangle, MessageCircle } from 'lucide-react';
import { SimpleCampaignFormData } from '@/types/simpleCampaign.types';
import { useMetaAssetsContext } from '@/contexts/MetaAssetsContext';
import { useNormalizedMetaSelection } from '@/hooks/useNormalizedMetaSelection';
import { WhatsAppInput } from './WhatsAppInput';
import { MediaSelector } from './MediaSelector';
import { InstagramPostSelector } from './InstagramPostSelector';
import { MetaAssetsLoading } from '@/components/ui/meta-assets-loading';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@supabase/auth-helpers-react';
import { useMetaAdsIntegration } from '@/hooks/useMetaAdsIntegration';
import { useToast } from '@/hooks/use-toast';

interface Step2MidiaProps {
  formData: SimpleCampaignFormData;
  updateFormData: (field: keyof SimpleCampaignFormData, value: any) => void;
}

export const Step2Midia: React.FC<Step2MidiaProps> = ({ formData, updateFormData }) => {
  const session = useSession();
  const { toast } = useToast();
  // ✅ FASE 2: Usar contexto compartilhado ao invés de hook direto
  const { 
    facebookPages, 
    instagramAccounts, 
    assetsLoading: isLoading, 
    assetsError: error,
    fetchAllAssets
  } = useMetaAssetsContext();

  const { selection: normalizedSelection } = useNormalizedMetaSelection();
  const { existingIntegration } = useMetaAdsIntegration();

  // ✅ FASE 3: Não precisa mais carregar assets aqui (contexto já carrega no mount)
  // Assets já vêm do cache do DB (instantâneo)

  // ✅ Auto-fill WhatsApp e IG quando page muda
  const [resolvingIg, setResolvingIg] = useState(false);
  
  const handleFanpageChange = (pageId: string) => {
    updateFormData('fanpage', pageId);
    
    // Auto-fill WhatsApp se a página tiver número conectado
    const selectedPage = facebookPages.find(p => p.id === pageId);
    if (selectedPage?.whatsappNumber) {
      updateFormData('whatsappNumber', selectedPage.whatsappNumber);
      toast({
        title: "WhatsApp detectado",
        description: `Número ${selectedPage.whatsappNumber} será usado para conversas`,
      });
    }
  };
  
  useEffect(() => {
    if (!formData.fanpage || !session?.access_token) return;
    
    setResolvingIg(true);
    
    // Call meta-selection edge function to resolve page-linked IG
    const resolvePageIg = async () => {
      try {
        const response = await fetch(`https://ibwhqkgvrkkqxiksbiqr.supabase.co/functions/v1/meta-selection`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            "Authorization": `Bearer ${session.access_token}` 
          },
          body: JSON.stringify({ 
            action: "resolve_page_ig", 
            page_id: formData.fanpage 
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data?.instagram_id && data.instagram_id !== formData.instagram) {
            updateFormData("instagram", data.instagram_id);
            console.log('[STEP2] Auto-filled IG from page:', data.instagram_id);
          }
        }
      } catch (error) {
        console.warn('[STEP2] Error resolving page IG:', error);
      } finally {
        setResolvingIg(false);
      }
    };

    resolvePageIg();
  }, [formData.fanpage, session?.access_token]);

  // ✅ NOVO: Pré-preenchimento determinístico baseado na seleção salva
  useEffect(() => {
    if (normalizedSelection && !formData.fanpage && !formData.instagram) {
      // Implementa heurística determinística conforme especificação
      const pageDefault = normalizedSelection.allPageIds[0] ?? null;
      
      let igDefault: string | null = null;
      if (normalizedSelection.allInstagramIds.length === 1) {
        // Caso simples: apenas 1 IG selecionado
        igDefault = normalizedSelection.allInstagramIds[0];
      } else if (normalizedSelection.allInstagramIds.length > 1 && pageDefault) {
        // Caso complexo: múltiplos IGs → preferir o IG vinculado à Page
        const linked = instagramAccounts.find(account => account.pageId === pageDefault);
        igDefault = linked?.id ?? normalizedSelection.allInstagramIds[0];
      }

      // Aplicar defaults se disponíveis
      if (pageDefault) {
        updateFormData('fanpage', pageDefault);
      }
      if (igDefault) {
        updateFormData('instagram', igDefault);
      }

      console.log('[STEP2-DEFAULTS]', JSON.stringify({
        pageDefault,
        igDefault,
        selectionSource: 'normalized-db',
        allPageIds: normalizedSelection.allPageIds,
        allInstagramIds: normalizedSelection.allInstagramIds
      }));
    }
  }, [normalizedSelection, instagramAccounts, formData.fanpage, formData.instagram, updateFormData]);

  // Auto-update whatsappLink based on whatsappNumber (GERAR wa.me)
  useEffect(() => {
    if (formData.whatsappNumber) {
      const cleanNumber = formData.whatsappNumber.replace(/\D/g, '');
      
      if (cleanNumber.length === 11) {
        // ✅ GERAR LINK wa.me com código do país
        const waLink = `https://wa.me/55${cleanNumber}`;
        updateFormData('whatsappLink', waLink);
        
        console.log('✅ Link wa.me gerado:', waLink);
      } else {
        updateFormData('whatsappLink', '');
      }
    }
  }, [formData.whatsappNumber, updateFormData]);

  // Auto-fill ad text when Instagram post is selected (mantido para futura reativação)
  useEffect(() => {
    if (formData.creativeType === 'post' && formData.selectedInstagramPost?.caption) {
      updateFormData('adText', formData.selectedInstagramPost.caption);
    }
  }, [formData.selectedInstagramPost, formData.creativeType, updateFormData]);

  const handleWhatsAppChange = (number: string) => {
    updateFormData('whatsappNumber', number);
  };

  // Funções mantidas para futura reativação da feature de posts do Instagram
  const handleCreativeTypeChange = (value: 'upload' | 'post') => {
    updateFormData('creativeType', value);
    if (value === 'upload') {
      updateFormData('selectedInstagramPost', null);
      updateFormData('useExistingInstagramPost', false);
      updateFormData('selectedInstagramPostId', null);
    } else {
      updateFormData('selectedMediaFile', null);
    }
  };

  const handleInstagramPostSelect = (post: { id: string; caption: string; media_url: string }) => {
    console.log('[STEP2] Seleção de ativos', { page_id: formData.fanpage, instagram_user_id: formData.instagram });
    updateFormData('selectedInstagramPost', post);
    updateFormData('useExistingInstagramPost', true);
    updateFormData('selectedInstagramPostId', post.id);
  };

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl text-center">
            Configuração da Campanha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span className="text-sm text-blue-600">Carregando ativos da Meta API...</span>
            </div>
          )}


          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <div className="flex flex-col gap-2 w-full">
                  <span>{error}</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fetchAllAssets(true)}
                    disabled={isLoading}
                    className="w-max"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Tentar novamente
                  </Button>
                </div>
              </div>
            </Alert>
          )}

          {/* Facebook Page Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between group">
              <Label htmlFor="fanpage" className="flex items-center gap-2 text-base">
                Escolha sua fanpage
                {isLoading && <Loader2 className="inline w-4 h-4 animate-spin" />}
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  toast({
                    title: "Atualizando ativos...",
                    description: "Buscando dados mais recentes da Meta API",
                  });
                  fetchAllAssets(true);
                }}
                disabled={isLoading}
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Atualizar páginas e contas"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <Select 
              value={formData.fanpage} 
              onValueChange={handleFanpageChange}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue 
                  placeholder={
                    isLoading 
                      ? "Carregando..." 
                      : facebookPages.length === 0 
                        ? "Nenhuma página encontrada" 
                        : "Qual é sua melhor fanpage?"
                  } 
                />
              </SelectTrigger>
              <SelectContent>
                {facebookPages.map((page) => (
                  <SelectItem key={page.id} value={page.id}>
                    <div className="flex items-center gap-2">
                      {page.pictureUrl ? (
                        <img 
                          src={page.pictureUrl} 
                          alt={page.name}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-gray-400" />
                      )}
                      {page.name}
                      {page.whatsappNumber && (
                        <MessageCircle className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Instagram Account Selection */}
          <div className="space-y-2">
            <Label htmlFor="instagram" className="flex items-center gap-2 text-base">
              Escolha seu Instagram
              {isLoading && <Loader2 className="inline w-4 h-4 animate-spin" />}
            </Label>
            <Select 
              value={formData.instagram} 
              onValueChange={(value) => updateFormData('instagram', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue 
                  placeholder={
                    isLoading 
                      ? "Carregando..." 
                      : instagramAccounts.length === 0 
                        ? "Nenhuma conta encontrada" 
                        : "Qual é seu melhor Instagram?"
                  } 
                />
              </SelectTrigger>
              <SelectContent>
                {instagramAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center gap-2">
                      {account.profilePictureUrl ? (
                        <img 
                          src={account.profilePictureUrl} 
                          alt={account.name}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-gray-400" />
                      )}
                      {account.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>


        </CardContent>
      </Card>

      {/* Creative Type Selection */}
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-lg">Tipo de Criativo</CardTitle>
          <CardDescription>
            Escolha como criar o anúncio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.creativeType}
            onValueChange={(value) => handleCreativeTypeChange(value as 'upload' | 'post')}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="upload" id="upload" />
              <Label htmlFor="upload" className="flex items-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                Enviar mídia
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="post"
                id="post"
                disabled={!formData.instagram}
              />
              <Label
                htmlFor="post"
                className={`flex items-center gap-2 cursor-pointer ${!formData.instagram ? 'opacity-50' : ''}`}
              >
                <User className="w-4 h-4" />
                Usar post do Instagram
              </Label>
            </div>
          </RadioGroup>
          {!formData.instagram && formData.creativeType !== 'post' && (
            <p className="text-xs text-muted-foreground mt-2">
              Selecione uma conta do Instagram acima para usar posts existentes.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Media Selection Section */}
      <div className="w-full max-w-2xl mx-auto">
        {formData.creativeType === 'upload' ? (
          <MediaSelector
            formData={formData}
            updateFormData={updateFormData}
          />
        ) : (
          formData.instagram && formData.fanpage && (
            <InstagramPostSelector
              instagramUserId={formData.instagram}
              pageId={formData.fanpage}
              selectedPost={formData.selectedInstagramPost}
              onPostSelect={handleInstagramPostSelect}
            />
          )
        )}
      </div>
    </div>
  );
};
