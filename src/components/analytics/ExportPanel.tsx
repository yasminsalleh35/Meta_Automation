
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, Calendar, Mail, FileText, Table, PieChart } from 'lucide-react';
import { useExportData } from '@/hooks/analytics/useExportData';

interface ExportPanelProps {
  data: any;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ data }) => {
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf' | 'excel'>('csv');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    'spend', 'impressions', 'clicks', 'ctr', 'cpc', 'conversions'
  ]);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [dateRange, setDateRange] = useState('current');

  const { exportData, isExporting } = useExportData();

  const availableMetrics = [
    { id: 'spend', label: 'Investimento', icon: '💰' },
    { id: 'impressions', label: 'Impressões', icon: '👁️' },
    { id: 'clicks', label: 'Cliques', icon: '👆' },
    { id: 'ctr', label: 'CTR', icon: '📊' },
    { id: 'cpc', label: 'CPC', icon: '💵' },
    { id: 'conversions', label: 'Conversões', icon: '🎯' },
    { id: 'roas', label: 'ROAS', icon: '📈' },
    { id: 'reach', label: 'Alcance', icon: '🌐' },
    { id: 'frequency', label: 'Frequência', icon: '🔄' }
  ];

  const handleMetricToggle = (metricId: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricId)
        ? prev.filter(m => m !== metricId)
        : [...prev, metricId]
    );
  };

  const handleExport = async () => {
    await exportData({
      format: exportFormat,
      metrics: selectedMetrics,
      includeCharts,
      dateRange,
      data
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Exportar Relatório
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formato de Exportação */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Formato</label>
          <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">
                <div className="flex items-center gap-2">
                  <Table className="w-4 h-4" />
                  CSV - Dados tabulares
                </div>
              </SelectItem>
              <SelectItem value="pdf">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  PDF - Relatório completo
                </div>
              </SelectItem>
              <SelectItem value="excel">
                <div className="flex items-center gap-2">
                  <Table className="w-4 h-4 text-green-600" />
                  Excel - Planilha detalhada
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Período dos Dados */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Período</label>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Período atual dos filtros</SelectItem>
              <SelectItem value="last30">Últimos 30 dias</SelectItem>
              <SelectItem value="last90">Últimos 90 dias</SelectItem>
              <SelectItem value="thisYear">Este ano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Métricas Selecionáveis */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Métricas a incluir</label>
          <div className="grid grid-cols-2 gap-3">
            {availableMetrics.map((metric) => (
              <div key={metric.id} className="flex items-center space-x-2">
                <Checkbox
                  id={metric.id}
                  checked={selectedMetrics.includes(metric.id)}
                  onCheckedChange={() => handleMetricToggle(metric.id)}
                />
                <label htmlFor={metric.id} className="text-sm cursor-pointer flex items-center gap-1">
                  <span>{metric.icon}</span>
                  {metric.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Opções Adicionais */}
        {(exportFormat === 'pdf' || exportFormat === 'excel') && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeCharts"
              checked={includeCharts}
              onCheckedChange={(checked) => setIncludeCharts(checked as boolean)}
            />
            <label htmlFor="includeCharts" className="text-sm cursor-pointer flex items-center gap-1">
              <PieChart className="w-4 h-4" />
              Incluir gráficos e visualizações
            </label>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex gap-3 pt-4">
          <Button 
            onClick={handleExport}
            disabled={isExporting || selectedMetrics.length === 0}
            className="flex-1"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Exportar {exportFormat.toUpperCase()}
              </>
            )}
          </Button>
          
          <Button variant="outline" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Enviar por email
          </Button>
          
          <Button variant="outline" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Agendar
          </Button>
        </div>

        {/* Informações */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          <strong>Dica:</strong> Relatórios em PDF incluem gráficos e análises visuais. 
          CSV é ideal para análise em planilhas. Excel combina dados tabulares com formatação.
        </div>
      </CardContent>
    </Card>
  );
};
