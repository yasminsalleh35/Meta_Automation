
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, TrendingUp, Users, Calendar, DollarSign, Eye, Edit, Trash2 } from 'lucide-react';
import { useAdminClientCampaigns } from '@/hooks/useAdminClientCampaigns';
import { AdminPagination } from '@/components/admin/AdminPagination';

const AdminClientCampaigns: React.FC = () => {
  // ADM-03: todas as campanhas dos clientes, paginadas no servidor (antes: só as do próprio admin)
  const { campaigns, isLoading, error, stats: serverStats, totalCount, page, pageSize, goToPage, loadCampaigns } = useAdminClientCampaigns();
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // filtros aplicados no servidor (busca com debounce)
  useEffect(() => {
    const t = setTimeout(() => {
      loadCampaigns({ status: filterStatus === 'all' ? undefined : filterStatus, search: searchTerm || undefined }, 0);
    }, 300);
    return () => clearTimeout(t);
  }, [filterStatus, searchTerm, loadCampaigns]);

  const filteredCampaigns = campaigns;

  const getStatusColor = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'finished': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    total: serverStats.total,
    active: serverStats.byStatus.active || 0,
    paused: serverStats.byStatus.paused || 0,
    draft: serverStats.byStatus.draft || 0,
    finished: serverStats.byStatus.finished || 0,
    totalBudget: serverStats.totalBudget,
    avgBudget: serverStats.avgBudget
  };
  // ADM-03: sem NaN% quando não há campanhas
  const activePct = stats.total > 0 ? (stats.active / stats.total) * 100 : 0;

  if (isLoading && campaigns.length === 0 && !error) {
    return <div className="p-6">Carregando campanhas...</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-800 via-violet-900 to-purple-900 rounded-2xl p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-800/20 to-purple-600/20 backdrop-blur-3xl"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Target className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-100 bg-clip-text text-transparent">
                  Campanhas dos Clientes
                </h1>
                <p className="text-violet-100 text-lg">Monitore todas as campanhas ativas na plataforma</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Campanhas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} ativas, {stats.paused} pausadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orçamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.totalBudget.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">
              Média: R$ {stats.avgBudget.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campanhas Ativas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              {activePct.toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Rascunho</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
            <p className="text-xs text-muted-foreground">Aguardando configuração</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Buscar campanhas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="paused">Pausadas</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="finished">Finalizadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Campanhas</CardTitle>
          <CardDescription>
            {totalCount} campanha(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="text-sm text-destructive mb-4">Erro ao carregar campanhas: {error}</p>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome da Campanha</TableHead>
                <TableHead>Objetivo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Orçamento</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Meta Ads</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{campaign.name}</span>
                      <span className="text-sm text-gray-500">
                        ID: {campaign.id.slice(0, 8)}...
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{campaign.objective}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        R$ {(campaign.budget_total || 0).toLocaleString('pt-BR')}
                      </span>
                      {campaign.budget_daily && (
                        <span className="text-sm text-gray-500">
                          R$ {campaign.budget_daily}/dia
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      {campaign.location_city && (
                        <span>{campaign.location_city}</span>
                      )}
                      {campaign.location_state && (
                        <span className="text-sm text-gray-500">
                          {campaign.location_state}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      {campaign.meta_campaign_id ? (
                        <>
                          <Badge variant="outline" className="mb-1">Integrado</Badge>
                          <span className="text-xs text-gray-500">
                            ID: {campaign.meta_campaign_id.slice(0, 8)}...
                          </span>
                        </>
                      ) : (
                        <Badge variant="secondary">Não integrado</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredCampaigns.length === 0 && (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma campanha encontrada</p>
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

export default AdminClientCampaigns;
