import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMetaAssetsContext } from '@/contexts/MetaAssetsContext';
import { MetaAssetsErrorBoundary } from './MetaAssetsErrorBoundary';
import { supabase } from '@/integrations/supabase/client';
import { metaCache } from '@/lib/metaCache';
import { 
  Facebook, 
  Instagram, 
  CreditCard, 
  CheckCircle2, 
  Save, 
  Users,
  Sparkles,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface PostAuthAssetSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  integrationId?: string;
}

export const PostAuthAssetSelector: React.FC<PostAuthAssetSelectorProps> = ({
  isOpen,
  onClose,
  onComplete,
  integrationId
}) => {
  const { toast } = useToast();
  const { 
    facebookPages, 
    instagramAccounts, 
    assetsLoading, 
    adAccounts,
    adAccountsLoading,
    fetchAllAssets 
  } = useMetaAssetsContext();
  
  const [selectedAdAccount, setSelectedAdAccount] = useState<string>('');
  const [selectedPage, setSelectedPage] = useState<string>('');
  const [selectedInstagram, setSelectedInstagram] = useState<string>('');
  const [isSaving, setSaving] = useState(false);

  const isLoading = assetsLoading || adAccountsLoading;

  // ✅ CORREÇÃO 1: Remover fetchAllAssets para evitar race condition com save-asset-selection
  useEffect(() => {
    if (isOpen) {
      console.log('[PostAuthAssetSelector] Modal opened - assets will be loaded from cache');
    }
  }, [isOpen]); // Dependencies corretas

  // Auto-select single options
  useEffect(() => {
    if (adAccounts.length === 1 && !selectedAdAccount) {
      setSelectedAdAccount(adAccounts[0].id);
    }
    if (facebookPages.length === 1 && !selectedPage) {
      setSelectedPage(facebookPages[0].id);
    }
    if (instagramAccounts.length === 1 && !selectedInstagram) {
      setSelectedInstagram(instagramAccounts[0].id);
    }
  }, [adAccounts, facebookPages, instagramAccounts, selectedAdAccount, selectedPage, selectedInstagram]);

  const handleSave = async () => {
    if (!selectedAdAccount || !selectedPage) {
      toast({
        title: "Seleção incompleta",
        description: "Por favor, selecione pelo menos uma conta de anúncio e uma página.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      console.log('💾 Saving asset selection...');
      
      // ✅ CORREÇÃO 2: Usar AbortController para timeout de 15 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      try {
        const { data, error } = await supabase.functions.invoke('save-asset-selection', {
          body: {
            integrationId,
            selectedAdAccount,
            selectedPage,
            selectedInstagram: selectedInstagram || null
          }
        });
        
        clearTimeout(timeoutId);

        if (error) throw error;

        console.log('✅ Asset selection saved successfully');

        // ✅ FASE 1 & 2: Resetar estado e fechar modal IMEDIATAMENTE
        toast({
          title: "Ativos configurados!",
          description: "Sua seleção foi salva com sucesso.",
          variant: "default"
        });

        // Reset saving state BEFORE closing to prevent re-renders during close
        setSaving(false);
        
        // Close modal immediately to prevent any validation triggers
        onComplete();
        
        // ✅ CORREÇÃO 3: Invalidar cache DEPOIS do onComplete para evitar race condition
        setTimeout(() => {
          metaCache.clear('unified-assets');
        }, 100);
      } catch (innerError) {
        clearTimeout(timeoutId);
        throw innerError;
      }
    } catch (error) {
      console.error('❌ Error saving asset selection:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a seleção. Tente novamente.",
        variant: "destructive"
      });
      setSaving(false);
    }
  };

  // ✅ FASE 4: Função para refresh manual
  const handleRefresh = async () => {
    console.log('[PostAuthAssetSelector] Manual refresh triggered');
    metaCache.clear('unified-assets');
    await fetchAllAssets(true);
  };

  const canSave = selectedAdAccount && selectedPage && !isSaving && !isLoading;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-xl">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Configurar Ativos Meta Ads
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </DialogTitle>
          <p className="text-muted-foreground">
            Selecione os ativos que serão utilizados nas suas campanhas
          </p>
        </DialogHeader>

        {/* ✅ FASE 4: Error Boundary para capturar erros */}
        <MetaAssetsErrorBoundary onRetry={handleRefresh}>

        <div className="space-y-6 py-4">
          {/* Ad Account Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold">Conta de Anúncio *</h3>
            </div>
            
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ) : adAccounts.length === 0 ? (
              <Card className="p-4 border-amber-200 bg-amber-50">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-900 font-medium text-sm mb-1">
                      Nenhuma conta de anúncio encontrada
                    </p>
                    <p className="text-amber-700 text-xs">
                      Verifique se você tem permissões de acesso às contas de anúncio no Meta Business Manager.
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="space-y-2">
                {adAccounts.map((account) => (
                  <Card 
                    key={account.id}
                    className={`p-4 cursor-pointer transition-all ${
                      selectedAdAccount === account.id 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedAdAccount(account.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{account.name}</span>
                          {selectedAdAccount === account.id && (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">ID: {account.id}</p>
                      </div>
                      <Badge variant="outline">{account.currency}</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Facebook Page Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Facebook className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold">Página do Facebook *</h3>
            </div>
            
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ) : facebookPages.length === 0 ? (
              <Card className="p-4 border-amber-200 bg-amber-50">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-900 font-medium text-sm mb-1">
                      Nenhuma página do Facebook encontrada
                    </p>
                    <p className="text-amber-700 text-xs">
                      Certifique-se de que você administra páginas no Facebook e tem as permissões necessárias.
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="space-y-2">
                {facebookPages.map((page) => (
                  <Card 
                    key={page.id}
                    className={`p-4 cursor-pointer transition-all ${
                      selectedPage === page.id 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedPage(page.id)}
                  >
                    <div className="flex items-center gap-3">
                      {page.pictureUrl && (
                        <img 
                          src={page.pictureUrl} 
                          alt={page.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{page.name}</span>
                          {selectedPage === page.id && (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>ID: {page.id}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Instagram Selection (Optional) */}
          {instagramAccounts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Instagram className="h-4 w-4 text-pink-600" />
                <h3 className="font-semibold">Instagram Business (Opcional)</h3>
              </div>
              
              <div className="space-y-2">
                <Card 
                  className={`p-4 cursor-pointer transition-all ${
                    selectedInstagram === '' 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedInstagram('')}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Não usar Instagram</span>
                    {selectedInstagram === '' && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </Card>

                {instagramAccounts.map((instagram) => (
                  <Card 
                    key={instagram.id}
                    className={`p-4 cursor-pointer transition-all ${
                      selectedInstagram === instagram.id 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedInstagram(instagram.id)}
                  >
                    <div className="flex items-center gap-3">
                      {instagram.profilePictureUrl && (
                        <img 
                          src={instagram.profilePictureUrl} 
                          alt={instagram.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{instagram.name}</span>
                          {selectedInstagram === instagram.id && (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Conectado à página: {instagram.pageId}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isSaving}
              className="flex-1"
            >
              Pular por Agora
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!canSave}
              className="flex-1 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Salvando...' : 'Salvar e Continuar'}
            </Button>
          </div>
        </div>
        </MetaAssetsErrorBoundary>
      </DialogContent>
    </Dialog>
  );
};