import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useMetaAssetsContext } from '@/contexts/MetaAssetsContext';
import { useMetaAdsIntegration } from '@/hooks/useMetaAdsIntegration';
import { supabase } from '@/integrations/supabase/client';
import { 
  Facebook, 
  Instagram, 
  CreditCard, 
  Save,
  AlertCircle
} from 'lucide-react';

interface CompactAssetEditorProps {
  isOpen: boolean;
  onClose: () => void;
  integrationId?: string;
}

export const CompactAssetEditor: React.FC<CompactAssetEditorProps> = ({
  isOpen,
  onClose,
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
  const { existingIntegration, refreshIntegration } = useMetaAdsIntegration();
  
  const [selectedAdAccount, setSelectedAdAccount] = useState<string>('');
  const [selectedPage, setSelectedPage] = useState<string>('');
  const [selectedInstagram, setSelectedInstagram] = useState<string>('');
  const [isSaving, setSaving] = useState(false);

  const isLoading = assetsLoading || adAccountsLoading;

  // ✅ FASE 4: Improved state management with fallback
  useEffect(() => {
    if (existingIntegration && isOpen) {
      setSelectedAdAccount(existingIntegration.ad_account_id || '');
      setSelectedPage(existingIntegration.page_id || '');
      setSelectedInstagram(existingIntegration.selected_instagram_ids?.[0] || '');
      
      // ✅ Smart data fetching - check if we have sufficient data
      const hasMinimumData = facebookPages.length > 0 && adAccounts.length > 0;
      
      if (!hasMinimumData && !isLoading) {
        console.log('[CompactAssetEditor] Fetching required assets:', {
          currentPages: facebookPages.length,
          currentAdAccounts: adAccounts.length,
          isLoading
        });
        
        // ✅ Fetch with shorter delay for better UX
        setTimeout(() => {
          fetchAllAssets(); // Remove the 'true' parameter since it's optional
        }, 100);
      }
    }
  }, [existingIntegration, isOpen]); // Kept minimal dependencies

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
      const { error } = await supabase.functions.invoke('save-asset-selection', {
        body: {
          integrationId,
          selectedAdAccount,
          selectedPage,
          selectedInstagram: selectedInstagram || null
        }
      });

      if (error) throw error;

      await refreshIntegration();

      toast({
        title: "Seleção atualizada!",
        description: "Seus ativos foram atualizados com sucesso.",
        variant: "default"
      });

      onClose();
    } catch (error) {
      console.error('Error saving asset selection:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a seleção. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const canSave = selectedAdAccount && selectedPage && !isSaving && !isLoading;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5 text-primary" />
            Editar Ativos Meta Ads
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Ad Account Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-600" />
              Conta de Anúncio *
            </Label>
            
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select value={selectedAdAccount} onValueChange={setSelectedAdAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma conta de anúncio" />
                </SelectTrigger>
                <SelectContent>
                  {adAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({account.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {!isLoading && adAccounts.length === 0 && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <AlertCircle className="h-4 w-4" />
                <span>
                  {adAccountsLoading ? 'Carregando contas de anúncio...' : 'Nenhuma conta de anúncio encontrada'}
                </span>
              </div>
            )}
          </div>

          {/* Facebook Page Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Facebook className="h-4 w-4 text-blue-600" />
              Página do Facebook *
            </Label>
            
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select value={selectedPage} onValueChange={setSelectedPage}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma página" />
                </SelectTrigger>
                <SelectContent>
                  {facebookPages.map((page) => (
                    <SelectItem key={page.id} value={page.id}>
                      {page.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {!isLoading && facebookPages.length === 0 && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span>Nenhuma página encontrada</span>
              </div>
            )}
          </div>

          {/* Instagram Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Instagram className="h-4 w-4 text-pink-600" />
              Instagram Business (Opcional)
            </Label>
            
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select value={selectedInstagram} onValueChange={setSelectedInstagram}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um Instagram ou deixe em branco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Não usar Instagram</SelectItem>
                  {instagramAccounts.map((instagram) => (
                    <SelectItem key={instagram.id} value={instagram.id}>
                      {instagram.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isSaving}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!canSave}
              className="flex-1 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};