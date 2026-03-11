
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Megaphone, TrendingUp, DollarSign, Users, Search, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Campaign {
  id: string;
  user_id: string;
  name: string;
  objective: string;
  status: string;
  budget_daily: number | null;
  budget_total: number | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
}

interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalBudget: number;
  avgDailyBudget: number;
}

export const CampaignAnalytics: React.FC = () => {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<CampaignStats>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalBudget: 0,
    avgDailyBudget: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    loadCampaignData();
  }, []);

  const loadCampaignData = async () => {
    try {
      // Carregar campanhas
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (campaignError) throw campaignError;

      // Carregar dados dos usuários usando função administrativa segura
      const { data: profilesData, error: profilesError } = await supabase
        .rpc('get_profiles_admin_with_email');

      if (profilesError) throw profilesError;

      // Combinar os dados
      const formattedData = campaignData?.map(campaign => {
        const profile = profilesData?.find(p => p.id === campaign.user_id);
        return {
          ...campaign,
          user_email: profile?.email,
          user_name: profile?.name
        };
      }) || [];

      setCampaigns(formattedData);

      // Calcular estatísticas
      const totalCampaigns = formattedData.length;
      const activeCampaigns = formattedData.filter(c => c.status === 'active').length;
      
      const totalBudget = formattedData.reduce((sum, c) => 
        sum + (c.budget_total || 0), 0
      );
      
      const dailyBudgets = formattedData
        .filter(c => c.budget_daily)
        .map(c => c.budget_daily || 0);
      const avgDailyBudget = dailyBudgets.length > 0 
        ? dailyBudgets.reduce((sum, b) => sum + b, 0) / dailyBudgets.length 
        : 0;

      setStats({
        totalCampaigns,
        activeCampaigns,
        totalBudget,
        avgDailyBudget
      });

    } catch (error) {
      console.error('Error loading campaign data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados das campanhas",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = !searchTerm || 
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Rascunho', variant: 'secondary' as const },
      active: { label: 'Ativa', variant: 'default' as const },
      paused: { label: 'Pausada', variant: 'outline' as const },
      completed: { label: 'Concluída', variant: 'destructive' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Análise de Campanhas</h2>
        <p className="text-gray-600">Visão geral de todas as campanhas criadas pelos clientes</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Campanhas</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCampaigns}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campanhas Ativas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCampaigns > 0 ? Math.round((stats.activeCampaigns / stats.totalCampaigns) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orçamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.totalBudget.toLocaleString('pt-BR')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orçamento Médio/Dia</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.avgDailyBudget.toLocaleString('pt-BR')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome da campanha, email ou nome do cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="active">Ativa</SelectItem>
            <SelectItem value="paused">Pausada</SelectItem>
            <SelectItem value="completed">Concluída</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela de Campanhas */}
      <Card>
        <CardHeader>
          <CardTitle>Campanhas dos Clientes</CardTitle>
          <CardDescription>
            {filteredCampaigns.length} campanha(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Nome da Campanha</TableHead>
                <TableHead>Objetivo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Orçamento</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{campaign.user_name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{campaign.user_email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>{campaign.objective}</TableCell>
                  <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                  <TableCell>
                    <div>
                      {campaign.budget_total && (
                        <div>Total: R$ {campaign.budget_total.toLocaleString('pt-BR')}</div>
                      )}
                      {campaign.budget_daily && (
                        <div className="text-sm text-gray-500">
                          Diário: R$ {campaign.budget_daily.toLocaleString('pt-BR')}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedCampaign(campaign)}
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

      {/* Modal de Detalhes da Campanha */}
      {selectedCampaign && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Detalhes da Campanha - {selectedCampaign.name}</CardTitle>
            <CardDescription>Cliente: {selectedCampaign.user_email}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Informações Básicas</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Objetivo:</strong> {selectedCampaign.objective}</div>
                  <div><strong>Status:</strong> {getStatusBadge(selectedCampaign.status)}</div>
                  <div><strong>Data de Início:</strong> {selectedCampaign.start_date ? new Date(selectedCampaign.start_date).toLocaleDateString('pt-BR') : 'N/A'}</div>
                  <div><strong>Data de Fim:</strong> {selectedCampaign.end_date ? new Date(selectedCampaign.end_date).toLocaleDateString('pt-BR') : 'N/A'}</div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Orçamento</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Orçamento Total:</strong> R$ {selectedCampaign.budget_total?.toLocaleString('pt-BR') || 'N/A'}</div>
                  <div><strong>Orçamento Diário:</strong> R$ {selectedCampaign.budget_daily?.toLocaleString('pt-BR') || 'N/A'}</div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={() => setSelectedCampaign(null)}>
                Fechar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
