
import { metaAdsInsightsService } from '../MetaAdsInsightsService';

export interface ReportData {
  campaignId: string;
  campaignName: string;
  dateRange: {
    start: string;
    end: string;
  };
  metrics: {
    impressions: number;
    clicks: number;
    spend: number;
    ctr: number;
    cpc: number;
    cpm: number;
    reach: number;
    frequency: number;
    conversions?: number;
    roas?: number;
  };
  performance: {
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    score: number;
    recommendations: string[];
  };
}

export interface ReportSummary {
  totalCampaigns: number;
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  averageCtr: number;
  averageCpc: number;
  bestPerforming: ReportData[];
  worstPerforming: ReportData[];
  trends: {
    metric: string;
    trend: 'up' | 'down' | 'stable';
    percentage: number;
  }[];
}

export class MetaAdsReportingService {
  async generateCampaignReport(
    campaigns: any[],
    accessToken: string,
    dateRange: { start: string; end: string }
  ): Promise<ReportData[]> {
    console.log('📊 Generating campaign report for', campaigns.length, 'campaigns');
    
    const reports: ReportData[] = [];

    for (const campaign of campaigns.filter(c => c.meta_ad_id)) {
      try {
        const insights = await metaAdsInsightsService.getCampaignInsights(
          campaign.meta_ad_id,
          accessToken
        );

        const metrics = {
          impressions: parseInt(insights.impressions || '0'),
          clicks: parseInt(insights.clicks || '0'),
          spend: parseFloat(insights.spend || '0'),
          ctr: parseFloat(insights.ctr || '0'),
          cpc: parseFloat(insights.cpc || '0'),
          cpm: parseFloat(insights.cpm || '0'),
          reach: parseInt(insights.reach || '0'),
          frequency: parseFloat(insights.frequency || '0')
        };

        const performance = this.calculatePerformanceScore(metrics);

        reports.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          dateRange,
          metrics,
          performance
        });
      } catch (error) {
        console.error(`❌ Error generating report for campaign ${campaign.id}:`, error);
      }
    }

    return reports;
  }

  generateReportSummary(reports: ReportData[]): ReportSummary {
    console.log('📈 Generating report summary for', reports.length, 'campaigns');
    
    if (reports.length === 0) {
      return {
        totalCampaigns: 0,
        totalSpend: 0,
        totalImpressions: 0,
        totalClicks: 0,
        averageCtr: 0,
        averageCpc: 0,
        bestPerforming: [],
        worstPerforming: [],
        trends: []
      };
    }

    const totalSpend = reports.reduce((sum, r) => sum + r.metrics.spend, 0);
    const totalImpressions = reports.reduce((sum, r) => sum + r.metrics.impressions, 0);
    const totalClicks = reports.reduce((sum, r) => sum + r.metrics.clicks, 0);
    const averageCtr = reports.reduce((sum, r) => sum + r.metrics.ctr, 0) / reports.length;
    const averageCpc = reports.reduce((sum, r) => sum + r.metrics.cpc, 0) / reports.length;

    // Sort by performance score
    const sortedByPerformance = [...reports].sort((a, b) => b.performance.score - a.performance.score);
    
    return {
      totalCampaigns: reports.length,
      totalSpend,
      totalImpressions,
      totalClicks,
      averageCtr,
      averageCpc,
      bestPerforming: sortedByPerformance.slice(0, 3),
      worstPerforming: sortedByPerformance.slice(-3).reverse(),
      trends: this.calculateTrends(reports)
    };
  }

  private calculatePerformanceScore(metrics: any): { grade: 'A' | 'B' | 'C' | 'D' | 'F'; score: number; recommendations: string[] } {
    let score = 0;
    const recommendations: string[] = [];

    // CTR scoring (40% of total score)
    if (metrics.ctr >= 2.0) {
      score += 40;
    } else if (metrics.ctr >= 1.5) {
      score += 32;
    } else if (metrics.ctr >= 1.0) {
      score += 24;
    } else if (metrics.ctr >= 0.5) {
      score += 16;
      recommendations.push('Considere otimizar o creative para melhorar o CTR');
    } else {
      score += 8;
      recommendations.push('CTR muito baixo - revise o targeting e creative');
    }

    // CPC scoring (30% of total score)
    if (metrics.cpc <= 1.0) {
      score += 30;
    } else if (metrics.cpc <= 2.0) {
      score += 24;
    } else if (metrics.cpc <= 5.0) {
      score += 18;
    } else if (metrics.cpc <= 10.0) {
      score += 12;
      recommendations.push('CPC elevado - considere refinar o targeting');
    } else {
      score += 6;
      recommendations.push('CPC muito alto - revise a estratégia de lances');
    }

    // Frequency scoring (20% of total score)
    if (metrics.frequency >= 1.0 && metrics.frequency <= 3.0) {
      score += 20;
    } else if (metrics.frequency <= 5.0) {
      score += 15;
    } else if (metrics.frequency <= 7.0) {
      score += 10;
      recommendations.push('Frequência alta - considere expandir o público');
    } else {
      score += 5;
      recommendations.push('Frequência muito alta - risco de fadiga do anúncio');
    }

    // Reach scoring (10% of total score)
    if (metrics.reach >= 10000) {
      score += 10;
    } else if (metrics.reach >= 5000) {
      score += 8;
    } else if (metrics.reach >= 1000) {
      score += 6;
    } else {
      score += 3;
      recommendations.push('Alcance baixo - considere aumentar o orçamento ou expandir targeting');
    }

    // Determine grade based on score
    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';
    else grade = 'F';

    // Add general recommendations based on grade
    if (grade === 'F') {
      recommendations.push('Performance crítica - considere pausar e revisar completamente a campanha');
    } else if (grade === 'D') {
      recommendations.push('Performance baixa - necessária otimização urgente');
    } else if (grade === 'A') {
      recommendations.push('Excelente performance - considere aumentar o orçamento para escalar');
    }

    return { grade, score, recommendations };
  }

  private calculateTrends(reports: ReportData[]): Array<{ metric: string; trend: 'up' | 'down' | 'stable'; percentage: number }> {
    // This is a simplified trend calculation
    // In a real implementation, you'd compare with historical data
    const trends = [
      { metric: 'CTR', trend: 'stable' as const, percentage: 0 },
      { metric: 'CPC', trend: 'stable' as const, percentage: 0 },
      { metric: 'Spend', trend: 'stable' as const, percentage: 0 }
    ];

    return trends;
  }

  async exportReport(reports: ReportData[], format: 'csv' | 'pdf' | 'excel'): Promise<Blob> {
    console.log('📤 Exporting report in', format, 'format');
    
    if (format === 'csv') {
      return this.exportToCsv(reports);
    }
    
    // For now, just return CSV for all formats
    return this.exportToCsv(reports);
  }

  private exportToCsv(reports: ReportData[]): Blob {
    const headers = [
      'Campaign Name',
      'Impressions',
      'Clicks',
      'Spend',
      'CTR',
      'CPC',
      'CPM',
      'Reach',
      'Frequency',
      'Performance Grade',
      'Performance Score'
    ];

    const rows = reports.map(report => [
      report.campaignName,
      report.metrics.impressions,
      report.metrics.clicks,
      report.metrics.spend.toFixed(2),
      report.metrics.ctr.toFixed(2),
      report.metrics.cpc.toFixed(2),
      report.metrics.cpm.toFixed(2),
      report.metrics.reach,
      report.metrics.frequency.toFixed(2),
      report.performance.grade,
      report.performance.score
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }
}

export const metaAdsReportingService = new MetaAdsReportingService();
