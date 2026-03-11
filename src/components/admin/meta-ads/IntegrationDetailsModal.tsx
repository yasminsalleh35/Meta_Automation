
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

interface Integration {
  id: string;
  user_id: string;
  provider: string;
  status: string;
  created_at: string;
  app_id?: string;
  ad_account_id?: string;
  page_id?: string;
}

interface UserWithIntegration extends User {
  integration?: Integration;
}

interface IntegrationDetailsModalProps {
  user: UserWithIntegration | null;
  onClose: () => void;
}

export const IntegrationDetailsModal: React.FC<IntegrationDetailsModalProps> = ({
  user,
  onClose
}) => {
  if (!user) return null;

  const getStatusBadge = (user: UserWithIntegration) => {
    if (user.integration && user.integration.status === 'active') {
      return (
        <Badge className="bg-green-500">
          <CheckCircle className="w-3 h-3 mr-1" />
          Conectado
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <XCircle className="w-3 h-3 mr-1" />
        Desconectado
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalhes da Integração - {user.email}</CardTitle>
        <CardDescription>
          Informações da integração Meta Ads
        </CardDescription>
      </CardHeader>
      <CardContent>
        {user.integration ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <div className="mt-1">{getStatusBadge(user)}</div>
            </div>
            <div>
              <Label>Data de Criação</Label>
              <div className="mt-1 text-sm">
                {new Date(user.integration.created_at).toLocaleString('pt-BR')}
              </div>
            </div>
            {user.integration.ad_account_id && (
              <div>
                <Label>Conta de Anúncios</Label>
                <div className="mt-1 text-sm font-mono">
                  {user.integration.ad_account_id}
                </div>
              </div>
            )}
            {user.integration.page_id && (
              <div>
                <Label>Página</Label>
                <div className="mt-1 text-sm font-mono">
                  {user.integration.page_id}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500">Este usuário não possui integração configurada.</p>
        )}
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
