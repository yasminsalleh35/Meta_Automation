
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserCheck, UserX, Mail, Search } from 'lucide-react';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { AdminPagination } from '@/components/admin/AdminPagination';

const AdminUsers: React.FC = () => {
  // Audit ADM-03: lista paginada no servidor, busca/status no servidor, contadores do servidor
  const { users, totalCount, page, pageSize, goToPage, loadUsers, stats, isLoading, error, actions } = useAdminUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // filtros aplicados no servidor (busca com debounce)
  useEffect(() => {
    const t = setTimeout(() => {
      loadUsers({ status: statusFilter === 'all' ? undefined : statusFilter, search: searchTerm || undefined }, 0);
    }, 300);
    return () => clearTimeout(t);
  }, [statusFilter, searchTerm, loadUsers]);

  if (isLoading && users.length === 0 && !searchTerm && statusFilter === 'all') {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Usuários</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      case 'basic': return 'bg-gray-100 text-gray-800';
      // premium e planos dos provedores (ex.: Pagar.me anual/mensal)
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Usuários</h1>
        <p className="text-gray-600">Visualize e gerencie todos os usuários do sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-lg font-semibold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Ativos</p>
                <p className="text-lg font-semibold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserX className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Suspensos</p>
                <p className="text-lg font-semibold">{stats.suspended}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Assinaturas ativas</p>
                <p className="text-lg font-semibold">{stats.activeSubscriptions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            {totalCount} usuário(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="suspended">Suspensos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-destructive mb-4">Erro ao carregar usuários: {error}</p>
          )}

          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-xs text-gray-500">
                      Criado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(user.status)}>
                    {user.status === 'active' ? 'Ativo' : 
                     user.status === 'suspended' ? 'Suspenso' : 'Inativo'}
                  </Badge>
                  <Badge className={getPlanColor(user.plan)}>
                    {user.plan}
                  </Badge>
                  
                  <div className="flex space-x-1">
                    {user.status === 'active' ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => actions.suspendUser(user.id)}
                      >
                        Suspender
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => actions.activateUser(user.id)}
                      >
                        Ativar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {users.length === 0 && !isLoading && (
              <p className="text-center text-gray-500 py-8">Nenhum usuário encontrado</p>
            )}
          </div>

          <AdminPagination
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={goToPage}
            disabled={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;
