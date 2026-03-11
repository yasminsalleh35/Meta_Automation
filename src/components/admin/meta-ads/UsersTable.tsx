
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Eye, Settings, Loader2 } from 'lucide-react';

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

interface UsersTableProps {
  users: UserWithIntegration[];
  configuring: boolean;
  globalConfigValid: boolean;
  onConfigure: (user: UserWithIntegration) => void;
  onDisconnect: (user: UserWithIntegration) => void;
  onViewDetails: (user: UserWithIntegration) => void;
}

export const UsersTable: React.FC<UsersTableProps> = ({
  users,
  configuring,
  globalConfigValid,
  onConfigure,
  onDisconnect,
  onViewDetails
}) => {
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

  const isTestUser = (user: UserWithIntegration) => {
    // Check if user was created as test user or has test characteristics
    return user.email.includes('test') || 
           user.email.includes('demo') ||
           user.name?.toLowerCase().includes('test') ||
           user.name?.toLowerCase().includes('demo');
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuário</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Última Integração</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.name || 'Sem nome'}</span>
                      {isTestUser(user) && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                          Teste
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {getStatusBadge(user)}
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-500">
                  {user.integration 
                    ? new Date(user.integration.created_at).toLocaleDateString('pt-BR')
                    : 'Nunca'
                  }
                </div>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  {user.integration && user.integration.status === 'active' ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetails(user)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDisconnect(user)}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Desconectar
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => onConfigure(user)}
                      disabled={configuring || !globalConfigValid}
                    >
                      {configuring ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Settings className="w-4 h-4 mr-1" />
                      )}
                      Configurar
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
