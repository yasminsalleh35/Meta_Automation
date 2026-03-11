
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, Search, Filter, TrendingUp, Users, MapPin, Calendar } from 'lucide-react';
import { useRealBusinessSettings } from '@/hooks/useRealBusinessSettings';

const AdminClientBusinesses: React.FC = () => {
  const { businesses, isLoading, loadBusinesses, getBusinessStats } = useRealBusinessSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stats, setStats] = useState({
    totalBusinesses: 0,
    totalCategories: 0,
    recentBusinesses: 0,
    categoryCounts: {} as Record<string, number>
  });

  useEffect(() => {
    setStats(getBusinessStats());
  }, [businesses]);

  const handleFilter = () => {
    loadBusinesses({
      category: categoryFilter || undefined,
      search: searchTerm || undefined
    });
  };

  const categories = Object.keys(stats.categoryCounts);

  if (isLoading) {
    return <div className="p-6">Carregando negócios...</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-900 to-teal-900 rounded-2xl p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-800/20 to-teal-600/20 backdrop-blur-3xl"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Building2 className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-100 bg-clip-text text-transparent">
                  Negócios dos Clientes
                </h1>
                <p className="text-emerald-100 text-lg">Gerencie e analise os negócios cadastrados</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Negócios</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBusinesses}</div>
            <p className="text-xs text-muted-foreground">Negócios cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorias Ativas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCategories}</div>
            <p className="text-xs text-muted-foreground">Diferentes setores</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos (7 dias)</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.recentBusinesses}</div>
            <p className="text-xs text-muted-foreground">Cadastros recentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média por Categoria</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalCategories > 0 ? Math.round(stats.totalBusinesses / stats.totalCategories) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Negócios por setor</p>
          </CardContent>
        </Card>
      </div>

      {/* Categories Overview */}
      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Categoria</CardTitle>
            <CardDescription>Quantidade de negócios por setor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((category) => (
                <div key={category} className="p-4 border rounded-lg">
                  <h4 className="font-medium text-sm">{category}</h4>
                  <p className="text-2xl font-bold text-blue-600">{stats.categoryCounts[category]}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleFilter}>
              <Search className="w-4 h-4 mr-2" />
              Filtrar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Businesses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Negócios</CardTitle>
          <CardDescription>
            {businesses.length} negócio(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Negócio</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Produto Principal</TableHead>
                <TableHead>Público-Alvo</TableHead>
                <TableHead>Cadastrado em</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {businesses.map((business) => (
                <TableRow key={business.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{business.business_name || 'Nome não informado'}</span>
                      {business.business_description && (
                        <span className="text-sm text-gray-500 truncate max-w-xs">
                          {business.business_description}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {business.category ? (
                      <Badge variant="outline">{business.category}</Badge>
                    ) : (
                      <span className="text-gray-400">Não informado</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {business.main_product || (
                      <span className="text-gray-400">Não informado</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {business.target_audience || (
                      <span className="text-gray-400">Não informado</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(business.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">Ativo</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {businesses.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum negócio encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminClientBusinesses;
