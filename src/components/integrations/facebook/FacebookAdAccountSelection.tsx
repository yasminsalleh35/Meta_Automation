
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Building, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useMetaAdsIntegration } from '@/hooks/useMetaAdsIntegration';
import { useMetaAdsData } from '@/hooks/useMetaAdsData';
import { useToast } from '@/hooks/use-toast';

const FacebookAdAccountSelection: React.FC = () => {
  const { existingIntegration, saveIntegration, isTokenIncompatible } = useMetaAdsIntegration();
  const { adAccounts, fetchAccountsAndPages, isLoading } = useMetaAdsData();
  const { toast } = useToast();

  const isConnected = existingIntegration?.status === 'active' && !isTokenIncompatible;
  const currentAdAccountId = existingIntegration?.ad_account_id;

  useEffect(() => {
    if (isConnected && existingIntegration?.access_token) {
      fetchAccountsAndPages(existingIntegration.access_token);
    }
  }, [isConnected, existingIntegration?.access_token]);

  const handleAccountSelect = async (accountId: string) => {
    if (!existingIntegration || !isConnected) {
      toast({
        title: "Erro",
        description: "É necessário estar conectado para selecionar uma conta",
        variant: "destructive"
      });
      return;
    }

    try {
      const selectedAccount = adAccounts.find(acc => acc.id === accountId);
      if (!selectedAccount) return;

      await saveIntegration(
        existingIntegration.app_id || '',
        existingIntegration.app_secret || '',
        existingIntegration.access_token || '',
        [accountId],
        existingIntegration.selected_pages || [],
        existingIntegration.business_manager_id
      );

      toast({
        title: "Conta selecionada",
        description: `Conta "${selectedAccount.name}" definida como principal`,
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a conta selecionada",
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
                <Skeleton className="h-4 w-4 rounded-full" />
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
    <div className="space-y-4">
      <Alert className="border-blue-200 bg-blue-50">
        <Building className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Requer permissão ads_management</strong> para funcionar corretamente.
          Selecione a conta de anúncios principal para suas campanhas.
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          {adAccounts.length} conta{adAccounts.length !== 1 ? 's' : ''} disponível{adAccounts.length !== 1 ? 'is' : ''}
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

      {currentAdAccountId && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Conta atual: <strong>{currentAdAccountId}</strong>
          </AlertDescription>
        </Alert>
      )}

      {adAccounts.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Nenhuma conta de anúncios encontrada. Verifique suas permissões ou se você possui contas ativas no Meta Ads.
          </AlertDescription>
        </Alert>
      ) : (
        <RadioGroup value={currentAdAccountId || ''} onValueChange={handleAccountSelect}>
          <div className="space-y-3">
            {adAccounts.map((account) => (
              <Card key={account.id} className="hover:bg-gray-50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value={account.id} id={account.id} />
                    <Label htmlFor={account.id} className="flex-1 cursor-pointer">
                      <div>
                        <h4 className="font-medium">{account.name}</h4>
                        <p className="text-sm text-gray-600">{account.id}</p>
                      </div>
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{account.currency}</Badge>
                      <Badge 
                        className={account.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}
                      >
                        {account.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </RadioGroup>
      )}
    </div>
  );
};

export default FacebookAdAccountSelection;
