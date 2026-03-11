
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
      
      switch (options.format) {
        case 'csv':
          await exportToCSV(exportData, options);
          break;
        case 'pdf':
          await exportToPDF(exportData, options);
          break;
        case 'excel':
          await exportToExcel(exportData, options);
          break;
      }

      toast({
        title: "Exportação concluída",
        description: `Relatório em ${options.format.toUpperCase()} foi baixado com sucesso.`,
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

  const exportToPDF = async (data: any[], options: ExportOptions) => {
    // Simular geração de PDF
    console.log('Gerando PDF com:', data.length, 'campanhas');
    
    // Em uma implementação real, usaria bibliotecas como jsPDF ou PDFKit
    const mockPdfContent = `Relatório de Campanhas Meta Ads
Data: ${new Date().toLocaleDateString('pt-BR')}
Campanhas: ${data.length}
Métricas incluídas: ${options.metrics.join(', ')}`;

    const blob = new Blob([mockPdfContent], { type: 'application/pdf' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-campanhas-${new Date().toISOString().split('T')[0]}.pdf`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = async (data: any[], options: ExportOptions) => {
    // Simular geração de Excel
    console.log('Gerando Excel com:', data.length, 'campanhas');
    
    // Em uma implementação real, usaria bibliotecas como xlsx ou exceljs
    const csvContent = [
      Object.keys(data[0] || {}).join('\t'),
      ...data.map(row => Object.values(row).join('\t'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-campanhas-${new Date().toISOString().split('T')[0]}.xlsx`);
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
