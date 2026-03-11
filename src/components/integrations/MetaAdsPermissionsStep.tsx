
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Instagram, Loader2 } from 'lucide-react';

interface MetaAdsPermissionsStepProps {
  isLoading: boolean;
  onConnect: () => void;
}

export const MetaAdsPermissionsStep: React.FC<MetaAdsPermissionsStepProps> = ({
  isLoading,
  onConnect
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Permissões Necessárias</CardTitle>
        <CardDescription>
          Confirme as permissões que serão solicitadas para gerenciar suas campanhas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium">Gerenciar Anúncios</p>
              <p className="text-sm text-gray-600">Criar, editar e excluir campanhas publicitárias</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium">Ler Dados de Anúncios</p>
              <p className="text-sm text-gray-600">Visualizar métricas e relatórios de campanhas</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium">Gerenciar Páginas</p>
              <p className="text-sm text-gray-600">Acessar páginas do Facebook para campanhas</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Instagram className="w-5 h-5 text-purple-600" />
            <div>
              <p className="font-medium">Instagram Business</p>
              <p className="text-sm text-gray-600">Gerenciar campanhas no Instagram</p>
            </div>
          </div>
        </div>

        <Button 
          onClick={onConnect} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Buscando contas...
            </>
          ) : (
            'Buscar Contas e Páginas'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
