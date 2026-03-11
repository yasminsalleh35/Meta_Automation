
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMetaAdsIntegration } from '@/hooks/useMetaAdsIntegration';
import { 
  metaAdsReportingService, 
  ReportData, 
  ReportSummary 
} from '@/services/metaAds/reporting/MetaAdsReportingService';

export const useMetaAdsReporting = () => {
  const { toast } = useToast();
  const { existingIntegration } = useMetaAdsIntegration();
  const [reports, setReports] = useState<ReportData[]>([]);
  const [reportSummary, setReportSummary] = useState<ReportSummary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const accessToken = existingIntegration?.access_token;

  const generateReport = async (
    campaigns: any[],
    dateRange: { start: string; end: string }
  ): Promise<boolean> => {
    if (!accessToken) {
      toast({
        title: "Erro de integração",
        description: "Meta Ads não está conectado",
        variant: "destructive"
      });
      return false;
    }

    setIsGenerating(true);
    
    try {
      console.log('📊 Generating report for', campaigns.length, 'campaigns');
      
      const reportData = await metaAdsReportingService.generateCampaignReport(
        campaigns,
        accessToken,
        dateRange
      );

      const summary = metaAdsReportingService.generateReportSummary(reportData);

      setReports(reportData);
      setReportSummary(summary);

      toast({
        title: "Relatório gerado",
        description: `Relatório criado com sucesso para ${reportData.length} campanhas.`,
      });

      return true;
    } catch (error) {
      console.error('❌ Error generating report:', error);
      toast({
        title: "Erro ao gerar relatório",
        description: "Ocorreu um erro ao gerar o relatório.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  const exportReport = async (format: 'csv' | 'pdf' | 'excel' = 'csv'): Promise<boolean> => {
    if (reports.length === 0) {
      toast({
        title: "Nenhum relatório",
        description: "Gere um relatório antes de exportar.",
        variant: "destructive"
      });
      return false;
    }

    setIsExporting(true);
    
    try {
      console.log('📤 Exporting report in', format, 'format');
      
      const blob = await metaAdsReportingService.exportReport(reports, format);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `meta-ads-report-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Relatório exportado",
        description: `Relatório exportado com sucesso em formato ${format.toUpperCase()}.`,
      });

      return true;
    } catch (error) {
      console.error('❌ Error exporting report:', error);
      toast({
        title: "Erro ao exportar",
        description: "Ocorreu um erro ao exportar o relatório.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsExporting(false);
    }
  };

  const clearReports = () => {
    setReports([]);
    setReportSummary(null);
  };

  const getPerformanceInsights = (reports: ReportData[]) => {
    if (reports.length === 0) return null;

    const insights = {
      topPerformers: reports
        .filter(r => r.performance.grade === 'A')
        .sort((a, b) => b.performance.score - a.performance.score)
        .slice(0, 3),
      
      needsAttention: reports
        .filter(r => ['D', 'F'].includes(r.performance.grade))
        .sort((a, b) => a.performance.score - b.performance.score)
        .slice(0, 5),
      
      averageScore: reports.reduce((sum, r) => sum + r.performance.score, 0) / reports.length,
      
      commonIssues: reports
        .flatMap(r => r.performance.recommendations)
        .reduce((acc, rec) => {
          acc[rec] = (acc[rec] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      
      totalSpend: reports.reduce((sum, r) => sum + r.metrics.spend, 0),
      totalClicks: reports.reduce((sum, r) => sum + r.metrics.clicks, 0),
      totalImpressions: reports.reduce((sum, r) => sum + r.metrics.impressions, 0)
    };

    return insights;
  };

  return {
    reports,
    reportSummary,
    isGenerating,
    isExporting,
    generateReport,
    exportReport,
    clearReports,
    getPerformanceInsights,
    hasMetaIntegration: !!accessToken
  };
};
