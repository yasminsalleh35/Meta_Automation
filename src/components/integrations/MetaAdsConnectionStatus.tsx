
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ExternalLink, Building, Facebook } from 'lucide-react';

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

interface MetaAdsConnectionStatusProps {
  existingIntegration: any;
  adAccounts: MetaAdAccount[];
  pages: MetaPage[];
  onDisconnect: () => void;
}

export const MetaAdsConnectionStatus: React.FC<MetaAdsConnectionStatusProps> = ({
  existingIntegration,
  adAccounts,
  pages,
  onDisconnect
}) => {
  return (
    <div className="space-y-4">
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          Meta Ads conectado com sucesso! Suas campanhas do Facebook e Instagram estão prontas.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Building className="w-5 h-5 mr-2" />
              Contas de Anúncios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {existingIntegration?.selected_accounts?.map((accountId: string) => {
                const account = adAccounts.find(acc => acc.id === accountId);
                return (
                  <div key={accountId} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border">
                    <div>
                      <p className="font-medium">{account?.name || accountId}</p>
                      <p className="text-sm text-gray-600">{accountId}</p>
                    </div>
                    <Badge className="bg-green-500">Ativa</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Facebook className="w-5 h-5 mr-2" />
              Páginas Conectadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {existingIntegration?.selected_pages?.map((pageId: string) => {
                const page = pages.find(p => p.id === pageId);
                return (
                  <div key={pageId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                    <div>
                      <p className="font-medium">{page?.name || pageId}</p>
                      <p className="text-sm text-gray-600">{page?.followers || 0} seguidores</p>
                    </div>
                    <Badge variant="outline">{page?.category || 'Page'}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex space-x-2">
        <Button variant="outline" size="sm">
          <ExternalLink className="w-4 h-4 mr-2" />
          Abrir Business Manager
        </Button>
        <Button variant="outline" size="sm" onClick={onDisconnect}>
          Desconectar
        </Button>
      </div>
    </div>
  );
};
