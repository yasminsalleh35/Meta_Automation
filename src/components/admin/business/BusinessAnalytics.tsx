
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Users, Target, TrendingUp, Search, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BusinessData {
  id: string;
  user_id: string;
  business_name: string | null;
  business_description: string | null;
  main_product: string | null;
  category: string | null;
  target_audience: string | null;
  business_goals: string | null;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
}

interface BusinessStats {
  totalBusinesses: number;
  completedProfiles: number;
  topCategories: { category: string; count: number; }[];
  recentUpdates: number;
}

export const BusinessAnalytics: React.FC = () => {
  const { toast } = useToast();
  const [businesses, setBusinesses] = useState<BusinessData[]>([]);
  const [stats, setStats] = useState<BusinessStats>({
    totalBusinesses: 0,
    completedProfiles: 0,
    topCategories: [],
    recentUpdates: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessData | null>(null);

  useEffect(() => {
    loadBusinessData();
  }, []);

  const loadBusinessData = async () => {
    try {
      // Carregar dados dos negócios
      const { data: businessData, error: businessError } = await supabase
        .from('business_settings')
        .select('*')
        .order('updated_at', { ascending: false });

      if (businessError) throw businessError;

      // Carregar dados dos usuários usando função administrativa segura
      const { data: profilesData, error: profilesError } = await supabase
        .rpc('get_profiles_admin_with_email');

      if (profilesError) throw profilesError;

      // Combinar os dados
      const formattedData = businessData?.map(business => {
        const profile = profilesData?.find(p => p.id === business.user_id);
        return {
          ...business,
          user_email: profile?.email,
          user_name: profile?.name
        };
      }) || [];

      setBusinesses(formattedData);

      // Calcular estatísticas
      const totalBusinesses = formattedData.length;
      const completedProfiles = formattedData.filter(b => 
        b.business_name && b.business_description && b.main_product && b.category
      ).length;

      // Categorias mais populares
      const categoryCount: { [key: string]: number } = {};
      formattedData.forEach(b => {
        if (b.category) {
          categoryCount[b.category] = (categoryCount[b.category] || 0) + 1;
        }
      });
      
      const topCategories = Object.entries(categoryCount)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Atualizações recentes (últimos 7 dias)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentUpdates = formattedData.filter(b => 
        new Date(b.updated_at) > sevenDaysAgo
      ).length;

      setStats({
        totalBusinesses,
        completedProfiles,
        topCategories,
        recentUpdates
      });

    } catch (error) {
      console.error('Error loading business data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados dos negócios",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = !searchTerm || 
      business.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || business.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const getCompletionPercentage = (business: BusinessData) => {
    const fields = [
      business.business_name,
      business.business_description,
      business.main_product,
      business.category,
      business.target_audience,
      business.business_goals
    ];
    const filledFields = fields.filter(field => field && field.trim().length > 0).length;
    return Math.round((filledFields / fields.length) * 100);
  };

  const getCompletionBadge = (percentage: number) => {
    if (percentage >= 80) return <Badge className="bg-green-500">Completo</Badge>;
    if (percentage >= 50) return <Badge className="bg-yellow-500">Parcial</Badge>;
    return <Badge variant="secondary">Incompleto</Badge>;
  };

  if (isLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Análise de Negócios dos Clientes</h2>
        <p className="text-gray-600">Visão geral dos dados de negócios configurados pelos clientes</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Negócios</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBusinesses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perfis Completos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedProfiles}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalBusinesses > 0 ? Math.round((stats.completedProfiles / stats.totalBusinesses) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atualizações Recentes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentUpdates}</div>
            <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categoria Principal</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.topCategories[0]?.category || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.topCategories[0]?.count || 0} negócios
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome do negócio, email ou nome do cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {stats.topCategories.map(cat => (
              <SelectItem key={cat.category} value={cat.category}>
                {cat.category} ({cat.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabela de Negócios */}
      <Card>
        <CardHeader>
          <CardTitle>Dados dos Negócios</CardTitle>
          <CardDescription>
            {filteredBusinesses.length} negócio(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Nome do Negócio</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Última Atualização</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBusinesses.map((business) => (
                <TableRow key={business.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{business.user_name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{business.user_email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {business.business_name || 'Não informado'}
                  </TableCell>
                  <TableCell>{business.category || 'N/A'}</TableCell>
                  <TableCell>
                    {getCompletionBadge(getCompletionPercentage(business))}
                  </TableCell>
                  <TableCell>
                    {new Date(business.updated_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedBusiness(business)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Detalhes do Negócio */}
      {selectedBusiness && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Detalhes do Negócio - {selectedBusiness.business_name}</CardTitle>
            <CardDescription>Cliente: {selectedBusiness.user_email}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Informações Básicas</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Nome:</strong> {selectedBusiness.business_name || 'N/A'}</div>
                  <div><strong>Categoria:</strong> {selectedBusiness.category || 'N/A'}</div>
                  <div><strong>Produto Principal:</strong> {selectedBusiness.main_product || 'N/A'}</div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Estratégia</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Público-Alvo:</strong> {selectedBusiness.target_audience || 'N/A'}</div>
                  <div><strong>Objetivos:</strong> {selectedBusiness.business_goals || 'N/A'}</div>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Descrição do Negócio</h4>
              <p className="text-sm text-gray-600">
                {selectedBusiness.business_description || 'Não informado'}
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={() => setSelectedBusiness(null)}>
                Fechar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
