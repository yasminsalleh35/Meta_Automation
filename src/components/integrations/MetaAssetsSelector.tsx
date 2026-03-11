import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useDynamicMetaAssets } from '@/hooks/useDynamicMetaAssets';
import { useMetaAdsIntegration } from '@/hooks/useMetaAdsIntegration';
import { useSupabase } from '@/hooks/useSupabase';
import { WhatsAppBusinessSelector } from './WhatsAppBusinessSelector';
import {
  Facebook,
  Instagram, 
  RefreshCw,
  Save,
  Info,
  Users,
  Shield,
  CheckCircle2
} from 'lucide-react';

interface MetaAssetsSelectorProps {
  className?: string;
}

export const MetaAssetsSelector: React.FC<MetaAssetsSelectorProps> = ({ className }) => {
  const { facebookPages, instagramAccounts, isLoading, fetchDynamicAssets } = useDynamicMetaAssets();
  const { existingIntegration, refreshIntegration } = useMetaAdsIntegration();
  const { toast } = useToast();
  const supabase = useSupabase();
  
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [selectedInstagram, setSelectedInstagram] = useState<string[]>([]);
  const [isSaving, setSaving] = useState(false);

  // Load current selections from integration with fallback to old columns
  useEffect(() => {
    if (existingIntegration) {
      // Pages: prefer new column, fallback to old
      const pageIdsNew = Array.isArray(existingIntegration.selected_page_ids) 
        ? existingIntegration.selected_page_ids 
        : [];
      const pageIdsOld = existingIntegration.selected_pages 
        ? existingIntegration.selected_pages.map((page: any) => 
            typeof page === 'string' ? page : page.id
          )
        : [];
      const allPageIds = [...new Set([...pageIdsNew, ...pageIdsOld])];
      setSelectedPages(allPageIds);

      // Instagram: prefer new column, fallback to old
      const igIdsNew = Array.isArray(existingIntegration.selected_instagram_ids)
        ? existingIntegration.selected_instagram_ids
        : [];
      const igIdsOld = Array.isArray(existingIntegration.selected_accounts)
        ? existingIntegration.selected_accounts.filter((x: string) => /^\d{10,}$/.test(x))
        : [];
      const allIgIds = [...new Set([...igIdsNew, ...igIdsOld])];
      setSelectedInstagram(allIgIds);
    }
  }, [existingIntegration]);

  const handlePageToggle = (pageId: string) => {
    setSelectedPages(prev => 
      prev.includes(pageId) 
        ? prev.filter(id => id !== pageId)
        : [...prev, pageId]
    );
  };

  const handleInstagramToggle = (instagramId: string) => {
    setSelectedInstagram(prev => 
      prev.includes(instagramId) 
        ? prev.filter(id => id !== instagramId)
        : [...prev, instagramId]
    );
  };

  const handleSave = async () => {
    if (!existingIntegration) return;

    setSaving(true);
    try {
      // Convert selected page IDs to full page objects for backward compatibility
      const selectedPageObjects = facebookPages.filter(page => 
        selectedPages.includes(page.id)
      );

      // Use new normalized columns as the primary source of truth
      const { error } = await supabase
        .from('integrations')
        .update({
          selected_page_ids: selectedPages,                // string[]
          selected_instagram_ids: selectedInstagram,       // string[]
          // Keep legacy columns for backward compatibility
          selected_pages: selectedPageObjects,
          selected_accounts: selectedInstagram,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingIntegration.id);

      if (error) throw error;

      await refreshIntegration();
      
      toast({
        title: "Seleção salva",
        description: `${selectedPages.length} páginas e ${selectedInstagram.length} contas do Instagram selecionadas.`,
        variant: "default"
      });

    } catch (error) {
      console.error('Error saving assets selection:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a seleção. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    await fetchDynamicAssets();
  };

  if (!existingIntegration || existingIntegration.status !== 'active') {
    return null;
  }

  return (
    <div className={className}>
      <Card className="border-0 shadow-lg rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Facebook className="h-4 w-4 text-primary" />
            </div>
            Seletor de Ativos Meta
          </CardTitle>
          <p className="text-muted-foreground text-base">
            Escolha quais Facebook Pages e Instagram você quer usar nas campanhas
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Permissions Alert */}
          <Alert className="border-blue-200 bg-blue-50">
            <Shield className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Permissões necessárias:</strong> Para visualizar todos os assets, certifique-se de que sua conta Meta possui as permissões 
              <code className="bg-blue-100 px-1 rounded mx-1">pages_read_engagement</code> e 
              <code className="bg-blue-100 px-1 rounded mx-1">instagram_basic</code>.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleRefresh}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Salvando...' : 'Salvar Seleção'}
            </Button>
          </div>

          {/* Facebook Pages */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Facebook className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Facebook Pages ({facebookPages.length})</h3>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center space-x-3 p-4 border rounded-xl">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : facebookPages.length === 0 ? (
              <Alert>
                <Info className="w-4 h-4" />
                <AlertDescription>
                  Nenhuma página do Facebook encontrada. Verifique suas permissões.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {facebookPages.map((page) => {
                  const connectedInstagram = instagramAccounts.find(ig => ig.pageId === page.id);
                  
                  return (
                    <div key={page.id} className="flex items-center space-x-3 p-4 border rounded-xl hover:bg-muted/50 transition-colors">
                      <Checkbox
                        checked={selectedPages.includes(page.id)}
                        onCheckedChange={() => handlePageToggle(page.id)}
                      />
                      
                      {page.pictureUrl && (
                        <img 
                          src={page.pictureUrl} 
                          alt={page.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      )}
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{page.name}</span>
                          {selectedPages.includes(page.id) && (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="w-3 h-3" />
                          <span>ID: {page.id}</span>
                          {connectedInstagram && (
                            <Badge variant="secondary" className="text-xs">
                              <Instagram className="w-3 h-3 mr-1" />
                              Instagram conectado
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Instagram Accounts */}
          {instagramAccounts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Instagram className="w-5 h-5 text-pink-600" />
                <h3 className="text-lg font-semibold">Instagram Business ({instagramAccounts.length})</h3>
              </div>

              <div className="space-y-3">
                {instagramAccounts.map((instagram) => (
                  <div key={instagram.id} className="flex items-center space-x-3 p-4 border rounded-xl hover:bg-muted/50 transition-colors">
                    <Checkbox
                      checked={selectedInstagram.includes(instagram.id)}
                      onCheckedChange={() => handleInstagramToggle(instagram.id)}
                    />
                    
                    {instagram.profilePictureUrl && (
                      <img 
                        src={instagram.profilePictureUrl} 
                        alt={instagram.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{instagram.name}</span>
                        {selectedInstagram.includes(instagram.id) && (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <span>Conectado à página: {instagram.pageId}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* WhatsApp Business Selector */}
          <WhatsAppBusinessSelector />

          {/* Selection Summary */}
          {(selectedPages.length > 0 || selectedInstagram.length > 0) && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Seleção atual:</strong> {selectedPages.length} páginas do Facebook 
                {selectedInstagram.length > 0 && ` e ${selectedInstagram.length} contas do Instagram`} selecionadas.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};