import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMetaAdsIntegration } from '@/hooks/useMetaAdsIntegration';
import { useMetaAssetsContext } from '@/contexts/MetaAssetsContext';
import { CompactAssetEditor } from './CompactAssetEditor';
import { 
  Facebook, 
  Instagram, 
  CreditCard, 
  Settings, 
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface IntegrationStatusCardProps {
  onEdit?: () => void;
}

export const IntegrationStatusCard: React.FC<IntegrationStatusCardProps> = ({ onEdit }) => {
  const { existingIntegration, isLoading: integrationLoading, refreshIntegration } = useMetaAdsIntegration();
  const { 
    facebookPages, 
    instagramAccounts, 
    assetsLoading,
    adAccounts,
    adAccountsLoading,
    fetchAllAssets
  } = useMetaAssetsContext();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isLoading = integrationLoading || assetsLoading || adAccountsLoading;

  // Get selected assets info
  const selectedAdAccount = existingIntegration?.ad_account_id 
    ? adAccounts.find(acc => acc.id === existingIntegration.ad_account_id)
    : null;

  const selectedPage = existingIntegration?.page_id 
    ? facebookPages.find(page => page.id === existingIntegration.page_id)
    : null;

  const selectedInstagram = existingIntegration?.selected_instagram_ids?.[0]
    ? instagramAccounts.find(ig => ig.id === existingIntegration.selected_instagram_ids[0])
    : null;

  // Calculate connection health
  const getConnectionHealth = () => {
    if (!existingIntegration || existingIntegration.status !== 'active') {
      return { status: 'disconnected', color: 'gray', text: 'Desconectado' };
    }
    
    const hasAdAccount = !!selectedAdAccount;
    const hasPage = !!selectedPage;
    
    if (hasAdAccount && hasPage) {
      return { status: 'complete', color: 'green', text: 'Configuração Completa' };
    } else if (hasAdAccount || hasPage) {
      return { status: 'partial', color: 'amber', text: 'Configuração Parcial' };
    } else {
      return { status: 'incomplete', color: 'red', text: 'Configuração Necessária' };
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshIntegration();
      // Only fetch if we have an active integration and user explicitly requested refresh
      if (existingIntegration?.status === 'active') {
        console.log('[IntegrationStatusCard] User-triggered refresh of assets data');
        // Add small delay to avoid race conditions
        setTimeout(() => {
          fetchAllAssets();
        }, 500);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const health = getConnectionHealth();

  return (
    <>
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Facebook className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Meta Ads Integration</h3>
                <p className="text-sm text-muted-foreground">
                  Status da integração e ativos selecionados
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={`
                  ${health.color === 'green' ? 'border-green-200 bg-green-50 text-green-700' : ''}
                  ${health.color === 'amber' ? 'border-amber-200 bg-amber-50 text-amber-700' : ''}
                  ${health.color === 'red' ? 'border-red-200 bg-red-50 text-red-700' : ''}
                  ${health.color === 'gray' ? 'border-gray-200 bg-gray-50 text-gray-700' : ''}
                `}
              >
                {health.status === 'complete' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                {health.status !== 'complete' && <AlertCircle className="w-3 h-3 mr-1" />}
                {health.text}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : health.status === 'disconnected' ? (
            <div className="text-center py-6 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>Meta Ads não está conectado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Ad Account */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Conta de Anúncio</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedAdAccount ? selectedAdAccount.name : 'Não selecionada'}
                  </p>
                </div>
                {selectedAdAccount && (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                )}
              </div>

              {/* Facebook Page */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Facebook className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Página do Facebook</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedPage ? selectedPage.name : 'Não selecionada'}
                  </p>
                </div>
                {selectedPage && (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                )}
              </div>

              {/* Instagram */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Instagram className="w-5 h-5 text-pink-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Instagram Business</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedInstagram ? selectedInstagram.name : 'Não configurado'}
                  </p>
                </div>
                {selectedInstagram && (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {health.status !== 'disconnected' && (
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Settings className="w-3 h-3" />
                Editar Seleção
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>

              <Button
                variant="outline"
                size="sm"
                asChild
                className="flex items-center gap-2"
              >
                <a 
                  href="https://business.facebook.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-3 h-3" />
                  Business Manager
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <CompactAssetEditor
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        integrationId={existingIntegration?.id}
      />
    </>
  );
};