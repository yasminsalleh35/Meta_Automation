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
  AlertCircle,
  MessageCircle,
  Building2,
  Smartphone,
  RefreshCw
} from 'lucide-react';

interface WhatsAppPhoneNumber {
  id: string;
  display_phone_number: string;
  verified_name: string;
}

interface WhatsAppWABA {
  id: string;
  name: string;
  phone_numbers: WhatsAppPhoneNumber[];
}

interface WhatsAppBusiness {
  id: string;
  name: string;
  wabas: WhatsAppWABA[];
}

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

  // WhatsApp state
  const [whatsAppBusinesses, setWhatsAppBusinesses] = useState<WhatsAppBusiness[]>([]);
  const [whatsAppLoading, setWhatsAppLoading] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
  const [selectedWabaId, setSelectedWabaId] = useState<string>('');
  const [selectedPhoneId, setSelectedPhoneId] = useState<string>('');
  const [selectedPhoneDisplay, setSelectedPhoneDisplay] = useState<string>('');
  const [selectedPhoneVerifiedName, setSelectedPhoneVerifiedName] = useState<string>('');

  const isLoading = assetsLoading || adAccountsLoading;

  // Fetch WhatsApp assets from edge function
  const fetchWhatsAppAssets = async () => {
    setWhatsAppLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await supabase.functions.invoke('meta-whatsapp-assets', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw new Error(response.error.message);
      setWhatsAppBusinesses(response.data?.businesses || []);
    } catch (error) {
      console.error('[CompactAssetEditor] Error fetching WhatsApp assets:', error);
    } finally {
      setWhatsAppLoading(false);
    }
  };

  // Derived WhatsApp objects for cascading selectors
  const selectedBusiness = whatsAppBusinesses.find(b => b.id === selectedBusinessId);
  const selectedWaba = selectedBusiness?.wabas.find(w => w.id === selectedWabaId);

  // ✅ FASE 4: Improved state management with fallback
  useEffect(() => {
    if (existingIntegration && isOpen) {
      setSelectedAdAccount(existingIntegration.ad_account_id || '');
      setSelectedPage(existingIntegration.page_id || '');
      setSelectedInstagram(existingIntegration.selected_instagram_ids?.[0] || '');

      // Load existing WhatsApp selections
      setSelectedBusinessId(existingIntegration.selected_business_id || '');
      setSelectedWabaId(existingIntegration.selected_waba_id || '');
      setSelectedPhoneId(existingIntegration.selected_whatsapp_phone_id || '');
      setSelectedPhoneDisplay(existingIntegration.selected_whatsapp_display || '');
      setSelectedPhoneVerifiedName(existingIntegration.selected_whatsapp_verified_name || '');

      // ✅ Smart data fetching - check if we have sufficient data
      const hasMinimumData = facebookPages.length > 0 && adAccounts.length > 0;

      if (!hasMinimumData && !isLoading) {
        console.log('[CompactAssetEditor] Fetching required assets:', {
          currentPages: facebookPages.length,
          currentAdAccounts: adAccounts.length,
          isLoading
        });

        setTimeout(() => {
          fetchAllAssets();
        }, 100);
      }

      // Fetch WhatsApp assets when modal opens
      if (existingIntegration.status === 'active') {
        fetchWhatsAppAssets();
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
      // Save core assets (Ad Account, Page, Instagram)
      const { error } = await supabase.functions.invoke('save-asset-selection', {
        body: {
          integrationId,
          selectedAdAccount,
          selectedPage,
          selectedInstagram: selectedInstagram || null
        }
      });

      if (error) throw error;

      // Save WhatsApp selection if a phone is selected
      if (selectedPhoneId) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const { error: waError } = await supabase.functions.invoke('meta-whatsapp-save-selection', {
            body: {
              business_id: selectedBusinessId,
              waba_id: selectedWabaId,
              phone_number_id: selectedPhoneId,
              display_phone_number: selectedPhoneDisplay,
              verified_name: selectedPhoneVerifiedName,
            },
            headers: { Authorization: `Bearer ${session.access_token}` },
          });

          if (waError) {
            console.error('Error saving WhatsApp selection:', waError);
            // Non-blocking — core assets already saved
          }
        }
      } else if (existingIntegration?.selected_whatsapp_phone_id && !selectedPhoneId) {
        // User cleared WhatsApp selection — update DB to remove it
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          await supabase.functions.invoke('meta-whatsapp-save-selection', {
            body: {
              business_id: '',
              waba_id: '',
              phone_number_id: '',
              display_phone_number: '',
              verified_name: '',
            },
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
        }
      }

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
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
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

          {/* WhatsApp Business Section */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-green-600" />
                WhatsApp Business (Opcional)
              </Label>
              {!whatsAppLoading && whatsAppBusinesses.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchWhatsAppAssets()}
                  className="h-6 px-2"
                >
                  <RefreshCw className="w-3 h-3" />
                </Button>
              )}
            </div>

            {whatsAppLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : whatsAppBusinesses.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>Nenhum negócio WhatsApp encontrado. Verifique as permissões da sua conta Meta.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Business Manager */}
                <Select
                  value={selectedBusinessId}
                  onValueChange={(value) => {
                    setSelectedBusinessId(value);
                    setSelectedWabaId('');
                    setSelectedPhoneId('');
                    setSelectedPhoneDisplay('');
                    setSelectedPhoneVerifiedName('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um Business Manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Não usar WhatsApp</SelectItem>
                    {whatsAppBusinesses.map((biz) => (
                      <SelectItem key={biz.id} value={biz.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3 h-3" />
                          {biz.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* WABA */}
                {selectedBusiness && selectedBusiness.wabas.length > 0 && (
                  <Select
                    value={selectedWabaId}
                    onValueChange={(value) => {
                      setSelectedWabaId(value);
                      setSelectedPhoneId('');
                      setSelectedPhoneDisplay('');
                      setSelectedPhoneVerifiedName('');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma WABA" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedBusiness.wabas.map((waba) => (
                        <SelectItem key={waba.id} value={waba.id}>
                          {waba.name} ({waba.phone_numbers.length} número{waba.phone_numbers.length !== 1 ? 's' : ''})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Phone Number */}
                {selectedWaba && selectedWaba.phone_numbers.length > 0 && (
                  <Select
                    value={selectedPhoneId}
                    onValueChange={(value) => {
                      const phone = selectedWaba.phone_numbers.find(p => p.id === value);
                      setSelectedPhoneId(value);
                      setSelectedPhoneDisplay(phone?.display_phone_number || '');
                      setSelectedPhoneVerifiedName(phone?.verified_name || '');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um número" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedWaba.phone_numbers.map((phone) => (
                        <SelectItem key={phone.id} value={phone.id}>
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-3 h-3" />
                            {phone.display_phone_number}
                            {phone.verified_name && (
                              <span className="text-xs text-muted-foreground">({phone.verified_name})</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
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