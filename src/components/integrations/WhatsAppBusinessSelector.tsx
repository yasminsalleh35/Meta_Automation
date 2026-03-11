import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/hooks/useSupabase';
import { useMetaAdsIntegration } from '@/hooks/useMetaAdsIntegration';
import {
  MessageCircle,
  Building2,
  Smartphone,
  Save,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Info
} from 'lucide-react';

interface PhoneNumber {
  id: string;
  display_phone_number: string;
  verified_name: string;
}

interface WABA {
  id: string;
  name: string;
  phone_numbers: PhoneNumber[];
}

interface Business {
  id: string;
  name: string;
  wabas: WABA[];
}

interface WhatsAppAssetsData {
  businesses: Business[];
}

interface WhatsAppSelection {
  business_id?: string;
  waba_id?: string;
  phone_number_id?: string;
  display_phone_number?: string;
  verified_name?: string;
}

export const WhatsAppBusinessSelector: React.FC = () => {
  const { toast } = useToast();
  const supabase = useSupabase();
  const { existingIntegration, refreshIntegration } = useMetaAdsIntegration();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<WhatsAppAssetsData>({ businesses: [] });
  const [selected, setSelected] = useState<WhatsAppSelection>({});
  const [lastFetch, setLastFetch] = useState<number>(0);
  
  // Check if feature flag is enabled (with default true for now)
  const isWhatsAppEnabled = true; // TODO: Replace with env check: Deno.env.get('ENABLE_META_WHATSAPP_SELECTOR') === 'true'

  // Load existing selection from integration
  useEffect(() => {
    if (existingIntegration) {
      setSelected({
        business_id: existingIntegration.selected_business_id || undefined,
        waba_id: existingIntegration.selected_waba_id || undefined,
        phone_number_id: existingIntegration.selected_whatsapp_phone_id || undefined,
        display_phone_number: existingIntegration.selected_whatsapp_display || undefined,
        verified_name: existingIntegration.selected_whatsapp_verified_name || undefined,
      });
    }
  }, [existingIntegration]);

  // Fetch WhatsApp assets
  const fetchWhatsAppAssets = async (force: boolean = false) => {
    // Simple 2-minute cache
    const now = Date.now();
    if (!force && (now - lastFetch) < 2 * 60 * 1000) {
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authenticated session');
      }

      const response = await supabase.functions.invoke('meta-whatsapp-assets', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch WhatsApp assets');
      }

      setData(response.data || { businesses: [] });
      setLastFetch(now);
      
    } catch (error) {
      console.error('Error fetching WhatsApp assets:', error);
      toast({
        title: "Erro ao carregar WhatsApp",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (existingIntegration && existingIntegration.status === 'active' && isWhatsAppEnabled) {
      fetchWhatsAppAssets();
    }
  }, [existingIntegration, isWhatsAppEnabled]);

  // Save selection
  const handleSave = async () => {
    if (!selected.business_id || !selected.waba_id || !selected.phone_number_id) {
      toast({
        title: "Seleção incompleta",
        description: "Por favor, selecione um negócio, WABA e número de telefone.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authenticated session');
      }

      const response = await supabase.functions.invoke('meta-whatsapp-save-selection', {
        body: {
          business_id: selected.business_id,
          waba_id: selected.waba_id,
          phone_number_id: selected.phone_number_id,
          display_phone_number: selected.display_phone_number,
          verified_name: selected.verified_name,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to save WhatsApp selection');
      }

      await refreshIntegration();
      
      toast({
        title: "WhatsApp salvo",
        description: `Número ${selected.display_phone_number} selecionado com sucesso.`,
        variant: "default"
      });

    } catch (error) {
      console.error('Error saving WhatsApp selection:', error);
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Get selected objects for display
  const selectedBusiness = data.businesses.find(b => b.id === selected.business_id);
  const selectedWABA = selectedBusiness?.wabas.find(w => w.id === selected.waba_id);
  const selectedPhone = selectedWABA?.phone_numbers.find(p => p.id === selected.phone_number_id);

  // Don't render if not enabled or no integration
  if (!isWhatsAppEnabled || !existingIntegration || existingIntegration.status !== 'active') {
    return null;
  }

  return (
    <Card className="border-0 shadow-lg rounded-2xl">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center">
              <MessageCircle className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">WhatsApp Business</h3>
              <p className="text-sm text-muted-foreground">
                Selecione um número para usar nas campanhas
              </p>
            </div>
          </div>
          
          <Button
            onClick={() => fetchWhatsAppAssets(true)}
            disabled={loading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Permission Notice */}
        <Alert className="border-amber-200 bg-amber-50">
          <Info className="w-4 h-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Permissão necessária:</strong> Para listar números WhatsApp, certifique-se de que sua conta Meta possui 
            <code className="bg-amber-100 px-1 rounded mx-1">whatsapp_business_management</code>.
            Se não aparecerem números, reconecte sua conta Meta.
          </AlertDescription>
        </Alert>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : data.businesses.length === 0 ? (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Nenhum negócio encontrado.</strong><br />
              Verifique se você tem acesso a Business Manager e permissões WhatsApp aprovadas.
              Você pode precisar reconectar sua conta Meta com as novas permissões.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {/* Business Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Business Manager
              </label>
              <Select 
                value={selected.business_id || ''} 
                onValueChange={(value) => {
                  setSelected({ business_id: value });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um Business Manager" />
                </SelectTrigger>
                <SelectContent>
                  {data.businesses.map((business) => (
                    <SelectItem key={business.id} value={business.id}>
                      <div className="flex items-center gap-2">
                        <span>{business.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {business.wabas.length} WABA(s)
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* WABA Selection */}
            {selectedBusiness && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp Business Account (WABA)
                </label>
                <Select 
                  value={selected.waba_id || ''} 
                  onValueChange={(value) => {
                    setSelected(prev => ({ 
                      ...prev, 
                      waba_id: value,
                      phone_number_id: undefined,
                      display_phone_number: undefined,
                      verified_name: undefined
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma WABA" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedBusiness.wabas.map((waba) => (
                      <SelectItem key={waba.id} value={waba.id}>
                        <div className="flex items-center gap-2">
                          <span>{waba.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {waba.phone_numbers.length} número(s)
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Phone Number Selection */}
            {selectedWABA && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  Número de Telefone
                </label>
                <Select 
                  value={selected.phone_number_id || ''} 
                  onValueChange={(value) => {
                    const phone = selectedWABA.phone_numbers.find(p => p.id === value);
                    setSelected(prev => ({ 
                      ...prev, 
                      phone_number_id: value,
                      display_phone_number: phone?.display_phone_number,
                      verified_name: phone?.verified_name
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um número" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedWABA.phone_numbers.map((phone) => (
                      <SelectItem key={phone.id} value={phone.id}>
                        <div className="space-y-1">
                          <div className="font-medium">{phone.display_phone_number}</div>
                          {phone.verified_name && (
                            <div className="text-xs text-muted-foreground">
                              Nome verificado: {phone.verified_name}
                            </div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Current Selection Summary */}
            {selectedPhone && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Seleção atual:</strong><br />
                  Business: {selectedBusiness?.name}<br />
                  WABA: {selectedWABA?.name}<br />
                  Número: {selectedPhone.display_phone_number}
                  {selectedPhone.verified_name && ` (${selectedPhone.verified_name})`}
                </AlertDescription>
              </Alert>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving || !selected.phone_number_id}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Salvando...' : 'Salvar Seleção'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};