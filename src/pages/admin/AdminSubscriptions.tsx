
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, TrendingUp, DollarSign, Calendar, Search } from 'lucide-react';
import { AdminDataService } from '@/services/adminDataService';
import { RealStats } from '@/types/adminData';
import { useAdminSubscriptions } from '@/hooks/useAdminSubscriptions';
import { AdminPagination } from '@/components/admin/AdminPagination';

const PROVIDER_LABELS: Record<string, string> = {
  stripe: 'Stripe',
  asaas: 'Asaas',
  pagarme: 'Pagar.me',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Ativa',
  trialing: 'Em teste',
  canceled: 'Cancelada',
  cancelled: 'Cancelada',
  inactive: 'Inativa',
  failed: 'Falhou',
  past_due: 'Em atraso',
  overdue: 'Em atraso',
  pending: 'Pendente',
};

const formatBRL = (value: number) =>
  `R$ ${(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const AdminSubscriptions: React.FC = () => {
  // Audit ADM-03: métricas do servidor (admin_dashboard_stats) e lista paginada de todos os
  // provedores (admin_list_subscriptions) — antes carregava todos os perfis e ignorava o Pagar.me.
  const [stats, setStats] = useState<RealStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const { rows, totalCount, page, pageSize, goToPage, loadSubscriptions, isLoading, error } = useAdminSubscriptions();
  const [searchTerm, setSearchTerm] = useState('');
  const [providerFilter, setProviderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('current');
  const [includeTest, setIncludeTest] = useState(false);

  useEffect(() => {
    AdminDataService.fetchDashboardStats()
      .then(setStats)
      .catch((err) => console.error('Error loading subscription stats:', err))
      .finally(() => setStatsLoading(false));
  }, []);

  // filtros aplicados no servidor (busca com debounce)
  useEffect(() => {
    const t = setTimeout(() => {
      loadSubscriptions({
        search: searchTerm || undefined,
        provider: providerFilter === 'all' ? undefined : providerFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
        includeTest,
      }, 0);
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm, providerFilter, statusFilter, includeTest, loadSubscriptions]);

  const activeByProvider = stats?.activeByProvider || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Assinaturas</h1>
        <p className="text-gray-600">Gerencie assinaturas e receita</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Assinaturas Ativas</p>
                <p className="text-lg font-semibold">{statsLoading ? '…' : stats?.activeSubscriptions || 0}</p>
                {Object.keys(activeByProvider).length > 0 && (
                  <p className="text-xs text-gray-500">
                    {Object.entries(activeByProvider)
                      .map(([provider, n]) => `${PROVIDER_LABELS[provider] || provider}: ${n}`)
                      .join(' · ')}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Receita Mensal</p>
                <p className="text-lg font-semibold">
                  {statsLoading ? '…' : formatBRL(stats?.monthlyRevenue || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">ARPU</p>
                <p className="text-lg font-semibold">
                  {statsLoading ? '…' : `R$ ${stats?.avgRevenuePerUser?.toFixed(2) || '0'}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Taxa de Churn</p>
                <p className="text-lg font-semibold">{statsLoading ? '…' : `${stats?.churnRate || 0}%`}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assinaturas</CardTitle>
          <CardDescription>
            Stripe, Asaas e Pagar.me — {totalCount} assinatura(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por email, nome, plano ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="Provedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os provedores</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="asaas">Asaas</SelectItem>
                <SelectItem value="pagarme">Pagar.me</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Ativas</SelectItem>
                <SelectItem value="not_current">Não ativas</SelectItem>
                <SelectItem value="canceled">Canceladas</SelectItem>
                <SelectItem value="all">Todos os status</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Switch id="include-test" checked={includeTest} onCheckedChange={setIncludeTest} />
              <Label htmlFor="include-test" className="text-sm whitespace-nowrap">Incluir testes (Pagar.me)</Label>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive mb-4">Erro ao carregar assinaturas: {error}</p>
          )}

          {isLoading && rows.length === 0 ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {rows.map((sub) => (
                <div key={`${sub.source}-${sub.id}`} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-semibold">{sub.name || sub.email || 'Usuário não identificado'}</p>
                      {sub.email && <p className="text-sm text-gray-600">{sub.email}</p>}
                      <p className="text-xs text-gray-500">
                        {sub.created_at && <>Desde: {new Date(sub.created_at).toLocaleDateString('pt-BR')}</>}
                        {sub.current_period_end && <> · Período até: {new Date(sub.current_period_end).toLocaleDateString('pt-BR')}</>}
                        {sub.canceled_at && <> · Cancelada em: {new Date(sub.canceled_at).toLocaleDateString('pt-BR')}</>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Badge variant="outline">{PROVIDER_LABELS[sub.provider] || sub.provider}</Badge>
                        {sub.environment === 'test' && <Badge variant="outline">teste</Badge>}
                        <Badge className="bg-blue-100 text-blue-800">{sub.plan_label}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{formatBRL(sub.monthly_amount)}/mês</p>
                    </div>
                    <Badge className={sub.is_current ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {STATUS_LABELS[sub.status] || sub.status}
                    </Badge>
                  </div>
                </div>
              ))}

              {rows.length === 0 && !error && (
                <p className="text-center text-gray-500 py-8">Nenhuma assinatura encontrada</p>
              )}
            </div>
          )}

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

export default AdminSubscriptions;
