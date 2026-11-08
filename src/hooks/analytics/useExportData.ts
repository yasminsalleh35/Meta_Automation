
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ExportOptions {
  format: 'csv' | 'pdf' | 'excel';
  metrics: string[];
  includeCharts: boolean;
  dateRange: string;
  data: any;
}

export const useExportData = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportData = async (options: ExportOptions) => {
    setIsExporting(true);
    
    try {
      // Simular processamento de exportação
      console.log('Exportando dados:', options);
      
      // Preparar dados baseado nas métricas selecionadas
      const exportData = prepareExportData(options);
      
      // audit DATA-01: the "PDF" and "XLSX" downloads were plain text with a fake
      // extension. Until real writers exist, every format is exported as CSV.
      await exportToCSV(exportData, options);

      toast({
        title: "Exportação concluída",
        description: options.format === 'csv'
          ? "Relatório em CSV foi baixado com sucesso."
          : "PDF/Excel ainda não disponíveis — o relatório foi baixado em CSV.",
      });

    } catch (error) {
      console.error('Erro na exportação:', error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar o relatório. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const prepareExportData = (options: ExportOptions) => {
    if (!options.data) return [];

    const campaigns = options.data.campaigns || [];
    
    return campaigns.map((campaign: any) => {
      const exportRow: any = {
        'Nome da Campanha': campaign.name,
        'Status': campaign.status,
        'Objetivo': campaign.objective
      };

      // Adicionar métricas selecionadas
      if (options.metrics.includes('spend')) {
        exportRow['Investimento (R$)'] = campaign.spend?.toFixed(2) || '0.00';
      }
      if (options.metrics.includes('impressions')) {
        exportRow['Impressões'] = campaign.impressions?.toLocaleString('pt-BR') || '0';
      }
      if (options.metrics.includes('clicks')) {
        exportRow['Cliques'] = campaign.clicks?.toLocaleString('pt-BR') || '0';
      }
      if (options.metrics.includes('ctr')) {
        exportRow['CTR (%)'] = campaign.ctr?.toFixed(2) || '0.00';
      }
      if (options.metrics.includes('cpc')) {
        exportRow['CPC (R$)'] = campaign.cpc?.toFixed(2) || '0.00';
      }
      if (options.metrics.includes('conversions')) {
        exportRow['Conversões'] = campaign.conversions || 0;
      }
      if (options.metrics.includes('roas')) {
        exportRow['ROAS'] = campaign.roas?.toFixed(2) || '0.00';
      }

      return exportRow;
    });
  };

  const exportToCSV = async (data: any[], options: ExportOptions) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-campanhas-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    exportData,
    isExporting
  };
};
