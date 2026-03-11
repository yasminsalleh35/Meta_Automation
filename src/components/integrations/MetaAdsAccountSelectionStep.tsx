
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Building, Facebook, Loader2 } from 'lucide-react';

interface MetaAdAccount {
  id: string;
  name: string;
  currency: string;
  status: string;
  permissions: string[];
}

interface MetaPage {
  id: string;
  name: string;
  category: string;
  followers?: number;
}

interface MetaAdsAccountSelectionStepProps {
  adAccounts: MetaAdAccount[];
  pages: MetaPage[];
  selectedAccounts: string[];
  selectedPages: string[];
  isLoading: boolean;
  onAccountToggle: (accountId: string) => void;
  onPageToggle: (pageId: string) => void;
  onConnect: () => void;
}

export const MetaAdsAccountSelectionStep: React.FC<MetaAdsAccountSelectionStepProps> = ({
  adAccounts,
  pages,
  selectedAccounts,
  selectedPages,
  isLoading,
  onAccountToggle,
  onPageToggle,
  onConnect
}) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="w-5 h-5 mr-2" />
            Selecionar Contas de Anúncios
          </CardTitle>
          <CardDescription>
            Escolha quais contas de anúncios você deseja gerenciar pelo Camply
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {adAccounts.map((account) => (
            <div key={account.id} className="flex items-center space-x-3 p-3 border rounded-lg">
              <Checkbox
                checked={selectedAccounts.includes(account.id)}
                onCheckedChange={() => onAccountToggle(account.id)}
              />
              <div className="flex-1">
                <h4 className="font-medium">{account.name}</h4>
                <p className="text-sm text-gray-600">{account.id}</p>
                <div className="flex space-x-2 mt-1">
                  <Badge variant="outline">{account.currency}</Badge>
                  <Badge className={account.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}>
                    {account.status}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Facebook className="w-5 h-5 mr-2" />
            Páginas do Facebook
          </CardTitle>
          <CardDescription>
            Selecione as páginas que poderão ser usadas nas campanhas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {pages.map((page) => (
            <div key={page.id} className="flex items-center space-x-3 p-3 border rounded-lg">
              <Checkbox
                checked={selectedPages.includes(page.id)}
                onCheckedChange={() => onPageToggle(page.id)}
              />
              <div className="flex-1">
                <h4 className="font-medium">{page.name}</h4>
                <p className="text-sm text-gray-600">{page.followers || 0} seguidores</p>
                <Badge variant="outline">{page.category}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button 
        onClick={onConnect}
        disabled={selectedAccounts.length === 0 || isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Salvando...
          </>
        ) : (
          `Finalizar Configuração (${selectedAccounts.length} conta${selectedAccounts.length !== 1 ? 's' : ''} selecionada${selectedAccounts.length !== 1 ? 's' : ''})`
        )}
      </Button>
    </div>
  );
};
