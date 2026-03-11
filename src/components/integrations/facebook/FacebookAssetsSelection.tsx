
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Facebook, Instagram, AlertCircle, CheckCircle, RefreshCw, Users } from 'lucide-react';
import { useMetaAdsIntegration } from '@/hooks/useMetaAdsIntegration';
import { useMetaAdsData } from '@/hooks/useMetaAdsData';
import { useToast } from '@/hooks/use-toast';

const FacebookAssetsSelection: React.FC = () => {
  const { existingIntegration, saveIntegration, isTokenIncompatible } = useMetaAdsIntegration();
  const { pages, fetchAccountsAndPages, isLoading } = useMetaAdsData();
  const { toast } = useToast();

  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [primaryPageId, setPrimaryPageId] = useState<string>('');

  const isConnected = existingIntegration?.status === 'active' && !isTokenIncompatible;

  useEffect(() => {
    if (isConnected && existingIntegration?.access_token) {
      fetchAccountsAndPages(existingIntegration.access_token);
    }
  }, [isConnected, existingIntegration?.access_token]);

  useEffect(() => {
    if (existingIntegration?.selected_pages) {
      const pageIds = existingIntegration.selected_pages.map((p: any) => 
        typeof p === 'string' ? p : p.id
      );
      setSelectedPages(pageIds);
    }
    if (existingIntegration?.page_id) {
      setPrimaryPageId(existingIntegration.page_id);
    }
  }, [existingIntegration]);

  const handlePageToggle = (pageId: string) => {
    setSelectedPages(prev => {
      const updated = prev.includes(pageId) 
        ? prev.filter(id => id !== pageId)
        : [...prev, pageId];
      
      // Se a página principal foi desmarcada, limpar ela
      if (!updated.includes(primaryPageId)) {
        setPrimaryPageId('');
      }
      
      return updated;
    });
  };

  const handlePrimaryPageChange = (pageId: string) => {
    setPrimaryPageId(pageId);
    
    // Garantir que a página principal está selecionada
    if (!selectedPages.includes(pageId)) {
      setSelectedPages(prev => [...prev, pageId]);
    }
  };

  const handleSave = async () => {
    if (!existingIntegration || !isConnected) {
      toast({
        title: "Erro",
        description: "É necessário estar conectado para salvar",
        variant: "destructive"
      });
      return;
    }

    try {
      // Converter array de IDs para array de objetos completos para salvar no banco
      const selectedPagesData = pages.filter(page => 
        selectedPages.includes(page.id)
      );

      await saveIntegration(
        existingIntegration.app_id || '',
        existingIntegration.app_secret || '',
        existingIntegration.access_token || '',
        existingIntegration.selected_accounts || [],
        selectedPagesData, // Passando array de objetos MetaPage
        existingIntegration.business_manager_id
      );

      toast({
        title: "Ativos salvos",
        description: `${selectedPages.length} página${selectedPages.length !== 1 ? 's' : ''} selecionada${selectedPages.length !== 1 ? 's' : ''}`,
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a seleção de ativos",
        variant: "destructive"
      });
    }
  };

  const handleRefresh = () => {
    if (existingIntegration?.access_token) {
      fetchAccountsAndPages(existingIntegration.access_token);
    }
  };

  if (!isConnected) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <strong>Meta não conectado!</strong> Você precisa fazer login na aba "Login Meta" primeiro.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-4 w-4" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert className="border-blue-200 bg-blue-50">
        <Users className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Requer permissões:</strong> pages_read_engagement e instagram_basic.
          Selecione suas páginas do Facebook e suas contas do Instagram serão detectadas automaticamente.
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          {pages.length} página{pages.length !== 1 ? 's' : ''} disponível{pages.length !== 1 ? 'is' : ''}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {selectedPages.length > 0 && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {selectedPages.length} página{selectedPages.length !== 1 ? 's' : ''} selecionada{selectedPages.length !== 1 ? 's' : ''}
            {primaryPageId && ` | Página principal: ${pages.find(p => p.id === primaryPageId)?.name}`}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Facebook className="w-5 h-5" />
            Páginas do Facebook
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pages.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nenhuma página encontrada. Verifique suas permissões ou se você possui páginas ativas no Facebook.
              </AlertDescription>
            </Alert>
          ) : (
            pages.map((page) => (
              <Card key={page.id} className="hover:bg-gray-50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedPages.includes(page.id)}
                      onCheckedChange={() => handlePageToggle(page.id)}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium flex items-center gap-2">
                        <Facebook className="w-4 h-4 text-blue-600" />
                        {page.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {page.followers || 0} seguidores • {page.category}
                      </p>
                      {/* Instagram detectado automaticamente seria mostrado aqui */}
                      <div className="flex items-center gap-2 mt-1">
                        <Instagram className="w-3 h-3 text-purple-600" />
                        <span className="text-xs text-gray-500">
                          Instagram: Detectando...
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline">{page.category}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {selectedPages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Página Principal</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={primaryPageId} onValueChange={handlePrimaryPageChange}>
              <div className="space-y-2">
                {pages
                  .filter(page => selectedPages.includes(page.id))
                  .map((page) => (
                    <div key={page.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={page.id} id={`primary-${page.id}`} />
                      <Label htmlFor={`primary-${page.id}`} className="cursor-pointer">
                        {page.name}
                      </Label>
                    </div>
                  ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      <Button 
        onClick={handleSave}
        disabled={selectedPages.length === 0 || isLoading}
        className="w-full"
      >
        Salvar Seleção ({selectedPages.length} página{selectedPages.length !== 1 ? 's' : ''})
      </Button>
    </div>
  );
};

export default FacebookAssetsSelection;
