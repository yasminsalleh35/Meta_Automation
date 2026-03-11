
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, RefreshCw } from 'lucide-react';
import { useSimpleCampaignList } from '@/hooks/useSimpleCampaignList';
import { SimpleCampaignListFilters } from './SimpleCampaignListFilters';
import { SimpleCampaignListTable } from './SimpleCampaignListTable';
import { useToast } from '@/hooks/use-toast';

export const SimpleCampaignListContainer: React.FC = () => {
  const {
    campaigns,
    isLoading,
    error,
    filters,
    fetchCampaigns,
    pauseCampaign,
    activateCampaign,
    updateFilters,
    refreshMetrics
  } = useSimpleCampaignList();

  const { toast } = useToast();

  const handlePauseCampaign = async (campaignId: string, campaignName: string) => {
    const result = await pauseCampaign(campaignId);
    
    if (result.success) {
      toast({
        title: "✅ Campanha pausada",
        description: `A campanha "${campaignName}" foi pausada com sucesso.`,
      });
    } else {
      toast({
        title: "❌ Erro ao pausar campanha",
        description: result.error,
        variant: "destructive"
      });
    }
  };

  const handleActivateCampaign = async (campaignId: string, campaignName: string) => {
    const result = await activateCampaign(campaignId);
    
    if (result.success) {
      toast({
        title: "🟢 Campanha ativada",
        description: `A campanha "${campaignName}" foi ativada com sucesso.`,
      });
    } else {
      toast({
        title: "❌ Erro ao ativar campanha",
        description: result.error,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Minhas Campanhas 2.0</h1>
            </div>
            <Button 
              onClick={refreshMetrics} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar métricas
            </Button>
          </div>
          <p className="text-gray-600">
            Gerencie suas campanhas criadas pelo Nova Campanha 2.0
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleCampaignListFilters 
              filters={filters}
              onFiltersChange={updateFilters}
            />
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Campanhas ({campaigns.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleCampaignListTable
              campaigns={campaigns}
              isLoading={isLoading}
              error={error}
              onPauseCampaign={handlePauseCampaign}
              onActivateCampaign={handleActivateCampaign}
              onRefresh={fetchCampaigns}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
