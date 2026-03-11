
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  Download, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye
} from 'lucide-react';
import { useMetaAdsReporting } from '@/hooks/useMetaAdsReporting';

interface CampaignReportsPanelProps {
  campaigns: any[];
}

export const CampaignReportsPanel: React.FC<CampaignReportsPanelProps> = ({
  campaigns
}) => {
  const {
    reports,
    reportSummary,
    isGenerating,
    isExporting,
    generateReport,
    exportReport,
    getPerformanceInsights,
    hasMetaIntegration
  } = useMetaAdsReporting();

  const [showReportDialog, setShowReportDialog] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const campaignsWithMeta = campaigns.filter(c => c.meta_campaign_id);
  const insights = getPerformanceInsights(reports);

  const handleGenerateReport = async () => {
    const success = await generateReport(campaignsWithMeta, dateRange);
    if (success) {
      setShowReportDialog(false);
    }
  };

  const getGradeColor = (grade: string) => {
    const colors = {
      'A': 'text-green-600 bg-green-100',
      'B': 'text-blue-600 bg-blue-100',
      'C': 'text-yellow-600 bg-yellow-100',
      'D': 'text-orange-600 bg-orange-100',
      'F': 'text-red-600 bg-red-100'
    };
    return colors[grade as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  const formatCurrency = (value: number) => `R$ ${value.toFixed(2)}`;
  const formatNumber = (value: number) => value.toLocaleString('pt-BR');

  if (!hasMetaIntegration) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Relatórios</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Configure a integração com Meta Ads para gerar relatórios.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Relatórios de Performance</span>
              {reports.length > 0 && (
                <Badge variant="outline">
                  {reports.length} campanhas
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {reports.length > 0 && (
                <Select onValueChange={(format: any) => exportReport(format)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Exportar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
              )}
              
              <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
                <DialogTrigger asChild>
                  <Button disabled={campaignsWithMeta.length === 0}>
                    <FileText className="w-4 h-4 mr-2" />
                    Gerar Relatório
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Gerar Relatório de Performance</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Período</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="start-date" className="text-sm">Data Inicial</Label>
                          <input
                            id="start-date"
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div>
                          <Label htmlFor="end-date" className="text-sm">Data Final</Label>
                          <input
                            id="end-date"
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="w-full p-2 border rounded"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <p>Campanhas incluídas: {campaignsWithMeta.length}</p>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowReportDialog(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleGenerateReport} disabled={isGenerating}>
                        {isGenerating ? (
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <BarChart3 className="w-4 h-4 mr-2" />
                        )}
                        Gerar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Nenhum relatório gerado</p>
              <p className="text-sm text-gray-400">
                Clique em "Gerar Relatório" para criar sua análise de performance
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              {reportSummary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(reportSummary.totalSpend)}
                      </div>
                      <div className="text-sm text-gray-600">Gasto Total</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-green-600">
                        {formatNumber(reportSummary.totalClicks)}
                      </div>
                      <div className="text-sm text-gray-600">Cliques</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-purple-600">
                        {reportSummary.averageCtr.toFixed(2)}%
                      </div>
                      <div className="text-sm text-gray-600">CTR Médio</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-orange-600">
                        {formatCurrency(reportSummary.averageCpc)}
                      </div>
                      <div className="text-sm text-gray-600">CPC Médio</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Performance Insights */}
              {insights && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-4">Insights de Performance</h3>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Top Performers */}
                      <div>
                        <h4 className="font-medium mb-3 flex items-center">
                          <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                          Melhores Campanhas
                        </h4>
                        <div className="space-y-2">
                          {insights.topPerformers.map(report => (
                            <div key={report.campaignId} className="flex items-center justify-between p-2 bg-green-50 rounded">
                              <span className="text-sm font-medium">{report.campaignName}</span>
                              <Badge className={getGradeColor(report.performance.grade)}>
                                {report.performance.grade}
                              </Badge>
                            </div>
                          ))}
                          {insights.topPerformers.length === 0 && (
                            <p className="text-sm text-gray-500">Nenhuma campanha com nota A</p>
                          )}
                        </div>
                      </div>

                      {/* Needs Attention */}
                      <div>
                        <h4 className="font-medium mb-3 flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-2 text-red-500" />
                          Precisam de Atenção
                        </h4>
                        <div className="space-y-2">
                          {insights.needsAttention.map(report => (
                            <div key={report.campaignId} className="flex items-center justify-between p-2 bg-red-50 rounded">
                              <span className="text-sm font-medium">{report.campaignName}</span>
                              <Badge className={getGradeColor(report.performance.grade)}>
                                {report.performance.grade}
                              </Badge>
                            </div>
                          ))}
                          {insights.needsAttention.length === 0 && (
                            <p className="text-sm text-gray-500">Todas as campanhas estão bem!</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Performance Score */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Score Médio de Performance</span>
                        <span className="text-lg font-bold">{insights.averageScore.toFixed(0)}</span>
                      </div>
                      <Progress value={insights.averageScore} className="h-2" />
                    </div>
                  </div>
                </>
              )}

              {/* Campaign Details */}
              <Separator />
              <div>
                <h3 className="font-semibold mb-4">Detalhes por Campanha</h3>
                <div className="space-y-2">
                  {reports.map(report => (
                    <div key={report.campaignId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{report.campaignName}</h4>
                        <Badge className={getGradeColor(report.performance.grade)}>
                          Nota {report.performance.grade}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Impressões</span>
                          <div className="font-medium">{formatNumber(report.metrics.impressions)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Cliques</span>
                          <div className="font-medium">{formatNumber(report.metrics.clicks)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">CTR</span>
                          <div className="font-medium">{report.metrics.ctr.toFixed(2)}%</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Gasto</span>
                          <div className="font-medium">{formatCurrency(report.metrics.spend)}</div>
                        </div>
                      </div>
                      
                      {report.performance.recommendations.length > 0 && (
                        <div className="mt-3 p-3 bg-blue-50 rounded">
                          <h5 className="font-medium text-sm mb-2">Recomendações:</h5>
                          <ul className="text-sm space-y-1">
                            {report.performance.recommendations.slice(0, 2).map((rec, index) => (
                              <li key={index} className="flex items-start">
                                <CheckCircle2 className="w-3 h-3 mr-2 mt-0.5 text-blue-500 flex-shrink-0" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
