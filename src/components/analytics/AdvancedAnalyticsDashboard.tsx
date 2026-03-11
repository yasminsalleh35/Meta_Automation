
import React from 'react';
import { AdvancedFilters } from './AdvancedFilters';
import { OverviewSection } from './OverviewSection';
import { PerformanceCharts } from './PerformanceCharts';
import { CampaignsTable } from './CampaignsTable';
import { DemographicAnalysis } from './DemographicAnalysis';
import { BreakdownAnalysis } from './BreakdownAnalysis';
import { ExportPanel } from './ExportPanel';
import { AlertsPanel } from './AlertsPanel';
import { useAdvancedAnalytics } from '@/hooks/analytics/useAdvancedAnalytics';
import { Loader2 } from 'lucide-react';

export const AdvancedAnalyticsDashboard: React.FC = () => {
  const { data, isLoading, filters, updateFilters } = useAdvancedAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-camply-blue" />
        <span className="ml-3 text-gray-600">Carregando análises...</span>
      </div>
    );
  }

  const selectedCampaignIds = data?.campaigns?.map(c => c.id) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Análise Avançada</h1>
        <p className="text-gray-600">Dashboard completo de performance das suas campanhas Meta Ads</p>
      </div>

      {/* Filtros Avançados */}
      <AdvancedFilters filters={filters} onFiltersChange={updateFilters} />

      {/* Visão Geral */}
      <OverviewSection data={data} />

      {/* Gráficos de Performance */}
      <PerformanceCharts data={data} />

      {/* Análise por Breakdowns */}
      <BreakdownAnalysis 
        campaignIds={selectedCampaignIds} 
        dateRange={filters.dateRange}
      />

      {/* Grade de Análises Avançadas */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Alertas e Recomendações */}
        <div className="xl:col-span-2">
          <AlertsPanel data={data} />
        </div>

        {/* Painel de Exportação */}
        <div>
          <ExportPanel data={data} />
        </div>
      </div>

      {/* Grade de Análises */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tabela de Campanhas */}
        <div className="lg:col-span-2">
          <CampaignsTable data={data?.campaigns || []} />
        </div>

        {/* Análise Demográfica */}
        <DemographicAnalysis data={data?.demographics} />
      </div>
    </div>
  );
};
